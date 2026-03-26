import net from 'node:net';
import tls from 'node:tls';
import type { Monitor } from '../../../db/schema/monitors.js';
import type { MonitorRunner, MonitorCheckResult } from '../runner-registry.js';

function connectSmtp(host: string, port: number, secure: boolean, timeoutMs: number): Promise<{ banner: string; responseTimeMs: number }> {
  return new Promise((resolve, reject) => {
    const start = performance.now();

    const createConnection = secure
      ? () => tls.connect({ host, port, rejectUnauthorized: false })
      : () => net.createConnection({ host, port });

    const socket = createConnection();
    socket.setTimeout(timeoutMs);

    let banner = '';

    socket.on('data', (data) => {
      banner += data.toString();
      // SMTP banners start with 220
      if (banner.includes('\r\n') || banner.includes('\n')) {
        const responseTimeMs = performance.now() - start;
        socket.end();
        resolve({ banner: banner.trim(), responseTimeMs: Math.round(responseTimeMs * 100) / 100 });
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

export const smtpRunner: MonitorRunner = {
  type: 'smtp',
  displayName: 'SMTP',

  async execute(monitor: Monitor): Promise<MonitorCheckResult> {
    if (!monitor.smtpHost) {
      return { status: 'down', responseTimeMs: 0, error: 'No SMTP host configured' };
    }

    try {
      const { banner, responseTimeMs } = await connectSmtp(
        monitor.smtpHost,
        monitor.smtpPort || 25,
        monitor.smtpSecure || false,
        monitor.timeoutMs,
      );

      // Check banner starts with 220 (SMTP ready)
      const isReady = banner.startsWith('220');

      // Optional banner match
      if (monitor.expectedBanner && !banner.includes(monitor.expectedBanner)) {
        return {
          status: 'down',
          responseTimeMs,
          error: `Banner mismatch. Expected "${monitor.expectedBanner}", got "${banner}"`,
        };
      }

      return {
        status: isReady ? 'up' : 'down',
        responseTimeMs,
        error: isReady ? undefined : `SMTP not ready: ${banner}`,
        metadata: { banner },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return {
        status: 'down',
        responseTimeMs: 0,
        error: message,
      };
    }
  },
};
