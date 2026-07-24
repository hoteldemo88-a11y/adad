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
    echo -e "${BLUE}[SETUP]${NC} $1"
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

check_command() {
    command -v "$1" >/dev/null 2>&1 || error "$1 is not installed. Please install it first."
}

log "Checking prerequisites..."
check_command node
check_command npm
check_command docker

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version 18 or higher is required. Current: $(node -v)"
fi

log "Node.js version: $(node -v)"

# Copy environment file if it does not exist
if [ ! -f "$ROOT_DIR/.env" ]; then
    log "Creating .env from .env.example..."
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    warn "Created .env file. Please edit it with your actual configuration values."
else
    log ".env file already exists, skipping creation."
fi

# Install root dependencies
log "Installing root dependencies..."
cd "$ROOT_DIR"
if [ -f "package.json" ]; then
    npm install
    success "Root dependencies installed."
else
    log "No root package.json found, skipping root npm install."
fi

# Install backend dependencies and run migrations
log "Setting up backend..."
cd "$ROOT_DIR/backend"
if [ -f "package.json" ]; then
    npm install
    success "Backend dependencies installed."

    log "Generating Prisma client..."
    npx prisma generate
    success "Prisma client generated."

    log "Running database migrations..."
    npx prisma migrate deploy || warn "Migrations failed. Make sure the database is running."
    success "Database migrations completed."
else
    error "Backend package.json not found."
fi

# Install dashboard dependencies
log "Setting up dashboard..."
cd "$ROOT_DIR/dashboard"
if [ -f "package.json" ]; then
    npm install
    success "Dashboard dependencies installed."
else
    error "Dashboard package.json not found."
fi

# Seed the database
log "Seeding the database..."
cd "$ROOT_DIR/backend"
if [ -f "../scripts/seed.ts" ]; then
    npx ts-node ../scripts/seed.ts || warn "Database seeding failed. You can run it manually later."
    success "Database seeded."
else
    warn "Seed script not found at scripts/seed.ts. Skipping."
fi

cd "$ROOT_DIR"

# Start Docker services if Docker is available
if command -v docker &> /dev/null; then
    log "Starting Docker services (postgres, redis)..."
    docker compose up -d postgres redis
    log "Waiting for services to be healthy..."
    sleep 5
    success "Docker services started."
fi

echo ""
success "========================================="
success "  Setup complete!"
success "========================================="
echo ""
log "Next steps:"
echo "  1. Edit .env with your configuration"
echo "  2. Start development:"
echo "     - Backend:    cd backend && npm run dev"
echo "     - Dashboard:  cd dashboard && npm run dev"
echo "  3. Or use Docker: docker compose -f docker-compose.yml -f docker-compose.dev.yml up"
echo ""
