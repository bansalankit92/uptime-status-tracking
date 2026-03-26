// ============================================
// Shared types used by both server and client
// ============================================

// Monitor types
export type MonitorType = 'http' | 'smtp';
export type MonitorStatus = 'up' | 'down' | 'degraded' | 'unknown';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// Incident statuses
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

// Notification types
export type NotificationChannelType = 'slack' | 'email';
export type NotificationEventType = 'down' | 'recovery' | 'degraded';
export type NotificationDeliveryStatus = 'sent' | 'failed' | 'skipped';

// Status page theming
export type StatusPageTheme = 'minimal' | 'modern' | 'classic' | 'dark-tech';
export type ColorMode = 'light' | 'dark' | 'auto';
export type FontFamily = 'inter' | 'geist' | 'mono-jetbrains' | 'system';
export type UptimeBarStyle = 'pill' | 'block' | 'line' | 'rounded';
export type FooterLayout = 'simple' | 'centered' | 'columns' | 'minimal';

// User roles
export type UserRole = 'admin' | 'editor' | 'viewer';

// ============================================
// API response types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Monitor API types
// ============================================

export interface MonitorListItem {
  id: number;
  name: string;
  type: MonitorType;
  url?: string | null;
  smtpHost?: string | null;
  enabled: boolean;
  currentStatus: MonitorStatus;
  lastCheckedAt: string | null;
  lastResponseTimeMs: number | null;
  tags: { id: number; name: string; color: string | null }[];
}

export interface MonitorDetail extends MonitorListItem {
  projectId: number;
  intervalSeconds: number;
  timeoutMs: number;
  retryCount: number;
  retryDelaySeconds: number;
  method?: string | null;
  expectedStatusCodes?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean | null;
  expectedBanner?: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  headers: { key: string; value: string }[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Status page public types
// ============================================

export interface PublicStatusPageData {
  title: string;
  description: string | null;
  logoUrl: string | null;
  headerText: string | null;
  footerText: string | null;
  footerLinks: { label: string; url: string }[];
  footerLayout: FooterLayout;
  theme: StatusPageTheme;
  colorMode: ColorMode;
  fontFamily: FontFamily;
  uptimeBarStyle: UptimeBarStyle;
  customCss: string | null;
  uptimeDaysToShow: number;
  overallStatus: MonitorStatus;
  monitors: PublicMonitorData[];
  activeIncidents: PublicIncidentData[];
}

export interface PublicMonitorData {
  name: string;
  status: MonitorStatus;
  uptimePercentage: number;
  responseTimeMs: number | null;
  dailyUptimes: DailyUptimeData[];
}

export interface DailyUptimeData {
  date: string;
  status: MonitorStatus;
  uptimePercentage: number;
}

export interface PublicIncidentData {
  title: string;
  status: IncidentStatus;
  cause: string | null;
  startedAt: string;
  resolvedAt: string | null;
  monitorName: string;
}

// ============================================
// Footer link type
// ============================================

export interface FooterLink {
  label: string;
  url: string;
}
