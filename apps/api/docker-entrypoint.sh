#!/bin/sh
set -e

echo "==> Ensuring upload directory structures exist..."
mkdir -p /app/apps/api/uploads/autographs
mkdir -p /app/apps/api/secure_uploads/books /app/apps/api/secure_uploads/pages

# Check if persistent volume is missing autographs and seed from bundled uploads_seed
if [ -d "/app/apps/api/uploads_seed" ]; then
  AUTOGRAPH_COUNT=$(ls -1 /app/apps/api/uploads/autographs 2>/dev/null | wc -l)
  if [ "$AUTOGRAPH_COUNT" -eq 0 ]; then
    echo "==> Persistent volume autographs directory is empty. Syncing from bundled seed..."
    cp -rn /app/apps/api/uploads_seed/* /app/apps/api/uploads/ 2>/dev/null || true
    echo "==> Synced $(ls -1 /app/apps/api/uploads/autographs 2>/dev/null | wc -l) visitor autograph/photo files into persistent volume."
  else
    echo "==> Persistent volume contains $AUTOGRAPH_COUNT autograph/photo files."
  fi
fi

echo "==> Applying database schema with Prisma..."
npx prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate

if [ "$SEED_ON_START" = "true" ]; then
  echo "==> Running database seed..."
  npm run seed --workspace=apps/api || echo "Seed skipped or already applied"
fi

echo "==> Starting backend server..."
exec "$@"
