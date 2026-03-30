import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { incidents } from './incidents.js';

export const incidentUpdates = sqliteTable('incident_updates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  incidentId: integer('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['investigating', 'identified', 'monitoring', 'resolved'] }).notNull(),
  message: text('message'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type IncidentUpdate = typeof incidentUpdates.$inferSelect;
export type NewIncidentUpdate = typeof incidentUpdates.$inferInsert;
