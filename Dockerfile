# ===========================================
# Multi-stage Dockerfile for Uptime Monitor
# ===========================================

# Stage 1: Build client and server
FROM node:22-alpine AS builder

WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Install client dependencies
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

# Copy source
COPY . .

# Build Tailwind CSS for server-rendered pages
RUN npx @tailwindcss/cli -i ./styles/input.css -o ./public/css/tailwind.css --minify

# Build React dashboard
RUN cd client && npx vite build

# Build TypeScript server
RUN npx tsc -p tsconfig.server.json

# ===========================================
# Stage 2: Production image
# ===========================================
FROM node:22-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built outputs from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server/src/views ./server/src/views
COPY --from=builder /app/server/src/db/migrations ./server/src/db/migrations

# Copy env example for reference
COPY .env.example .env.example

# Create data directory
RUN mkdir -p /data/uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Set production defaults
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/statuspage.sqlite
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "dist/server/src/index.js"]
