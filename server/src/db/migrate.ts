import 'dotenv/config';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './connection.js';

console.log('Running migrations...');
migrate(db, { migrationsFolder: './server/src/db/migrations' });
console.log('Migrations complete.');
process.exit(0);
