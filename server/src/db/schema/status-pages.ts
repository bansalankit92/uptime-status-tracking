import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';
import { monitors } from './monitors.js';

export const statusPages = sqliteTable('status_pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull().default('Status'),
  description: text('description'),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),

  // Custom domain (future-ready)
  customDomain: text('custom_domain'),

  // Branding
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  headerText: text('header_text'),
  footerText: text('footer_text'),
  footerLinks: text('footer_links'), // JSON: [{label, url}]
  footerLayout: text('footer_layout', { enum: ['simple', 'centered', 'columns', 'minimal'] }).notNull().default('simple'),

  // Theme / design
  theme: text('theme', { enum: ['minimal', 'modern', 'classic', 'dark-tech', 'clean'] }).notNull().default('minimal'),
  colorMode: text('color_mode', { enum: ['light', 'dark', 'auto'] }).notNull().default('light'),
  fontFamily: text('font_family', { enum: ['inter', 'geist', 'mono-jetbrains', 'system'] }).notNull().default('inter'),
  uptimeBarStyle: text('uptime_bar_style', { enum: ['pill', 'block', 'line', 'rounded'] }).notNull().default('pill'),

  // Custom CSS (power users)
  customCss: text('custom_css'),

  // Uptime display range
  uptimeDaysToShow: integer('uptime_days_to_show').notNull().default(90),

  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const statusPageMonitors = sqliteTable('status_page_monitors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  statusPageId: integer('status_page_id').notNull().references(() => statusPages.id, { onDelete: 'cascade' }),
  monitorId: integer('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  displayName: text('display_name'), // Override monitor name on public page
  sortOrder: integer('sort_order').notNull().default(0),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
});

export type StatusPage = typeof statusPages.$inferSelect;
export type NewStatusPage = typeof statusPages.$inferInsert;
export type StatusPageMonitor = typeof statusPageMonitors.$inferSelect;
export type NewStatusPageMonitor = typeof statusPageMonitors.$inferInsert;
