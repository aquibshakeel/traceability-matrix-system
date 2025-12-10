# QA Guide - AI-Driven Test Coverage System

**Version:** 6.1.0
**Last Updated:** December 10, 2025
**Audience:** QA Engineers, Test Managers, Business Analysts

## 🎨 New in v6.1.0 - Premium Report Redesign
- Colored coverage badges for instant status (🟢 Green, 🟡 Yellow, 🔴 Red)
- Collapsible sections to reduce scrolling
- Priority-first layout (critical gaps shown first)
- One-click copy for YAML scenarios
- Professional design for stakeholder presentations

---

## 📋 Table of Contents

1. [What is This System?](#what-is-this-system)
2. [Quick Start](#quick-start)
3. [How Claude AI Works](#how-claude-ai-works)
4. [QA Workflow](#qa-workflow)
5. [Writing Business Scenarios](#writing-business-scenarios)
6. [Understanding Reports](#understanding-reports)
7. [Advanced Features](#advanced-features)
8. [Onboarding a New Service](#onboarding-a-new-service)
9. [Quick Reference](#quick-reference)
10. [Version History](#version-history)

---

## 🎯 What is This System?

### Purpose

An **AI-powered system** that uses **Claude AI** to automatically validate whether business scenarios have corresponding unit test coverage. It ensures developers can't commit code for critical scenarios without tests.

### Core Technology

**🤖 Powered by Claude AI (Anthropic)**
- Natural language understanding
- No manual pattern matching
- 100% AI-driven analysis
- Auto-detects best Claude model

### Key Benefits for QA

✅ **Automated Validation** - Runs on every developer commit
✅ **AI-Generated Scenarios** - Claude AI suggests test scenarios from APIs
✅ **AI-Powered Matching** - Claude AI maps scenarios to tests intelligently
✅ **Smart Recommendations** - AI provides context-aware suggestions
✅ **Orphan Detection** - AI categorizes orphan tests (Technical vs Business)
✅ **Visual Dashboards** - Interactive charts for stakeholder presentations
✅ **Multiple Reports** - HTML, JSON, CSV, Markdown formats

### What Problems Does It Solve?

**Before:**
- ❌ No way to verify if requirements are tested
- ❌ Manual tracking in spreadsheets
- ❌ Features ship without test coverage
- ❌ Unclear which tests cover which scenarios

**After:**
- ✅ Automated scenario → test mapping via Claude AI
- ✅ Real-time coverage visibility
- ✅ P0 scenarios MUST have tests (enforced)
- ✅ AI-generated scenario suggestions
- ✅ Clear reports showing gaps and recommendations

---

## ⚡ Quick Start

### Prerequisites

```bash
# Required
export CLAUDE_API_KEY="sk-ant-your-key-here"
```

### First Time Setup

```bash
# 1. Generate AI scenarios from APIs
npm run generate

# 2. Review AI suggestions
# Edit: .traceability/test-cases/baseline/<service>-baseline.yml

# 3. Analyze coverage
npm run continue

# 4. Open HTML report
open .traceability/reports/<service>-report.html
```

### Daily Usage

```bash
# Check coverage status
npm run continue

# View reports
open .traceability/reports/<service>-report.html
```

---

## 🤖 How Claude AI Works

### AI-Powered Analysis (Not Manual Matching)

**Important:** This system uses Claude AI with natural language understanding, NOT manual fuzzy matching, pattern matching, or similarity algorithms.

### Auto Model Selection

**What It Does:**
- System automatically selects the best Claude model for your needs
- Analyzes codebase size and complexity
- Chooses optimal Claude model
- **Default:** claude-3-5-sonnet-20241022 (optimized for coverage analysis)

**Why It Matters:**
- Ensures optimal performance
- Reduces unnecessary API costs
- Maintains accuracy with intelligent model selection
- Transparent model selection in logs

**How It Works:**
```
Codebase Analysis:
  • Scans codebase size (KB)
  • Counts services and APIs
  • Evaluates complexity level

Model Selection:
  if (codebaseSize < 500KB && apiCount < 50)
    → claude-3-5-sonnet (optimal for small-medium projects)
  else
    → claude-3-5-sonnet (handles any size)
```

---

## 🔄 QA Workflow

### Daily Workflow

```
1. Developer adds new API
       ↓
2. Pre-commit runs - AI generates scenarios
       ↓
3. QA Reviews AI suggestions
       ↓
4. Developer adds unit tests
       ↓
5. Pre-commit validation - AI analyzes coverage
       ↓
6. (If gaps exist) Fix issues
       ↓
7. Commit Successful ✅
```

### QA Daily Commands

```bash
# Morning: Check current coverage
npm run continue
open .traceability/reports/customer-service-report.html

# After baseline updates: Verify changes
npm run continue

# Before sprint planning: Generate fresh scenarios
npm run generate
npm run continue
```

---

## ✍️ Writing Business Scenarios

### Scenario Format

Use "When...Then..." format:

```yaml
service: customer-service

POST /api/customers:
  happy_case:
    - When customer created with valid data, return 201 with customer ID
  error_case:
    - When customer created with missing email, return 400 with validation error
  security:
    - When customer created without auth token, return 401
```

---

## 📊 Understanding Reports

### Report Sections

1. **Summary Cards** - Coverage %, critical gaps, orphan tests
2. **Git Changes** - APIs added/modified/removed with warnings
3. **API Coverage Breakdown** - Per-endpoint scenario status
4. **Coverage Gaps** - P0/P1/P2/P3 gaps with AI suggestions
5. **Orphan Tests** - Uncovered tests with categorization
6. **Visual Analytics** - Charts and priority grids

### Coverage Gaps with AI Suggestions

```
[P0] POST /api/customers/bulk
  Reason: No test cases in baseline
  Status: ORPHAN UNIT TEST

  Test: createCustomerBulk_ShouldValidateInput()
  File: CustomerControllerTest.java
  💡 AI Suggestion: "When customers created in bulk with invalid format, return 400"
  
  Action: Add scenario to baseline or improve test documentation
```

---

## 🔧 Manual Execution

### Command 1: Generate AI Scenarios
```bash
npm run generate
# Or: node bin/ai-generate-api customer-service
```

### Command 2: Analyze Coverage
```bash
npm run continue
# Or: node bin/ai-continue customer-service
```

### Command 3: Combined Workflow
```bash
npm run generate && npm run continue
```

---

## 🚀 Advanced Features

### 1. Git Change Detection & Impact Analysis

**What It Does:**
- Detects APIs added/modified/removed in current commit
- Identifies affected unit tests
- Warns about APIs without tests
- Shows impact on coverage

**Implementation File:** `lib/core/GitChangeDetector.ts`

**Example Output:**
```
Git Changes Detected:
  • Added: POST /api/orders (5 new endpoints)
  • Modified: POST /api/customers (signature changed)
  • Removed: POST /api/legacy (deprecated)

Impact Analysis:
  ⚠️ WARNING: POST /api/orders has NO unit tests
  ⚠️ WARNING: Modified endpoint - verify tests still valid
  ✓ Deprecated endpoint removed successfully

Recommendation:
  → Add unit tests for 5 new /api/orders endpoints
  → Verify POST /api/customers tests cover new signature
```

**When to Use:**
- Code review process
- Pre-commit validation
- Release planning
- Risk assessment

---

### 2. Bidirectional Scenario Completeness Detection (3-Layer)

**3-Layer Architecture:**

**Layer 1: API Spec → Baseline (Forward Check)**
- Analyzes Swagger/OpenAPI specifications
- Checks baseline for corresponding scenarios
- Identifies missing scenario documentation
- Reports gaps with priorities (P0-P3)

**Layer 1b: Unit Tests → Baseline (Reverse Check - NEW)**
- Finds unit tests WITHOUT baseline scenarios
- Matches with AI-generated scenarios
- Provides AI suggestions for missing scenarios
- Categorizes as orphan tests

**Layer 2: Baseline ↔ Unit Tests (Semantic Matching)**
- AI-powered semantic matching using Claude
- Maps scenarios to unit tests
- Calculates coverage status per scenario
- Detects partial coverage

**Layer 3: Intelligent Status Adjustment**
- Adjusts coverage based on API completeness
- Determines FULLY_COVERED vs PARTIALLY_COVERED
- Considers edge cases and error scenarios
- Prioritizes by business impact

**See Also:** `docs/SCENARIO-COMPLETENESS-DETECTION.md`

---

### 3. Orphan Test Categorization with AI Reasoning

**Automatic Classification:**

**Business Tests (Require Baseline Scenarios):**
- Controller/API tests (HTTP endpoints)
- Service tests (business logic)
- Integration tests
- Priority: P0-P2 (gaps need action)

**Technical Tests (No Scenarios Needed):**
- Entity/Model tests (data structures)
- DTO tests (data transfer objects)
- Mapper tests (model-to-DTO conversion)
- Utility tests (helper functions)
- Priority: P3 (no action required)

**Example Categorization:**
```
BUSINESS TESTS (5) - Action Required:
  P0 | CustomerController.getCustomer() → 💡 Suggestion available
  P1 | CustomerService.validateEmail() → Create custom scenario
  P2 | CustomerService.createBulk() → 💡 Suggestion available

TECHNICAL TESTS (3) - No Action Needed:
  P3 | CustomerEntity.getId() → Entity test (skip)
  P3 | CustomerMapper.toDTO() → Mapper test (skip)
  P3 | CustomerDTO.validate() → DTO test (skip)

Summary:
  Business Tests Needing Scenarios: 5
  Technical Tests: 3
  Total Orphan Tests: 8
```

**How AI Determines Category:**
- Analyzes test class name and location
- Evaluates test purpose and assertions
- Checks if test touches business logic
- Determines if customer impact exists

---

### 4. Multi-Language Test Parser Support

**Supported Languages:**
- ✅ Java (JUnit 4/5, Mockito, Spring Test)
- ✅ Python (pytest, unittest)
- ✅ TypeScript/JavaScript (Jest, Mocha, Jasmine)
- ✅ Go (testing package, testify)

**Auto-Detection Process:**
```
1. Scan codebase directory
2. Detect language by file extension (.java, .py, .ts, .go)
3. Select appropriate parser from lib/parsers/
4. Extract test methods and assertions
5. Analyze test coverage
6. Generate reports with language-specific insights
```

**Parser Details:**

**Java Parser** (`lib/parsers/JavaTestParser.ts`):
- Detects: `@Test`, `@ParameterizedTest` annotations
- Frameworks: JUnit 4, JUnit 5, Mockito, Spring Test
- Handles: Nested test classes, parameterized tests

**Python Parser** (`lib/parsers/PythonTestParser.ts`):
- Detects: `test_*` functions, `Test*` classes
- Frameworks: pytest, unittest
- Handles: Parameterized tests, fixtures

**TypeScript Parser** (`lib/parsers/TypeScriptTestParser.ts`):
- Detects: `test()`, `it()`, `describe()` blocks
- Frameworks: Jest, Mocha, Jasmine
- Handles: Async tests, snapshots

**Go Parser** (`lib/parsers/GoTestParser.ts`):
- Detects: `Test*` functions
- Frameworks: testing package, testify
- Handles: Table-driven tests, subtests

**Configuration Output:**
```
📝 Multi-Language Test Analysis:

Service: customer-service
Primary Language: Java
Secondary Language: TypeScript (UI tests)

Java Configuration:
  Test Framework: JUnit 5
  Test Directory: src/test/java
  Found Tests: 42 (35 unit, 7 integration)

TypeScript Configuration:
  Test Framework: Jest
  Test Directory: src/__tests__
  Found Tests: 28 (20 unit, 8 E2E)

Cross-Language Coverage:
  Total Tests: 70
  Languages Analyzed: 2
  Combined Coverage: 78%
```

---

## 📦 Onboarding a New Service

### Step 1: Add Service Configuration

**Edit:** `.traceability/config.json`

```json
{
  "services": [
    {
      "name": "payment-service",
      "enabled": true,
      "path": "services/payment-service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java"
    }
  ]
}
```

### Step 2: Generate AI Scenarios

```bash
npm run generate
```

Result: `.traceability/test-cases/ai_cases/payment-service-ai.yml`

### Step 3: Create Baseline

**Create:** `.traceability/test-cases/baseline/payment-service-baseline.yml`

```yaml
service: payment-service

POST /api/payments:
  happy_case:
    - When payment processed with valid card, return 200
  error_case:
    - When payment processed with invalid card, return 400
  security:
    - When payment processed without auth, return 401
```

### Step 4: Verify Setup

```bash
npm run continue
open .traceability/reports/payment-service-report.html
```

---

## 🎯 Quick Reference

### File Locations

```
.traceability/
├── config.json                          # Service configuration
├── test-cases/
│   ├── baseline/                        # QA-managed scenarios
│   │   ├── customer-service-baseline.yml
│   │   └── payment-service-baseline.yml
│   └── ai_cases/                        # AI-generated suggestions
│       ├── customer-service-ai.yml
│       └── payment-service-ai.yml
└── reports/                             # Generated reports
    ├── customer-service-report.html
    ├── customer-service-report.json
    └── customer-service-report.csv
```

### Common Commands

```bash
npm run generate              # Generate AI scenarios
npm run continue              # Analyze coverage
npm run generate && npm run continue  # Combined workflow
npm run install:hooks         # Install pre-commit hook
```

### Priority Guidelines

| Priority | Blocks | Example |
|----------|--------|---------|
| P0 | YES | Auth, payments, security |
| P1 | Configurable | CRUD operations, core features |
| P2 | NO | Edge cases, validation |
| P3 | NO | UI formatting, nice-to-have |

---

## 📚 Additional Resources

- **Developer Guide:** `docs/DEV_GUIDE.md`
- **Testing Guide:** `docs/TESTING-GUIDE.md`
- **Completeness Detection:** `docs/SCENARIO-COMPLETENESS-DETECTION.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`

---

## 📜 Version History

### v6.0.0 (December 10, 2025) - Current Release
**Major Features:**
- Orphan Unit Test Detection with AI-suggested scenarios
- Orphan API Detection for completely untracked endpoints
- Visual Analytics Dashboard with interactive charts
- Enhanced 3-Layer Completeness Detection with reverse check
- Improved Git Change Detection with impact analysis

### v5.0.0
**Features:**
- 3-Layer Scenario Completeness Detection
- Bidirectional gap analysis
- Change Impact Analysis with affected tests tracking

### v4.0.0
**Features:**
- Multi-format reporting (HTML, JSON, CSV, Markdown)
- Git integration for change detection
- Orphan test categorization (Technical vs Business)

### v3.0.0
**Features:**
- Claude AI integration for coverage analysis
- Pre-commit hook validation
- Automated scenario-to-test mapping

---

**Version:** 6.0.0  
**Powered By:** Claude AI (Anthropic)  
**Status:** Production Ready

---

**Key Takeaway for QA:** This system uses Claude AI to understand scenarios and tests through natural language, not manual pattern matching. Focus on writing clear, descriptive scenarios in "When...then..." format, and let the AI handle the intelligent matching and analysis.
