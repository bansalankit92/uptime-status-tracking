import { Router, Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { incidents, monitors } from '../../db/schema/index.js';
import { eq, desc, and } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error-handler.js';
import { getDefaultProjectId } from '../../services/project.js';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';

const updateIncidentSchema = z.object({
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']),
  cause: z.string().optional().nullable(),
});

const router = Router();
router.use(authMiddleware);

// List incidents
router.get('/', (req: Request, res: Response) => {
  const projectId = getDefaultProjectId();
  const status = req.query.status as string | undefined;

  let query = db.select({
    incident: incidents,
    monitorName: monitors.name,
  })
    .from(incidents)
    .innerJoin(monitors, eq(incidents.monitorId, monitors.id))
    .where(eq(incidents.projectId, projectId))
    .orderBy(desc(incidents.createdAt))
    .limit(200);

  const result = query.all().map((row) => ({
    ...row.incident,
    monitorName: row.monitorName,
  }));

  // Filter in-memory if status param provided (simpler than dynamic where)
  const filtered = status ? result.filter((i) => i.status === status) : result;

  res.json({ success: true, data: filtered });
});

// Get single incident
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid incident ID');

  const result = db.select({
    incident: incidents,
    monitorName: monitors.name,
  })
    .from(incidents)
    .innerJoin(monitors, eq(incidents.monitorId, monitors.id))
    .where(eq(incidents.id, id))
    .get();

  if (!result) throw new AppError(404, 'Incident not found');

  res.json({ success: true, data: { ...result.incident, monitorName: result.monitorName } });
});

// Update incident status
router.patch('/:id', validate(updateIncidentSchema), (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid incident ID');

  const existing = db.select().from(incidents).where(eq(incidents.id, id)).get();
  if (!existing) throw new AppError(404, 'Incident not found');

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status: req.body.status,
    updatedAt: now,
  };

  if (req.body.cause !== undefined) updates.cause = req.body.cause;
  if (req.body.status === 'resolved') updates.resolvedAt = now;
  if (req.body.status === 'identified' && !existing.acknowledgedAt) updates.acknowledgedAt = now;

  db.update(incidents).set(updates).where(eq(incidents.id, id)).run();

  const updated = db.select().from(incidents).where(eq(incidents.id, id)).get();
  res.json({ success: true, data: updated });
});

export const incidentRoutes = router;
