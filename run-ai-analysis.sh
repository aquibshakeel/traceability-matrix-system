#!/bin/bash

# Easy End-to-End AI Analysis Script
# Usage: ./run-ai-analysis.sh identity-service

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🤖 Easy AI Analysis Script (Generate + Analyze)                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo

# Check service name provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Service name required${NC}"
  echo "Usage: ./run-ai-analysis.sh <service-name>"
  echo "Example: ./run-ai-analysis.sh identity-service"
  exit 1
fi

SERVICE_NAME=$1

# Load environment variables from .env
if [ -f .env ]; then
  echo -e "${GREEN}✓${NC} Loading API key from .env"
  export $(grep CLAUDE_API_KEY .env | xargs)
else
  echo -e "${RED}❌ Error: .env file not found${NC}"
  exit 1
fi

# Set paths from .env or use defaults
export SERVICE_PATH=${SERVICE_PATH:-/Users/aquibshakeel/Desktop/pulse-services}
export TEST_SCENARIO_PATH=${TEST_SCENARIO_PATH:-/Users/aquibshakeel/Desktop/qa-test-scenario/baseline}

echo -e "${GREEN}✓${NC} Service path: $SERVICE_PATH"
echo -e "${GREEN}✓${NC} Baseline path: $TEST_SCENARIO_PATH"
echo

# Step 1: Generate AI Cases
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Generating AI Test Cases${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npm run generate $SERVICE_NAME -- --service-path=$SERVICE_PATH/$SERVICE_NAME

echo
echo -e "${GREEN}✅ AI cases generated!${NC}"
echo

# Step 2: Analyze Coverage
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Analyzing Coverage${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npm run continue $SERVICE_NAME -- \
  --service-path=$SERVICE_PATH/$SERVICE_NAME \
  --baseline-path=$TEST_SCENARIO_PATH/${SERVICE_NAME}-baseline.yml

echo
echo -e "${GREEN}✅ Analysis complete!${NC}"
echo

# Show results
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Results${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "AI Cases: .traceability/test-cases/ai_cases/${SERVICE_NAME}-ai.yml"
echo -e "Report:   .traceability/reports/${SERVICE_NAME}-report.html"
echo

# Check for ✅ markers
echo -e "${GREEN}Checking for ✅ markers in AI cases...${NC}"
CHECKMARKS=$(grep -c "✅" .traceability/test-cases/ai_cases/${SERVICE_NAME}-ai.yml || echo "0")
NEW_MARKERS=$(grep -c "🆕" .traceability/test-cases/ai_cases/${SERVICE_NAME}-ai.yml || echo "0")

echo -e "  ${GREEN}✅${NC} Scenarios in baseline: $CHECKMARKS"
echo -e "  ${BLUE}🆕${NC} New AI suggestions: $NEW_MARKERS"
echo

echo -e "${GREEN}✅ Done! Open the HTML report to see results.${NC}"
echo -e "${BLUE}Command: open .traceability/reports/${SERVICE_NAME}-report.html${NC}"
