#!/bin/bash

# Atlas402 Quick Setup Script
# This script helps you get started quickly

echo "🚀 Atlas402 Quick Setup"
echo "======================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  IMPORTANT: Edit .env and add your private keys and API keys!"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
echo ""

echo "Installing contracts dependencies..."
cd contracts
npm install
cd ..

echo ""
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo ""
echo "Installing scripts dependencies..."
cd scripts
npm install
cd ..

echo ""
echo "✅ All dependencies installed!"
echo ""

# Check configuration
echo "🔍 Checking configuration..."
echo ""

if grep -q "your_.*_here" .env; then
    echo "⚠️  WARNING: You still have placeholder values in .env"
    echo "   Please edit .env and add:"
    echo "   - DEPLOYER_PRIVATE_KEY"
    echo "   - EXECUTOR_PRIVATE_KEY"
    echo "   - OPENAI_API_KEY (or ANTHROPIC_API_KEY)"
    echo ""
else
    echo "✅ .env appears to be configured"
    echo ""
fi

# Summary
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Edit .env and add your keys (if not done yet)"
echo "   nano .env"
echo ""
echo "2. Get testnet CRO from faucet:"
echo "   https://cronos.org/faucet"
echo ""
echo "3. Check wallet balances:"
echo "   cd scripts && npm run fund-wallet"
echo ""
echo "4. Compile contracts:"
echo "   cd contracts && npm run compile"
echo ""
echo "5. Deploy to Cronos testnet:"
echo "   npm run deploy:testnet"
echo ""
echo "6. Start backend:"
echo "   cd backend && npm run dev"
echo ""
echo "📖 For detailed instructions, see INSTRUCTIONS.md"
echo ""
echo "✨ Setup complete!"
