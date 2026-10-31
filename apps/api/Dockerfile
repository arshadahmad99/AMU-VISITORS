# Build Stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install native dependencies for node-canvas compilation & prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    openssl \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy monorepo configuration
COPY package.json package-lock.json ./
COPY packages/ ./packages/
COPY apps/website/package.json ./apps/website/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/api/ ./apps/api/

# Install all dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build TypeScript to dist
RUN npm run build --workspace=apps/api

# Production Runner Stage
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Install runtime libraries for canvas and prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    openssl \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000

# Copy workspace dependencies and built output
COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY packages/ ./packages/
COPY --from=builder /app/apps/api ./apps/api

# Create default directories for uploads
RUN mkdir -p /app/apps/api/uploads /app/apps/api/secure_uploads/books /app/apps/api/secure_uploads/pages

# Ensure entrypoint is executable
RUN chmod +x /app/apps/api/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/app/apps/api/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/src/server.js"]
