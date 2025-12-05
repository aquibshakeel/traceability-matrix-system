#!/bin/bash
###############################################################################
# Docker Test Wrapper
# Runs tests in Docker container against host services
# Usage:
#   ./scripts/docker-test.sh --case HF001
#   ./scripts/docker-test.sh --cases HF001,NF001
#   ./scripts/docker-test.sh --file onboarding/ts001
#   ./scripts/docker-test.sh --folder onboarding
#   ./scripts/docker-test.sh --all
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
MODE=""
TARGET=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --case)
      MODE="case"
      TARGET="$2"
      shift 2
      ;;
    --cases)
      MODE="cases"
      TARGET="$2"
      shift 2
      ;;
    --file)
      MODE="file"
      TARGET="$2"
      shift 2
      ;;
    --folder)
      MODE="folder"
      TARGET="$2"
      shift 2
      ;;
    --all)
      MODE="all"
      shift
      ;;
    --help)
      echo "Usage: $0 [MODE] [TARGET]"
      echo ""
      echo "Modes:"
      echo "  --case TEST_ID        Run single test case (e.g., HF001)"
      echo "  --cases TEST_IDS      Run multiple test cases (e.g., HF001,NF001)"
      echo "  --file FILE_PATH      Run specific test file"
      echo "  --folder FOLDER       Run all tests in folder"
      echo "  --all                 Run all tests"
      echo ""
      echo "Note: Requires services running on host (docker-compose up -d)"
      echo ""
      echo "Examples:"
      echo "  $0 --case HF001"
      echo "  $0 --cases HF001,NF001"
      echo "  $0 --file onboarding/ts001"
      echo "  $0 --folder onboarding"
      echo "  $0 --all"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Validate mode
if [ -z "$MODE" ]; then
  echo -e "${RED}Error: No mode specified${NC}"
  echo "Use --help for usage information"
  exit 1
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🐳 Docker QA Test Runner${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Mode: ${GREEN}$MODE${NC}"
if [ -n "$TARGET" ]; then
  echo -e "Target: ${GREEN}$TARGET${NC}"
fi
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if host services are running
echo -e "${YELLOW}🔍 Checking host services...${NC}"
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Services not running on host!${NC}"
  echo -e "${YELLOW}Please start services first:${NC}"
  echo -e "  cd /Users/aquibshakeel/Desktop/ai-dummy-service"
  echo -e "  docker-compose up -d"
  exit 1
fi
echo -e "${GREEN}✅ Host services are running${NC}"
echo ""

# Build test container
echo -e "${YELLOW}🔨 Building test container...${NC}"
docker-compose -f docker-compose.qa.yml build qa-tests

# Run tests based on mode
echo ""
echo -e "${GREEN}🚀 Running tests...${NC}"

if [ "$MODE" = "all" ]; then
  docker-compose -f docker-compose.qa.yml run --rm qa-tests npm run test:all
else
  docker-compose -f docker-compose.qa.yml run --rm qa-tests sh scripts/unified-test-runner.sh --$MODE "$TARGET"
fi

TEST_EXIT_CODE=$?

echo ""
echo -e "${BLUE}================================================${NC}"
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Tests completed successfully!${NC}"
else
  echo -e "${RED}❌ Tests failed with exit code: $TEST_EXIT_CODE${NC}"
fi
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "📊 View reports in: ${GREEN}qa/reports/html/${NC}"

exit $TEST_EXIT_CODE
