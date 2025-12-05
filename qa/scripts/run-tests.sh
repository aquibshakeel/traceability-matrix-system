#!/bin/bash
###############################################################################
# Unified QA Test Runner
# Handles: Local & Docker execution, All tests & Selective tests
# Always generates: Test Reports + Traceability Matrix
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QA_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$QA_DIR")"

# Default values
ENVIRONMENT="local"  # local or docker
TEST_TARGETS=()      # array of test patterns

# Parse arguments
show_usage() {
    echo -e "${BLUE}Unified QA Test Runner${NC}"
    echo ""
    echo "Usage: ./scripts/run-tests.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env <local|docker>    Environment (default: local)"
    echo "  -t, --target <pattern>      Test target (can be used multiple times)"
    echo "  -h, --help                  Show this help"
    echo ""
    echo "Examples:"
    echo "  # Run all tests locally"
    echo "  ./scripts/run-tests.sh"
    echo ""
    echo "  # Run all tests in Docker"
    echo "  ./scripts/run-tests.sh --env docker"
    echo ""
    echo "  # Run single test locally"
    echo "  ./scripts/run-tests.sh --target 'TS001'"
    echo ""
    echo "  # Run multiple tests in Docker"
    echo "  ./scripts/run-tests.sh --env docker --target 'TS001' --target 'TS005'"
    echo ""
    echo "  # Run service tests"
    echo "  ./scripts/run-tests.sh --target 'onboarding'"
    echo ""
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--target)
            TEST_TARGETS+=("$2")
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "local" && "$ENVIRONMENT" != "docker" ]]; then
    echo -e "${RED}Error: Environment must be 'local' or 'docker'${NC}"
    exit 1
fi

# Determine if selective mode
SELECTIVE_MODE=false
if [ ${#TEST_TARGETS[@]} -gt 0 ]; then
    SELECTIVE_MODE=true
fi

# Header
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🎯 Unified QA Test Runner${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
if [ "$SELECTIVE_MODE" = true ]; then
    echo -e "Mode: ${YELLOW}Selective${NC}"
    echo -e "Targets: ${YELLOW}${TEST_TARGETS[*]}${NC}"
else
    echo -e "Mode: ${YELLOW}All Tests${NC}"
fi
echo -e "Reports: ${GREEN}HTML Test Report + HTML TM Report${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

cd "$QA_DIR"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo ""

# Clean old artifacts
echo -e "${YELLOW}🧹 Cleaning old artifacts...${NC}"
./scripts/clean-artifacts.sh
echo ""

# Execute based on environment
if [ "$ENVIRONMENT" = "local" ]; then
    #############################################
    # LOCAL EXECUTION
    #############################################
    
    # Check if service is running
    if docker ps | grep -q "onboarding-service"; then
        echo -e "${GREEN}✅ Service is already running${NC}"
        export API_BASE_URL=http://localhost:3000
    else
        echo -e "${RED}❌ Error: Service is not running${NC}"
        echo -e "${YELLOW}Start the service first:${NC}"
        echo -e "   cd .. && docker-compose up -d"
        exit 1
    fi
    
    echo -e "${GREEN}🚀 Running tests locally...${NC}"
    echo ""
    
    # Execute tests
    if [ "$SELECTIVE_MODE" = true ]; then
        # Build grep pattern for mocha
        TEST_PATTERN=""
        for target in "${TEST_TARGETS[@]}"; do
            if [ -z "$TEST_PATTERN" ]; then
                TEST_PATTERN="$target"
            else
                TEST_PATTERN="$TEST_PATTERN|$target"
            fi
        done
        
        echo -e "${BLUE}Test pattern: ${TEST_PATTERN}${NC}"
        npm run test:selective -- --grep "$TEST_PATTERN"
    else
        npm test
    fi
    
else
    #############################################
    # DOCKER EXECUTION
    #############################################
    
    echo -e "${YELLOW}📦 Building service image...${NC}"
    cd "$ROOT_DIR"
    docker-compose build service
    echo ""
    
    echo -e "${GREEN}🐳 Running tests in Docker...${NC}"
    echo ""
    
    cd "$QA_DIR"
    
    # Set test target for Docker
    if [ "$SELECTIVE_MODE" = true ]; then
        # Build test pattern
        TEST_PATTERN=""
        for target in "${TEST_TARGETS[@]}"; do
            if [ -z "$TEST_PATTERN" ]; then
                TEST_PATTERN="$target"
            else
                TEST_PATTERN="$TEST_PATTERN|$target"
            fi
        done
        export TEST_TARGET="$TEST_PATTERN"
    else
        export TEST_TARGET="all"
    fi
    
    docker-compose -f docker-compose.qa.yml up --build --abort-on-container-exit
    
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up containers...${NC}"
    docker-compose -f docker-compose.qa.yml down
    echo ""
fi

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ Test execution complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}📊 Reports Generated:${NC}"

if [ "$SELECTIVE_MODE" = true ]; then
    echo -e "   ${BLUE}•${NC} Test Report: qa/reports/html/selective-test-report.html"
    echo -e "   ${BLUE}•${NC} TM Report: qa/reports/html/selective-traceability-matrix-*.html"
    echo ""
    echo -e "${YELLOW}🔍 View Reports:${NC}"
    echo -e "   open qa/reports/html/selective-test-report.html"
else
    echo -e "   ${BLUE}•${NC} Test Report: qa/reports/html/test-report.html"
    echo -e "   ${BLUE}•${NC} TM Report: qa/reports/html/traceability-matrix-*.html"
    echo ""
    echo -e "${YELLOW}🔍 View Reports:${NC}"
    echo -e "   open qa/reports/html/test-report.html"
fi

echo -e "${BLUE}================================================${NC}"
