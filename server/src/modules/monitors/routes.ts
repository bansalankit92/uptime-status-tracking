import { Router, Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { monitors, monitorHeaders, monitorTags, tags } from '../../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createMonitorSchema } from './validators.js';
import { AppError } from '../../middleware/error-handler.js';
import { getDefaultProjectId } from '../../services/project.js';

const router = Router();
router.use(authMiddleware);

// List monitors
router.get('/', (req: Request, res: Response) => {
  const projectId = getDefaultProjectId();
  const allMonitors = db.select().from(monitors).where(eq(monitors.projectId, projectId)).orderBy(desc(monitors.createdAt)).all();

  const result = allMonitors.map((m) => {
    const mTags = db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(monitorTags)
      .innerJoin(tags, eq(monitorTags.tagId, tags.id))
      .where(eq(monitorTags.monitorId, m.id))
      .all();

    return {
      id: m.id,
      name: m.name,
      type: m.type,
      url: m.url,
      smtpHost: m.smtpHost,
      enabled: m.enabled,
      currentStatus: m.currentStatus,
      lastCheckedAt: m.lastCheckedAt,
      lastResponseTimeMs: m.lastResponseTimeMs,
      tags: mTags,
    };
  });

  res.json({ success: true, data: result });
});

// Get single monitor
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid monitor ID');

  const monitor = db.select().from(monitors).where(eq(monitors.id, id)).get();
  if (!monitor) throw new AppError(404, 'Monitor not found');

  const headers = db.select({ key: monitorHeaders.key, value: monitorHeaders.value })
    .from(monitorHeaders).where(eq(monitorHeaders.monitorId, id)).all();

  const mTags = db
    .select({ id: tags.id, name: tags.name, color: tags.color })
    .from(monitorTags)
    .innerJoin(tags, eq(monitorTags.tagId, tags.id))
    .where(eq(monitorTags.monitorId, id))
    .all();

  res.json({
    success: true,
    data: { ...monitor, headers, tags: mTags },
  });
});

// Create monitor
router.post('/', validate(createMonitorSchema), (req: Request, res: Response) => {
  const body = req.body;
  const projectId = getDefaultProjectId();
  const now = new Date().toISOString();

  const newMonitor = db.insert(monitors).values({
    projectId,
    name: body.name,
    type: body.type,
    enabled: body.enabled,
    intervalSeconds: body.intervalSeconds,
    timeoutMs: body.timeoutMs,
    retryCount: body.retryCount,
    retryDelaySeconds: body.retryDelaySeconds,
    // HTTP fields
    url: body.type === 'http' ? body.url : null,
    method: body.type === 'http' ? body.method : null,
    expectedStatusCodes: body.type === 'http' ? JSON.stringify(body.expectedStatusCodes) : null,
    // SMTP fields
    smtpHost: body.type === 'smtp' ? body.smtpHost : null,
    smtpPort: body.type === 'smtp' ? body.smtpPort : null,
    smtpSecure: body.type === 'smtp' ? body.smtpSecure : null,
    expectedBanner: body.type === 'smtp' ? body.expectedBanner : null,
    // Schedule first check immediately
    nextCheckAt: now,
    currentStatus: 'unknown',
    consecutiveFailures: 0,
  }).returning().get();

  // Insert headers (HTTP only)
  if (body.type === 'http' && body.headers?.length) {
    for (const h of body.headers) {
      db.insert(monitorHeaders).values({
        monitorId: newMonitor.id,
        key: h.key,
        value: h.value,
      }).run();
    }
  }

  // Insert tag associations
  if (body.tagIds?.length) {
    for (const tagId of body.tagIds) {
      db.insert(monitorTags).values({
        monitorId: newMonitor.id,
        tagId,
      }).run();
    }
  }

  res.status(201).json({ success: true, data: newMonitor });
});

// Update monitor
router.put('/:id', validate(createMonitorSchema), (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid monitor ID');

  const existing = db.select().from(monitors).where(eq(monitors.id, id)).get();
  if (!existing) throw new AppError(404, 'Monitor not found');

  const body = req.body;
  const now = new Date().toISOString();

  db.update(monitors).set({
    name: body.name,
    type: body.type,
    enabled: body.enabled,
    intervalSeconds: body.intervalSeconds,
    timeoutMs: body.timeoutMs,
    retryCount: body.retryCount,
    retryDelaySeconds: body.retryDelaySeconds,
    url: body.type === 'http' ? body.url : null,
    method: body.type === 'http' ? body.method : null,
    expectedStatusCodes: body.type === 'http' ? JSON.stringify(body.expectedStatusCodes) : null,
    smtpHost: body.type === 'smtp' ? body.smtpHost : null,
    smtpPort: body.type === 'smtp' ? body.smtpPort : null,
    smtpSecure: body.type === 'smtp' ? body.smtpSecure : null,
    expectedBanner: body.type === 'smtp' ? body.expectedBanner : null,
    updatedAt: now,
  }).where(eq(monitors.id, id)).run();

  // Replace headers
  db.delete(monitorHeaders).where(eq(monitorHeaders.monitorId, id)).run();
  if (body.type === 'http' && body.headers?.length) {
    for (const h of body.headers) {
      db.insert(monitorHeaders).values({
        monitorId: id,
        key: h.key,
        value: h.value,
      }).run();
    }
  }

  // Replace tags
  db.delete(monitorTags).where(eq(monitorTags.monitorId, id)).run();
  if (body.tagIds?.length) {
    for (const tagId of body.tagIds) {
      db.insert(monitorTags).values({ monitorId: id, tagId }).run();
    }
  }

  const updated = db.select().from(monitors).where(eq(monitors.id, id)).get();
  res.json({ success: true, data: updated });
});

// Delete monitor
router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid monitor ID');

  const existing = db.select().from(monitors).where(eq(monitors.id, id)).get();
  if (!existing) throw new AppError(404, 'Monitor not found');

  db.delete(monitors).where(eq(monitors.id, id)).run();
  res.json({ success: true, message: 'Monitor deleted' });
});

// Toggle monitor enabled/disabled
router.patch('/:id/toggle', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid monitor ID');

  const existing = db.select().from(monitors).where(eq(monitors.id, id)).get();
  if (!existing) throw new AppError(404, 'Monitor not found');

  const now = new Date().toISOString();
  db.update(monitors).set({
    enabled: !existing.enabled,
    nextCheckAt: !existing.enabled ? now : null, // schedule check if re-enabling
    updatedAt: now,
  }).where(eq(monitors.id, id)).run();

  res.json({ success: true, data: { enabled: !existing.enabled } });
});

export const monitorRoutes = router;
