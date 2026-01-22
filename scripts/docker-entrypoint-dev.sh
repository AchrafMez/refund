#!/bin/sh
set -e

# Install deps if needed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Sync schema
echo "Syncing database..."
npx prisma db push --skip-generate

echo "Starting dev server..."
exec npm run dev
