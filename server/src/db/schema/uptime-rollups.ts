import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { monitors } from './monitors.js';

export const uptimeDailyRollups = sqliteTable('uptime_daily_rollups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  monitorId: integer('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  totalChecks: integer('total_checks').notNull().default(0),
  successfulChecks: integer('successful_checks').notNull().default(0),
  failedChecks: integer('failed_checks').notNull().default(0),
  avgResponseTimeMs: real('avg_response_time_ms'),
  minResponseTimeMs: real('min_response_time_ms'),
  maxResponseTimeMs: real('max_response_time_ms'),
  uptimePercentage: real('uptime_percentage').notNull().default(100),
  // Dominant status for the day (for uptime bar coloring)
  dominantStatus: text('dominant_status', { enum: ['up', 'down', 'degraded', 'unknown'] }).notNull().default('unknown'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index('idx_uptime_rollups_monitor_date').on(table.monitorId, table.date),
]);

export type UptimeDailyRollup = typeof uptimeDailyRollups.$inferSelect;
export type NewUptimeDailyRollup = typeof uptimeDailyRollups.$inferInsert;
