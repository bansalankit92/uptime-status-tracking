import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRoutes } from './modules/auth/routes.js';
import { monitorRoutes } from './modules/monitors/routes.js';
import { monitorResultsRoutes } from './modules/monitors/results-routes.js';
import { notificationRoutes } from './modules/notifications/routes.js';
import { incidentRoutes } from './modules/incidents/routes.js';
import { statusPageRoutes } from './modules/status-pages/routes.js';
import { settingsRoutes } from './modules/settings/routes.js';
import { publicStatusRoutes } from './modules/status-pages/public-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export function createApp() {
  const app = express();

  // ---- Core middleware ----
  app.use(cors({ origin: config.isDev ? true : config.appUrl, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // ---- Static files ----
  app.use('/public', express.static(path.join(rootDir, 'public')));
  app.use('/uploads', express.static(config.uploadsDir));

  // ---- EJS view engine for public status pages ----
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // ---- API routes ----
  app.use('/api/auth', authRoutes);
  app.use('/api/monitors', monitorRoutes);
  app.use('/api/monitors', monitorResultsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/status-page', statusPageRoutes);
  app.use('/api/settings', settingsRoutes);

  // ---- Health check ----
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ---- Public status pages (server-rendered) ----
  app.use(publicStatusRoutes);

  // ---- Serve React dashboard in production ----
  if (!config.isDev) {
    const clientDist = path.join(rootDir, 'client', 'dist');
    app.use('/dashboard', express.static(clientDist));
    // SPA fallback for dashboard routes
    app.get('/dashboard/{*splat}', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // ---- Root redirect ----
  app.get('/', (_req, res) => {
    res.redirect('/dashboard');
  });

  // ---- Error handler ----
  app.use(errorHandler);

  return app;
}
