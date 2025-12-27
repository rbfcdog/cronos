#!/bin/bash

# Quick test script to verify backend integration

echo "Testing backend endpoints..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test health endpoint
echo -n "Testing /api/playground/health... "
if curl -s http://localhost:3000/api/playground/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "Backend might not be running. Start it with: ./start-playground.sh"
    exit 1
fi

# Test simulate endpoint
echo -n "Testing /api/playground/simulate... "
response=$(curl -s -X POST http://localhost:3000/api/playground/simulate \
    -H "Content-Type: application/json" \
    -d '{"actions":[{"type":"read_balance","params":{"address":"0x0000000000000000000000000000000000000000"}}]}')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    exit 1
fi

# Test validate endpoint
echo -n "Testing /api/playground/validate... "
response=$(curl -s -X POST http://localhost:3000/api/playground/validate \
    -H "Content-Type: application/json" \
    -d '{"actions":[{"type":"read_balance","params":{"address":"0x0000000000000000000000000000000000000000"}}]}')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    exit 1
fi

# Test runs list endpoint
echo -n "Testing /api/playground/runs... "
response=$(curl -s http://localhost:3000/api/playground/runs)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}All backend endpoints are working!${NC}"
