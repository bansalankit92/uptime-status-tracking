import { Router, Request, Response } from 'express';
import { getPublicStatusPageData } from './data-service.js';

const router = Router();

router.get('/status/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const data = getPublicStatusPageData(slug);

  if (!data) {
    res.status(404).render('404', { message: 'Status page not found' });
    return;
  }

  // Select template based on theme
  const templateMap: Record<string, string> = {
    'minimal': 'themes/minimal/index',
    'modern': 'themes/modern/index',
    'classic': 'themes/classic/index',
    'dark-tech': 'themes/dark-tech/index',
  };

  const template = templateMap[data.theme] || 'themes/minimal/index';

  res.render(template, {
    page: data,
    helpers: {
      statusColor,
      statusLabel,
      formatUptime,
      timeAgo,
    },
  });
});

// JSON API for the public status page (for AJAX refresh)
router.get('/api/public/status/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const data = getPublicStatusPageData(slug);

  if (!data) {
    res.status(404).json({ success: false, error: 'Status page not found' });
    return;
  }

  res.json({ success: true, data });
});

// ---- Template helpers ----

function statusColor(status: string): string {
  switch (status) {
    case 'up': return '#22c55e';
    case 'down': return '#ef4444';
    case 'degraded': return '#f59e0b';
    default: return '#94a3b8';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'up': return 'Operational';
    case 'down': return 'Down';
    case 'degraded': return 'Degraded';
    default: return 'Unknown';
  }
}

function formatUptime(pct: number): string {
  return `${pct.toFixed(2)}%`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const publicStatusRoutes = router;
