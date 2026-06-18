# =============================================================================
# Dockerfile — Tinemu Next.js Production Build
# Multi-stage: builder → runner (Node.js 22-alpine)
# =============================================================================

# ---- Builder Stage ----
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Remove devDependencies to slim down final image
RUN npm prune --omit=dev

# ---- Runner Stage ----
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat openssl curl

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production artifacts from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma

# Ensure Prisma client can be found at runtime
ENV PRISMA_CLIENT_ENGINE_TYPE="dataproxy"
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Health check — Next.js serves /api/health from the app router
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start Next.js in production mode
CMD ["node", "server.js"]
