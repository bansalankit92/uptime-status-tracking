import { z } from 'zod';

const footerLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const updateStatusPageSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  isPublic: z.boolean().optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),

  // Branding
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  headerText: z.string().max(500).optional().nullable(),
  footerText: z.string().max(500).optional().nullable(),
  footerLinks: z.array(footerLinkSchema).max(10).optional(),
  footerLayout: z.enum(['simple', 'centered', 'columns', 'minimal']).optional(),

  // Theme
  theme: z.enum(['minimal', 'modern', 'classic', 'dark-tech', 'clean']).optional(),
  colorMode: z.enum(['light', 'dark', 'auto']).optional(),
  fontFamily: z.enum(['inter', 'geist', 'mono-jetbrains', 'system']).optional(),
  uptimeBarStyle: z.enum(['pill', 'block', 'line', 'rounded']).optional(),
  customCss: z.string().max(10000).optional().nullable(),
  uptimeDaysToShow: z.number().int().min(7).max(365).optional(),
});

export const updateStatusPageMonitorsSchema = z.object({
  monitors: z.array(z.object({
    monitorId: z.number().int(),
    displayName: z.string().optional().nullable(),
    sortOrder: z.number().int().min(0).optional().default(0),
    visible: z.boolean().optional().default(true),
  })),
});

export type UpdateStatusPageInput = z.infer<typeof updateStatusPageSchema>;
export type UpdateStatusPageMonitorsInput = z.infer<typeof updateStatusPageMonitorsSchema>;
