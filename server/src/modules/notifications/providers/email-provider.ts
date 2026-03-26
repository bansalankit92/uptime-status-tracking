import nodemailer from 'nodemailer';
import type { NotificationProvider, NotificationContext } from '../provider-registry.js';
import type { NotificationChannel } from '../../../db/schema/notifications.js';
import { config } from '../../../config.js';

function buildEmailHtml(context: NotificationContext): string {
  const { monitor, eventType, errorMessage, responseTimeMs } = context;
  const isDown = eventType === 'down';
  const isDegraded = eventType === 'degraded';
  const statusText = isDown ? 'DOWN' : isDegraded ? 'DEGRADED' : 'RECOVERED';
  const statusColor = isDown ? '#ef4444' : isDegraded ? '#f59e0b' : '#22c55e';
  const target = monitor.url || `${monitor.smtpHost}:${monitor.smtpPort}`;

  return `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">${monitor.name} is ${statusText}</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280;">Monitor</td><td style="padding: 8px 0;">${monitor.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Type</td><td style="padding: 8px 0;">${monitor.type.toUpperCase()}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Target</td><td style="padding: 8px 0;">${target}</td></tr>
          ${responseTimeMs !== undefined ? `<tr><td style="padding: 8px 0; color: #6b7280;">Response Time</td><td style="padding: 8px 0;">${responseTimeMs}ms</td></tr>` : ''}
          ${errorMessage ? `<tr><td style="padding: 8px 0; color: #6b7280;">Error</td><td style="padding: 8px 0; color: #ef4444;">${errorMessage}</td></tr>` : ''}
        </table>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Sent by Uptime Monitor</p>
      </div>
    </div>
  `;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!config.smtp.host) {
      throw new Error('SMTP is not configured. Set SMTP_HOST in environment.');
    }
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? {
        user: config.smtp.user,
        pass: config.smtp.pass,
      } : undefined,
    });
  }
  return transporter;
}

export const emailProvider: NotificationProvider = {
  type: 'email',
  displayName: 'Email (SMTP)',

  async send(channel: NotificationChannel, context: NotificationContext): Promise<void> {
    const addresses: string[] = channel.emailAddresses ? JSON.parse(channel.emailAddresses) : [];
    if (!addresses.length) {
      throw new Error('No email addresses configured');
    }

    const { monitor, eventType } = context;
    const statusText = eventType === 'down' ? 'DOWN' : eventType === 'degraded' ? 'DEGRADED' : 'RECOVERED';

    const transport = getTransporter();
    await transport.sendMail({
      from: config.smtp.from,
      to: addresses.join(', '),
      subject: `[${statusText}] ${monitor.name} — Uptime Monitor`,
      html: buildEmailHtml(context),
    });
  },

  validateConfig(channel: Partial<NotificationChannel>): string | null {
    if (!channel.emailAddresses) return 'At least one email address is required';
    try {
      const addresses = JSON.parse(channel.emailAddresses);
      if (!Array.isArray(addresses) || addresses.length === 0) return 'At least one email address is required';
    } catch {
      return 'Invalid email addresses format';
    }
    return null;
  },
};
