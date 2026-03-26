import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/src/db/schema/index.ts',
  out: './server/src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './data/statuspage.sqlite',
  },
});
