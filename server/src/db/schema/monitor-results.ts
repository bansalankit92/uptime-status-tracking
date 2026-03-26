import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { monitors } from './monitors.js';

export const monitorResults = sqliteTable('monitor_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  monitorId: integer('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['up', 'down', 'degraded'] }).notNull(),
  responseTimeMs: real('response_time_ms'),
  statusCode: integer('status_code'),
  error: text('error'),
  checkedAt: text('checked_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index('idx_monitor_results_monitor_checked').on(table.monitorId, table.checkedAt),
  index('idx_monitor_results_checked').on(table.checkedAt),
]);

export type MonitorResult = typeof monitorResults.$inferSelect;
export type NewMonitorResult = typeof monitorResults.$inferInsert;
