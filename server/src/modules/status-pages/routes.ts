import { Router, Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { statusPages, statusPageMonitors, monitors } from '../../db/schema/index.js';
import { eq, asc } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateStatusPageSchema, updateStatusPageMonitorsSchema } from './validators.js';
import { AppError } from '../../middleware/error-handler.js';
import { getDefaultProjectId } from '../../services/project.js';

const router = Router();
router.use(authMiddleware);

// Get status page settings for the default project
router.get('/', (_req: Request, res: Response) => {
  const projectId = getDefaultProjectId();
  const page = db.select().from(statusPages).where(eq(statusPages.projectId, projectId)).get();
  if (!page) throw new AppError(404, 'Status page not found');

  // Get associated monitors
  const pageMonitors = db.select({
    id: statusPageMonitors.id,
    monitorId: statusPageMonitors.monitorId,
    displayName: statusPageMonitors.displayName,
    sortOrder: statusPageMonitors.sortOrder,
    visible: statusPageMonitors.visible,
    monitorName: monitors.name,
    monitorType: monitors.type,
  })
    .from(statusPageMonitors)
    .innerJoin(monitors, eq(statusPageMonitors.monitorId, monitors.id))
    .where(eq(statusPageMonitors.statusPageId, page.id))
    .orderBy(asc(statusPageMonitors.sortOrder))
    .all();

  res.json({
    success: true,
    data: {
      ...page,
      footerLinks: page.footerLinks ? JSON.parse(page.footerLinks) : [],
      monitors: pageMonitors,
    },
  });
});

// Update status page settings
router.put('/', validate(updateStatusPageSchema), (_req: Request, res: Response) => {
  const projectId = getDefaultProjectId();
  const page = db.select().from(statusPages).where(eq(statusPages.projectId, projectId)).get();
  if (!page) throw new AppError(404, 'Status page not found');

  const body = _req.body;
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = { updatedAt: now };

  // Copy over all provided fields
  const fields = [
    'title', 'description', 'isPublic', 'slug', 'logoUrl', 'faviconUrl',
    'headerText', 'footerText', 'footerLayout', 'theme', 'colorMode',
    'fontFamily', 'uptimeBarStyle', 'customCss', 'uptimeDaysToShow',
  ] as const;

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (body.footerLinks !== undefined) {
    updates.footerLinks = JSON.stringify(body.footerLinks);
  }

  db.update(statusPages).set(updates).where(eq(statusPages.id, page.id)).run();

  const updated = db.select().from(statusPages).where(eq(statusPages.id, page.id)).get();
  res.json({
    success: true,
    data: {
      ...updated,
      footerLinks: updated!.footerLinks ? JSON.parse(updated!.footerLinks) : [],
    },
  });
});

// Update monitors shown on the status page
router.put('/monitors', validate(updateStatusPageMonitorsSchema), (_req: Request, res: Response) => {
  const projectId = getDefaultProjectId();
  const page = db.select().from(statusPages).where(eq(statusPages.projectId, projectId)).get();
  if (!page) throw new AppError(404, 'Status page not found');

  // Replace all
  db.delete(statusPageMonitors).where(eq(statusPageMonitors.statusPageId, page.id)).run();

  for (const m of _req.body.monitors) {
    db.insert(statusPageMonitors).values({
      statusPageId: page.id,
      monitorId: m.monitorId,
      displayName: m.displayName || null,
      sortOrder: m.sortOrder,
      visible: m.visible,
    }).run();
  }

  res.json({ success: true, message: 'Status page monitors updated' });
});

// Available themes metadata
router.get('/themes', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 'minimal', name: 'Minimal', description: 'Clean, whitespace-focused design' },
      { id: 'modern', name: 'Modern SaaS', description: 'Bold, contemporary SaaS style' },
      { id: 'classic', name: 'Classic', description: 'Traditional status page layout' },
      { id: 'dark-tech', name: 'Dark Technical', description: 'Dark theme with technical aesthetics' },
      { id: 'clean', name: 'Clean', description: 'Statuspage-style with incident history' },
    ],
  });
});

export const statusPageRoutes = router;
