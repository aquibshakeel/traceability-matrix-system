#!/bin/bash

# Complete setup script - clones repos, copies data, commits, and configures traceability
set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║     Complete External Repository Setup & Migration                   ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
GITHUB_SERVICES_REPO="https://github.com/aquibshakeel/pulse-services"
GITHUB_SCENARIOS_REPO="https://github.com/aquibshakeel/qa-test-scenario"
CLONE_LOCATION="$HOME/Desktop"
TRACEABILITY_ROOT=$(pwd)

echo "📋 Step 1: Clone External Repositories to Desktop"
echo "=================================================="
echo ""

# Clone pulse-services
if [ -d "$CLONE_LOCATION/pulse-services" ]; then
    echo "⚠️  pulse-services already exists at $CLONE_LOCATION/pulse-services"
    read -p "Remove and re-clone? (y/n): " remove_services
    if [ "$remove_services" = "y" ]; then
        rm -rf "$CLONE_LOCATION/pulse-services"
        echo "Cloning pulse-services..."
        cd "$CLONE_LOCATION"
        git clone "$GITHUB_SERVICES_REPO"
    fi
else
    echo "Cloning pulse-services..."
    cd "$CLONE_LOCATION"
    git clone "$GITHUB_SERVICES_REPO"
fi

# Clone qa-test-scenario
if [ -d "$CLONE_LOCATION/qa-test-scenario" ]; then
    echo "⚠️  qa-test-scenario already exists at $CLONE_LOCATION/qa-test-scenario"
    read -p "Remove and re-clone? (y/n): " remove_scenarios
    if [ "$remove_scenarios" = "y" ]; then
        rm -rf "$CLONE_LOCATION/qa-test-scenario"
        echo "Cloning qa-test-scenario..."
        cd "$CLONE_LOCATION"
        git clone "$GITHUB_SCENARIOS_REPO"
    fi
else
    echo "Cloning qa-test-scenario..."
    cd "$CLONE_LOCATION"
    git clone "$GITHUB_SCENARIOS_REPO"
fi

echo "✅ Repositories cloned to Desktop"
echo ""

# Set paths
SERVICES_PATH="$CLONE_LOCATION/pulse-services"
SCENARIOS_PATH="$CLONE_LOCATION/qa-test-scenario"

echo "📋 Step 2: Copy Services to pulse-services Repository"
echo "====================================================="
echo ""

if [ -d "$TRACEABILITY_ROOT/services" ]; then
    echo "Copying services..."
    
    # Copy identity-service
    if [ -d "$TRACEABILITY_ROOT/services/identity-service" ]; then
        cp -r "$TRACEABILITY_ROOT/services/identity-service" "$SERVICES_PATH/"
        echo "✅ Copied identity-service"
    fi
    
    # Copy customer-service
    if [ -d "$TRACEABILITY_ROOT/services/customer-service" ]; then
        cp -r "$TRACEABILITY_ROOT/services/customer-service" "$SERVICES_PATH/"
        echo "✅ Copied customer-service"
    fi
    
    # Copy README
    if [ -f "$TRACEABILITY_ROOT/templates/SERVICES_REPO_README.md" ]; then
        cp "$TRACEABILITY_ROOT/templates/SERVICES_REPO_README.md" "$SERVICES_PATH/README.md"
        echo "✅ Added README.md"
    fi
    
    # Commit and push
    cd "$SERVICES_PATH"
    git add .
    if git diff --cached --quiet; then
        echo "ℹ️  No changes to commit in pulse-services"
    else
        git commit -m "Initial commit: Add services from traceability-matrix-system

- Added identity-service with unit tests
- Added customer-service with unit tests  
- Added README with documentation"
        git push origin main
        echo "✅ Pushed services to GitHub"
    fi
else
    echo "⚠️  No services directory found in traceability repo"
fi

echo ""
echo "📋 Step 3: Copy Scenarios to qa-test-scenario Repository"
echo "========================================================="
echo ""

# Create directory structure
mkdir -p "$SCENARIOS_PATH/baseline"
mkdir -p "$SCENARIOS_PATH/ai_cases"
echo "✅ Created baseline/ and ai_cases/ directories"

if [ -d "$TRACEABILITY_ROOT/.traceability/test-cases/baseline" ]; then
    echo "Copying baseline scenarios..."
    cp -r "$TRACEABILITY_ROOT/.traceability/test-cases/baseline/"* "$SCENARIOS_PATH/baseline/" 2>/dev/null || true
    echo "✅ Copied baseline scenarios"
fi

if [ -d "$TRACEABILITY_ROOT/.traceability/test-cases/ai_cases" ]; then
    echo "Copying AI cases..."
    cp -r "$TRACEABILITY_ROOT/.traceability/test-cases/ai_cases/"* "$SCENARIOS_PATH/ai_cases/" 2>/dev/null || true
    echo "✅ Copied AI cases"
fi

# Copy README
if [ -f "$TRACEABILITY_ROOT/templates/SCENARIOS_REPO_README.md" ]; then
    cp "$TRACEABILITY_ROOT/templates/SCENARIOS_REPO_README.md" "$SCENARIOS_PATH/README.md"
    echo "✅ Added README.md"
fi

# Commit and push
cd "$SCENARIOS_PATH"
git add .
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit in qa-test-scenario"
else
    git commit -m "Initial commit: Add QA test scenarios from traceability-matrix-system

- Added baseline scenarios for identity-service
- Added baseline scenarios for customer-service
- Added AI-generated scenarios for review
- Added README with documentation"
    git push origin main
    echo "✅ Pushed scenarios to GitHub"
fi

echo ""
echo "📋 Step 4: Configure Traceability System"
echo "========================================="
echo ""

cd "$TRACEABILITY_ROOT"

# Create .env file
cat > .env << EOF
# External Repository Configuration
# Generated on $(date)

# Service Repository Path (cloned on Desktop)
SERVICE_PATH=$SERVICES_PATH

# QA Test Scenarios Path (cloned on Desktop)
TEST_SCENARIO_PATH=$SCENARIOS_PATH/baseline

# AI Configuration
CLAUDE_API_KEY=${CLAUDE_API_KEY:-your-api-key-here}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-your-api-key-here}

# Optional: Verbose logging
# VERBOSE=true
EOF

echo "✅ Created .env file with paths:"
echo "   SERVICE_PATH=$SERVICES_PATH"
echo "   TEST_SCENARIO_PATH=$SCENARIOS_PATH/baseline"
echo ""

# Check API key
if [ -z "$CLAUDE_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  WARNING: No API key found in environment"
    echo "   Please update .env file with your Claude API key"
    echo ""
fi

echo "📋 Step 5: Test the Setup"
echo "========================="
echo ""

echo "Testing path resolution..."
echo ""

# Source the .env
source .env

echo "Environment variables loaded:"
echo "  SERVICE_PATH: $SERVICE_PATH"
echo "  TEST_SCENARIO_PATH: $TEST_SCENARIO_PATH"
echo ""

# Verify paths exist
if [ -d "$SERVICE_PATH/identity-service" ]; then
    echo "✅ identity-service found at $SERVICE_PATH/identity-service"
else
    echo "❌ identity-service NOT found"
fi

if [ -f "$TEST_SCENARIO_PATH/identity-service-baseline.yml" ]; then
    echo "✅ identity-service-baseline.yml found"
else
    echo "❌ identity-service-baseline.yml NOT found"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                                 ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Repository Locations:"
echo "   Services:  $SERVICES_PATH"
echo "   Scenarios: $SCENARIOS_PATH"
echo "   GitHub:    https://github.com/aquibshakeel/pulse-services"
echo "   GitHub:    https://github.com/aquibshakeel/qa-test-scenario"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Load environment variables:"
echo "   source .env"
echo ""
echo "2. Run traceability analysis:"
echo "   node bin/ai-continue identity-service"
echo ""
echo "3. You should see:"
echo "   📁 Path Configuration:"
echo "      Services: $SERVICES_PATH (ENV: SERVICE_PATH)"
echo "      Scenarios: $SCENARIOS_PATH/baseline (ENV: TEST_SCENARIO_PATH)"
echo ""
echo "4. View your repos on GitHub:"
echo "   - https://github.com/aquibshakeel/pulse-services"
echo "   - https://github.com/aquibshakeel/qa-test-scenario"
echo ""
echo "📖 Documentation:"
echo "   - Quick Start: QUICKSTART_EXTERNAL_REPOS.md"
echo "   - Full Guide: docs/EXTERNAL_REPOS.md"
echo ""
