# Uptime Monitor

A self-hosted, open-source uptime monitoring and status page platform. Single Docker container, SQLite database, zero external dependencies.

## Features

- **HTTP/HTTPS & SMTP monitoring** with configurable intervals, timeouts, and retries
- **DB-driven scheduler** — no Redis, no cron, no external queue
- **Incident management** — automatic creation on downtime, auto-resolve on recovery
- **Notifications** — Slack webhooks and email (SMTP) with cooldown/deduplication
- **Public status pages** — server-rendered (SEO-friendly) with 4 themes
- **React dashboard** — full monitor management, settings, and status page editor
- **Plugin architecture** — easy to add new monitor types and notification providers
- **Single Docker container** with persistent `/data` volume

## Quick Start

### Docker Compose (recommended)

```bash
# Clone the repository
git clone <repo-url> && cd uptime-monitor

# Copy and edit environment variables
cp .env.example .env

# Start the container
docker compose up -d

# Access the dashboard
open http://localhost:3000/dashboard
```

Default credentials: `admin@example.com` / `changeme123`

### Docker Run

```bash
docker build -t uptime-monitor .

docker run -d \
  --name uptime-monitor \
  -p 3000:3000 \
  -v uptime-data:/data \
  -e JWT_SECRET=your-secret-here \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=your-password \
  uptime-monitor
```

### Development

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Copy env file
cp .env.example .env

# Run migrations and seed
npm run db:migrate
npm run db:seed

# Start all dev servers concurrently (Express + Vite + Tailwind watch)
npm run dev
```

This starts 3 processes via `concurrently`:

| Process | Command | What it does |
|---------|---------|--------------|
| `dev:server` | `tsx watch server/src/index.ts` | Express API — auto-restarts on server file changes |
| `dev:client` | `cd client && npx vite` | Vite dev server — HMR for instant React UI updates |
| `dev:tailwind` | `@tailwindcss/cli --watch` | Rebuilds Tailwind CSS for server-rendered status pages |

You can also run them individually in separate terminals if you prefer.

**URLs in dev mode:**

| URL | What |
|-----|------|
| http://localhost:5173/dashboard | React dashboard (Vite HMR — edit `client/src/` and see changes instantly) |
| http://localhost:3000/status/status | Public status page (server-rendered, refresh to see changes) |
| http://localhost:3000/api/health | API health check |

> Vite proxies `/api` requests from `:5173` to Express on `:3000` automatically, so the dashboard works seamlessly during development.

**Other commands:**

```bash
npm run build              # Full production build (Tailwind + Client + Server)
npm run build:client       # Build React dashboard only
npm run build:tailwind     # Build Tailwind CSS for status pages only
npm run db:generate        # Generate new Drizzle migration after schema changes
npm run db:migrate         # Apply pending migrations
npm run db:seed            # Seed admin user and default project
npm start                  # Start production server (run build first)
```

## Architecture

```
┌─────────────────────────────────────────┐
│             Express Server              │
│                                         │
│  ┌─────────┐  ┌───────────┐  ┌───────┐ │
│  │ API      │  │ Public    │  │ React │ │
│  │ Routes   │  │ Status    │  │ SPA   │ │
│  │ /api/*   │  │ Pages     │  │ /dash │ │
│  │          │  │ /status/* │  │ board │ │
│  └────┬─────┘  └─────┬─────┘  └───────┘ │
│       │              │                   │
│  ┌────┴──────────────┴────────────────┐  │
│  │         Service Layer              │  │
│  │  Scheduler · Runners · Incidents   │  │
│  │  Notifications · Rollups           │  │
│  └────────────┬───────────────────────┘  │
│               │                          │
│  ┌────────────┴───────────────────────┐  │
│  │    SQLite (Drizzle ORM)            │  │
│  │    /data/statuspage.sqlite         │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Adding Monitor Types

Create a new runner in `server/src/modules/monitors/runners/`:

```typescript
// server/src/modules/monitors/runners/tcp-runner.ts
import type { MonitorRunner, MonitorCheckResult } from '../runner-registry.js';

export const tcpRunner: MonitorRunner = {
  type: 'tcp',
  displayName: 'TCP Port',
  async execute(monitor): Promise<MonitorCheckResult> {
    // Your implementation
  },
};
```

Register in `server/src/modules/monitors/runners/index.ts`:

```typescript
import { tcpRunner } from './tcp-runner.js';
registerRunner(tcpRunner);
```

## Adding Notification Providers

Create a new provider in `server/src/modules/notifications/providers/`:

```typescript
// server/src/modules/notifications/providers/telegram-provider.ts
import type { NotificationProvider } from '../provider-registry.js';

export const telegramProvider: NotificationProvider = {
  type: 'telegram',
  displayName: 'Telegram',
  async send(channel, context): Promise<void> {
    // Your implementation
  },
};
```

Register in `server/src/modules/notifications/providers/index.ts`:

```typescript
import { telegramProvider } from './telegram-provider.js';
registerProvider(telegramProvider);
```

## Status Page Themes

4 built-in themes with full customization:

| Theme | Description |
|-------|-------------|
| **Minimal** | Clean, whitespace-focused design |
| **Modern SaaS** | Bold cards with response times |
| **Classic** | Traditional table-based layout |
| **Dark Technical** | Terminal-inspired dark theme |

All themes support: custom logo, header, footer (4 layouts), font selection (Inter, Geist, JetBrains Mono, System), uptime bar styles (pill, block, line, rounded), light/dark mode, and custom CSS.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DATABASE_PATH` | `/data/statuspage.sqlite` | SQLite database path |
| `JWT_SECRET` | — | JWT signing secret (required) |
| `ADMIN_EMAIL` | `admin@example.com` | Initial admin email |
| `ADMIN_PASSWORD` | `changeme123` | Initial admin password |
| `SMTP_HOST` | — | SMTP server for email notifications |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | `noreply@example.com` | From address for emails |
| `APP_URL` | `http://localhost:3000` | Public URL of the app |

## Tech Stack

- **Backend:** Express 5, TypeScript, SQLite, Drizzle ORM, better-sqlite3
- **Frontend:** React 19, Vite, React Router 7, Tailwind CSS 4
- **Status Pages:** EJS templates, server-rendered
- **Notifications:** Nodemailer (email), native fetch (Slack)
- **Deployment:** Docker, single container, persistent volume

## License

MIT
