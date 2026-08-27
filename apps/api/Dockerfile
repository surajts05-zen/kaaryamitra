# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root config
COPY package.json ./
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
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only production artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/src/prisma/schema.prisma ./prisma/schema.prisma

EXPOSE 3000

CMD ["node", "dist/index.js"]
