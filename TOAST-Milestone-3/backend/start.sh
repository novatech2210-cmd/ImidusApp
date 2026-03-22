#!/bin/bash
#
# IMIDUS POS Integration - Startup Script
# Starts all services with a single command
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           IMIDUS POS Integration Platform                  ║"
echo "║                   Milestone 3 Delivery                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARN] .env file not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}[WARN] Please edit .env with your actual credentials before production use.${NC}"
    else
        echo -e "${RED}[ERROR] .env.example not found. Cannot continue.${NC}"
        exit 1
    fi
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check for Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}[ERROR] Docker Compose is not available.${NC}"
    echo "Please ensure Docker Compose v2 is installed."
    exit 1
fi

echo -e "${BLUE}[INFO] Stopping any existing containers...${NC}"
docker compose down --remove-orphans 2>/dev/null || true

echo -e "${BLUE}[INFO] Building and starting services...${NC}"
docker compose up -d --build

echo ""
echo -e "${BLUE}[INFO] Waiting for services to be healthy...${NC}"

# Wait for SQL Server
echo -n "  SQL Server: "
for i in {1..60}; do
    if docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$(grep SA_PASSWORD .env | cut -d= -f2)" -Q "SELECT 1" -C -No &> /dev/null 2>&1; then
        echo -e "${GREEN}Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for API
echo -n "  API Server: "
for i in {1..30}; do
    if curl -sf http://localhost:5004/health > /dev/null 2>&1; then
        echo -e "${GREEN}Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  All services started successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Access Points:${NC}"
echo -e "  ────────────────────────────────────────────────────────────"
echo -e "  API (Direct):      ${YELLOW}http://localhost:5004${NC}"
echo -e "  API (via Nginx):   ${YELLOW}http://localhost/api/${NC}"
echo -e "  Swagger Docs:      ${YELLOW}http://localhost:5004/swagger${NC}"
echo -e "  Health Check:      ${YELLOW}http://localhost:5004/health${NC}"
echo ""
echo -e "  ${BLUE}Database:${NC}"
echo -e "  ────────────────────────────────────────────────────────────"
echo -e "  SQL Server:        ${YELLOW}localhost:1433${NC}"
echo -e "  Database:          INI_Restaurant / IntegrationService"
echo ""
echo -e "  ${BLUE}Management:${NC}"
echo -e "  ────────────────────────────────────────────────────────────"
echo -e "  View logs:         ${YELLOW}docker compose logs -f${NC}"
echo -e "  Stop services:     ${YELLOW}docker compose down${NC}"
echo -e "  Restart services:  ${YELLOW}docker compose restart${NC}"
echo ""
echo -e "  ${BLUE}Enable DB Admin (Adminer):${NC}"
echo -e "  ────────────────────────────────────────────────────────────"
echo -e "  ${YELLOW}docker compose --profile debug up -d${NC}"
echo -e "  Then access:       ${YELLOW}http://localhost:8080${NC}"
echo ""
