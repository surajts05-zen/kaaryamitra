# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/web/package.json ./apps/web/

RUN npm install --workspace=apps/web

COPY apps/web ./apps/web

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN cd apps/web && npm run build

# ── Production stage — Nginx ──────────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Nginx config for React SPA (all routes → index.html)
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  location / { try_files $uri $uri/ /index.html; } \
  location /api/ { proxy_pass http://api:3000/api/; proxy_set_header Host $host; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
