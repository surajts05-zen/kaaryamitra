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

# Install dependencies (including devDependencies for tsx and prisma)
RUN npm install --workspace=apps/api

# Copy API source
COPY apps/api ./apps/api

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy everything from builder (source + node_modules with tsx + prisma client)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/tsconfig.base.json ./

EXPOSE 3000

# Run via tsx (no compilation needed) — memory-efficient and fast startup
CMD ["sh", "-c", "cd apps/api && npx prisma db push --accept-data-loss && npx prisma db seed && npx tsx src/index.ts"]
