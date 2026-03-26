import type { NotificationProvider, NotificationContext } from '../provider-registry.js';
import type { NotificationChannel } from '../../../db/schema/notifications.js';

function buildSlackPayload(context: NotificationContext): object {
  const { monitor, eventType, errorMessage, responseTimeMs, appUrl } = context;
  const isDown = eventType === 'down';
  const isDegraded = eventType === 'degraded';
  const emoji = isDown ? ':red_circle:' : isDegraded ? ':large_orange_circle:' : ':large_green_circle:';
  const statusText = isDown ? 'DOWN' : isDegraded ? 'DEGRADED' : 'RECOVERED';
  const color = isDown ? '#ef4444' : isDegraded ? '#f59e0b' : '#22c55e';

  const fields: { title: string; value: string; short: boolean }[] = [
    { title: 'Monitor', value: monitor.name, short: true },
    { title: 'Status', value: statusText, short: true },
    { title: 'Type', value: monitor.type.toUpperCase(), short: true },
  ];

  if (monitor.url) fields.push({ title: 'URL', value: monitor.url, short: false });
  if (monitor.smtpHost) fields.push({ title: 'Host', value: `${monitor.smtpHost}:${monitor.smtpPort}`, short: true });
  if (responseTimeMs !== undefined) fields.push({ title: 'Response Time', value: `${responseTimeMs}ms`, short: true });
  if (errorMessage) fields.push({ title: 'Error', value: errorMessage, short: false });

  return {
    attachments: [
      {
        color,
        pretext: `${emoji} *${monitor.name}* is ${statusText}`,
        fields,
        footer: 'Uptime Monitor',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

export const slackProvider: NotificationProvider = {
  type: 'slack',
  displayName: 'Slack Webhook',

  async send(channel: NotificationChannel, context: NotificationContext): Promise<void> {
    if (!channel.slackWebhookUrl) {
      throw new Error('Slack webhook URL is not configured');
    }

    const payload = buildSlackPayload(context);

    const response = await fetch(channel.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Slack webhook failed (${response.status}): ${text}`);
    }
  },

  validateConfig(channel: Partial<NotificationChannel>): string | null {
    if (!channel.slackWebhookUrl) return 'Slack webhook URL is required';
    try {
      new URL(channel.slackWebhookUrl);
    } catch {
      return 'Invalid Slack webhook URL';
    }
    return null;
  },
};
