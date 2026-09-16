# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace root config
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types

# Copy API package
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install --workspace=apps/api

# Copy API source
COPY apps/api ./apps/api

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build TypeScript
RUN cd apps/api && npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy root workspace configurations and hoisted node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy API artifacts retaining workspace structure
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/prisma ./apps/api/src/prisma

# We don't strictly need to expose port for Dokploy Traefik, but it's good documentation
EXPOSE 3000

CMD ["sh", "-c", "cd apps/api && npx prisma db push --accept-data-loss && node dist/index.js"]
