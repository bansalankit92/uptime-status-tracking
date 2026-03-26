import { registerProvider } from '../provider-registry.js';
import { slackProvider } from './slack-provider.js';
import { emailProvider } from './email-provider.js';

// ============================================
// Register all notification providers here.
// To add a new provider (e.g., PagerDuty, Telegram, Datadog, Discord):
// 1. Create a new file (e.g., pagerduty-provider.ts)
// 2. Implement the NotificationProvider interface
// 3. Import and register it below
// 4. Add the type to the notification_channels.type enum in the schema
// 5. Add any provider-specific config fields to the schema
// ============================================

export function registerAllProviders(): void {
  registerProvider(slackProvider);
  registerProvider(emailProvider);

  // Future providers:
  // registerProvider(pagerdutyProvider);
  // registerProvider(telegramProvider);
  // registerProvider(discordProvider);
  // registerProvider(datadogProvider);
  // registerProvider(opsgenieProvider);
}
