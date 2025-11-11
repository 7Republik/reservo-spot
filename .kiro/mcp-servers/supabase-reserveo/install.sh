#!/bin/bash

# Supabase Reserveo MCP Server - Installation Script
# This script installs dependencies and verifies the setup

set -e

echo "🚀 Installing Supabase Reserveo MCP Server..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from .kiro/mcp-servers/supabase-reserveo/"
    exit 1
fi

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node.js version: $NODE_VERSION"

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
npm install

# Verify installation
echo ""
echo "✅ Verifying installation..."

if [ -d "node_modules/@modelcontextprotocol" ]; then
    echo "   ✓ @modelcontextprotocol/sdk installed"
else
    echo "   ✗ @modelcontextprotocol/sdk NOT installed"
    exit 1
fi

if [ -d "node_modules/@supabase" ]; then
    echo "   ✓ @supabase/supabase-js installed"
else
    echo "   ✗ @supabase/supabase-js NOT installed"
    exit 1
fi

# Check Supabase CLI (optional)
echo ""
echo "🔍 Checking Supabase CLI (optional)..."
if command -v supabase &> /dev/null; then
    SUPABASE_VERSION=$(supabase --version)
    echo "   ✓ Supabase CLI installed: $SUPABASE_VERSION"
else
    echo "   ⚠️  Supabase CLI not found (optional)"
    echo "   Install with: brew install supabase/tap/supabase"
    echo "   Or: npm install -g supabase"
fi

# Success message
echo ""
echo "✨ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart Kiro to detect the new MCP server"
echo "   2. Or use Command Palette → 'MCP: Reconnect Servers'"
echo "   3. Test with: 'List all tables in Supabase'"
echo ""
echo "📚 Documentation: .kiro/mcp-servers/supabase-reserveo/README.md"
echo ""
