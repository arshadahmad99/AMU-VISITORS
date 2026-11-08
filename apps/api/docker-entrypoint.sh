#!/bin/sh
set -e

echo "==> Ensuring upload directory structures exist..."
mkdir -p /app/apps/api/uploads/autographs
mkdir -p /app/apps/api/secure_uploads/books /app/apps/api/secure_uploads/pages

# Sync bundled seed assets into persistent volume (no-clobber preserves existing user uploads)
if [ -d "/app/apps/api/uploads_seed" ]; then
  echo "==> Syncing bundled seed assets to persistent uploads volume..."
  cp -rn /app/apps/api/uploads_seed/* /app/apps/api/uploads/ 2>/dev/null || true
  AUTOGRAPH_COUNT=$(ls -1 /app/apps/api/uploads/autographs 2>/dev/null | wc -l)
  echo "==> Persistent uploads volume contains $AUTOGRAPH_COUNT autograph/photo files."
fi

echo "==> Applying database schema with Prisma..."
npx prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate

if [ "$SEED_ON_START" = "true" ]; then
  echo "==> Running database seed..."
  npm run seed --workspace=apps/api || echo "Seed skipped or already applied"
fi

echo "==> Starting backend server..."
exec "$@"
