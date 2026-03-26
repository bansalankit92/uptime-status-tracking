import { db } from '../../db/connection.js';
import {
  statusPages, statusPageMonitors, monitors,
  incidents, uptimeDailyRollups
} from '../../db/schema/index.js';
import { eq, and, ne, asc, desc, gte } from 'drizzle-orm';
import type { PublicStatusPageData, PublicMonitorData, PublicIncidentData, DailyUptimeData, MonitorStatus, FooterLink } from '../../../../shared/types.js';

export function getPublicStatusPageData(slug: string): PublicStatusPageData | null {
  // Get status page config
  const page = db.select().from(statusPages).where(eq(statusPages.slug, slug)).get();
  if (!page || !page.isPublic) return null;

  // Get monitors assigned to this status page
  const pageMonitors = db.select({
    monitorId: statusPageMonitors.monitorId,
    displayName: statusPageMonitors.displayName,
    sortOrder: statusPageMonitors.sortOrder,
    visible: statusPageMonitors.visible,
  })
    .from(statusPageMonitors)
    .where(and(
      eq(statusPageMonitors.statusPageId, page.id),
      eq(statusPageMonitors.visible, true),
    ))
    .orderBy(asc(statusPageMonitors.sortOrder))
    .all();

  // Build monitor data with uptime info
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - page.uptimeDaysToShow);
  const sinceDateStr = sinceDate.toISOString().split('T')[0];

  const monitorDataList: PublicMonitorData[] = [];

  for (const pm of pageMonitors) {
    const monitor = db.select().from(monitors).where(eq(monitors.id, pm.monitorId)).get();
    if (!monitor) continue;

    // Get daily rollups
    const rollups = db.select().from(uptimeDailyRollups)
      .where(and(
        eq(uptimeDailyRollups.monitorId, monitor.id),
        gte(uptimeDailyRollups.date, sinceDateStr),
      ))
      .orderBy(asc(uptimeDailyRollups.date))
      .all();

    // Fill in missing days with unknown status
    const dailyUptimes: DailyUptimeData[] = [];
    const current = new Date(sinceDate);
    const today = new Date();
    const rollupMap = new Map(rollups.map((r) => [r.date, r]));

    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      const rollup = rollupMap.get(dateStr);

      dailyUptimes.push({
        date: dateStr,
        status: rollup ? rollup.dominantStatus as MonitorStatus : 'unknown',
        uptimePercentage: rollup ? rollup.uptimePercentage : 100,
      });

      current.setDate(current.getDate() + 1);
    }

    // Overall uptime percentage
    const totalChecks = rollups.reduce((sum, r) => sum + r.totalChecks, 0);
    const successfulChecks = rollups.reduce((sum, r) => sum + r.successfulChecks, 0);
    const uptimePercentage = totalChecks > 0
      ? Math.round((successfulChecks / totalChecks) * 100 * 1000) / 1000
      : 100;

    monitorDataList.push({
      name: pm.displayName || monitor.name,
      status: monitor.currentStatus as MonitorStatus,
      uptimePercentage,
      responseTimeMs: monitor.lastResponseTimeMs,
      dailyUptimes,
    });
  }

  // Active incidents
  const activeIncidents = db.select({
    incident: incidents,
    monitorName: monitors.name,
  })
    .from(incidents)
    .innerJoin(monitors, eq(incidents.monitorId, monitors.id))
    .where(and(
      eq(incidents.projectId, page.projectId),
      ne(incidents.status, 'resolved'),
    ))
    .orderBy(desc(incidents.startedAt))
    .all();

  const incidentData: PublicIncidentData[] = activeIncidents.map((row) => ({
    title: row.incident.title,
    status: row.incident.status as PublicIncidentData['status'],
    cause: row.incident.cause,
    startedAt: row.incident.startedAt,
    resolvedAt: row.incident.resolvedAt,
    monitorName: row.monitorName,
  }));

  // Compute overall status
  let overallStatus: MonitorStatus = 'up';
  if (monitorDataList.some((m) => m.status === 'down')) {
    overallStatus = 'down';
  } else if (monitorDataList.some((m) => m.status === 'degraded')) {
    overallStatus = 'degraded';
  } else if (monitorDataList.length === 0 || monitorDataList.every((m) => m.status === 'unknown')) {
    overallStatus = 'unknown';
  }

  // Parse footer links
  let footerLinks: FooterLink[] = [];
  if (page.footerLinks) {
    try { footerLinks = JSON.parse(page.footerLinks); } catch { /* ignore */ }
  }

  return {
    title: page.title,
    description: page.description,
    logoUrl: page.logoUrl,
    headerText: page.headerText,
    footerText: page.footerText,
    footerLinks,
    footerLayout: page.footerLayout as PublicStatusPageData['footerLayout'],
    theme: page.theme as PublicStatusPageData['theme'],
    colorMode: page.colorMode as PublicStatusPageData['colorMode'],
    fontFamily: page.fontFamily as PublicStatusPageData['fontFamily'],
    uptimeBarStyle: page.uptimeBarStyle as PublicStatusPageData['uptimeBarStyle'],
    customCss: page.customCss,
    uptimeDaysToShow: page.uptimeDaysToShow,
    overallStatus,
    monitors: monitorDataList,
    activeIncidents: incidentData,
  };
}
