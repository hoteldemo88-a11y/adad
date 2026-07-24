#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

ENVIRONMENT="${1:-production}"
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.yml"
elif [ "$ENVIRONMENT" = "staging" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    error "Invalid environment. Use 'production' or 'staging'."
fi

cd "$ROOT_DIR"

log "Deploying to $ENVIRONMENT environment..."

# Validate environment file
if [ ! -f ".env" ]; then
    error ".env file not found. Copy .env.example to .env and configure it."
fi

source .env

if [ -z "${JWT_SECRET:-}" ] || [ "${#JWT_SECRET}" -lt 32 ]; then
    error "JWT_SECRET must be set and at least 32 characters long."
fi

if [ -z "${JWT_REFRESH_SECRET:-}" ] || [ "${#JWT_REFRESH_SECRET}" -lt 32 ]; then
    error "JWT_REFRESH_SECRET must be set and at least 32 characters long."
fi

if [ -z "${POSTGRES_PASSWORD:-}" ] || [ "${POSTGRES_PASSWORD}" = "postgres" ]; then
    error "POSTGRES_PASSWORD must be set to a strong password (not the default)."
fi

log "Pulling latest changes..."
git pull origin main || warn "Git pull failed or not a git repository."

log "Building Docker images..."
docker compose -f "$COMPOSE_FILE" build --no-cache

log "Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans

log "Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

log "Waiting for services to become healthy..."
RETRIES=30
until docker compose -f "$COMPOSE_FILE" ps | grep -q "healthy" || [ $RETRIES -eq 0 ]; do
    RETRIES=$((RETRIES - 1))
    echo -n "."
    sleep 2
done
echo ""

if [ $RETRIES -eq 0 ]; then
    warn "Some services may not be healthy. Check with: docker compose ps"
fi

log "Running database migrations..."
docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy || warn "Migrations failed or already up to date."

log "Pruning unused Docker images..."
docker image prune -f

success "========================================="
success "  Deployment complete! ($ENVIRONMENT)"
success "========================================="
echo ""
docker compose -f "$COMPOSE_FILE" ps
echo ""
log "Check logs with: docker compose -f $COMPOSE_FILE logs -f"
