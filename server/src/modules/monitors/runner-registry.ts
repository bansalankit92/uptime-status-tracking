import type { Monitor } from '../../db/schema/monitors.js';

// ============================================
// Monitor Runner Plugin Interface
// ============================================
// To add a new monitor type (e.g., TCP, DNS, Ping):
// 1. Create a file like `runners/tcp-runner.ts`
// 2. Implement the MonitorRunner interface
// 3. Register it in `runners/index.ts` via registerRunner()
// ============================================

export interface MonitorCheckResult {
  status: 'up' | 'down' | 'degraded';
  responseTimeMs: number;
  statusCode?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface MonitorRunner {
  /** Unique type key — must match the monitor.type enum value */
  type: string;
  /** Human-readable name */
  displayName: string;
  /** Execute a single check against the monitor target */
  execute(monitor: Monitor, headers?: { key: string; value: string }[]): Promise<MonitorCheckResult>;
}

// Registry
const runners = new Map<string, MonitorRunner>();

export function registerRunner(runner: MonitorRunner): void {
  if (runners.has(runner.type)) {
    console.warn(`[runner-registry] Overwriting existing runner for type: ${runner.type}`);
  }
  runners.set(runner.type, runner);
  console.log(`[runner-registry] Registered monitor runner: ${runner.displayName} (${runner.type})`);
}

export function getRunner(type: string): MonitorRunner | undefined {
  return runners.get(type);
}

export function getAllRunners(): MonitorRunner[] {
  return Array.from(runners.values());
}

export function getRegisteredTypes(): string[] {
  return Array.from(runners.keys());
}
