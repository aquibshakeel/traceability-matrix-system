#!/bin/bash

# Clean Old QA Artifacts Script
# Removes old test reports, screenshots, and temporary files

echo "🧹 Cleaning QA Artifacts..."
echo ""

# Navigate to QA directory
cd "$(dirname "$0")/.."

# Clean reports directory
if [ -d "reports/html" ]; then
    echo "📁 Cleaning HTML reports..."
    rm -rf reports/html/*
fi

if [ -d "reports/screenshots" ]; then
    echo "📁 Cleaning screenshots..."
    rm -rf reports/screenshots/*
fi

# Clean node_modules if requested
if [ "$1" == "--deep" ]; then
    echo "🗑️  Deep clean - removing node_modules..."
    rm -rf node_modules
    rm -f package-lock.json
fi

# Create directories if they don't exist
mkdir -p reports/html
mkdir -p reports/screenshots

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📂 Directory structure:"
echo "   - reports/html/ (ready for new reports)"
echo "   - reports/screenshots/ (ready for new screenshots)"
echo ""
