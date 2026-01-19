#!/bin/sh
# Docker startup script for Refund-Med production

set -e

echo "🔄 Waiting for database to be ready..."
sleep 3

echo "📦 Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "🚀 Starting production server..."
exec node server.js
