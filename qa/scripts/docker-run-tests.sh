#!/bin/sh
###############################################################################
# Docker Test Runner - Uses Unified Test Runner
# Supports: --case, --cases, --file, --folder, --all
###############################################################################

set -e

echo "================================================"
echo "🐳 Docker QA Test Runner"
echo "================================================"
echo "Mode: ${TEST_MODE:-all}"
echo "Target: ${TEST_TARGET:-N/A}"
echo "================================================"
echo ""

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 5

# Determine command based on TEST_MODE
case "${TEST_MODE}" in
  case)
    echo "🎯 Running single test case: ${TEST_TARGET}"
    sh scripts/unified-test-runner.sh --case "${TEST_TARGET}"
    ;;
  cases)
    echo "🎯 Running multiple test cases: ${TEST_TARGET}"
    sh scripts/unified-test-runner.sh --cases "${TEST_TARGET}"
    ;;
  file)
    echo "📄 Running test file: ${TEST_TARGET}"
    sh scripts/unified-test-runner.sh --file "${TEST_TARGET}"
    ;;
  folder)
    echo "📁 Running folder: ${TEST_TARGET}"
    sh scripts/unified-test-runner.sh --folder "${TEST_TARGET}"
    ;;
  all|*)
    echo "🚀 Running complete test suite..."
    sh scripts/unified-test-runner.sh --all
    ;;
esac

echo ""
echo "================================================"
echo "✨ Docker test execution completed!"
echo "================================================"
