import { z } from 'zod';

const baseChannelSchema = z.object({
  name: z.string().min(1).max(255),
  enabled: z.boolean().optional().default(true),
  notifyOnDown: z.boolean().optional().default(true),
  notifyOnRecovery: z.boolean().optional().default(true),
  cooldownMinutes: z.number().int().min(0).max(1440).optional().default(5),
});

export const createSlackChannelSchema = baseChannelSchema.extend({
  type: z.literal('slack'),
  slackWebhookUrl: z.string().url('Must be a valid Slack webhook URL'),
});

export const createEmailChannelSchema = baseChannelSchema.extend({
  type: z.literal('email'),
  emailAddresses: z.array(z.string().email()).min(1, 'At least one email address is required'),
});

export const createNotificationChannelSchema = z.discriminatedUnion('type', [
  createSlackChannelSchema,
  createEmailChannelSchema,
]);

export type CreateNotificationChannelInput = z.infer<typeof createNotificationChannelSchema>;
