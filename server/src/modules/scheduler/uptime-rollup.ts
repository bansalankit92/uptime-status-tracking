import { db } from '../../db/connection.js';
import { uptimeDailyRollups } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import type { MonitorCheckResult } from '../monitors/runner-registry.js';

/**
 * Incrementally updates the daily uptime rollup for a monitor.
 * Called after every check. Creates the rollup row for today if it doesn't exist.
 */
export function updateDailyRollup(monitorId: number, result: MonitorCheckResult): void {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const isSuccess = result.status === 'up';

  // Try to get existing rollup for today
  const existing = db.select().from(uptimeDailyRollups)
    .where(and(
      eq(uptimeDailyRollups.monitorId, monitorId),
      eq(uptimeDailyRollups.date, today),
    ))
    .get();

  if (existing) {
    const totalChecks = existing.totalChecks + 1;
    const successfulChecks = existing.successfulChecks + (isSuccess ? 1 : 0);
    const failedChecks = existing.failedChecks + (isSuccess ? 0 : 1);
    const uptimePercentage = (successfulChecks / totalChecks) * 100;

    // Compute running average for response time
    const newAvg = result.responseTimeMs != null
      ? existing.avgResponseTimeMs != null
        ? ((existing.avgResponseTimeMs * existing.totalChecks) + result.responseTimeMs) / totalChecks
        : result.responseTimeMs
      : existing.avgResponseTimeMs;

    const newMin = result.responseTimeMs != null
      ? existing.minResponseTimeMs != null
        ? Math.min(existing.minResponseTimeMs, result.responseTimeMs)
        : result.responseTimeMs
      : existing.minResponseTimeMs;

    const newMax = result.responseTimeMs != null
      ? existing.maxResponseTimeMs != null
        ? Math.max(existing.maxResponseTimeMs, result.responseTimeMs)
        : result.responseTimeMs
      : existing.maxResponseTimeMs;

    // Dominant status: if any check is down, day is down; if some degraded, degraded; else up
    let dominantStatus: 'up' | 'down' | 'degraded' | 'unknown' = 'up';
    if (failedChecks > 0) {
      dominantStatus = failedChecks > totalChecks / 2 ? 'down' : 'degraded';
    }

    db.update(uptimeDailyRollups).set({
      totalChecks,
      successfulChecks,
      failedChecks,
      avgResponseTimeMs: newAvg != null ? Math.round(newAvg * 100) / 100 : null,
      minResponseTimeMs: newMin != null ? Math.round(newMin * 100) / 100 : null,
      maxResponseTimeMs: newMax != null ? Math.round(newMax * 100) / 100 : null,
      uptimePercentage: Math.round(uptimePercentage * 1000) / 1000,
      dominantStatus,
      updatedAt: new Date().toISOString(),
    }).where(eq(uptimeDailyRollups.id, existing.id)).run();
  } else {
    // Create new rollup row
    db.insert(uptimeDailyRollups).values({
      monitorId,
      date: today,
      totalChecks: 1,
      successfulChecks: isSuccess ? 1 : 0,
      failedChecks: isSuccess ? 0 : 1,
      avgResponseTimeMs: result.responseTimeMs != null ? Math.round(result.responseTimeMs * 100) / 100 : null,
      minResponseTimeMs: result.responseTimeMs != null ? Math.round(result.responseTimeMs * 100) / 100 : null,
      maxResponseTimeMs: result.responseTimeMs != null ? Math.round(result.responseTimeMs * 100) / 100 : null,
      uptimePercentage: isSuccess ? 100 : 0,
      dominantStatus: isSuccess ? 'up' : 'down',
    }).run();
  }
}
