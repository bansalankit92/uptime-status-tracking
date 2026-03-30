import { db } from '../../db/connection.js';
import { incidents, incidentUpdates, monitors } from '../../db/schema/index.js';
import { eq, and, ne } from 'drizzle-orm';
import type { Monitor } from '../../db/schema/monitors.js';
import type { Incident } from '../../db/schema/incidents.js';
import type { MonitorCheckResult } from '../monitors/runner-registry.js';
import { dispatchNotifications } from '../notifications/dispatch.js';
import { config } from '../../config.js';

/**
 * Handles state transitions after a monitor check:
 * - up → down: create incident, notify DOWN
 * - down → up: resolve incident, notify RECOVERY
 * - down → down: update incident (no duplicate notification due to cooldown)
 */
export async function handleStateTransition(
  monitor: Monitor,
  result: MonitorCheckResult,
): Promise<void> {
  const previousStatus = monitor.currentStatus;
  const newStatus = result.status;
  const now = new Date().toISOString();

  // Update monitor state
  db.update(monitors).set({
    currentStatus: newStatus,
    lastCheckedAt: now,
    lastResponseTimeMs: result.responseTimeMs,
    lastError: result.error || null,
    consecutiveFailures: newStatus === 'up' ? 0 : monitor.consecutiveFailures + 1,
    nextCheckAt: new Date(Date.now() + monitor.intervalSeconds * 1000).toISOString(),
    updatedAt: now,
  }).where(eq(monitors.id, monitor.id)).run();

  // Transition: was up/unknown, now down
  if ((previousStatus === 'up' || previousStatus === 'unknown') && newStatus === 'down') {
    const incident = db.insert(incidents).values({
      projectId: monitor.projectId,
      monitorId: monitor.id,
      title: `${monitor.name} is down`,
      status: 'investigating',
      cause: result.error || null,
      startedAt: now,
    }).returning().get();

    db.insert(incidentUpdates).values({
      incidentId: incident.id,
      status: 'investigating',
      message: result.error || `We are investigating an issue with ${monitor.name}.`,
    }).run();

    console.log(`[incident] Created incident #${incident.id} for ${monitor.name}`);

    await dispatchNotifications({
      monitor,
      incident,
      eventType: 'down',
      errorMessage: result.error,
      responseTimeMs: result.responseTimeMs,
      appUrl: config.appUrl,
    });
  }

  // Transition: was down, now up → resolve open incidents
  if (previousStatus === 'down' && newStatus === 'up') {
    const openIncidents = db.select().from(incidents)
      .where(and(
        eq(incidents.monitorId, monitor.id),
        ne(incidents.status, 'resolved'),
      ))
      .all();

    for (const incident of openIncidents) {
      db.update(incidents).set({
        status: 'resolved',
        resolvedAt: now,
        updatedAt: now,
      }).where(eq(incidents.id, incident.id)).run();

      db.insert(incidentUpdates).values({
        incidentId: incident.id,
        status: 'resolved',
        message: `${monitor.name} is back online. This has been resolved.`,
      }).run();

      console.log(`[incident] Resolved incident #${incident.id} for ${monitor.name}`);
    }

    // Dispatch recovery notification (use last open incident for context)
    const lastIncident = openIncidents[0];
    await dispatchNotifications({
      monitor,
      incident: lastIncident,
      eventType: 'recovery',
      responseTimeMs: result.responseTimeMs,
      appUrl: config.appUrl,
    });
  }
}
