import { Router, Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { tags } from '../../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error-handler.js';
import { getDefaultProjectId } from '../../services/project.js';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#3b82f6'),
});

const router = Router();
router.use(authMiddleware);

// ---- Tags ----

router.get('/tags', (_req: Request, res: Response) => {
  const projectId = getDefaultProjectId();
  const allTags = db.select().from(tags).where(eq(tags.projectId, projectId)).orderBy(desc(tags.createdAt)).all();
  res.json({ success: true, data: allTags });
});

router.post('/tags', validate(createTagSchema), (req: Request, res: Response) => {
  const projectId = getDefaultProjectId();
  const tag = db.insert(tags).values({
    projectId,
    name: req.body.name,
    color: req.body.color,
  }).returning().get();
  res.status(201).json({ success: true, data: tag });
});

router.delete('/tags/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid tag ID');

  const existing = db.select().from(tags).where(eq(tags.id, id)).get();
  if (!existing) throw new AppError(404, 'Tag not found');

  db.delete(tags).where(eq(tags.id, id)).run();
  res.json({ success: true, message: 'Tag deleted' });
});

export const settingsRoutes = router;
