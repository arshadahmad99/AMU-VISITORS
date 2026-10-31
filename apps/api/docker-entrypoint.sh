#!/bin/sh
set -e

echo "==> Applying database schema with Prisma..."
npx prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate

if [ "$SEED_ON_START" = "true" ]; then
  echo "==> Running database seed..."
  npm run seed --workspace=apps/api || echo "Seed skipped or already applied"
fi

echo "==> Starting backend server..."
exec "$@"
