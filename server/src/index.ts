import 'dotenv/config';
import { config } from './config.js';
import { createApp } from './app.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db/connection.js';
import { registerAllRunners } from './modules/monitors/runners/index.js';
import { registerAllProviders } from './modules/notifications/providers/index.js';
import { startScheduler } from './modules/scheduler/scheduler.js';

// Auto-run migrations on startup
console.log('[boot] Running migrations...');
migrate(db, { migrationsFolder: './server/src/db/migrations' });
console.log('[boot] Migrations complete.');

// Register plugin systems
registerAllRunners();
registerAllProviders();

// Create and start Express app
const app = createApp();

app.listen(config.port, config.host, () => {
  console.log(`[boot] Uptime Monitor running at http://${config.host}:${config.port}`);
  console.log(`[boot] Environment: ${config.nodeEnv}`);
  console.log(`[boot] Database: ${config.databasePath}`);

  // Start the monitoring scheduler
  startScheduler();
});
