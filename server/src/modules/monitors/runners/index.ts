import { registerRunner } from '../runner-registry.js';
import { httpRunner } from './http-runner.js';
import { smtpRunner } from './smtp-runner.js';

// ============================================
// Register all monitor runners here.
// To add a new monitor type:
// 1. Create a new file (e.g., tcp-runner.ts, dns-runner.ts)
// 2. Implement the MonitorRunner interface
// 3. Import and register it below
// ============================================

export function registerAllRunners(): void {
  registerRunner(httpRunner);
  registerRunner(smtpRunner);

  // Future runners:
  // registerRunner(tcpRunner);
  // registerRunner(dnsRunner);
  // registerRunner(pingRunner);
}
