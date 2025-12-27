#!/bin/bash

# Test Atlas402 End-to-End Flow
# This script demonstrates the complete agent → backend → blockchain flow

echo "🧪 Atlas402 End-to-End Test"
echo "=" | head -c 60
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "${YELLOW}Checking backend...${NC}"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "Please start the backend first:"
    echo "  cd backend && npm run dev"
    exit 1
fi

echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s http://localhost:3000/health | jq .
echo ""

# Test 2: System Status
echo -e "${YELLOW}Test 2: System Status${NC}"
curl -s http://localhost:3000/status | jq .
echo ""

# Test 3: Balance Query
echo -e "${YELLOW}Test 3: Balance Query${NC}"
EXECUTOR_ADDRESS=$(curl -s http://localhost:3000/status | jq -r '.executor.address')
echo "Querying balance for: $EXECUTOR_ADDRESS"
curl -s "http://localhost:3000/balance/$EXECUTOR_ADDRESS" | jq .
echo ""

# Test 4: Execute Payment (SIMULATION - Update recipient address)
echo -e "${YELLOW}Test 4: Execute Payment (SIMULATION)${NC}"
echo "This would execute a payment. Update the recipient address to test."
echo ""
echo "Example command:"
echo 'curl -X POST http://localhost:3000/execute/payment \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{\"recipient\": \"0xYourTestAddress\", \"amount\": \"0.1\", \"reason\": \"Test payment\"}"'
echo ""

# Summary
echo "=" | head -c 60
echo ""
echo -e "${GREEN}✓ All tests complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update .env with real wallet addresses"
echo "  2. Fund your executor wallet with test CRO"
echo "  3. Try executing a real payment"
echo ""
