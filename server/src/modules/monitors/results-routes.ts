import { Router, Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { monitorResults, uptimeDailyRollups } from '../../db/schema/index.js';
import { eq, desc, and, gte } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error-handler.js';

const router = Router();
router.use(authMiddleware);

// Get recent check results for a monitor
router.get('/:monitorId/results', (req: Request, res: Response) => {
  const monitorId = parseInt(req.params.monitorId as string, 10);
  if (isNaN(monitorId)) throw new AppError(400, 'Invalid monitor ID');

  const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 500);

  const results = db.select().from(monitorResults)
    .where(eq(monitorResults.monitorId, monitorId))
    .orderBy(desc(monitorResults.checkedAt))
    .limit(limit)
    .all();

  res.json({ success: true, data: results });
});

// Get daily uptime rollups for a monitor
router.get('/:monitorId/uptime', (req: Request, res: Response) => {
  const monitorId = parseInt(req.params.monitorId as string, 10);
  if (isNaN(monitorId)) throw new AppError(400, 'Invalid monitor ID');

  const days = Math.min(parseInt(req.query.days as string || '90', 10), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  const rollups = db.select().from(uptimeDailyRollups)
    .where(and(
      eq(uptimeDailyRollups.monitorId, monitorId),
      gte(uptimeDailyRollups.date, sinceStr),
    ))
    .orderBy(uptimeDailyRollups.date)
    .all();

  // Calculate overall uptime percentage
  const totalChecks = rollups.reduce((sum, r) => sum + r.totalChecks, 0);
  const successfulChecks = rollups.reduce((sum, r) => sum + r.successfulChecks, 0);
  const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

  res.json({
    success: true,
    data: {
      days,
      uptimePercentage: Math.round(uptimePercentage * 1000) / 1000,
      dailyRollups: rollups,
    },
  });
});

export const monitorResultsRoutes = router;
