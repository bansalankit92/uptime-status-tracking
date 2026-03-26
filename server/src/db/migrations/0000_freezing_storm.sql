CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `monitor_headers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitor_id` integer NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monitors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'http' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`interval_seconds` integer DEFAULT 60 NOT NULL,
	`timeout_ms` integer DEFAULT 10000 NOT NULL,
	`retry_count` integer DEFAULT 2 NOT NULL,
	`retry_delay_seconds` integer DEFAULT 5 NOT NULL,
	`url` text,
	`method` text DEFAULT 'GET',
	`expected_status_codes` text,
	`smtp_host` text,
	`smtp_port` integer,
	`smtp_secure` integer DEFAULT false,
	`expected_banner` text,
	`current_status` text DEFAULT 'unknown' NOT NULL,
	`last_checked_at` text,
	`next_check_at` text,
	`last_response_time_ms` real,
	`last_error` text,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monitor_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitor_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#3b82f6',
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `monitor_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitor_id` integer NOT NULL,
	`status` text NOT NULL,
	`response_time_ms` real,
	`status_code` integer,
	`error` text,
	`checked_at` text NOT NULL,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_monitor_results_monitor_checked` ON `monitor_results` (`monitor_id`,`checked_at`);--> statement-breakpoint
CREATE INDEX `idx_monitor_results_checked` ON `monitor_results` (`checked_at`);--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`monitor_id` integer NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'investigating' NOT NULL,
	`cause` text,
	`started_at` text NOT NULL,
	`acknowledged_at` text,
	`resolved_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notification_channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`slack_webhook_url` text,
	`email_addresses` text,
	`notify_on_down` integer DEFAULT true NOT NULL,
	`notify_on_recovery` integer DEFAULT true NOT NULL,
	`cooldown_minutes` integer DEFAULT 5 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel_id` integer NOT NULL,
	`monitor_id` integer,
	`incident_id` integer,
	`event_type` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`sent_at` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `notification_channels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_notification_logs_channel` ON `notification_logs` (`channel_id`);--> statement-breakpoint
CREATE INDEX `idx_notification_logs_sent` ON `notification_logs` (`sent_at`);--> statement-breakpoint
CREATE TABLE `status_page_monitors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status_page_id` integer NOT NULL,
	`monitor_id` integer NOT NULL,
	`display_name` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`status_page_id`) REFERENCES `status_pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `status_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text DEFAULT 'Status' NOT NULL,
	`description` text,
	`is_public` integer DEFAULT true NOT NULL,
	`custom_domain` text,
	`logo_url` text,
	`favicon_url` text,
	`header_text` text,
	`footer_text` text,
	`footer_links` text,
	`footer_layout` text DEFAULT 'simple' NOT NULL,
	`theme` text DEFAULT 'minimal' NOT NULL,
	`color_mode` text DEFAULT 'light' NOT NULL,
	`font_family` text DEFAULT 'inter' NOT NULL,
	`uptime_bar_style` text DEFAULT 'pill' NOT NULL,
	`custom_css` text,
	`uptime_days_to_show` integer DEFAULT 90 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `status_pages_slug_unique` ON `status_pages` (`slug`);--> statement-breakpoint
CREATE TABLE `uptime_daily_rollups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monitor_id` integer NOT NULL,
	`date` text NOT NULL,
	`total_checks` integer DEFAULT 0 NOT NULL,
	`successful_checks` integer DEFAULT 0 NOT NULL,
	`failed_checks` integer DEFAULT 0 NOT NULL,
	`avg_response_time_ms` real,
	`min_response_time_ms` real,
	`max_response_time_ms` real,
	`uptime_percentage` real DEFAULT 100 NOT NULL,
	`dominant_status` text DEFAULT 'unknown' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_uptime_rollups_monitor_date` ON `uptime_daily_rollups` (`monitor_id`,`date`);