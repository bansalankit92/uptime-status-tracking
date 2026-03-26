import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/index.js';
import { config } from '../config.js';

const sqlite = new Database(config.databasePath);

// SQLite performance pragmas
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('busy_timeout = 5000');
sqlite.pragma('synchronous = NORMAL');
sqlite.pragma('cache_size = -20000'); // 20MB
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('temp_store = MEMORY');

export const db = drizzle(sqlite, { schema });
export { sqlite };
