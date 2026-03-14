#!/bin/bash
#==============================================================================
# Imidus POS Integration - One-Click Local Development Startup
#==============================================================================
# Usage: ./start-local.sh [--rebuild] [--reset-db]
#
# This script starts ALL services needed for local development:
# - SQL Server (Docker) with INI_Restaurant database
# - Backend API (.NET 9)
# - Web Customer Portal (Next.js)
# - Admin Portal (Next.js)
#
# Prerequisites:
# - Docker Desktop running
# - Node.js 18+ installed
# - pnpm or npm installed
#==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/src/backend"
WEB_DIR="${SCRIPT_DIR}/src/web"
ADMIN_DIR="${SCRIPT_DIR}/src/admin"
MOBILE_DIR="${SCRIPT_DIR}/src/mobile/ImidusCustomerApp"

# Parse arguments
REBUILD=false
RESET_DB=false
for arg in "$@"; do
    case $arg in
        --rebuild) REBUILD=true ;;
        --reset-db) RESET_DB=true ;;
    esac
done

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    echo -e "${GREEN}Cleanup complete.${NC}"
}
trap cleanup EXIT

print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   ${GREEN}IMIDUS POS INTEGRATION${CYAN}                                      ║${NC}"
    echo -e "${CYAN}║   ${NC}One-Click Local Development Environment${CYAN}                      ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_prerequisites() {
    echo -e "${BLUE}[1/6] Checking prerequisites...${NC}"

    local missing=()

    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi

    if ! docker info &> /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running. Please start Docker Desktop.${NC}"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        missing+=("node")
    fi

    if ! command -v pnpm &> /dev/null && ! command -v npm &> /dev/null; then
        missing+=("pnpm or npm")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}Error: Missing prerequisites: ${missing[*]}${NC}"
        exit 1
    fi

    echo -e "${GREEN}  ✓ Docker running${NC}"
    echo -e "${GREEN}  ✓ Node.js $(node -v)${NC}"
    if command -v pnpm &> /dev/null; then
        echo -e "${GREEN}  ✓ pnpm $(pnpm -v)${NC}"
        PKG_MANAGER="pnpm"
    else
        echo -e "${GREEN}  ✓ npm $(npm -v)${NC}"
        PKG_MANAGER="npm"
    fi
    echo ""
}

start_database() {
    echo -e "${BLUE}[2/6] Starting SQL Server...${NC}"

    cd "${BACKEND_DIR}"

    # Check if container already running
    if docker ps --format '{{.Names}}' | grep -q "^imidus-sqlserver$"; then
        if [ "$RESET_DB" = true ]; then
            echo "  Resetting database..."
            docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
                -S localhost -U sa -P "YourStrong@Passw0rd" -C \
                -Q "IF EXISTS (SELECT name FROM sys.databases WHERE name = 'INI_Restaurant') DROP DATABASE INI_Restaurant" 2>/dev/null || true
        else
            echo -e "${GREEN}  ✓ SQL Server already running${NC}"
        fi
    else
        echo "  Starting SQL Server container..."
        docker-compose up -d sqlserver

        # Wait for SQL Server to be ready
        echo "  Waiting for SQL Server to be ready..."
        for i in {1..30}; do
            if docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C -Q "SELECT 1" &>/dev/null; then
                break
            fi
            sleep 2
        done
    fi

    # Restore INI_Restaurant if needed
    DB_EXISTS=$(docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "YourStrong@Passw0rd" -C -h -1 \
        -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = 'INI_Restaurant'" 2>/dev/null || echo "0")

    if [ "${DB_EXISTS//[[:space:]]/}" -eq 0 ]; then
        echo "  Restoring INI_Restaurant database from backup..."

        # Check for backup file (handle both spellings)
        BACKUP_FILE=""
        if docker exec imidus-sqlserver test -f "/var/opt/mssql/backup/INI_Restaurant.Bak" 2>/dev/null; then
            BACKUP_FILE="/var/opt/mssql/backup/INI_Restaurant.Bak"
        elif docker exec imidus-sqlserver test -f "/var/opt/mssql/backup/INI_Restaruant.Bak" 2>/dev/null; then
            BACKUP_FILE="/var/opt/mssql/backup/INI_Restaruant.Bak"
        fi

        if [ -n "$BACKUP_FILE" ]; then
            # Get logical file names
            LOGICAL_DATA=$(docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
                -S localhost -U sa -P "YourStrong@Passw0rd" -C -h -1 \
                -Q "SET NOCOUNT ON; RESTORE FILELISTONLY FROM DISK = '${BACKUP_FILE}'" 2>/dev/null | head -n 1 | awk '{print $1}')

            LOGICAL_LOG=$(docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
                -S localhost -U sa -P "YourStrong@Passw0rd" -C -h -1 \
                -Q "SET NOCOUNT ON; RESTORE FILELISTONLY FROM DISK = '${BACKUP_FILE}'" 2>/dev/null | tail -n +2 | head -n 1 | awk '{print $1}')

            # Restore with MOVE
            docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
                -S localhost -U sa -P "YourStrong@Passw0rd" -C \
                -Q "RESTORE DATABASE [INI_Restaurant]
                    FROM DISK = '${BACKUP_FILE}'
                    WITH MOVE '${LOGICAL_DATA}' TO '/var/opt/mssql/data/INI_Restaurant.mdf',
                         MOVE '${LOGICAL_LOG}' TO '/var/opt/mssql/data/INI_Restaurant_log.ldf',
                         REPLACE"

            echo -e "${GREEN}  ✓ INI_Restaurant database restored${NC}"
        else
            echo -e "${YELLOW}  ! No backup file found - using empty database${NC}"
            # Create IntegrationService database if needed
            docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
                -S localhost -U sa -P "YourStrong@Passw0rd" -C \
                -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IntegrationService') CREATE DATABASE IntegrationService" 2>/dev/null || true
        fi
    else
        echo -e "${GREEN}  ✓ INI_Restaurant database exists${NC}"
    fi

    # Create IntegrationService database if needed
    docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "YourStrong@Passw0rd" -C \
        -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IntegrationService') CREATE DATABASE IntegrationService" 2>/dev/null || true

    echo ""
}

start_backend() {
    echo -e "${BLUE}[3/6] Starting Backend API...${NC}"

    cd "${BACKEND_DIR}"

    if [ "$REBUILD" = true ]; then
        echo "  Rebuilding API container..."
        docker-compose build api
    fi

    # Check if API is already running
    if docker ps --format '{{.Names}}' | grep -q "^imidus-api$"; then
        if [ "$REBUILD" = true ]; then
            docker-compose stop api
            docker-compose up -d api
        else
            echo -e "${GREEN}  ✓ Backend API already running${NC}"
        fi
    else
        echo "  Starting Backend API..."
        docker-compose up -d api
    fi

    # Wait for API to be ready
    echo "  Waiting for API health check..."
    for i in {1..30}; do
        if curl -sf http://localhost:5004/health &>/dev/null; then
            echo -e "${GREEN}  ✓ Backend API running at http://localhost:5004${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${YELLOW}  ! API health check timeout - check docker logs${NC}"
        fi
        sleep 2
    done
    echo ""
}

start_web() {
    echo -e "${BLUE}[4/6] Starting Customer Web Portal...${NC}"

    cd "${WEB_DIR}"

    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "$REBUILD" = true ]; then
        echo "  Installing dependencies..."
        $PKG_MANAGER install --silent 2>/dev/null || $PKG_MANAGER install
    fi

    # Start dev server in background
    echo "  Starting Next.js dev server..."
    PORT=3000 $PKG_MANAGER run dev > /tmp/web-dev.log 2>&1 &
    WEB_PID=$!

    # Wait for server to be ready
    for i in {1..20}; do
        if curl -sf http://localhost:3000 &>/dev/null; then
            echo -e "${GREEN}  ✓ Customer Web running at http://localhost:3000${NC}"
            break
        fi
        sleep 1
    done
    echo ""
}

start_admin() {
    echo -e "${BLUE}[5/6] Starting Admin Portal...${NC}"

    cd "${ADMIN_DIR}"

    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "$REBUILD" = true ]; then
        echo "  Installing dependencies..."
        $PKG_MANAGER install --silent 2>/dev/null || $PKG_MANAGER install
    fi

    # Start dev server in background
    echo "  Starting Next.js dev server..."
    PORT=3001 $PKG_MANAGER run dev > /tmp/admin-dev.log 2>&1 &
    ADMIN_PID=$!

    # Wait for server to be ready
    for i in {1..20}; do
        if curl -sf http://localhost:3001 &>/dev/null; then
            echo -e "${GREEN}  ✓ Admin Portal running at http://localhost:3001${NC}"
            break
        fi
        sleep 1
    done
    echo ""
}

print_summary() {
    echo -e "${BLUE}[6/6] All services started!${NC}"
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   ${GREEN}ALL SERVICES RUNNING${CYAN}                                         ║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${YELLOW}Backend API:${NC}      http://localhost:5004                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${YELLOW}API Health:${NC}       http://localhost:5004/health              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${YELLOW}API Docs:${NC}         http://localhost:5004/swagger             ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${YELLOW}Customer Web:${NC}     http://localhost:3000                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${YELLOW}Admin Portal:${NC}     http://localhost:3001                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${YELLOW}SQL Server:${NC}       localhost:1433                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${YELLOW}Database:${NC}         INI_Restaurant                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}   ${NC}Press ${RED}Ctrl+C${NC} to stop all services                           ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Logs:${NC}"
    echo "  Web:    tail -f /tmp/web-dev.log"
    echo "  Admin:  tail -f /tmp/admin-dev.log"
    echo "  API:    docker logs -f imidus-api"
    echo ""
}

# Main execution
print_banner
check_prerequisites
start_database
start_backend
start_web
start_admin
print_summary

# Keep script running to maintain child processes
wait
