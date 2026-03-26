import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';

export const monitors = sqliteTable('monitors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),

  // Common fields
  name: text('name').notNull(),
  type: text('type', { enum: ['http', 'smtp'] }).notNull().default('http'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  intervalSeconds: integer('interval_seconds').notNull().default(60),
  timeoutMs: integer('timeout_ms').notNull().default(10000),
  retryCount: integer('retry_count').notNull().default(2),
  retryDelaySeconds: integer('retry_delay_seconds').notNull().default(5),

  // HTTP-specific fields
  url: text('url'),
  method: text('method', { enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] }).default('GET'),
  expectedStatusCodes: text('expected_status_codes'), // JSON array, e.g. "[200,201]"

  // SMTP-specific fields
  smtpHost: text('smtp_host'),
  smtpPort: integer('smtp_port'),
  smtpSecure: integer('smtp_secure', { mode: 'boolean' }).default(false),
  expectedBanner: text('expected_banner'),

  // State
  currentStatus: text('current_status', { enum: ['up', 'down', 'degraded', 'unknown'] }).notNull().default('unknown'),
  lastCheckedAt: text('last_checked_at'),
  nextCheckAt: text('next_check_at'),
  lastResponseTimeMs: real('last_response_time_ms'),
  lastError: text('last_error'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const monitorHeaders = sqliteTable('monitor_headers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  monitorId: integer('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
});

export type Monitor = typeof monitors.$inferSelect;
export type NewMonitor = typeof monitors.$inferInsert;
export type MonitorHeader = typeof monitorHeaders.$inferSelect;
export type NewMonitorHeader = typeof monitorHeaders.$inferInsert;
