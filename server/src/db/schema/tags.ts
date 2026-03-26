import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';
import { monitors } from './monitors.js';

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#3b82f6'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const monitorTags = sqliteTable('monitor_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  monitorId: integer('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type MonitorTag = typeof monitorTags.$inferSelect;
