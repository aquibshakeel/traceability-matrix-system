#!/bin/bash
###############################################################################
# Unit-Test-Tracer - Git Hook Installer
# 
# This script installs the pre-commit hook for automatic validation
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📦 Unit-Test-Tracer - Git Hook Installation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo "Please run this script from the root of your git repository"
    exit 1
fi

# Check if pre-commit script exists
if [ ! -f "scripts/pre-commit.sh" ]; then
    echo -e "${RED}❌ Error: scripts/pre-commit.sh not found${NC}"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Backup existing pre-commit hook if it exists
if [ -f ".git/hooks/pre-commit" ]; then
    echo -e "${YELLOW}⚠️  Existing pre-commit hook found${NC}"
    BACKUP_FILE=".git/hooks/pre-commit.backup.$(date +%Y%m%d_%H%M%S)"
    cp .git/hooks/pre-commit "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backed up to: $BACKUP_FILE${NC}"
    echo ""
fi

# Install the hook
echo "Installing pre-commit hook..."
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo -e "${GREEN}✅ Pre-commit hook installed successfully!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 What happens now:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✓ Every commit will automatically validate:"
echo "  - Business scenarios against unit tests"
echo "  - Test coverage gaps"
echo "  - Orphan tests without scenarios"
echo "  - P0 critical gaps (will block commits)"
echo ""
echo "✓ Manual validation available:"
echo "  ./scripts/pre-commit.sh --all              # Validate all services"
echo "  ./scripts/pre-commit.sh --service NAME     # Validate one service"
echo ""
echo "✓ To bypass validation (use with caution):"
echo "  git commit --no-verify"
echo ""
echo -e "${GREEN}🎉 Setup complete! You're ready to go.${NC}"
echo ""
