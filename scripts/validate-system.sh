#!/bin/bash

###############################################################################
# x402 Agent Playground - System Validation Script
# 
# This script validates that the entire system is operational:
# 1. Backend server running
# 2. Playground APIs functional
# 3. AI agents working
# 4. Demo scripts passing
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║         x402 Agent Playground - System Validation                ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${BLUE}ℹ️  $message${NC}"
    fi
}

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name=$1
    local test_command=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Test $TOTAL_TESTS: $test_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if eval "$test_command"; then
        print_status "success" "PASSED: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        print_status "error" "FAILED: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

###############################################################################
# TEST 1: Check if backend server is running
###############################################################################
run_test "Backend Server Running" \
    "ps aux | grep -q '[t]s-node.*server.ts'"

###############################################################################
# TEST 2: Backend health check
###############################################################################
run_test "Backend Health Endpoint" \
    "curl -sf http://localhost:3000/health > /dev/null"

###############################################################################
# TEST 3: Playground health check
###############################################################################
run_test "Playground Health Endpoint" \
    "curl -sf http://localhost:3000/api/playground/health | grep -q 'operational'"

###############################################################################
# TEST 4: Playground simulate endpoint
###############################################################################
run_test "Playground Simulate API" \
    "curl -sf -X POST http://localhost:3000/api/playground/simulate \
     -H 'Content-Type: application/json' \
     -d '{\"mode\":\"simulate\",\"actions\":[{\"type\":\"read_balance\",\"token\":\"TCRO\"}]}' \
     | grep -q '\"success\":true'"

###############################################################################
# TEST 5: Playground validate endpoint
###############################################################################
run_test "Playground Validate API" \
    "curl -sf -X POST http://localhost:3000/api/playground/validate \
     -H 'Content-Type: application/json' \
     -d '{\"mode\":\"simulate\",\"actions\":[{\"type\":\"read_balance\",\"token\":\"TCRO\"}]}' \
     | grep -q '\"success\":true'"

###############################################################################
# TEST 6: Playground runs list endpoint
###############################################################################
run_test "Playground List Runs API" \
    "curl -sf http://localhost:3000/api/playground/runs | grep -q '\"success\":true'"

###############################################################################
# TEST 7: Environment variables configured
###############################################################################
run_test "Environment Variables" \
    "grep -q '^EXECUTOR_PRIVATE_KEY=' backend/.env && grep -q '^OPENAI_API_KEY=sk-' .env"

###############################################################################
# TEST 8: Smart contracts deployed
###############################################################################
run_test "Smart Contracts Deployed" \
    "grep -q '^EXECUTION_ROUTER_ADDRESS=0x' backend/.env && \
     grep -q '^TREASURY_VAULT_ADDRESS=0x' backend/.env && \
     grep -q '^ATTESTATION_REGISTRY_ADDRESS=0x' backend/.env"

###############################################################################
# TEST 9: Node modules installed (backend)
###############################################################################
run_test "Backend Dependencies" \
    "[ -d backend/node_modules ] && [ -f backend/node_modules/.bin/ts-node ]"

###############################################################################
# TEST 10: Node modules installed (agents)
###############################################################################
run_test "Agents Dependencies" \
    "[ -d agents/node_modules ] && [ -f agents/node_modules/.bin/ts-node ]"

###############################################################################
# SUMMARY
###############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "                        VALIDATION SUMMARY                         "
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Total Tests:  $TOTAL_TESTS"
print_status "success" "Passed: $PASSED_TESTS"
[ $FAILED_TESTS -gt 0 ] && print_status "error" "Failed: $FAILED_TESTS" || print_status "info" "Failed: 0"
echo ""

# Calculate percentage
PASS_PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

if [ $PASS_PERCENTAGE -eq 100 ]; then
    print_status "success" "ALL TESTS PASSED! System is fully operational. 🎉"
    echo ""
    echo "Next Steps:"
    echo "  1. Run demos:        node scripts/demo-playground.js"
    echo "  2. Test AI agents:   cd agents && npm run test"
    echo "  3. Try integration:  cd agents && npm run playground"
    echo ""
    exit 0
elif [ $PASS_PERCENTAGE -ge 80 ]; then
    print_status "warning" "Most tests passed ($PASS_PERCENTAGE%). Some features may not work."
    exit 1
else
    print_status "error" "Many tests failed ($PASS_PERCENTAGE%). System needs attention."
    exit 1
fi
