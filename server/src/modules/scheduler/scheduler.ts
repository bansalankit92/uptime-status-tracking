import { db } from '../../db/connection.js';
import { monitors, monitorHeaders, monitorResults } from '../../db/schema/index.js';
import { and, eq, lte, isNotNull } from 'drizzle-orm';
import { getRunner } from '../monitors/runner-registry.js';
import { handleStateTransition } from '../incidents/state-machine.js';
import { updateDailyRollup } from './uptime-rollup.js';
import type { Monitor } from '../../db/schema/monitors.js';
import type { MonitorCheckResult } from '../monitors/runner-registry.js';

// ============================================
// DB-driven scheduler — single polling loop
// ============================================
// - Polls every POLL_INTERVAL_MS for monitors due to check
// - Processes in batches of BATCH_SIZE
// - Limited concurrency via CONCURRENCY_LIMIT
// - Retries handled inline per monitor
// - No Redis, no cron, no per-monitor timers
// ============================================

const POLL_INTERVAL_MS = 5000;   // Poll every 5 seconds
const BATCH_SIZE = 20;           // Max monitors per poll cycle
const CONCURRENCY_LIMIT = 10;   // Max concurrent checks

let running = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (running) return;
  running = true;
  console.log('[scheduler] Starting polling loop...');
  pollTimer = setInterval(pollAndExecute, POLL_INTERVAL_MS);
  // Run immediately on start
  pollAndExecute();
}

export function stopScheduler(): void {
  running = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  console.log('[scheduler] Stopped.');
}

async function pollAndExecute(): Promise<void> {
  if (!running) return;

  try {
    const now = new Date().toISOString();

    // Fetch monitors due for checking
    const dueMonitors = db.select().from(monitors)
      .where(and(
        eq(monitors.enabled, true),
        lte(monitors.nextCheckAt, now),
        isNotNull(monitors.nextCheckAt),
      ))
      .limit(BATCH_SIZE)
      .all();

    if (dueMonitors.length === 0) return;

    // Immediately update nextCheckAt to prevent double-processing
    for (const monitor of dueMonitors) {
      const nextCheck = new Date(Date.now() + monitor.intervalSeconds * 1000).toISOString();
      db.update(monitors).set({ nextCheckAt: nextCheck }).where(eq(monitors.id, monitor.id)).run();
    }

    // Process with limited concurrency
    const chunks = chunkArray(dueMonitors, CONCURRENCY_LIMIT);
    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map((m) => executeCheck(m)));
    }
  } catch (err) {
    console.error('[scheduler] Poll error:', err);
  }
}

async function executeCheck(monitor: Monitor): Promise<void> {
  const runner = getRunner(monitor.type);
  if (!runner) {
    console.error(`[scheduler] No runner for type: ${monitor.type}`);
    return;
  }

  // Get headers for HTTP monitors
  const headers = monitor.type === 'http'
    ? db.select({ key: monitorHeaders.key, value: monitorHeaders.value })
        .from(monitorHeaders)
        .where(eq(monitorHeaders.monitorId, monitor.id))
        .all()
    : undefined;

  let result: MonitorCheckResult;

  // Execute with retries
  result = await runner.execute(monitor, headers);

  if (result.status !== 'up' && monitor.retryCount > 0) {
    for (let attempt = 1; attempt <= monitor.retryCount; attempt++) {
      // Wait before retry
      await sleep(monitor.retryDelaySeconds * 1000);
      result = await runner.execute(monitor, headers);
      if (result.status === 'up') break;
    }
  }

  // Record result
  db.insert(monitorResults).values({
    monitorId: monitor.id,
    status: result.status,
    responseTimeMs: result.responseTimeMs,
    statusCode: result.statusCode ?? null,
    error: result.error ?? null,
  }).run();

  // Update daily rollup
  updateDailyRollup(monitor.id, result);

  // Handle state transitions (incidents + notifications)
  await handleStateTransition(monitor, result);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
