# Build Stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy monorepo configuration
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/website/package.json ./apps/website/package.json
COPY apps/api/ ./apps/api/
COPY apps/admin/ ./apps/admin/

# Install dependencies and build
RUN npm ci
RUN npm run build --workspace=apps/admin

# Production Stage
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
