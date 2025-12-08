# QA User Guide
## Universal Unit-Test Traceability Validator

**Version:** 2.0.0  
**Last Updated:** December 2025  
**Target Audience:** QA Engineers, Test Managers, Business Analysts

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What is the System?](#what-is-the-system)
3. [How the System Works](#how-the-system-works)
4. [Matching Techniques](#matching-techniques)
5. [Scenarios the System Catches](#scenarios-the-system-catches)
6. [Understanding the Reports](#understanding-the-reports)
7. [Writing Business Scenarios](#writing-business-scenarios)
8. [Managing Scenarios](#managing-scenarios)
9. [Manual Validation](#manual-validation)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [E2E Workflow](#e2e-workflow)

---

## 🎯 Overview

The Universal Unit-Test Traceability Validator helps QA teams ensure that **every business scenario has corresponding unit test coverage**. It automatically validates this mapping and generates comprehensive reports.

### Key Benefits for QA

✅ **Visibility** - See exactly which scenarios have test coverage  
✅ **Automation** - System runs automatically on every commit  
✅ **Traceability** - Clear mapping from requirements → scenarios → tests  
✅ **Gap Detection** - Automatically identifies missing test coverage  
✅ **Reports** - Beautiful HTML reports you can share with stakeholders  

---

## 🤔 What is the System?

### Purpose

This system creates a **bridge** between:
- Business requirements/scenarios (what QA writes)
- Unit tests (what developers write)

It answers questions like:
- "Is scenario CUST-001 tested?"
- "Which tests cover the customer creation API?"
- "Are all P0 scenarios covered?"
- "Did the developer forget to write tests for the new feature?"

### What It's NOT

❌ **Not a test execution tool** - It doesn't run tests  
❌ **Not a code coverage tool** - It doesn't measure line/branch coverage  
❌ **Not for E2E/UI tests** - Only validates unit test coverage  
❌ **Not a replacement for QA** - It's a tool to help QA work more effectively  

### What It IS

✅ **Traceability validator** - Maps scenarios → unit tests  
✅ **Gap analyzer** - Finds missing test coverage  
✅ **Pre-commit gate** - Blocks commits when critical scenarios aren't tested  
✅ **Report generator** - Creates shareable traceability reports  

---

## ⚙️ How the System Works

### High-Level Flow

```
┌──────────────────┐
│  QA writes       │
│  business        │
│  scenarios       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Scenarios stored in YAML/JSON/Markdown  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Developer commits code                   │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Pre-commit hook triggers validation      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  System Analysis:                         │
│  1. Loads business scenarios              │
│  2. Parses unit tests from code           │
│  3. Maps scenarios → tests (AI matching)  │
│  4. Identifies gaps                       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Decision:                                │
│  - P0 gaps? → BLOCK commit               │
│  - All covered? → ALLOW commit           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Generate Reports:                        │
│  • HTML (visual dashboard)                │
│  • JSON (data export)                     │
│  • Markdown (documentation)               │
│  • CSV (spreadsheet)                      │
└───────────────────────────────────────────┘
```

### Step-by-Step Process

1. **QA writes scenarios** in YAML/JSON/Markdown format
2. **Scenarios include**:
   - Scenario ID (e.g., CUST-001)
   - Description (what should happen)
   - API endpoint (e.g., /api/customer)
   - Priority (P0/P1/P2/P3)
   - Risk level (Critical/High/Medium/Low)

3. **Developer writes unit tests** for their code
4. **System automatically**:
   - Reads scenario descriptions
   - Parses unit test descriptions
   - Uses AI/semantic matching to map them
   - Scores each match (0-100% confidence)

5. **System generates reports** showing:
   - ✅ Fully covered scenarios
   - ⚠️ Partially covered scenarios
   - ❌ Not covered scenarios (gaps)
   - 🔍 Orphan tests (tests without scenarios)

6. **Pre-commit validation**:
   - If P0 gaps exist → ❌ Block commit
   - If coverage is acceptable → ✅ Allow commit

---

## 🧠 Matching Techniques

The system uses **multiple AI techniques** to match scenarios to tests:

### 1. Exact Matching
**What:** Direct string match  
**Example:**  
- Scenario: "GET /api/customer/:id"
- Test: "testGetCustomerById() calls /api/customer/123"
- **Match: ✅ 100%** (exact API endpoint match)

### 2. Fuzzy Matching
**What:** Token-based similarity (handles typos, word order)  
**Example:**  
- Scenario: "When user creates customer with valid data"
- Test: "test creates valid customer data"
- **Match: ✅ 85%** (similar words, different order)

### 3. Semantic Matching
**What:** Understands synonyms and context  
**Example:**  
- Scenario: "When user deletes a customer"
- Test: "testRemoveCustomer()"
- **Match: ✅ 80%** ("delete" = "remove" as synonyms)

**Configured Synonyms:**
- create = add, insert, new, post
- read = get, fetch, retrieve, find
- update = modify, edit, change, put
- delete = remove, destroy, drop

### 4. Keyword Matching
**What:** Matches important keywords  
**Example:**  
- Scenario: "Customer service returns 404 for invalid ID"
- Test: "testInvalidCustomerId404()"
- **Match: ✅ 75%** (keywords: customer, 404, invalid, id)

### 5. Levenshtein Distance
**What:** Calculates edit distance between strings  
**Example:**  
- Scenario: "Validate customer email"
- Test: "validateCustomrEmail()" (typo)
- **Match: ✅ 90%** (only 1 character different)

### Match Score Thresholds

| Score | Status | Meaning |
|-------|--------|---------|
| 95-100% | ✅ Fully Covered | Very high confidence match |
| 75-94% | ✅ Fully Covered | Good confidence match |
| 60-74% | ⚠️ Partially Covered | Medium confidence, review recommended |
| < 60% | ❌ Not Covered | No confident match found |

---

## 🎯 Scenarios the System Catches

### Scenario 1: New Service/Feature

**Situation:**  
- Developer pushes new microservice
- QA adds business scenarios to scenario file

**What System Detects:**
```
✅ Scenarios: 20
✅ Tests Found: 18
❌ Gaps: 2 (CUST-001, CUST-005)
```

**Action Required:**  
Developer must write unit tests for CUST-001 and CUST-005

---

### Scenario 2: Developer Adds API Without Test

**Situation:**  
- Developer adds new POST /api/customer endpoint
- Developer forgets to write unit test
- QA adds scenario CUST-NEW-001

**What System Detects:**
```
❌ Gap Found: CUST-NEW-001
   Description: Create customer with valid data
   API: POST /api/customer
   Status: No unit test found
   Priority: P1
   Action: Developer - Create Test
```

**Report Shows:**
- Red alert in HTML report
- Gap listed in "Coverage Gaps" section
- Recommendation: "Create unit test for POST /api/customer"

---

### Scenario 3: Developer Removes API

**Situation:**  
- Developer removes DELETE /api/customer/:id endpoint
- Unit tests for that API are deleted
- Scenario file still contains CUST-012 (delete customer)

**What System Detects:**
```
⚠️ API Change Detected
   Type: API Removed
   Endpoint: DELETE /api/customer/:id
   Affected Scenarios: CUST-012
   Impact: Scenario exists but API implementation missing
   
🔍 Orphan Scenario: CUST-012
   Description: Delete customer
   Reason: No unit test found
   Possible Causes:
     - API was removed (feature sunset)
     - API moved to different service
     - Scenario is outdated
```

**Action Required:**
1. **QA verifies**: Was API intentionally removed?
2. **If yes**: Remove/archive CUST-012 from scenario file
3. **If no**: Developer must restore API + tests

---

### Scenario 4: Test Exists But No Scenario

**Situation:**  
- Developer writes unit test for edge case
- QA hasn't documented this scenario yet

**What System Detects:**
```
🔍 Orphan Test Found
   Test: testCustomerEmailValidation()
   Description: Should reject invalid email format
   Status: No matching scenario
   
Warning: 15 orphan tests found
Recommendation: QA should create scenarios for these tests
```

**Action:**  
QA reviews orphan tests and:
- Creates scenarios for important tests
- Or marks tests as "internal/technical" (no scenario needed)

---

### Scenario 5: Partial Coverage

**Situation:**  
- Scenario describes multiple acceptance criteria
- Only some criteria have tests

**What System Detects:**
```
⚠️ Partial Coverage: CUST-001
   Match Score: 65%
   Tests Found: 1
   Description: Get customer should return 200 with all fields
   
   ✅ Covered:
     - HTTP 200 response
   
   ❌ Missing:
     - Email field validation
     - Phone field validation
     - Response time < 500ms
```

**Action:**  
Developer adds additional tests for missing acceptance criteria

---

## 📊 Understanding the Reports

### HTML Report Structure

The HTML report is the **main deliverable** for stakeholders.

#### 1. Header Section
```
╔════════════════════════════════════════╗
║  Unit Test Traceability Report         ║
╚════════════════════════════════════════╝

Generated: Dec 8, 2025, 9:00 PM
Duration: 2,450ms
Status: ✓ PASSED (or ✗ FAILED)
```

#### 2. Summary Cards
```
┌─────────────────┐  ┌─────────────────┐
│ Coverage        │  │ Total Scenarios │
│ 85%             │  │ 20              │
│ 17 of 20        │  │ 2 services      │
└─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ Total Tests     │  │ Gaps            │
│ 25              │  │ 3               │
│ 2 orphan tests  │  │ 1 critical (P0) │
└─────────────────┘  └─────────────────┘
```

#### 3. Coverage Overview
- Visual progress bar showing coverage %
- Breakdown: Fully Covered | Partially Covered | Not Covered

#### 4. Coverage Gaps (Most Important!)
Each gap shows:
- **Scenario ID** (e.g., CUST-001)
- **Priority Badge** (P0 in red, P1 in orange, etc.)
- **Description** - What the scenario is testing
- **API Endpoint** - Which API is affected
- **Impact** - Business impact of this gap
- **Action Required** - Who needs to do what
- **Recommendations** - Specific steps to fix

**Example:**
```
╔═══════════════════════════════════════════════╗
║ CUST-001                             [P0]     ║
╚═══════════════════════════════════════════════╝

Description: When user gets customer with valid ID,
             system returns 200 with complete data

API: GET /api/customer/:id
Impact: P0 priority scenario without coverage. Risk: High
Action Required: Developer - Create Test

💡 Recommendations:
  • Create unit test for: Get customer with valid ID
  • Target API: GET /api/customer/:id
  • Risk Level: High
  • Business Impact: Core customer retrieval function
```

#### 5. Orphan Tests Section
Lists tests that don't have corresponding scenarios.

**Why This Matters:**
- Shows technical debt
- Helps QA identify missing documentation
- Reveals edge cases that need scenarios

#### 6. Recommendations Section
Actionable items for the team:
- Create missing tests (for developers)
- Write missing scenarios (for QA)
- Review/update outdated scenarios

---

### Traceability Matrix

The matrix shows **scenario-to-test mapping**:

```
                Test1   Test2   Test3   Test4
CUST-001         ✅      -       -       -
CUST-002         -       ✅      ✅      -
CUST-003         -       -       -       ❌
CUST-004         ✅      -       -       -

Legend:
✅ = Mapped (test covers this scenario)
❌ = Not Covered
- = No relationship
```

---

## ✍️ Writing Business Scenarios

### Supported Formats

You can write scenarios in **4 formats**:

#### Format 1: YAML (Recommended)
**Best for:** Structured data, rich metadata

```yaml
scenarios:
  - id: CUST-001
    description: When user requests customer with valid ID, system returns 200
    apiEndpoint: /api/customer/:id
    httpMethod: GET
    priority: P1
    riskLevel: High
    category: Happy Path
    tags: [api, get, customer]
    acceptanceCriteria:
      - Response status is 200
      - Response includes customer data
      - Response time < 500ms
```

**Pros:**
- Most structured and powerful
- Supports rich metadata
- Easy to read and maintain
- Best IDE support

**When to use:** Complex scenarios with many fields

#### Format 2: JSON
**Best for:** Programmatic generation, tool integration

```json
{
  "scenarios": [
    {
      "id": "CUST-001",
      "description": "When user requests customer with valid ID, system returns 200",
      "apiEndpoint": "/api/customer/:id",
      "priority": "P1",
      "riskLevel": "High"
    }
  ]
}
```

**When to use:** Generated from other tools (JIRA, TestRail, etc.)

#### Format 3: Markdown
**Best for:** Documentation-style scenarios

```markdown
## Scenario: CUST-001

**Priority:** P1  
**Risk Level:** High  
**API Endpoint:** /api/customer/:id

#### Description
When user requests customer with valid ID, system returns 200

#### Acceptance Criteria
- Response status is 200
- Response includes customer data
```

**When to use:** Want scenarios to live in documentation

#### Format 4: Plain Text
**Best for:** Simple, QA-friendly format

```
Scenario ID: CUST-001
Priority: P1
Category: Happy Path

When user requests customer with valid ID
Then system returns 200 status
And response includes customer data
```

**When to use:** QA team prefers simple text format

---

## 📝 Managing Scenarios

### Adding New Scenarios

**When to add:**
- New feature is being developed
- New API endpoint added
- New business requirement identified

**Steps:**
1. Open scenario file (`.traceability/scenarios/your-service.scenarios.yaml`)
2. Add new scenario with unique ID
3. Fill in all required fields
4. Run validation manually: `npm run validate`
5. Commit the scenario file

**Example:**
```yaml
- id: CUST-015  # New unique ID
  description: When user searches customers by email, system returns matching results
  apiEndpoint: /api/customer/search
  httpMethod: GET
  priority: P2
  riskLevel: Medium
  category: Search
  tags: [api, search, customer]
```

### Updating Existing Scenarios

**When to update:**
- API endpoint changed
- Business rules changed
- Priority changed
- Acceptance criteria changed

**What to update:**
- ✅ Description - If behavior changed
- ✅ API endpoint - If URL changed
- ✅ Priority - If business importance changed
- ✅ Acceptance criteria - If requirements changed
- ⚠️ Scenario ID - **NEVER change** (breaks traceability)

**Best Practice:**
```yaml
# Add lastModified field to track changes
- id: CUST-001
  description: Updated description
  lastModified: "2025-12-08"
  notes: "Updated to reflect new validation rules"
```

### Deleting/Archiving Scenarios

**When to delete:**
- Feature was removed
- API endpoint was sunset
- Scenario is no longer relevant

**Process:**
1. **Don't immediately delete** - Move to `archived` section first
2. **Document why:** Add a note explaining the removal
3. **Run validation** to ensure no issues
4. **After 1 release cycle:** Permanently remove

**Example:**
```yaml
# Active scenarios
scenarios:
  - id: CUST-001
    # ...

# Archived scenarios (keep for reference)
archived_scenarios:
  - id: CUST-OLD-001
    description: Old feature that was removed
    archivedDate: "2025-12-01"
    reason: "Feature sunset in v2.0"
```

### Important Rules

✅ **DO:**
- Use unique scenario IDs
- Write clear, testable descriptions
- Include API endpoints when applicable
- Set appropriate priority levels
- Add tags for categorization
- Include acceptance criteria

❌ **DON'T:**
- Reuse scenario IDs
- Write vague descriptions ("test customer stuff")
- Skip priority/risk levels
- Mix multiple scenarios in one
- Use special characters in IDs
- Change scenario IDs after creation

---

## 🔍 Manual Validation (QA Workflow)

### Running Validation Without Committing

As QA, you can run validation **any time** without needing to commit:

```bash
# Validate all services
./scripts/pre-commit.sh --all

# Validate specific service
./scripts/pre-commit.sh --service customer-service

# Verbose output (see detailed matching)
./scripts/pre-commit.sh --all --verbose
```

### QA Daily Workflow

**Morning:**
```bash
# Pull latest code
git pull

# Run validation to see current state
npm run validate

# Open HTML report
open .traceability/reports/traceability-report.html
```

**After Adding Scenarios:**
```bash
# Add new scenario to file
vim .traceability/scenarios/customer-service.scenarios.yaml

# Validate to check if tests exist
npm run validate

# Review gaps in report
open .traceability/reports/traceability-report.html

# If gaps found, create JIRA tickets for developers
```

**Before Sprint Planning:**
```bash
# Generate comprehensive report
npm run validate:all

# Export to CSV for spreadsheet analysis
# File: .traceability/reports/traceability-report.csv

# Share HTML report with stakeholders
```

### Interpreting Validation Results

**Success (✅):**
```
✓ VALIDATION PASSED
Coverage: 85%
Total Scenarios: 20
Gaps: 3 (all P2/P3)
```
**Meaning:** All critical scenarios covered, minor gaps acceptable

**Failure (❌):**
```
✗ VALIDATION FAILED
❌ Critical (P0) Gaps: 2
```
**Meaning:** Critical scenarios lack tests, must be fixed

---

## ✅ Best Practices

### Scenario Writing Tips

1. **Use Given-When-Then Format**
```yaml
description: >
  Given user is authenticated
  When user requests customer with valid ID
  Then system returns 200 with customer data
```

2. **Be Specific**
```yaml
# ❌ BAD
description: Test customer stuff

# ✅ GOOD
description: When user creates customer with valid email, system returns 201 and saves to database
```

3. **One Scenario = One Test Case**
```yaml
# ❌ BAD - Multiple scenarios in one
description: Test customer creation, update, and deletion

# ✅ GOOD - Separate scenarios
- id: CUST-001
  description: Create customer with valid data
- id: CUST-002
  description: Update customer with valid data
- id: CUST-003
  description: Delete customer by ID
```

4. **Include Acceptance Criteria**
```yaml
acceptanceCriteria:
  - Response status is 201
  - Response includes customer ID
  - Customer is saved in database
  - Email confirmation is sent
```

### Maintenance Schedule

**Weekly:**
- Review new orphan tests
- Update scenarios for API changes
- Check gap reports

**Monthly:**
- Full validation of all services
- Review and archive old scenarios
- Update priorities based on business changes

**Per Sprint:**
- Add scenarios for new features
- Update scenarios for changed features
- Generate reports for sprint review

---

## 🐛 Troubleshooting

### "My scenario shows as 'Not Covered' but test exists"

**Possible Causes:**
1. Test name doesn't match scenario description
2. Test is in wrong directory
3. Test pattern in config is incorrect

**Solution:**
1. Check test naming is descriptive
2. Verify test file matches `testPattern` in config
3. Try lowering `defaultThreshold` temporarily
4. Add explicit matching rules to scenario

### "Too many orphan tests"

**Meaning:** Many tests don't have corresponding scenarios

**Solution:**
- Review orphan tests list in report
- Create scenarios for important tests
- Mark technical tests as acceptable orphans

### "Coverage shows 0% but tests exist"

**Cause:** Test parser can't find tests

**Solution:**
1. Check `testDirectory` path in config
2. Verify `testPattern` matches your files
3. Check language/framework settings

---

## 🔄 E2E Workflow Example

### Complete Scenario: New Feature Development

**Day 1 - Requirements:**
```
Business Analyst creates requirement:
"Add customer search by email functionality"
```

**Day 2 - QA Creates Scenario:**
```yaml
# QA adds to customer-service.scenarios.yaml
- id: CUST-016
  description: When user searches customer by email, system returns matching customers
  apiEndpoint: /api/customer/search
  httpMethod: GET
  priority: P1
  riskLevel: High
  category: Search
  tags: [search, email, customer]
  acceptanceCriteria:
    - Response status is 200
    - Results match email query
    - Results are paginated
```

**Day 3 - Developer Implements:**
```java
// Developer writes code
@GetMapping("/api/customer/search")
public ResponseEntity<?> searchCustomers(@RequestParam String email) {
    // Implementation
}
```

**Day 4 - Developer Commits:**
```bash
git add .
git commit -m "Add customer search by email"

# Pre-commit hook runs:
# ✗ VALIDATION FAILED
# ❌ Gap Found: CUST-016
#    No unit test found for customer search
#    Priority: P1
#    Action Required: Developer - Create Test
```

**Day 5 - Developer Writes Test:**
```java
@Test
public void testSearchCustomerByEmailReturnsMatchingResults() {
    // Arrange
    String email = "john@example.com";
    
    // Act
    ResponseEntity<?> response = controller.searchCustomers(email);
    
    // Assert
    assertEquals(200, response.getStatusCodeValue());
    assertNotNull(response.getBody());
}
```

**Day 6 - Developer Commits Again:**
```bash
git add .
git commit -m "Add unit test for customer search"

# Pre-commit hook runs:
# ✓ VALIDATION PASSED
# Coverage: 87%
# ✓ All P0/P1 scenarios covered
```

**Day 7 - QA Verification:**
```bash
# QA runs validation
npm run validate

# QA reviews HTML report
open .traceability/reports/traceability-report.html

# Confirms:
# ✅ CUST-016 is Fully Covered (95% match score)
# ✅ Test: testSearchCustomerByEmailReturnsMatchingResults
```

**Day 8 - Sprint Review:**
```
QA shares traceability report with stakeholders:
- Shows CUST-016 is fully tested
- Demonstrates 87% overall coverage
- Highlights no P0 gaps
- Feature is ready for release
```

---

## 📚 Quick Reference

### Common Commands

```bash
# Validate all services
npm run validate

# Validate specific service
npm run validate -- --service customer-service

# Run manually (QA workflow)
./scripts/pre-commit.sh --all

# Generate only HTML report
npm run report:html

# Clean old reports
npm run clean
```

### Scenario File Locations

```
.traceability/scenarios/
├── customer-service.scenarios.yaml
├── identity-service.scenarios.json
└── order-service.scenarios.md
```

### Report Locations

```
.traceability/reports/
├── traceability-report.html   ← Main report (open in browser)
├── traceability-report.json   ← Data export
├── traceability-report.md     ← Documentation
└── traceability-report.csv    ← Spreadsheet
```

---

## 💬 Getting Help

- **Questions:** Ask your team's tech lead
- **Issues:** Create ticket in JIRA
- **Documentation:** [DEV-IMPLEMENTATION-GUIDE.md](./DEV-IMPLEMENTATION-GUIDE.md)
- **Examples:** See `.traceability/scenarios/` folder

---

**Last Updated:** December 2025  
**Version:** 2.0.0
