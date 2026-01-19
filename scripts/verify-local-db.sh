#!/bin/bash
# ============================================
# verify-local-db.sh
# Verifies local PostgreSQL Docker setup
# ============================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verifying Local PostgreSQL Setup..."
echo "========================================"

# 1. Check if Docker is running
echo -n "1. Docker daemon running... "
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Error: Docker is not running. Start Docker first."
    exit 1
fi

# 2. Check if the PostgreSQL container exists and is running
echo -n "2. PostgreSQL container running... "
if docker ps --format '{{.Names}}' | grep -q "refund-med-db"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Error: Container 'refund-med-db' is not running."
    echo "   Run: docker compose up -d db"
    exit 1
fi

# 3. Check if PostgreSQL is accepting connections
echo -n "3. PostgreSQL accepting connections... "
if docker exec refund-med-db pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Error: PostgreSQL is not ready to accept connections."
    exit 1
fi

# 4. Check if the database exists
echo -n "4. Database 'local_db' exists... "
DB_EXISTS=$(docker exec refund-med-db psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='local_db'")
if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   Error: Database 'local_db' does not exist."
    exit 1
fi

# 5. List tables in the database
echo ""
echo "📋 Tables in 'local_db':"
echo "------------------------"
TABLES=$(docker exec refund-med-db psql -U postgres -d local_db -tAc "SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
if [ -z "$TABLES" ]; then
    echo -e "${YELLOW}   No tables found. Run 'npx prisma db push' to create schema.${NC}"
else
    echo "$TABLES" | while read table; do
        if [ -n "$table" ]; then
            COUNT=$(docker exec refund-med-db psql -U postgres -d local_db -tAc "SELECT COUNT(*) FROM \"$table\"")
            echo "   - $table ($COUNT rows)"
        fi
    done
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ Local PostgreSQL is ready!${NC}"
echo ""
echo "Next steps:"
echo "  - Run 'npx prisma db push' to sync schema"
echo "  - Run 'npx prisma studio' to browse data"
