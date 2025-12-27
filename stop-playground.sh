#!/bin/bash

# x402 Agent Playground Stop Script
# This script stops all running services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} ✅ $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} ⚠️  $1"
}

print_error() {
    echo -e "${RED}[$(date +%H:%M:%S)]${NC} ❌ $1"
}

print_status "Stopping x402 Agent Playground services..."
echo ""

# Find and kill backend processes
print_status "Looking for backend processes on port 3000..."
BACKEND_PIDS=$(lsof -ti:3000 2>/dev/null || true)
if [ -n "$BACKEND_PIDS" ]; then
    echo "$BACKEND_PIDS" | xargs kill -9 2>/dev/null || true
    print_success "Backend stopped"
else
    print_warning "No backend process found on port 3000"
fi

# Find and kill frontend processes
print_status "Looking for frontend processes on port 3001..."
FRONTEND_PIDS=$(lsof -ti:3001 2>/dev/null || true)
if [ -n "$FRONTEND_PIDS" ]; then
    echo "$FRONTEND_PIDS" | xargs kill -9 2>/dev/null || true
    print_success "Frontend stopped"
else
    print_warning "No frontend process found on port 3001"
fi

# Also kill any node processes from the directories
print_status "Cleaning up any remaining Node.js processes..."
pkill -f "npm start" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

echo ""
print_success "All services stopped!"
echo ""
print_status "You can restart with: ./start-playground.sh"
echo ""
