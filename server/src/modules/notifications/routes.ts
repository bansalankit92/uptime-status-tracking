import { Router, Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { notificationChannels, notificationLogs } from '../../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createNotificationChannelSchema } from './validators.js';
import { AppError } from '../../middleware/error-handler.js';
import { getDefaultProjectId } from '../../services/project.js';

const router = Router();
router.use(authMiddleware);

// List channels
router.get('/', (_req: Request, res: Response) => {
  const projectId = getDefaultProjectId();
  const channels = db.select().from(notificationChannels)
    .where(eq(notificationChannels.projectId, projectId))
    .orderBy(desc(notificationChannels.createdAt))
    .all();

  res.json({ success: true, data: channels });
});

// Get single channel
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid channel ID');

  const channel = db.select().from(notificationChannels).where(eq(notificationChannels.id, id)).get();
  if (!channel) throw new AppError(404, 'Channel not found');

  res.json({ success: true, data: channel });
});

// Create channel
router.post('/', validate(createNotificationChannelSchema), (req: Request, res: Response) => {
  const body = req.body;
  const projectId = getDefaultProjectId();

  const newChannel = db.insert(notificationChannels).values({
    projectId,
    name: body.name,
    type: body.type,
    enabled: body.enabled,
    notifyOnDown: body.notifyOnDown,
    notifyOnRecovery: body.notifyOnRecovery,
    cooldownMinutes: body.cooldownMinutes,
    slackWebhookUrl: body.type === 'slack' ? body.slackWebhookUrl : null,
    emailAddresses: body.type === 'email' ? JSON.stringify(body.emailAddresses) : null,
  }).returning().get();

  res.status(201).json({ success: true, data: newChannel });
});

// Update channel
router.put('/:id', validate(createNotificationChannelSchema), (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid channel ID');

  const existing = db.select().from(notificationChannels).where(eq(notificationChannels.id, id)).get();
  if (!existing) throw new AppError(404, 'Channel not found');

  const body = req.body;
  const now = new Date().toISOString();

  db.update(notificationChannels).set({
    name: body.name,
    type: body.type,
    enabled: body.enabled,
    notifyOnDown: body.notifyOnDown,
    notifyOnRecovery: body.notifyOnRecovery,
    cooldownMinutes: body.cooldownMinutes,
    slackWebhookUrl: body.type === 'slack' ? body.slackWebhookUrl : null,
    emailAddresses: body.type === 'email' ? JSON.stringify(body.emailAddresses) : null,
    updatedAt: now,
  }).where(eq(notificationChannels.id, id)).run();

  const updated = db.select().from(notificationChannels).where(eq(notificationChannels.id, id)).get();
  res.json({ success: true, data: updated });
});

// Delete channel
router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid channel ID');

  const existing = db.select().from(notificationChannels).where(eq(notificationChannels.id, id)).get();
  if (!existing) throw new AppError(404, 'Channel not found');

  db.delete(notificationChannels).where(eq(notificationChannels.id, id)).run();
  res.json({ success: true, message: 'Channel deleted' });
});

// Get notification logs for a channel
router.get('/:id/logs', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid channel ID');

  const logs = db.select().from(notificationLogs)
    .where(eq(notificationLogs.channelId, id))
    .orderBy(desc(notificationLogs.sentAt))
    .limit(100)
    .all();

  res.json({ success: true, data: logs });
});

export const notificationRoutes = router;
