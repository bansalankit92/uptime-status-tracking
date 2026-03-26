import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { monitors } from './monitors.js';
import { projects } from './projects.js';

export const incidents = sqliteTable('incidents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  monitorId: integer('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  status: text('status', { enum: ['investigating', 'identified', 'monitoring', 'resolved'] }).notNull().default('investigating'),
  cause: text('cause'),
  startedAt: text('started_at').notNull().$defaultFn(() => new Date().toISOString()),
  acknowledgedAt: text('acknowledged_at'),
  resolvedAt: text('resolved_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
