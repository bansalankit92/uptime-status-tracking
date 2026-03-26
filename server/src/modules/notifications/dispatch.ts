import { db } from '../../db/connection.js';
import { notificationChannels, notificationLogs } from '../../db/schema/index.js';
import { eq, and, gte } from 'drizzle-orm';
import { getProvider, type NotificationContext } from './provider-registry.js';
import { getDefaultProjectId } from '../../services/project.js';

export async function dispatchNotifications(context: NotificationContext): Promise<void> {
  const projectId = getDefaultProjectId();
  const channels = db.select().from(notificationChannels)
    .where(and(
      eq(notificationChannels.projectId, projectId),
      eq(notificationChannels.enabled, true),
    ))
    .all();

  for (const channel of channels) {
    // Check event type preferences
    if (context.eventType === 'down' && !channel.notifyOnDown) continue;
    if (context.eventType === 'recovery' && !channel.notifyOnRecovery) continue;

    // Cooldown check — skip if we sent a notification for this monitor within cooldown window
    const cooldownSince = new Date(Date.now() - channel.cooldownMinutes * 60 * 1000).toISOString();
    const recentLog = db.select({ id: notificationLogs.id })
      .from(notificationLogs)
      .where(and(
        eq(notificationLogs.channelId, channel.id),
        eq(notificationLogs.monitorId, context.monitor.id),
        eq(notificationLogs.eventType, context.eventType),
        eq(notificationLogs.status, 'sent'),
        gte(notificationLogs.sentAt, cooldownSince),
      ))
      .get();

    if (recentLog) {
      // Log as skipped due to cooldown
      db.insert(notificationLogs).values({
        channelId: channel.id,
        monitorId: context.monitor.id,
        incidentId: context.incident?.id ?? null,
        eventType: context.eventType,
        status: 'skipped',
        error: 'Cooldown active',
      }).run();
      continue;
    }

    // Dispatch via the registered provider
    const provider = getProvider(channel.type);
    if (!provider) {
      db.insert(notificationLogs).values({
        channelId: channel.id,
        monitorId: context.monitor.id,
        incidentId: context.incident?.id ?? null,
        eventType: context.eventType,
        status: 'failed',
        error: `No provider registered for type: ${channel.type}`,
      }).run();
      continue;
    }

    try {
      await provider.send(channel, context);
      db.insert(notificationLogs).values({
        channelId: channel.id,
        monitorId: context.monitor.id,
        incidentId: context.incident?.id ?? null,
        eventType: context.eventType,
        status: 'sent',
      }).run();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[notification] Failed to send via ${channel.type} (${channel.name}):`, message);
      db.insert(notificationLogs).values({
        channelId: channel.id,
        monitorId: context.monitor.id,
        incidentId: context.incident?.id ?? null,
        eventType: context.eventType,
        status: 'failed',
        error: message,
      }).run();
    }
  }
}
