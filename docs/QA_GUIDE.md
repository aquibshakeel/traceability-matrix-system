# QA Guide - AI-Driven Test Coverage System

**Version:** 6.2.0
**Last Updated:** December 13, 2025
**Audience:** QA Engineers, Test Managers, Business Analysts

## 🚀 New in v6.2.0 - Business Journeys & Historical Tracking
- **Business Journeys (E2E)** - Track complete user workflows across multiple API steps
- **Historical Trend Analysis** - Coverage tracking over time with 30-day charts
- **Journey Status** - FULLY_COVERED / PARTIAL_COVERAGE / AT_RISK / NOT_COVERED
- **Trend Charts** - Visual coverage progression with smart date formatting
- All v6.1.0 features (colored badges, collapsible sections, priority-first layout)

---

## 📋 Table of Contents

1. [What is This System?](#what-is-this-system)
2. [Quick Start](#quick-start)
3. [Demonstration Test Cases](#demonstration-test-cases) 🆕
4. [Business Journeys (E2E)](#business-journeys-e2e) 🆕 v6.2.0
5. [How Claude AI Works](#how-claude-ai-works)
6. [QA Workflow](#qa-workflow)
7. [Writing Business Scenarios](#writing-business-scenarios)
8. [Understanding Reports](#understanding-reports)
9. [Advanced Features](#advanced-features)
10. [Onboarding a New Service](#onboarding-a-new-service)
11. [Quick Reference](#quick-reference)
12. [Version History](#version-history)

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

## 🎯 Demonstration Test Cases

The system includes three demonstration cases that QA teams can reference to understand different coverage states:

### Case 4: Full Coverage (GET /v1/customers)
**Purpose:** Shows what perfect coverage looks like

- **Baseline:** 10 scenarios in `customer-service-baseline.yml`
- **Status:** ✅ 100% covered (10/10)
- **What QA Learns:**
  - How to write scenarios that match perfectly with tests
  - What "fully covered" means in practice
  - How to structure scenarios for clear traceability

### Case 5: Intelligent Gap Detection (DELETE /v1/customers/{id})
**Purpose:** Shows AI's two-phase analysis capability

- **Baseline:** 5 scenarios in `customer-service-baseline.yml`
- **Status:** ✅ 100% baseline + 🤖 22 AI suggestions
- **What QA Learns:**
  - Difference between "covered" vs "complete"
  - How AI suggests additional scenarios from API spec
  - How to evaluate and add AI suggestions to baseline

### Case 6: Partial Coverage (PUT /v1/customers/{id})
**Purpose:** Shows real-world gaps and how to address them

- **Baseline:** 5 scenarios in `customer-service-baseline.yml`
- **Status:** ⚠️ 40% fully covered (2 full + 2 partial + 1 none)
- **What QA Learns:**
  - How to identify incomplete test assertions
  - How to enhance partial tests to full coverage
  - How to prioritize gap remediation (P0/P1/P2)

### Using the Demonstrations

```bash
# Run analysis to see all three cases
npm run continue

# Open report to review results
open .traceability/reports/customer-service-report.html
```

**For QA Teams:**
- Use Case 4 as your coverage goal
- Use Case 5 to understand AI suggestions
- Use Case 6 to learn gap identification

**Learn More:** See `docs/DETAILED-CASE-MAPPINGS.md` for complete details with exact scenario-to-test mappings.

---

## 🚀 Business Journeys (E2E)

### What Are Business Journeys?

**Business Journeys** track end-to-end user workflows that span multiple API endpoints, ensuring complete user experiences are tested.

### Why Track Journeys?

**Unit Tests Alone Aren't Enough:**
- Unit tests validate individual endpoints
- Journeys validate complete user workflows
- Real user experiences involve multiple steps
- Integration issues often occur between services

**Example Journey:**
```
User Registration Flow:
  1. POST /identity/register → Create account
  2. POST /identity/verify-otp → Verify email
  3. POST /identity/login → First login
  
Status: PARTIAL_COVERAGE
- Step 1: 0% unit tests (❌ Missing tests)
- Step 2: 60% unit tests (⚠️ Partial coverage)
- Step 3: 100% unit tests (✅ Full coverage)
- E2E Test: ❌ Missing

Recommendation: Add E2E test + improve Step 1 & 2 unit tests
```

### Journey Status Meanings

| Status | Meaning | E2E Test | Unit Tests | Action Required |
|--------|---------|----------|------------|-----------------|
| **FULLY_COVERED** | ✅ Complete | Yes | 80%+ on all steps | Maintain coverage |
| **PARTIAL_COVERAGE** | ⚠️ Some tests | No | Some steps covered | Add E2E test |
| **AT_RISK** | ⚠️ Risky | Yes or No | Gaps in critical steps | Fix unit test gaps |
| **NOT_COVERED** | ❌ None | No | No tests | Add tests immediately |

### Journey File Format

**Create:** `.traceability/test-cases/journeys/{service}-journeys.yml`

```yaml
service: identity-service

business_journeys:
  - id: user-registration-flow
    name: "Complete User Registration Flow"
    description: "User registers → receives OTP → verifies account"
    priority: P0
    steps:
      - api: "POST /identity/register"
        description: "Create new user account"
        required: true
      - api: "POST /identity/verify-otp"
        description: "Verify user email with OTP"
        required: true
    e2e_tests:
      - file: "RegistrationFlowE2ETest.java"
        methods:
          - "testCompleteRegistrationFlow"
    tags: ["onboarding", "authentication"]

  - id: user-login-journey
    name: "User Login Journey"
    description: "User logs in with credentials → receives JWT token"
    priority: P0
    steps:
      - api: "POST /identity/login"
        description: "Authenticate user credentials"
        required: true
    e2e_tests:
      - file: "LoginFlowE2ETest.java"
        methods:
          - "testUserLoginSuccess"
          - "testUserLoginFailure"
    tags: ["authentication"]
```

### Journey Report Section

**HTML Report includes Business Journeys card with:**
- Journey status badges (Fully Covered / Partial / At Risk / Not Covered)
- Step-by-step coverage breakdown
- Weak point identification
- E2E test presence validation
- Comprehensive recommendations

**Example Output:**
```
🚀 Business Journeys (E2E)

✅ Complete User Registration Flow (P0)
   2 Steps | 38% Unit Tests | ❌ No E2E Test | 2 Weak Points
   
   Step 1: POST /identity/register
   ❌ 0% Coverage | 0 unit tests | 0/0 scenarios
   
   Step 2: POST /identity/verify-otp
   ⚠️ 60% Coverage | 3 unit tests | 3/5 scenarios
   
   Recommendations:
   - 🚨 CRITICAL: Create E2E test covering all 2 steps
   - ⚠️ Step 1: Add unit tests (0/0 scenarios covered)
   - 📝 Step 2: Add more unit tests (3/5 scenarios covered)
```

### Creating Journeys for Your Service

**Step 1: Identify User Workflows**
```
Examples:
- User Registration → OTP Verification → First Login
- Add to Cart → Checkout → Payment → Confirmation
- Create Order → Process Payment → Send Confirmation
```

**Step 2: Map APIs to Journey Steps**
```
Registration Journey:
  Step 1: POST /identity/register
  Step 2: POST /identity/verify-otp
  Step 3: GET /identity/profile
```

**Step 3: Define E2E Tests**
```
Create: tests/e2e/RegistrationFlowE2ETest.java

Test should:
- Call all journey steps in sequence
- Verify data flows between steps
- Test complete user experience
```

**Step 4: Run Analysis**
```bash
npm run continue
```

**Step 5: Review Journey Card in Report**
- Check journey status
- Identify weak steps
- Follow recommendations

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

- **Main Documentation:**
  - `README.md` - Project overview and quick start
  - `docs/DEV_GUIDE.md` - Developer guide and implementation
  - `docs/TESTING-GUIDE.md` - Testing and validation guide

- **Test Case Documentation:**
  - `docs/DETAILED-CASE-MAPPINGS.md` - Complete traceability matrix for all 5 APIs (Cases 1, 3, 4, 5, 6)
  - `docs/AI-PRIORITY-LOGIC.md` - How P0/P1/P2/P3 priorities work
  - `docs/TWO-PHASE-ANALYSIS-EXPLAINED.md` - Baseline vs completeness
  - `docs/DETAILED-CASE-MAPPINGS.md` - All 3 cases with exact mappings and details

- **Technical Documentation:**
  - `docs/SCENARIO-COMPLETENESS-DETECTION.md` - Completeness detection
  - `IMPLEMENTATION_SUMMARY.md` - Implementation overview

---

## 📜 Version History

### v6.2.0 (December 13, 2025) - Current Release
**Major Features:**
- **Business Journeys (E2E)** - Track end-to-end user workflows
- **Historical Trend Analysis** - 30-day coverage tracking with charts
- **Journey Status** - FULLY_COVERED / PARTIAL_COVERAGE / AT_RISK / NOT_COVERED
- Fixed journey status calculation for accurate reporting
- AI stability improvements (temperature=0.0)

### v6.1.0 (December 10, 2025)
**Major Features:**
- Premium Report Redesign with colored badges
- Collapsible sections and priority-first layout
- Professional design for stakeholders

### v6.0.0 (December 2025)
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

**Version:** 6.2.0  
**Powered By:** Claude AI (Anthropic)  
**Status:** Production Ready  
**Business Journeys:** 🚀 E2E Workflow Tracking  
**Historical Trends:** 📈 30-Day Coverage Tracking

---

**Key Takeaway for QA:** This system uses Claude AI to understand scenarios and tests through natural language, not manual pattern matching. Focus on writing clear, descriptive scenarios in "When...then..." format, and let the AI handle the intelligent matching and analysis.
