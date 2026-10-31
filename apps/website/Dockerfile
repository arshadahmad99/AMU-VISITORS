# Build Stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy monorepo configuration
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/website/ ./apps/website/

# Install dependencies and build
RUN npm ci
RUN npm run build --workspace=apps/website

# Production Stage
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/website/dist /usr/share/nginx/html
COPY apps/website/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
