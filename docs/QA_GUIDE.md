# QA Guide (QA_GUIDE.md)
## AI-Driven Test Coverage System

**Version:** 5.0.0  
**Last Updated:** December 10, 2025  
**Audience:** QA Engineers, Test Managers, Business Analysts

---

## 📋 Table of Contents

1. [What is This System?](#what-is-this-system)
2. [What's New in v5.0.0](#whats-new-in-v50)
3. [How It Works](#how-it-works)
3. [Matching Techniques & Strategies](#matching-techniques--strategies)
4. [Working Mechanics](#working-mechanics)
5. [Pre-Commit Integration](#pre-commit-integration)
6. [Manual Execution (QA Workflow)](#manual-execution-qa-workflow)
7. [Onboarding a New Service](#onboarding-a-new-service)
8. [Writing Business Scenarios](#writing-business-scenarios)
9. [Local Testing Commands](#local-testing-commands)
10. [Understanding Reports](#understanding-reports)
11. [Action Flows](#action-flows)
12. [Validation Checklist](#validation-checklist)
13. [Troubleshooting & Escalation](#troubleshooting--escalation)

---

## ⭐ What's New in v5.0.0

### Major Features for QA

#### 1. Bidirectional Scenario Completeness Detection
**What It Means for QA:**
- System now performs 3-layer intelligent analysis
- Detects scenarios missing from baseline (even if tests exist)
- Finds tests without scenarios ("No test case for: [test]")
- Smart status: FULLY_COVERED only when API truly complete

**QA Impact:**
- More accurate gap detection
- Baseline completeness verification
- Better visibility into missing scenarios
- Actionable recommendations

#### 2. Change Impact Analysis
**What It Means for QA:**
- Tracks which tests are affected by code changes
- Shows before/after code comparison
- Identifies scenarios needing re-verification
- Documents impact in ai_cases files

**QA Impact:**
- Know which scenarios to re-test
- Track regression risk
- Faster impact assessment
- Better change documentation

#### 3. Enhanced Console Output
**What You'll See:**
```
POST /api/customers:
  ⚠️  API Completeness: 3 additional scenarios suggested
     - No unit test for: "When created with invalid email..."
  
  🔍 Checking for unit tests without test cases...
  ⚠️  Found 2 unit tests without baseline scenarios
     - No test case for: "createCustomer_ShouldValidateEmail"
```

**QA Benefits:**
- Real-time completeness feedback
- Clear warnings about gaps
- Specific action items
- Better traceability

See `docs/SCENARIO-COMPLETENESS-DETECTION.md` for complete details.

---

## 🎯 What is This System?

### Purpose & Scope

The **Universal Unit-Test Traceability Validator** is an automated system that ensures **every business scenario has corresponding unit test coverage**. It creates a bridge between:

- **Business Requirements** (what QA documents)
- **Unit Tests** (what developers write)
- **Traceability** (proof that requirements are tested)

### Key Benefits for QA

✅ **Automated Validation** - Runs on every developer commit  
✅ **Clear Traceability** - See exactly which scenarios have test coverage  
✅ **Gap Detection** - Automatically identifies missing tests  
✅ **Beautiful Reports** - HTML dashboards you can share with stakeholders  
✅ **Suggested Fixes** - System tells you exactly what actions to take  
✅ **P0 Protection** - Critical scenarios without tests block commits  

### What Problems Does It Solve?

**Before:**
- ❌ Scenarios exist in documents but no link to actual tests
- ❌ No way to verify if requirements are tested
- ❌ Manual tracking in spreadsheets
- ❌ Tests added but no one knows which scenario they cover
- ❌ Features ship without tests, causing regressions

**After:**
- ✅ Automated scenario → test mapping
- ✅ Real-time coverage visibility
- ✅ P0 scenarios MUST have tests (enforced automatically)
- ✅ Clear reports showing gaps
- ✅ Developers can't commit untested P0 features

### Scope

**What It Covers:**
- Unit test coverage validation
- Business scenario traceability
- API endpoint coverage
- Gap analysis and reporting
- Orphan test categorization

**What It Doesn't Cover:**
- Integration test coverage (separate tool)
- E2E test coverage (separate tool)
- Code coverage metrics (use JaCoCo, Istanbul, etc.)
- Test execution or results (use test runners)

---

## ⚙️ How It Works

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    QA Team Activities                         │
│  • Write business scenarios in YAML/JSON/Markdown            │
│  • Define priorities (P0/P1/P2/P3)                           │
│  • Set risk levels (Critical/High/Medium/Low)                │
│  • Add acceptance criteria                                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              Scenario Files Stored in Repository             │
│  .traceability/scenarios/service-name.scenarios.yaml         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                 Developer Commits Code                        │
│  git commit -m "Add feature"                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              Pre-Commit Hook Triggers                         │
│  • Detects changed files                                     │
│  • Identifies affected services                              │
│  • Runs validation automatically                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                  Validation Process                           │
│                                                               │
│  1. Load Scenarios (from .traceability/scenarios/)           │
│  2. Parse Unit Tests (Java, TypeScript, Python, etc.)        │
│  3. Semantic Matching (AI/fuzzy matching)                    │
│  4. Gap Analysis (scenarios without tests)                   │
│  5. Orphan Detection (tests without scenarios)               │
│  6. Generate Reports (HTML, JSON, MD, CSV)                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                  Decision Point                               │
│                                                               │
│  ❌ P0 Gaps Found → BLOCK COMMIT                             │
│     - Show which scenarios lack tests                        │
│     - Display gap report                                     │
│     - Exit with error code                                   │
│                                                               │
│  ✅ No P0 Gaps → ALLOW COMMIT                                │
│     - Show coverage statistics                               │
│     - Generate reports                                       │
│     - Continue with commit                                   │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Scenarios (YAML/JSON/MD)
         ↓
    Scenario Loader
         ↓
   Parsed Scenarios ──────────┐
                              │
Unit Tests (Java/TS/etc)      │
         ↓                    │
    Test Parser               │
         ↓                    │
   Parsed Tests ──────────────┤
                              ↓
                      Semantic Matcher
                              ↓
                     Matching Analysis
                              ↓
                ┌─────────────┴─────────────┐
                ↓                           ↓
           Gaps Found              Orphans Found
                ↓                           ↓
           Gap Analyzer           Orphan Categorizer
                │                           │
                └───────────┬───────────────┘
                            ↓
                    Report Generator
                            ↓
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
            HTML          JSON        Markdown
```

---

## 🧠 Matching Techniques & Strategies

The system uses **7 advanced matching strategies** to map scenarios to tests:

### 1. Exact Matching (Weight: 2.0)

**What:** Direct string match, highest confidence  
**Used For:** API endpoints, scenario IDs  
**Example:**
```yaml
Scenario: apiEndpoint: /api/customer/:id
Test: mockMvc.perform(get("/api/customer/123"))
Match: ✅ 100% (exact endpoint match)
```

### 2. Fuzzy Matching (Weight: 1.5)

**What:** Token-based similarity, handles typos and word order  
**Algorithm:** Jaccard similarity, token overlap  
**Example:**
```yaml
Scenario: "When user creates customer with valid data"
Test: "test creates valid customer data"
Match: ✅ 85% (similar tokens, different order)
```

### 3. Semantic Matching (Weight: 1.2)

**What:** Context-aware matching with synonym expansion  
**Synonyms Configured:**
- create = add, insert, new, post
- read = get, fetch, retrieve, find
- update = modify, edit, change, put
- delete = remove, destroy, drop

**Example:**
```yaml
Scenario: "When user deletes customer"
Test: "testRemoveCustomer()"
Match: ✅ 80% ("delete" = "remove" are synonyms)
```

### 4. Keyword Matching (Weight: 1.0)

**What:** Matches important domain keywords  
**Keywords:** HTTP methods, status codes, entities, actions  
**Example:**
```yaml
Scenario: "Customer returns 404 for invalid ID"
Test: "testInvalidCustomerId404()"
Match: ✅ 75% (keywords: customer, 404, invalid, id)
```

### 5. Levenshtein Distance

**What:** Edit distance algorithm, catches typos  
**Example:**
```yaml
Scenario: "validate customer email"
Test: "validateCustomrEmail()" 
Match: ✅ 90% (only 1 character different)
```

### 6. Jaccard Similarity

**What:** Set-based similarity of words  
**Example:**
```yaml
Scenario: "create new customer account"
Test: "testCreateCustomerAccount()"
Match: ✅ 88% (3 of 4 words match)
```

### 7. Regex Pattern Matching

**What:** Custom pattern matching for specific formats  
**Example:**
```yaml
Scenario: "API-001"
Test: "/** Tests API-001 **/"
Match: ✅ 100% (explicit reference)
```

### Match Score Calculation

```typescript
// Weighted score calculation
finalScore = 
  (exact × 2.0) + 
  (fuzzy × 1.5) + 
  (semantic × 1.2) + 
  (keyword × 1.0)

confidence = (finalScore / maxPossibleScore) × 100

// Decision thresholds
if (confidence >= 75%) → "Fully Covered" ✅
if (confidence >= 60%) → "Partially Covered" ⚠️
if (confidence < 60%)  → "Not Covered" ❌
```

### Threshold Configuration

**Default:** 65% minimum confidence  
**Configurable:** Can be adjusted in `.traceability/config.json`

```json
{
  "matching": {
    "defaultThreshold": 0.65,
    "strategies": ["exact", "fuzzy", "semantic", "keyword"]
  }
}
```

---

## 🔄 Working Mechanics

### Step-by-Step Process

#### Step 1: QA Authors Scenarios

**File:** `.traceability/scenarios/customer-service.scenarios.yaml`

```yaml
scenarios:
  - id: CUST-001
    description: When user creates customer with valid data, returns 201
    apiEndpoint: /api/customer
    httpMethod: POST
    priority: P1
    riskLevel: High
    category: Happy Path
    tags: [api, create, customer]
    acceptanceCriteria:
      - Response status is 201
      - Customer ID is returned
      - Data is saved in database
```

**QA Actions:**
1. Create/update scenario file
2. Commit to repository
3. Notify developers of new scenarios

#### Step 2: Developer Writes Unit Test

**File:** `CustomerControllerTest.java`

```java
@Test
@DisplayName("When user creates customer with valid data, returns 201")
public void testCreateCustomerWithValidData() {
    // Arrange
    CustomerRequest request = new CustomerRequest("John", "john@example.com");
    
    // Act
    ResponseEntity<CustomerResponse> response = 
        controller.createCustomer(request);
    
    // Assert
    assertEquals(201, response.getStatusCodeValue());
    assertNotNull(response.getBody().getCustomerId());
}
```

**Developer Actions:**
1. Write unit test
2. Run test locally (ensure it passes)
3. Commit code

#### Step 3: Pre-Commit Validation Runs

**Triggered Automatically:**
```bash
git commit -m "Add customer creation feature"

# System automatically runs:
# ╔════════════════════════════════════════════╗
# ║  Unit-Test Traceability Validator          ║
# ╚════════════════════════════════════════════╝
# 
# 📝 Analyzing customer-service...
# ✓ Loaded 15 scenarios
# ✓ Found 12 unit tests
# ✓ Performing semantic matching...
```

#### Step 4: System Performs Matching

**Matching Process:**
1. **Load:** Read CUST-001 scenario description
2. **Parse:** Extract test name and @DisplayName
3. **Match:** Compare using 7 strategies
4. **Score:** Calculate confidence (e.g., 95%)
5. **Classify:** "Fully Covered" ✅

**Match Result:**
```
CUST-001 → testCreateCustomerWithValidData()
Match Score: 95%
Status: ✅ Fully Covered
Strategies Used: exact, fuzzy, semantic
```

#### Step 5: Gap Analysis

**Scenario Examples:**

**Example A: Covered Scenario**
```
CUST-001: Create customer with valid data
✅ Matched to: testCreateCustomerWithValidData()
Match: 95%
Status: Fully Covered
```

**Example B: Gap Found**
```
CUST-002: Create customer with duplicate email returns 409
❌ No matching test found
Status: Not Covered
Priority: P0
Action: BLOCK COMMIT
```

**Example C: Orphan Test**
```
Test: testCustomerMapperMapsToDto()
❌ No matching scenario
Category: 🔧 Technical (DTO test)
Action: No action needed
```

#### Step 6: Report Generation

**Generated Files:**
```
.traceability/reports/
├── traceability-report.html    # Visual dashboard
├── traceability-report.json    # Machine-readable data
├── traceability-report.md      # Documentation
└── traceability-report.csv     # Spreadsheet import
```

#### Step 7: Decision

**Scenario A: Commit Allowed**
```
✓ VALIDATION PASSED
Coverage: 85%
P0 Gaps: 0
P1 Gaps: 2 (warnings only)

📊 View report: .traceability/reports/traceability-report.html

✅ Commit proceeding...
```

**Scenario B: Commit Blocked**
```
✗ VALIDATION FAILED
❌ Critical (P0) Gaps: 2

CUST-002: Create customer with duplicate email
CUST-005: Authentication required

📊 View detailed report for recommendations
💡 Fix these gaps and try again

❌ Commit BLOCKED
```

---

## 🔗 Pre-Commit Integration

### How Pre-Commit Works

**Automatic Execution:**
```bash
# When developer commits:
git commit -m "Add feature"

# Hook automatically executes:
.git/hooks/pre-commit → scripts/pre-commit.sh

# Script performs:
1. Detect changed files (git diff)
2. Identify affected services
3. Run validation for those services
4. Check for P0/P1 gaps
5. Generate reports
6. Exit with appropriate code
```

### Master Pre-Commit Script Workflow

**Location:** `scripts/pre-commit.sh`

**What It Does:**

```bash
#!/bin/bash
# 1. SETUP
echo "🧪 Unit-Test Traceability Validator"
echo "═══════════════════════════════════"

# 2. DETECT CHANGES
changed_files=$(git diff --cached --name-only)
affected_services=$(identify_services_from_files "$changed_files")

# 3. LOAD SCENARIOS
for service in $affected_services; do
  load_scenarios ".traceability/scenarios/$service.scenarios.yaml"
done

# 4. ANALYZE TESTS
for service in $affected_services; do
  parse_tests "$service"
done

# 5. PERFORM MATCHING
semantic_matching_engine
calculate_coverage
identify_gaps

# 6. GENERATE REPORTS
generate_html_report
generate_json_report
generate_markdown_report

# 7. CHECK P0 GAPS
if [ $p0_gaps -gt 0 ]; then
  echo "❌ BLOCKING: P0 gaps found"
  exit 1
fi

# 8. CHECK P1 GAPS (if configured)
if [ $p1_gaps -gt 0 ] && [ $blockOnP1 == true ]; then
  echo "❌ BLOCKING: P1 gaps found"
  exit 1
fi

# 9. SUCCESS
echo "✓ VALIDATION PASSED"
exit 0
```

### P0 vs P1 Behavior

#### P0 (Critical Priority)

**Behavior:** **BLOCKS commits**

```yaml
- id: CUST-AUTH
  description: Request without auth token returns 401
  priority: P0  # Critical
  riskLevel: Critical
```

**If No Test Found:**
```
❌ CRITICAL GAP DETECTED
Scenario: CUST-AUTH
Priority: P0
Status: No test found

🚫 COMMIT BLOCKED

Action Required:
- Developer must write unit test
- Test must achieve 75%+ match confidence
- Re-run validation after adding test
```

#### P1 (High Priority)

**Behavior:** **WARNING only** (doesn't block)

```yaml
- id: CUST-UPDATE
  description: Update customer with valid data returns 200
  priority: P1  # High
  riskLevel: High
```

**If No Test Found:**
```
⚠️  HIGH PRIORITY GAP
Scenario: CUST-UPDATE
Priority: P1
Status: No test found

✅ COMMIT ALLOWED (warning only)

Recommendation:
- Add test in next sprint
- Track in backlog
- QA should create ticket
```

#### P2/P3 (Medium/Low Priority)

**Behavior:** **Informational** (no blocking, no warnings)

```
ℹ️  Coverage Gap (P2)
Status: Informational only
Action: Optional - add when time permits
```

### Configuration

**File:** `.traceability/config.json`

```json
{
  "preCommit": {
    "enabled": true,
    "blockOnP0Gaps": true,       // Block commits for P0 gaps
    "blockOnP1Gaps": false,      // Don't block for P1 (default)
    "validateChangedServicesOnly": true  // Only validate changed services
  }
}
```

---

## 🚀 Manual Execution (QA Workflow)

### Why Two Phases?

**Important:** Even though pre-commit runs both phases automatically, they are separated for a specific reason:

**Phase 1 is designed for QA to run independently!**

| Phase | Command | Purpose | When QA Uses It |
|-------|---------|---------|-----------------|
| **Phase 1** | `npm run generate` | Generate AI test scenarios from APIs | **QA runs this separately** to get AI suggestions for baseline |
| **Phase 2** | `npm run continue` | Analyze test coverage against baseline | After developers write tests |

### QA Workflow Benefits

**Phase 1 Separate Execution:**
```bash
# QA runs this when:
# - New APIs are added
# - Swagger specs are updated
# - Need to refresh test scenario ideas
npm run generate

# Result: ai_cases/ folder has AI suggestions
# QA Action: Review, add/update/remove scenarios in baseline/
```

**Why This Matters:**
- ✅ **QA Control:** QA team decides which AI suggestions to add to baseline
- ✅ **Baseline Management:** Add, update, or remove scenarios independently
- ✅ **Flexibility:** Don't wait for pre-commit - generate scenarios anytime
- ✅ **Planning:** Use AI suggestions for test planning and sprint work

**Pre-Commit Integration:**
- Pre-commit automatically runs **both phases together**
- But QA can still run Phase 1 separately whenever needed
- This separation gives QA full control over baseline management

### QA Commands Reference

#### Command 1: Validate All Services

**Use Case:** Weekly/sprint validation, comprehensive check

```bash
# Run validation for all services
npm run validate

# Or using script directly
./scripts/pre-commit.sh --all

# With verbose output
npm run validate -- --all --verbose
```

**Output:**
```
╔════════════════════════════════════════════╗
║  Unit-Test Traceability Validator          ║
╚════════════════════════════════════════════╝

Validating 2 services...
✓ customer-service (85% coverage)
✓ identity-service (92% coverage)

Overall Coverage: 88.5%
Total Scenarios: 30
Total Tests: 25
Gaps: 5 (1 P0, 2 P1, 2 P2)

📊 Reports generated:
  .traceability/reports/traceability-report.html
```

#### Command 2: Validate Single Service

**Use Case:** After QA adds scenarios for specific service

```bash
# Validate only customer-service
npm run validate -- --service customer-service

# Or
./scripts/pre-commit.sh --service customer-service

# With verbose matching details
npm run validate -- --service customer-service --verbose
```

**Output:**
```
Validating: customer-service
✓ Loaded 15 scenarios
✓ Found 12 tests
✓ Matching complete

Coverage: 80%
Fully Covered: 12
Partially Covered: 1
Not Covered: 2
```

#### Command 3: Dry-Run Mode

**Use Case:** Test validation without affecting anything

```bash
# Dry run - won't fail/block, just reports
npm run validate -- --dry-run

# Useful for:
# - Testing new scenarios before committing
# - Checking coverage without blocking
# - QA validation workflow
```

**Output:**
```
🔍 DRY RUN MODE (informational only)

Validation Results:
✓ Scenarios: 20
✓ Tests: 18
❌ P0 Gaps: 1

Note: This is a dry run. No blocking occurs.
```

#### Command 4: Specific Format Output

**Use Case:** Generate only HTML or JSON

```bash
# Generate only HTML report
npm run validate -- --all --format html

# Generate only JSON (for automation)
npm run validate -- --all --format json

# Generate multiple formats
npm run validate -- --all --format html --format json
```

###Manual Execution Examples

#### Example 1: QA Daily Workflow

```bash
# Morning: Check current state
npm run validate --all

# Open report
open .traceability/reports/traceability-report.html

# Review gaps and create JIRA tickets
```

#### Example 2: After Adding New Scenarios

```bash
# 1. QA adds scenarios to file
vim .traceability/scenarios/customer-service.scenarios.yaml

# 2. Validate to see gaps
npm run validate -- --service customer-service

# 3. Review report
open .traceability/reports/traceability-report.html

# 4. Create tickets for developers based on gaps
```

#### Example 3: Pre-Sprint Planning

```bash
# Generate comprehensive report
npm run validate --all --verbose

# Export to CSV for spreadsheet
# File: .traceability/reports/traceability-report.csv

# Share HTML report with stakeholders
```

---

## 📦 Onboarding a New Service

### Step 1: Identify Service Details

**Information Needed:**
- Service name (e.g., "payment-service")
- Programming language (Java, TypeScript, Python, Go)
- Test framework (JUnit, Jest, Pytest, go-test)
- Test directory path
- Test file pattern

### Step 2: Create Scenario File

**Location:** `.traceability/scenarios/[service-name].scenarios.yaml`

```bash
# Create scenario file
cat > .traceability/scenarios/payment-service.scenarios.yaml << 'EOF'
scenarios:
  - id: PAY-001
    description: When user processes payment with valid card, returns 200
    apiEndpoint: /api/payment
    httpMethod: POST
    priority: P0
    riskLevel: Critical
    category: Payment Processing
    tags: [payment, card, transaction]
    acceptanceCriteria:
      - Payment is processed
      - Transaction ID is returned
      - Receipt is generated
EOF
```

### Step 3: Add Service to Configuration

**File:** `.traceability/config.json`

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
      "testPattern": "*Test.java",
      "scenarioFile": ".traceability/scenarios/payment-service.scenarios.yaml",
      "scenarioFormat": "yaml"
    }
  ]
}
```

**Configuration Parameters:**

| Parameter | Description | Examples |
|-----------|-------------|----------|
| `name` | Unique service identifier | "payment-service", "auth-service" |
| `enabled` | Enable/disable validation | `true` or `false` |
| `path` | Relative path to service root | "services/payment-service", "./payment" |
| `language` | Programming language | "java", "typescript", "python", "go" |
| `testFramework` | Test framework used | "junit", "jest", "pytest", "go-test" |
| `testDirectory` | Path to test files | "src/test/java", "test/", "__tests__" |
| `testPattern` | File name pattern | "*Test.java", "*.test.ts", "test_*.py" |
| `scenarioFile` | Path to scenario file | ".traceability/scenarios/payment.scenarios.yaml" |
| `scenarioFormat` | Format of scenarios | "yaml", "json", "markdown", "txt" |

### Step 4: Verify Configuration

```bash
# Test configuration loads correctly
npm run validate -- --service payment-service --dry-run

# Expected output:
# ✓ Configuration loaded
# ✓ Service found: payment-service
# ✓ Scenario file loaded
# ✓ Tests parsed (X tests found)
```

### Step 5: Run First Validation

```bash
# Run full validation
npm run validate -- --service payment-service

# Check report
open .traceability/reports/traceability-report.html
```

### Onboarding Checklist

- [ ] Service name decided
- [ ] Scenario file created in `.traceability/scenarios/`
- [ ] At least 3 example scenarios added
- [ ] Service added to `.traceability/config.json`
- [ ] Configuration parameters verified
- [ ] Test directory path confirmed
- [ ] Test pattern matches files
- [ ] Dry-run validation successful
- [ ] Full validation run
- [ ] Report reviewed
- [ ] Team notified of new service

---

## ✍️ Writing Business Scenarios

### Scenario Format Options

The system supports **4 formats**:

#### Format 1: YAML (Recommended)

**Best For:** Structured data with rich metadata

**File:** `service-name.scenarios.yaml`

```yaml
scenarios:
  - id: CUST-001
    description: When user creates customer with valid email, system returns 201 and customer ID
    apiEndpoint: /api/customer
    httpMethod: POST
    priority: P1
    riskLevel: High
    category: Happy Path
    tags: [api, create, customer, email]
    acceptanceCriteria:
      - Response status is 201
      - Customer ID is returned in response
      - Customer is saved to database
      - Email validation is performed
    testData:
      validEmail: "test@example.com"
      validName: "John Doe"
    preconditions:
      - Database is accessible
      - Email service is running
    postconditions:
      - Customer exists in database
      - Welcome email is sent

  - id: CUST-002
    description: When user creates customer with duplicate email, returns 409 conflict
    apiEndpoint: /api/customer
    httpMethod: POST
    priority: P0
    riskLevel: Critical
    category: Error Handling
    tags: [api, create, customer, duplicate, error]
```

#### Format 2: JSON

**Best For:** Programmatic generation, tool integration

**File:** `service-name.scenarios.json`

```json
{
  "scenarios": [
    {
      "id": "CUST-001",
      "description": "When user creates customer with valid email, returns 201",
      "apiEndpoint": "/api/customer",
      "httpMethod": "POST",
      "priority": "P1",
      "riskLevel": "High",
      "category": "Happy Path",
      "tags": ["api", "create", "customer"],
      "acceptanceCriteria": [
        "Response status is 201",
        "Customer ID is returned"
      ]
    }
  ]
}
```

#### Format 3: Markdown

**Best For:** Documentation-style scenarios

**File:** `service-name.scenarios.md`

```markdown
## Scenario: CUST-001

**Priority:** P1  
**Risk Level:** High  
**API Endpoint:** /api/customer  
**HTTP Method:** POST  
**Category:** Happy Path

### Description
When user creates customer with valid email, system returns 201 and customer ID

### Acceptance Criteria
- Response status is 201
- Customer ID is returned in response
- Customer is saved to database

### Tags
`api` `create` `customer` `email`

---

## Scenario: CUST-002

**Priority:** P0  
**Risk Level:** Critical  
**API Endpoint:** /api/customer  
**HTTP Method:** POST

### Description
When user creates customer with duplicate email, returns 409 conflict

### Acceptance Criteria
- Response status is 409
- Error message indicates duplicate email
- No data is saved
```

#### Format 4: Plain Text

**Best For:** Simple, QA-friendly format

**File:** `service-name.scenarios.txt`

```
Scenario ID: CUST-001
Priority: P1
Risk Level: High
Category: Happy Path

Description:
When user creates customer with valid email
Then system validates email format
And system returns 201 status code
And system returns customer ID

---

Scenario ID: CUST-002
Priority: P0
Risk Level: Critical
Category: Error Handling

Description:
When user creates customer with duplicate email
Then system returns 409 conflict
And system returns error message
And no data is saved
```

### Best Practices for Writing Scenarios

#### 1. Use Clear, Descriptive Language

**❌ Bad Example:**
```yaml
description: Test customer stuff
```

**✅ Good Example:**
```yaml
description: When user creates customer with valid data, system validates input and returns 201 with customer ID
```

#### 2. Include Specific HTTP Details

**✅ Good Example:**
```yaml
apiEndpoint: /api/customer/:id
httpMethod: GET
expectedStatus: 200
```

#### 3. Use Given-When-Then Format

**✅ Good Example:**
```yaml
description: >
  Given user is authenticated
  When user requests customer with valid ID
  Then system returns 200 with customer data
```

#### 4. Add Comprehensive Acceptance Criteria

**✅ Good Example:**
```yaml
acceptanceCriteria:
  - Response status is 200
  - Response includes customer ID
  - Response includes name and email
  - Response time is under 500ms
  - Data is fetched from database
```

#### 5. Set Appropriate Priorities

**Priority Guidelines:**

| Priority | When to Use | Blocks Commits? |
|----------|-------------|-----------------|
| **P0** | Core functionality, security, data integrity | YES |
| **P1** | Important features, common workflows | Configurable |
| **P2** | Nice-to-have features, edge cases | NO |
| **P3** | Optional features, UI polish | NO |

**Examples:**
```yaml
# P0 - Authentication (blocks commits)
- id: AUTH-001
  description: Request without token returns 401
  priority: P0
  riskLevel: Critical

# P1 - Main feature (warning)
- id: FEAT-001
  description: User can update profile
  priority: P1
  riskLevel: High

# P2 - Edge case (informational)
- id: EDGE-001
  description: Handles malformed input gracefully
  priority: P2
  riskLevel: Medium

# P3 - Nice-to-have (informational)
- id: UX-001
  description: Returns friendly error messages
  priority: P3
  riskLevel: Low
```

#### 6. Use Meaningful Tags

**✅
