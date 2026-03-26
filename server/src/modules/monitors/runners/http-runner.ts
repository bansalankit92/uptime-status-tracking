import type { Monitor } from '../../../db/schema/monitors.js';
import type { MonitorRunner, MonitorCheckResult } from '../runner-registry.js';

export const httpRunner: MonitorRunner = {
  type: 'http',
  displayName: 'HTTP/HTTPS',

  async execute(monitor: Monitor, headers?: { key: string; value: string }[]): Promise<MonitorCheckResult> {
    if (!monitor.url) {
      return { status: 'down', responseTimeMs: 0, error: 'No URL configured' };
    }

    const expectedCodes: number[] = monitor.expectedStatusCodes
      ? JSON.parse(monitor.expectedStatusCodes)
      : [200];

    const reqHeaders: Record<string, string> = {
      'User-Agent': 'UptimeMonitor/1.0',
    };
    if (headers) {
      for (const h of headers) {
        reqHeaders[h.key] = h.value;
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), monitor.timeoutMs);
    const start = performance.now();

    try {
      const response = await fetch(monitor.url, {
        method: monitor.method || 'GET',
        headers: reqHeaders,
        signal: controller.signal,
        redirect: 'follow',
      });

      const responseTimeMs = performance.now() - start;
      clearTimeout(timeout);

      const isExpected = expectedCodes.includes(response.status);

      return {
        status: isExpected ? 'up' : 'down',
        responseTimeMs: Math.round(responseTimeMs * 100) / 100,
        statusCode: response.status,
        error: isExpected ? undefined : `Unexpected status code: ${response.status}`,
      };
    } catch (err: unknown) {
      clearTimeout(timeout);
      const responseTimeMs = performance.now() - start;
      const message = err instanceof Error ? err.message : 'Unknown error';
      const isTimeout = message.includes('abort');

      return {
        status: 'down',
        responseTimeMs: Math.round(responseTimeMs * 100) / 100,
        error: isTimeout ? `Timeout after ${monitor.timeoutMs}ms` : message,
      };
    }
  },
};
