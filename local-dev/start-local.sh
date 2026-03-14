#!/bin/bash
# IMIDUS POS Integration - One-Click Local Development Environment
# Usage: ./start-local.sh [--with-restore] [--skip-build]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
WITH_RESTORE=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --with-restore)
            WITH_RESTORE=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help|-h)
            echo "IMIDUS POS Integration - One-Click Local Environment"
            echo ""
            echo "Usage: ./start-local.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --with-restore    Restore INI_Restaurant database from backup"
            echo "  --skip-build      Skip Docker build (use cached images)"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./start-local.sh                    # Start services only"
            echo "  ./start-local.sh --with-restore     # Start and restore database"
            echo "  ./start-local.sh --skip-build       # Start without rebuilding"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

cd "$(dirname "$0")"

echo "=========================================="
echo "  IMIDUS POS Integration"
echo "  One-Click Local Development"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"
echo ""

# Check for database backup
if [ ! -f "db/backups/INI_Restaurant.Bak" ]; then
    echo -e "${YELLOW}⚠ Database backup not found${NC}"
    echo "Expected: db/backups/INI_Restaurant.Bak"
    echo ""
    read -p "Continue without database restore? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    WITH_RESTORE=false
fi

# Build and start services
echo "Starting services..."
if [ "$SKIP_BUILD" = true ]; then
    echo "Skipping build (using cached images)..."
    docker-compose up -d
else
    echo "Building and starting services..."
    docker-compose up -d --build
fi

echo ""
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Wait for SQL Server
echo "Waiting for SQL Server to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "YourStrong@Passw0rd" -C -Q "SELECT 1" &>/dev/null; then
        echo -e "${GREEN}✓ SQL Server is ready${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ SQL Server failed to start${NC}"
    echo "Check logs: docker-compose logs sqlserver"
    exit 1
fi

echo ""

# Restore database if requested
if [ "$WITH_RESTORE" = true ]; then
    echo -e "${BLUE}▶ Restoring INI_Restaurant database...${NC}"
    echo ""
    ./scripts/restore-database.sh
    echo ""
fi

# Wait for API
echo "Waiting for API to be ready..."
MAX_RETRIES=20
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5004/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is ready${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠ API may still be starting${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  ✓ Local environment is ready!${NC}"
echo "=========================================="
echo ""
echo "Services:"
echo "  🗄️  SQL Server:    localhost:1433"
echo "  🔌 Backend API:    http://localhost:5004"
echo "  🗄️  Adminer (DB):   http://localhost:8080"
echo ""
echo "Connection Strings:"
echo "  POS Database:       Server=localhost,1433;Database=INI_Restaurant;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;"
echo "  Backend Database:   Server=localhost,1433;Database=IntegrationService;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;"
echo ""
echo "Useful Commands:"
echo "  ./scripts/restore-database.sh    # Restore database from backup"
echo "  docker-compose logs -f api       # Watch API logs"
echo "  docker-compose logs -f sqlserver # Watch SQL Server logs"
echo "  docker-compose down              # Stop all services"
echo ""
echo "Testing:"
echo "  curl http://localhost:5004/health"
echo "  curl http://localhost:5004/swagger"
echo ""
