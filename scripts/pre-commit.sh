#!/bin/bash

# Pre-Commit Hook - Complete AI-Driven Coverage System
# Runs comprehensive validation with all features:
# - AI test case generation
# - Coverage analysis with orphan categorization
# - Git API change detection
# - Multi-format reporting (HTML/JSON/CSV/MD)
# - Auto-opens HTML report
# Blocks commit on P0 gaps

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║         🤖 AI-Driven Pre-Commit Validation System                    ║"
echo "║  Phase 1: Test Generation | Phase 2: Coverage Analysis & Reporting  ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Check for Claude API key
if [ -z "$CLAUDE_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ ERROR: Claude API key not found!"
  echo ""
  echo "Set environment variable:"
  echo "  export CLAUDE_API_KEY=\"sk-ant-...\""
  echo "  or"
  echo "  export ANTHROPIC_API_KEY=\"sk-ant-...\""
  echo ""
  exit 1
fi

# Check if config exists
if [ ! -f ".traceability/config.json" ]; then
  echo "❌ ERROR: Configuration not found!"
  echo "Expected: .traceability/config.json"
  echo ""
  exit 1
fi

# Phase 1: Generate AI test cases (baselines)
echo "🔄 Phase 1: AI Test Case Generation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Generating comprehensive test scenarios from APIs..."
echo ""
npm run generate
GENERATE_EXIT=$?

if [ $GENERATE_EXIT -ne 0 ]; then
  echo ""
  echo "❌ Phase 1 FAILED!"
  echo "Fix generation errors before committing."
  exit 1
fi

echo ""
echo "✅ Phase 1 Complete - Test scenarios generated"
echo ""

# Phase 2: Complete Coverage Analysis with Reporting
echo "📊 Phase 2: Coverage Analysis, Git Changes & Report Generation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running comprehensive analysis:"
echo "  • AI-powered coverage analysis"
echo "  • Orphan test categorization (Technical vs Business)"
echo "  • Git API change detection"
echo "  • Multi-format report generation (HTML, JSON, CSV, MD)"
echo "  • Auto-opening HTML report"
echo ""
npm run continue
CONTINUE_EXIT=$?

if [ $CONTINUE_EXIT -ne 0 ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ Phase 2 FAILED - COMMIT BLOCKED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "⛔ Critical gaps detected. Required actions:"
  echo ""
  echo "1. 🔴 P0 Gaps: Implement missing unit tests for critical scenarios"
  echo "2. 🔍 Orphan Tests: Review business tests that need scenarios"
  echo "3. 🆕 New APIs: Add tests for newly detected API endpoints"
  echo ""
  echo "📋 Reports available at:"
  echo "   • HTML:     .traceability/reports/*-report.html"
  echo "   • JSON:     .traceability/reports/*-report.json"
  echo "   • CSV:      .traceability/reports/*-report.csv"
  echo "   • Markdown: .traceability/reports/*-report.md"
  echo ""
  echo "💡 Tip: Review the HTML report (auto-opened) for detailed analysis"
  echo ""
  exit 1
fi

echo ""
echo "✅ Phase 2 Complete - All analysis passed"
echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ VALIDATION SUCCESSFUL                            ║"
echo "║                                                                      ║"
echo "║  All checks passed:                                                  ║"
echo "║  ✓ Test scenarios generated                                         ║"
echo "║  ✓ Coverage analysis complete                                       ║"
echo "║  ✓ Git changes detected and analyzed                                ║"
echo "║  ✓ Orphan tests categorized                                         ║"
echo "║  ✓ Reports generated (HTML, JSON, CSV, MD)                          ║"
echo "║  ✓ No P0/P1 gaps blocking commit                                    ║"
echo "║                                                                      ║"
echo "║                 🚀 Proceeding with commit...                         ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

exit 0
