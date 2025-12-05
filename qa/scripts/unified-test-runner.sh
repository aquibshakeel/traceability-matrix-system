#!/bin/bash

###############################################################################
# Unified Test Runner
# Supports 5 execution modes with automatic TM generation
# Modes: --case, --cases, --file, --folder, --all
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="reports/html"
MODE=""
TARGET=""
GREP_PATTERN=""
FILE_PATTERN=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --case)
      MODE="case"
      TARGET="$2"
      # Match both [TS001] and (HF001) patterns
      GREP_PATTERN="\\($TARGET\\)|\\[$TARGET\\]"
      shift 2
      ;;
    --cases)
      MODE="cases"
      TARGET="$2"
      # Convert HF001,NF001 to \(HF001\)|\(NF001\) pattern
      GREP_PATTERN=$(echo "$TARGET" | sed 's/,/\\)|\\(/g')
      GREP_PATTERN="\\($GREP_PATTERN\\)"
      shift 2
      ;;
    --file)
      MODE="file"
      TARGET="$2"
      # Handle different file path formats
      if [[ "$TARGET" =~ ^tests/ ]]; then
        FILE_PATTERN="$TARGET"
      elif [[ "$TARGET" =~ ^e2e/ ]]; then
        FILE_PATTERN="tests/$TARGET"
      else
        FILE_PATTERN="tests/e2e/$TARGET"
      fi
      shift 2
      ;;
    --folder)
      MODE="folder"
      TARGET="$2"
      FILE_PATTERN="tests/e2e/$2/**/*.spec.ts"
      shift 2
      ;;
    --all)
      MODE="all"
      shift
      ;;
    --env)
      ENV="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate mode
if [ -z "$MODE" ]; then
  echo -e "${RED}Error: No execution mode specified${NC}"
  echo ""
  echo "Usage:"
  echo "  $0 --case TS001              # Run single test case"
  echo "  $0 --cases TS001,TS002       # Run multiple test cases"
  echo "  $0 --file onboarding/ts001   # Run specific file"
  echo "  $0 --folder onboarding       # Run folder"
  echo "  $0 --all                     # Run all tests"
  exit 1
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🎯 Unified Test Runner${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Mode: ${GREEN}$MODE${NC}"
echo -e "Target: ${GREEN}$TARGET${NC}"
echo -e "Timestamp: ${GREEN}$TIMESTAMP${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Build mocha command based on mode
MOCHA_CMD="npx mocha --require ts-node/register --no-config"

if [ "$MODE" = "case" ] || [ "$MODE" = "cases" ]; then
  # Use grep pattern
  MOCHA_CMD="$MOCHA_CMD 'tests/**/*.spec.ts' --grep '$GREP_PATTERN'"
  REPORT_PREFIX="selective-test-report"
  TM_MODE="--selective"
elif [ "$MODE" = "file" ]; then
  # Run specific file only
  if [[ ! "$FILE_PATTERN" =~ ^tests/ ]]; then
    FILE_PATTERN="tests/$FILE_PATTERN"
  fi
  MOCHA_CMD="$MOCHA_CMD '$FILE_PATTERN'"
  REPORT_PREFIX="selective-test-report"
  TM_MODE="--selective"
elif [ "$MODE" = "folder" ]; then
  # Run folder - use glob pattern
  MOCHA_CMD="$MOCHA_CMD '$FILE_PATTERN'"
  REPORT_PREFIX="selective-test-report"
  TM_MODE="--selective"
else
  # All tests - use config file
  MOCHA_CMD="npx mocha --require ts-node/register 'tests/**/*.spec.ts'"
  REPORT_PREFIX="test-report"
  TM_MODE=""
fi

# Add multi-reporter configuration
MOCHA_CMD="$MOCHA_CMD --reporter mocha-multi-reporters"
MOCHA_CMD="$MOCHA_CMD --reporter-options configFile=.mocha-reporters.json"

echo -e "📦 Installing dependencies..."
npm install --silent

# Clean Allure results before new test run to prevent accumulation
echo ""
echo -e "🧹 Cleaning previous Allure results..."
rm -rf reports/allure-results/*
mkdir -p reports/allure-results

echo ""
echo -e "🚀 Running tests..."
echo -e "Command: ${MOCHA_CMD}"
echo ""

# Run tests
eval $MOCHA_CMD || TEST_EXIT_CODE=$?

echo ""
echo -e "${GREEN}✅ Test execution completed${NC}"
echo -e "Report: ${REPORT_DIR}/${REPORT_PREFIX}-${TIMESTAMP}.html"
echo ""

# Generate TM
echo -e "📊 Generating Traceability Matrix..."

# Find the most recent JSON report file (Mochawesome generates with its own timestamp)
LATEST_JSON=$(ls -t ${REPORT_DIR}/*.json 2>/dev/null | head -1)

if [ -n "$LATEST_JSON" ]; then
  export REPORT_TIMESTAMP=$TIMESTAMP
  export REPORT_JSON="$LATEST_JSON"
  echo -e "   Using report: $(basename $LATEST_JSON)"
  
  if [ -n "$TM_MODE" ]; then
    npx ts-node matrix/generate-traceability-matrix.ts $TM_MODE
  else
    npx ts-node matrix/generate-traceability-matrix.ts
  fi
else
  echo -e "${YELLOW}⚠️  No Mochawesome JSON report found, skipping TM generation${NC}"
fi

# Generate Allure report
echo ""
echo -e "📊 Generating Allure report..."
if [ -d "reports/allure-results" ] && [ -n "$(ls -A reports/allure-results)" ]; then
  npm run allure:generate --silent || echo -e "${YELLOW}⚠️  Allure report generation skipped (allure-commandline may not be installed)${NC}"
  echo -e "${GREEN}✅ Allure report generated${NC}"
else
  echo -e "${YELLOW}⚠️  No Allure results found to generate report${NC}"
fi

echo ""
echo -e "${GREEN}✅ All reports generated successfully!${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "📄 Test Report: ${REPORT_DIR}/${REPORT_PREFIX}-${TIMESTAMP}.html"
if [ -n "$TM_MODE" ]; then
  echo -e "📊 TM Report: ${REPORT_DIR}/selective-traceability-matrix-${TIMESTAMP}.html"
else
  echo -e "📊 TM Report: ${REPORT_DIR}/traceability-matrix-${TIMESTAMP}.html"
fi
if [ -d "reports/allure-report" ]; then
  echo -e "🎯 Allure Report: reports/allure-report/index.html"
  echo -e "   Run 'npm run allure:open' to view in browser"
fi
echo -e "${BLUE}================================================${NC}"

# Exit with test exit code if tests failed
exit ${TEST_EXIT_CODE:-0}
