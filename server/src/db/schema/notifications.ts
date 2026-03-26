import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';
import { monitors } from './monitors.js';
import { incidents } from './incidents.js';

export const notificationChannels = sqliteTable('notification_channels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['slack', 'email'] }).notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),

  // Slack config
  slackWebhookUrl: text('slack_webhook_url'),

  // Email config
  emailAddresses: text('email_addresses'), // JSON array of email strings

  // Behavior
  notifyOnDown: integer('notify_on_down', { mode: 'boolean' }).notNull().default(true),
  notifyOnRecovery: integer('notify_on_recovery', { mode: 'boolean' }).notNull().default(true),
  cooldownMinutes: integer('cooldown_minutes').notNull().default(5),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const notificationLogs = sqliteTable('notification_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  channelId: integer('channel_id').notNull().references(() => notificationChannels.id, { onDelete: 'cascade' }),
  monitorId: integer('monitor_id').references(() => monitors.id, { onDelete: 'set null' }),
  incidentId: integer('incident_id').references(() => incidents.id, { onDelete: 'set null' }),
  eventType: text('event_type', { enum: ['down', 'recovery', 'degraded'] }).notNull(),
  status: text('status', { enum: ['sent', 'failed', 'skipped'] }).notNull(),
  error: text('error'),
  sentAt: text('sent_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index('idx_notification_logs_channel').on(table.channelId),
  index('idx_notification_logs_sent').on(table.sentAt),
]);

export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type NewNotificationChannel = typeof notificationChannels.$inferInsert;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;
