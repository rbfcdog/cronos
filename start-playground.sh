#!/bin/bash

# x402 Agent Playground Startup Script
# This script starts all necessary services for the playground

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} ✅ $1"
}

print_error() {
    echo -e "${RED}[$(date +%H:%M:%S)]${NC} ❌ $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} ⚠️  $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Must be run from the cronos root directory"
    exit 1
fi

print_status "Starting x402 Agent Playground..."
echo ""

# Create log directory
mkdir -p logs

# Check Node.js
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js $(node --version) found"

# Check npm
print_status "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm --version) found"

# Check backend dependencies
print_status "Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    print_warning "Backend dependencies not found, installing..."
    cd backend && npm install && cd ..
fi
print_success "Backend dependencies OK"

# Check frontend dependencies
print_status "Checking frontend dependencies..."
if [ ! -d "frontend-playground/node_modules" ]; then
    print_warning "Frontend dependencies not found, installing..."
    cd frontend-playground && npm install && cd ..
fi
print_success "Frontend dependencies OK"

# Check environment files
print_status "Checking environment configuration..."
if [ ! -f "frontend-playground/.env.local" ]; then
    print_warning ".env.local not found in frontend-playground"
    print_status "Creating .env.local with defaults..."
    cat > frontend-playground/.env.local << EOF
# WalletConnect Project ID (Get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Cronos Testnet RPC
NEXT_PUBLIC_CRONOS_RPC_URL=https://evm-t3.cronos.org
EOF
    print_warning "Please update NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in frontend-playground/.env.local"
fi

# Start backend
print_status "Starting backend server on port 3000..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
print_success "Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
print_status "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/playground/health > /dev/null 2>&1; then
        print_success "Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend failed to start (timeout)"
        print_status "Check logs/backend.log for details"
        exit 1
    fi
    sleep 1
done

# Start frontend
print_status "Starting frontend server on port 3001..."
cd frontend-playground
npm run start -- --port 3001 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
print_success "Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
print_status "Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        print_success "Frontend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Frontend failed to start (timeout)"
        print_status "Check logs/frontend.log for details"
        exit 1
    fi
    sleep 1
done

echo ""
print_success "================================================"
print_success "x402 Agent Playground is ready!"
print_success "================================================"
echo ""
echo -e "${GREEN}🚀 Frontend:${NC} http://localhost:3001"
echo -e "${GREEN}🔧 Backend:${NC}  http://localhost:3000"
echo -e "${GREEN}📊 Health:${NC}   http://localhost:3000/api/playground/health"
echo ""
echo -e "${YELLOW}📝 View Logs:${NC}"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}🛑 Stop Services:${NC}"
echo "   Kill backend:  kill $BACKEND_PID"
echo "   Kill frontend: kill $FRONTEND_PID"
echo "   Kill both:     kill $BACKEND_PID $FRONTEND_PID"
echo ""
print_success "Services are running in the background!"
print_status "Script complete. Services will continue running."
echo ""
