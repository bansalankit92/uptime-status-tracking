import type { NotificationChannel } from '../../db/schema/notifications.js';
import type { Monitor } from '../../db/schema/monitors.js';
import type { Incident } from '../../db/schema/incidents.js';

// ============================================
// Notification Provider Plugin Interface
// ============================================
// To add a new notification provider (e.g., PagerDuty, Telegram, Datadog):
// 1. Create a file like `providers/pagerduty-provider.ts`
// 2. Implement the NotificationProvider interface
// 3. Register it in `providers/index.ts` via registerProvider()
// 4. Add the type to the notification_channels schema enum
// 5. Add any provider-specific config fields to the schema
// ============================================

export interface NotificationContext {
  monitor: Monitor;
  incident?: Incident;
  eventType: 'down' | 'recovery' | 'degraded';
  errorMessage?: string;
  responseTimeMs?: number;
  appUrl: string;
}

export interface NotificationProvider {
  /** Unique type key — must match the notification_channel.type enum value */
  type: string;
  /** Human-readable name */
  displayName: string;
  /** Send the notification. Returns true on success, throws on failure. */
  send(channel: NotificationChannel, context: NotificationContext): Promise<void>;
  /** Validate provider-specific config fields */
  validateConfig?(channel: Partial<NotificationChannel>): string | null;
}

// Registry
const providers = new Map<string, NotificationProvider>();

export function registerProvider(provider: NotificationProvider): void {
  if (providers.has(provider.type)) {
    console.warn(`[provider-registry] Overwriting existing provider for type: ${provider.type}`);
  }
  providers.set(provider.type, provider);
  console.log(`[provider-registry] Registered notification provider: ${provider.displayName} (${provider.type})`);
}

export function getProvider(type: string): NotificationProvider | undefined {
  return providers.get(type);
}

export function getAllProviders(): NotificationProvider[] {
  return Array.from(providers.values());
}

export function getRegisteredProviderTypes(): string[] {
  return Array.from(providers.keys());
}
