#!/bin/bash

###############################################################################
# Universal Unit-Test Traceability Validator - Pre-Commit Hook
# 
# This script runs automatically before each git commit to validate that
# business scenarios have corresponding unit test coverage.
#
# Features:
# - Validates changed services only (configurable)
# - Blocks commits on critical (P0) gaps
# - Generates comprehensive traceability reports
# - Supports manual execution for QA validation
#
# Usage:
#   Automatic: Runs on git commit (after installing hooks)
#   Manual: ./scripts/pre-commit.sh [--service <name>] [--all] [--force]
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
CONFIG_FILE="$PROJECT_ROOT/.traceability/config.json"
REPORTS_DIR="$PROJECT_ROOT/.traceability/reports"

# Parse command line arguments
FORCE_MODE=false
VALIDATE_ALL=false
SERVICE_NAME=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --force)
      FORCE_MODE=true
      shift
      ;;
    --all)
      VALIDATE_ALL=true
      shift
      ;;
    --service)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --force        Skip validation and allow commit"
      echo "  --all          Validate all services (not just changed)"
      echo "  --service NAME Validate specific service"
      echo "  --verbose      Show detailed output"
      echo "  --help         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Print banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Universal Unit-Test Traceability Validator - Pre-Commit Hook  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if force mode
if [ "$FORCE_MODE" = true ]; then
  echo -e "${YELLOW}⚠️  Force mode enabled - skipping validation${NC}"
  echo ""
  exit 0
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo -e "${RED}✗ Configuration file not found: $CONFIG_FILE${NC}"
  echo -e "${YELLOW}Run: npm install to set up the project${NC}"
  exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js is not installed${NC}"
  echo -e "${YELLOW}Please install Node.js >= 18.0.0${NC}"
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js version must be >= 18.0.0 (current: $(node -v))${NC}"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  cd "$PROJECT_ROOT"
  npm install --silent
  echo -e "${GREEN}✓ Dependencies installed${NC}"
  echo ""
fi

# Create reports directory if it doesn't exist
mkdir -p "$REPORTS_DIR"

# Build validation command
VALIDATION_CMD="node $PROJECT_ROOT/bin/utt-validate"

if [ "$VALIDATE_ALL" = true ]; then
  VALIDATION_CMD="$VALIDATION_CMD --all"
elif [ -n "$SERVICE_NAME" ]; then
  VALIDATION_CMD="$VALIDATION_CMD --service $SERVICE_NAME"
else
  # Check if we're in a git repository and get changed files
  if git rev-parse --git-dir > /dev/null 2>&1; then
    CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
    
    if [ -z "$CHANGED_FILES" ]; then
      echo -e "${GREEN}✓ No files changed - skipping validation${NC}"
      echo ""
      exit 0
    fi
    
    echo -e "${BLUE}📝 Changed files detected:${NC}"
    echo "$CHANGED_FILES" | head -5
    if [ $(echo "$CHANGED_FILES" | wc -l) -gt 5 ]; then
      echo "   ... and $(( $(echo "$CHANGED_FILES" | wc -l) - 5 )) more"
    fi
    echo ""
    
    VALIDATION_CMD="$VALIDATION_CMD --changed"
  else
    VALIDATION_CMD="$VALIDATION_CMD --all"
  fi
fi

if [ "$VERBOSE" = true ]; then
  VALIDATION_CMD="$VALIDATION_CMD --verbose"
fi

# Run validation
echo -e "${BLUE}🔍 Running validation...${NC}"
echo ""

if $VALIDATION_CMD; then
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                    ✓ VALIDATION PASSED                         ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}✓ All business scenarios have adequate unit test coverage${NC}"
  echo -e "${BLUE}📊 Reports generated in: $REPORTS_DIR${NC}"
  echo ""
  
  # Show quick summary
  if [ -f "$REPORTS_DIR/traceability-report.json" ]; then
    COVERAGE=$(node -e "const data = require('$REPORTS_DIR/traceability-report.json'); console.log(data.summary.coveragePercent);")
    TOTAL_SCENARIOS=$(node -e "const data = require('$REPORTS_DIR/traceability-report.json'); console.log(data.summary.totalScenarios);")
    GAPS=$(node -e "const data = require('$REPORTS_DIR/traceability-report.json'); console.log(data.gaps.length);")
    
    echo -e "${BLUE}Quick Summary:${NC}"
    echo -e "  Coverage: ${GREEN}${COVERAGE}%${NC}"
    echo -e "  Total Scenarios: $TOTAL_SCENARIOS"
    echo -e "  Gaps: $GAPS"
    echo ""
  fi
  
  # Auto-open HTML report
  if [ -f "$REPORTS_DIR/traceability-report.html" ]; then
    echo -e "${BLUE}📊 Opening enhanced HTML report...${NC}"
    if command -v open &> /dev/null; then
      open "$REPORTS_DIR/traceability-report.html"
    elif command -v xdg-open &> /dev/null; then
      xdg-open "$REPORTS_DIR/traceability-report.html"
    fi
    echo ""
  fi
  
  exit 0
else
  EXIT_CODE=$?
  echo ""
  echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                    ✗ VALIDATION FAILED                         ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${RED}✗ Critical gaps found in test coverage${NC}"
  echo -e "${BLUE}📊 Detailed reports: $REPORTS_DIR${NC}"
  echo ""
  
  # Show critical gaps
  if [ -f "$REPORTS_DIR/traceability-report.json" ]; then
    P0_GAPS=$(node -e "const data = require('$REPORTS_DIR/traceability-report.json'); console.log(data.summary.p0Gaps);")
    P1_GAPS=$(node -e "const data = require('$REPORTS_DIR/traceability-report.json'); console.log(data.summary.p1Gaps);")
    
    if [ "$P0_GAPS" -gt 0 ]; then
      echo -e "${RED}❌ Critical (P0) Gaps: $P0_GAPS${NC}"
      echo -e "${YELLOW}   Action Required: Create unit tests for P0 scenarios${NC}"
      echo ""
    fi
    
    if [ "$P1_GAPS" -gt 0 ]; then
      echo -e "${YELLOW}⚠️  High Priority (P1) Gaps: $P1_GAPS${NC}"
      echo ""
    fi
    
    # Auto-open HTML report on failure too
    if [ -f "$REPORTS_DIR/traceability-report.html" ]; then
      echo -e "${BLUE}📊 Opening enhanced HTML report...${NC}"
      if command -v open &> /dev/null; then
        open "$REPORTS_DIR/traceability-report.html"
      elif command -v xdg-open &> /dev/null; then
        xdg-open "$REPORTS_DIR/traceability-report.html"
      fi
      echo ""
    fi
  fi
  
  echo -e "${YELLOW}💡 To bypass this check (not recommended):${NC}"
  echo -e "   git commit --no-verify"
  echo -e "   or"
  echo -e "   ./scripts/pre-commit.sh --force && git commit"
  echo ""
  
  exit $EXIT_CODE
fi
