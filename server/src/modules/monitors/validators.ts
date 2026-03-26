import { z } from 'zod';

const headerSchema = z.object({
  key: z.string().min(1, 'Header key is required'),
  value: z.string(),
});

const baseMonitorSchema = z.object({
  name: z.string().min(1).max(255),
  enabled: z.boolean().optional().default(true),
  intervalSeconds: z.number().int().min(10).max(86400).optional().default(60),
  timeoutMs: z.number().int().min(1000).max(120000).optional().default(10000),
  retryCount: z.number().int().min(0).max(10).optional().default(2),
  retryDelaySeconds: z.number().int().min(0).max(300).optional().default(5),
  tagIds: z.array(z.number().int()).optional().default([]),
});

export const createHttpMonitorSchema = baseMonitorSchema.extend({
  type: z.literal('http'),
  url: z.string().url('Must be a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional().default('GET'),
  expectedStatusCodes: z.array(z.number().int().min(100).max(599)).optional().default([200]),
  headers: z.array(headerSchema).optional().default([]),
});

export const createSmtpMonitorSchema = baseMonitorSchema.extend({
  type: z.literal('smtp'),
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.number().int().min(1).max(65535).optional().default(25),
  smtpSecure: z.boolean().optional().default(false),
  expectedBanner: z.string().optional(),
});

export const createMonitorSchema = z.discriminatedUnion('type', [
  createHttpMonitorSchema,
  createSmtpMonitorSchema,
]);

export const updateMonitorSchema = createMonitorSchema.optional();

export type CreateHttpMonitorInput = z.infer<typeof createHttpMonitorSchema>;
export type CreateSmtpMonitorInput = z.infer<typeof createSmtpMonitorSchema>;
export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
