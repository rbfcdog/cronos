#!/bin/bash

# Check project readiness for hackathon submission

echo "🔍 Atlas402 Readiness Check"
echo "=" | head -c 60
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check directory structure
echo "📁 Checking project structure..."
[ -d "contracts" ] && check_pass "contracts/ exists" || check_fail "contracts/ missing"
[ -d "agents" ] && check_pass "agents/ exists" || check_fail "agents/ missing"
[ -d "backend" ] && check_pass "backend/ exists" || check_fail "backend/ missing"
[ -d "docs" ] && check_pass "docs/ exists" || check_fail "docs/ missing"
[ -d "scripts" ] && check_pass "scripts/ exists" || check_fail "scripts/ missing"
[ -d "frontend" ] && check_pass "frontend/ exists" || check_warn "frontend/ exists (UI pending)"
echo ""

# Check key files
echo "📄 Checking key files..."
[ -f "README.md" ] && check_pass "README.md exists" || check_fail "README.md missing"
[ -f "INSTRUCTIONS.md" ] && check_pass "INSTRUCTIONS.md exists" || check_fail "INSTRUCTIONS.md missing"
[ -f ".env.example" ] && check_pass ".env.example exists" || check_fail ".env.example missing"
[ -f "setup.sh" ] && check_pass "setup.sh exists" || check_fail "setup.sh missing"
echo ""

# Check contracts
echo "📜 Checking smart contracts..."
[ -f "contracts/src/ExecutionRouter.sol" ] && check_pass "ExecutionRouter.sol" || check_fail "ExecutionRouter.sol missing"
[ -f "contracts/src/TreasuryVault.sol" ] && check_pass "TreasuryVault.sol" || check_fail "TreasuryVault.sol missing"
[ -f "contracts/src/AttestationRegistry.sol" ] && check_pass "AttestationRegistry.sol" || check_fail "AttestationRegistry.sol missing"
[ -f "contracts/hardhat.config.ts" ] && check_pass "hardhat.config.ts" || check_fail "hardhat.config.ts missing"
[ -f "contracts/scripts/deploy.ts" ] && check_pass "deploy.ts" || check_fail "deploy.ts missing"
[ -f "contracts/test/execution.test.ts" ] && check_pass "execution.test.ts" || check_fail "execution.test.ts missing"
echo ""

# Check agents
echo "🤖 Checking AI agents..."
[ -f "agents/src/planner.agent.ts" ] && check_pass "planner.agent.ts" || check_fail "planner.agent.ts missing"
[ -f "agents/src/risk.agent.ts" ] && check_pass "risk.agent.ts" || check_fail "risk.agent.ts missing"
[ -f "agents/src/executor.agent.ts" ] && check_pass "executor.agent.ts" || check_fail "executor.agent.ts missing"
[ -f "agents/prompts/system.md" ] && check_pass "system.md prompt" || check_fail "system.md missing"
echo ""

# Check backend
echo "🧠 Checking backend..."
[ -f "backend/src/server.ts" ] && check_pass "server.ts" || check_fail "server.ts missing"
[ -f "backend/src/routes/execute.ts" ] && check_pass "execute.ts routes" || check_fail "execute.ts missing"
[ -f "backend/src/services/cronos.service.ts" ] && check_pass "cronos.service.ts" || check_fail "cronos.service.ts missing"
[ -f "backend/src/services/x402.service.ts" ] && check_pass "x402.service.ts" || check_fail "x402.service.ts missing"
[ -f "backend/src/services/market.service.ts" ] && check_pass "market.service.ts" || check_fail "market.service.ts missing"
[ -f "backend/src/config/index.ts" ] && check_pass "config/index.ts" || check_fail "config/index.ts missing"
echo ""

# Check documentation
echo "📚 Checking documentation..."
[ -f "docs/architecture.md" ] && check_pass "architecture.md" || check_fail "architecture.md missing"
[ -f "docs/setup.md" ] && check_pass "setup.md" || check_fail "setup.md missing"
[ -f "docs/demo.md" ] && check_pass "demo.md" || check_fail "demo.md missing"
[ -f "docs/integrations.md" ] && check_pass "integrations.md" || check_fail "integrations.md missing"
echo ""

# Check utilities
echo "🛠️  Checking utilities..."
[ -f "scripts/fund-wallet.ts" ] && check_pass "fund-wallet.ts" || check_fail "fund-wallet.ts missing"
[ -f "scripts/verify-contract.ts" ] && check_pass "verify-contract.ts" || check_fail "verify-contract.ts missing"
[ -f "scripts/test-e2e.sh" ] && check_pass "test-e2e.sh" || check_fail "test-e2e.sh missing"
echo ""

# Check package.json files
echo "📦 Checking package.json files..."
[ -f "contracts/package.json" ] && check_pass "contracts/package.json" || check_fail "contracts/package.json missing"
[ -f "agents/package.json" ] && check_pass "agents/package.json" || check_fail "agents/package.json missing"
[ -f "backend/package.json" ] && check_pass "backend/package.json" || check_fail "backend/package.json missing"
echo ""

# Check .env configuration
echo "⚙️  Checking configuration..."
if [ -f ".env" ]; then
    check_pass ".env file exists"
    
    # Check for placeholder values
    if grep -q "your_.*_here" .env 2>/dev/null; then
        check_warn ".env contains placeholder values - needs configuration"
    else
        check_pass ".env appears configured"
    fi
else
    check_warn ".env not created yet (use .env.example)"
fi
echo ""

# Check git
echo "📑 Checking git repository..."
if [ -d ".git" ]; then
    check_pass "Git repository initialized"
    
    BRANCH=$(git branch --show-current 2>/dev/null)
    if [ ! -z "$BRANCH" ]; then
        check_pass "Current branch: $BRANCH"
    fi
    
    COMMITS=$(git rev-list --count HEAD 2>/dev/null)
    if [ ! -z "$COMMITS" ] && [ "$COMMITS" -gt 0 ]; then
        check_pass "Commits: $COMMITS"
    fi
else
    check_fail "Git repository not initialized"
fi
echo ""

# Summary
echo "=" | head -c 60
echo ""
echo "📊 Summary:"
echo -e "   ${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "   ${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Project is ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Configure .env with your keys"
    echo "  2. Deploy contracts: cd contracts && npm run deploy:testnet"
    echo "  3. Start backend: cd backend && npm run dev"
    echo "  4. Test system: cd scripts && ./test-e2e.sh"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Project has missing components${NC}"
    echo "Please check the failed items above"
    echo ""
    exit 1
fi
