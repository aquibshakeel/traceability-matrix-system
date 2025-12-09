# AI-Driven Traceability System - Complete Testing Guide

## 📋 Table of Contents

1. [System Capabilities](#system-capabilities)
2. [Pre-requisites](#pre-requisites)
3. [Test Case 1: Fresh Start - No Tests](#test-case-1-fresh-start---no-tests)
4. [Test Case 2: Partial Coverage](#test-case-2-partial-coverage)
5. [Test Case 3: Orphan Tests Detection](#test-case-3-orphan-tests-detection)
6. [Test Case 4: Scenario Completeness Check](#test-case-4-scenario-completeness-check)
7. [Test Case 5: Code Change Impact](#test-case-5-code-change-impact)
8. [Test Case 6: New API Added](#test-case-6-new-api-added)
9. [Test Case 7: API Removed](#test-case-7-api-removed)
10. [Test Case 8: Full Coverage Success](#test-case-8-full-coverage-success)
11. [Testing Checklist](#testing-checklist)
12. [Common Issues & Solutions](#common-issues--solutions)

---

## System Capabilities

### What This AI System Can Do

#### 1. **AI Test Scenario Generation**
- ✅ Automatically generates test scenarios from API specifications
- ✅ Analyzes Swagger/OpenAPI documentation
- ✅ Scans code for API endpoints
- ✅ Suggests comprehensive test coverage

**Scenario Types Generated:**
- **Happy Case**: Valid inputs, successful responses (201, 200)
- **Edge Case**: Boundary conditions, special characters, null/empty values
- **Error Case**: Validation errors (400, 404, 409, 422, 500)
- **Security**: SQL injection, XSS, authentication bypass

#### 2. **Smart Coverage Analysis**
- ✅ Compares actual unit tests vs baseline scenarios
- ✅ Calculates coverage percentage
- ✅ AI-powered semantic matching (not just string matching)
- ✅ Identifies gaps (scenarios without tests)
- ✅ Categorizes orphan tests (tests without scenarios)

#### 3. **Scenario Completeness Detection**
- ✅ Compares QA baseline vs AI suggestions
- ✅ Detects missing scenarios based on API spec
- ✅ Suggests additional test cases
- ✅ Prevents incomplete test coverage

#### 4. **Change Impact Analysis**
- ✅ Detects code changes via Git
- ✅ Identifies affected unit tests
- ✅ Marks scenarios needing re-verification
- ✅ Tracks lines changed with before/after diff

#### 5. **Intelligent Test Categorization**
- ✅ **Technical Tests** (P3): Infrastructure tests (DTOs, Entities, Mappers)
- ✅ **Business Tests** (P0-P2): Controller/Service tests requiring scenarios
- ✅ Priority-based recommendations

#### 6. **Multi-Format Reporting**
- ✅ **HTML**: Visual, interactive dashboard
- ✅ **JSON**: Machine-readable for CI/CD
- ✅ **CSV**: Spreadsheet analysis
- ✅ **Markdown**: Documentation

#### 7. **Pre-Commit Validation**
- ✅ Blocks commits with P0/P1 gaps
- ✅ Allows commits with only P2/P3 gaps
- ✅ Provides actionable recommendations

---

## Pre-requisites

### Environment Setup

```bash
# 1. Navigate to project directory
cd /Users/aquibshakeel/Desktop/traceability-matrix-system

# 2. Install dependencies
npm install

# 3. Set Claude API Key
export CLAUDE_API_KEY="sk-ant-your-key-here"
# OR
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# 4. Verify configuration exists
cat .traceability/config.json

# 5. Ensure baseline exists
ls -la .traceability/test-cases/baseline/

# 6. Check services
ls -la services/
```

### Required Files

```
traceability-matrix-system/
├── .traceability/
│   ├── config.json                    # Configuration
│   ├── test-cases/
│   │   ├── baseline/                  # QA-managed scenarios
│   │   │   └── customer-service.yml   # 25 scenarios
│   │   └── ai_cases/                  # AI-generated (auto-created)
│   └── reports/                       # Generated reports (auto-created)
├── services/
│   ├── customer-service/              # Java service
│   └── identity-service/              # Java service
└── package.json
```

---

## Test Case 1: Fresh Start - No Tests

### Objective
Test the system with baseline scenarios but NO unit tests to validate gap detection.

### Setup

```bash
# 1. Ensure baseline exists
cat .traceability/test-cases/baseline/customer-service.yml
# Should show 25 scenarios

# 2. Verify NO unit tests exist
ls services/customer-service/src/test/
# Should be empty or not exist

# 3. Clean previous reports
rm -rf .traceability/reports/*
rm -rf .traceability/test-cases/ai_cases/*
```

### Execute

```bash
# Phase 1: Generate AI scenarios
npm run generate

# Phase 2: Analyze coverage
npm run continue
```

### Expected Output

#### Console Output:
```
🤖 AI-Driven Pre-Commit Validation System

Phase 1: AI Test Case Generation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Discovered 4 APIs
✓ Generated scenarios
✓ Comparing with baseline (25 scenarios)
✅ Phase 1 Complete

Phase 2: Coverage Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Baseline: 25 scenarios
✓ Unit tests: 0 found
📈 Coverage: 0.0%
✅ Covered: 0/25
⚠️  Gaps: P0=5, P1=8, P2=12

❌ Phase 2 FAILED - COMMIT BLOCKED
⛔ Critical gaps detected
```

#### Files Generated:
```bash
# 1. AI cases file
cat .traceability/test-cases/ai_cases/customer-service-ai.yml
# Should show all scenarios marked with ✅

# 2. HTML Report (auto-opened)
open .traceability/reports/customer-service-report.html
```

### Verification Checklist

- [ ] Phase 1 completed successfully
- [ ] ai_cases file created with ✅ markers
- [ ] Phase 2 detects 0 unit tests
- [ ] Coverage shows 0%
- [ ] All 25 scenarios marked as gaps
- [ ] P0/P1 gaps present → Commit BLOCKED
- [ ] HTML report shows:
  - Coverage: 0%
  - Coverage Gaps: 25
  - Recommendations for each gap
- [ ] JSON/CSV/MD reports generated

### Expected Report Sections

#### HTML Report Should Show:
```
╔══════════════════════════════════════╗
║  Coverage: 0%                        ║
║  Total Scenarios: 25                 ║
║  Covered: 0 | Gaps: 25              ║
║  P0 Gaps: 5 | P1 Gaps: 8           ║
╚══════════════════════════════════════╝

Coverage Gaps (25):
  ❌ CUST-001: When customer created with valid data, return 201
     Priority: P1
     Recommendation: Create unit test
  
  ❌ CUST-002: When created without auth token, return 401
     Priority: P0
     Recommendation: Create unit test
  
  ... (23 more)
```

---

## Test Case 2: Partial Coverage

### Objective
Test with some scenarios covered by tests, some not.

### Setup

```bash
# 1. Create sample unit test file
mkdir -p services/customer-service/src/test/java/com/pulse/customerservice/controller

# 2. Create a test file with 10 tests
cat > services/customer-service/src/test/java/com/pulse/customerservice/controller/CustomerControllerTest.java << 'EOF'
package com.pulse.customerservice.controller;

import org.junit.jupiter.api.Test;

public class CustomerControllerTest {
    
    @Test
    public void createCustomer_ShouldReturn201_WhenValidData() {
        // Test implementation
    }
    
    @Test
    public void createCustomer_ShouldReturn400_WhenInvalidEmail() {
        // Test implementation
    }
    
    @Test
    public void createCustomer_ShouldReturn409_WhenDuplicateEmail() {
        // Test implementation
    }
    
    @Test
    public void getCustomer_ShouldReturn200_WhenValidId() {
        // Test implementation
    }
    
    @Test
    public void getCustomer_ShouldReturn404_WhenNotFound() {
        // Test implementation
    }
    
    @Test
    public void updateCustomer_ShouldReturn200_WhenValidData() {
        // Test implementation
    }
    
    @Test
    public void updateCustomer_ShouldReturn404_WhenNotFound() {
        // Test implementation
    }
    
    @Test
    public void deleteCustomer_ShouldReturn204_WhenValidId() {
        // Test implementation
    }
    
    @Test
    public void deleteCustomer_ShouldReturn404_WhenNotFound() {
        // Test implementation
    }
    
    @Test
    public void createCustomer_ShouldReturn401_WhenNoAuth() {
        // Test implementation
    }
}
EOF
```

### Execute

```bash
# Run analysis
npm run continue
```

### Expected Output

```
Phase 2: Coverage Analysis
✓ Baseline: 25 scenarios
✓ Unit tests: 10 found
📈 Coverage: 40.0%
✅ Covered: 10/25
⚠️  Gaps: P0=3, P1=5, P2=7

❌ COMMIT BLOCKED (P0/P1 gaps exist)
```

### Verification Checklist

- [ ] System finds 10 unit tests
- [ ] Coverage: ~40% (10/25)
- [ ] 10 scenarios marked as FULLY_COVERED
- [ ] 15 scenarios marked as gaps
- [ ] Commit blocked due to remaining P0/P1 gaps
- [ ] Report shows which scenarios are covered vs not
- [ ] Clear recommendations for missing tests

---

## Test Case 3: Orphan Tests Detection

### Objective
Test with tests that don't have corresponding scenarios (orphans).

### Setup

```bash
# Add orphan tests to the test file
cat >> services/customer-service/src/test/java/com/pulse/customerservice/controller/CustomerControllerTest.java << 'EOF'

    // Technical orphan tests (should be P3)
    @Test
    public void customerEntity_Builder_ShouldWork() {
        // Entity test
    }
    
    @Test
    public void customerMapper_ToDto_ShouldMap() {
        // Mapper test
    }
    
    @Test
    public void customerRequest_Validation_ShouldPass() {
        // DTO test
    }
    
    // Business orphan tests (should require scenarios)
    @Test
    public void getCustomersByAge_ShouldReturnList() {
        // No scenario exists for this
    }
    
    @Test
    public void updateCustomer_WithPartialData_ShouldWork() {
        // No scenario exists for this
    }
EOF
```

### Execute

```bash
npm run continue
```

### Expected Output

```
Phase 2: Coverage Analysis
✓ Baseline: 25 scenarios
✓ Unit tests: 15 found
🔍 Orphans: 5 tests

Categorizing orphan tests...
✅ Technical: 3 (Entity, Mapper, DTO tests)
⚠️  Business: 2 (require QA scenarios)
```

### Verification Checklist

- [ ] System finds all 15 tests
- [ ] Identifies 5 orphan tests
- [ ] **Categorizes orphans:**
  - [ ] Technical (P3): 3 tests → No action needed
  - [ ] Business (P0-P2): 2 tests → QA should add scenarios
- [ ] Report shows orphan tests section
- [ ] Recommendations for business orphans

#### Expected Report Section:

```
Orphan Tests (5):

Technical Tests (P3) - No Action Needed:
  ✅ customerEntity_Builder_ShouldWork
  ✅ customerMapper_ToDto_ShouldMap
  ✅ customerRequest_Validation_ShouldPass

Business Tests (P2) - QA Action Required:
  ⚠️ getCustomersByAge_ShouldReturnList
     Recommendation: Add scenario to baseline
  ⚠️ updateCustomer_WithPartialData_ShouldWork
     Recommendation: Add scenario to baseline
```

---

## Test Case 4: Scenario Completeness Check

### Objective
Test detection of missing scenarios when baseline is incomplete.

### Setup

```bash
# 1. Create minimal baseline (only 1 happy case)
cat > .traceability/test-cases/baseline/customer-service-minimal.yml << 'EOF'
service: customer-service

POST /api/customers:
  happy_case:
    - When customer is created with valid data, return 201 and customer ID
EOF

# 2. Update config to use minimal baseline
# (For this test, we'll keep the full baseline and see completeness gaps)
```

### Execute

```bash
npm run generate
npm run continue
```

### Expected Output

```
Phase 1: AI Generation
✓ AI generating scenarios from API spec
✓ Detected 4 APIs with responses: 201, 400, 401, 409

Phase 2: Coverage Analysis
⚠️  Scenario completeness: 12 potentially missing scenarios
✓ Baseline has 1 scenario
✓ AI suggests 13 total scenarios
⚠️  Missing: 12 scenarios
```

### Verification Checklist

- [ ] AI generates comprehensive scenarios from API spec
- [ ] System compares baseline vs AI suggestions
- [ ] Detects missing scenarios (e.g., 400, 401, 409)
- [ ] Creates "Completeness Gaps" in report
- [ ] Recommendations for QA to review
- [ ] AI cases file shows 🆕 for missing scenarios

#### Expected ai_cases Output:

```yaml
# POST /api/customers
POST /api/customers:
  happy_case:
    - When customer created with valid data, return 201  ✅
  
  error_case:
    - When created with invalid email format, return 400  🆕
    - When created without authentication token, return 401  🆕
    - When created with duplicate email, return 409  🆕
```

---

## Test Case 5: Code Change Impact

### Objective
Test change detection when developer modifies code.

### Setup

```bash
# 1. Make sure you're in a git repository
git status

# 2. Modify the controller file
nano services/customer-service/src/main/java/com/pulse/customerservice/controller/CustomerController.java

# Add a comment or modify a method:
# Example: Add email validation in createCustomer method

# 3. Stage the changes
git add services/customer-service/src/main/java/com/pulse/customerservice/controller/CustomerController.java
```

### Execute

```bash
npm run generate
```

### Expected Output

```
Phase 1: AI Test Case Generation
🔍 Detecting Git changes...
✓ Detected 1 API changes
  - Modified: POST /api/customers (CustomerController.java)
  - Lines changed: 15
  - Affected tests: 3

✓ Change impact tracked in ai_cases/
```

### Verification Checklist

- [ ] Git change detected
- [ ] Modified API identified
- [ ] Affected tests found
- [ ] Change details captured (lines changed)
- [ ] ai_cases file shows change markers

#### Expected ai_cases Output:

```yaml
# POST /api/customers
# 🔧 CHANGE DETECTED - MODIFIED
# File: CustomerController.java
# Lines changed: 15
# ⚠️ Affected tests (3):
#   - createCustomer_ShouldReturn201_WhenValidData
#   - createCustomer_ShouldReturn400_WhenInvalidEmail
#   - createCustomer_ShouldReturn409_WhenDuplicateEmail
# Action: Verify affected tests still pass, update if needed
#
POST /api/customers:
  happy_case:
    - When customer created with valid data, return 201  ✅ ⚠️
  error_case:
    - When created with invalid email, return 400  ✅ ⚠️
```

### Test Variations

#### 5a. Multiple Files Changed
```bash
# Modify multiple controller files
git add services/customer-service/src/main/java/com/pulse/customerservice/controller/*.java
npm run generate
```

#### 5b. New Method Added
```bash
# Add a new method in controller
# Expected: Detect new API, mark as ADDED
```

#### 5c. Method Removed
```bash
# Delete a method
# Expected: Detect removed API, recommend cleanup
```

---

## Test Case 6: New API Added

### Objective
Test detection when developer adds a new API endpoint.

### Setup

```bash
# Add new API method to controller
cat >> services/customer-service/src/main/java/com/pulse/customerservice/controller/CustomerController.java << 'EOF'

    @PatchMapping("/{id}")
    public ResponseEntity<CustomerResponse> partialUpdateCustomer(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates) {
        // Implementation
        return ResponseEntity.ok(null);
    }
EOF

# Stage changes
git add services/customer-service/src/main/java/com/pulse/customerservice/controller/CustomerController.java
```

### Execute

```bash
npm run generate
npm run continue
```

### Expected Output

```
Phase 1: AI Generation
✓ Detected 1 API changes
  - Added: PATCH /api/customers/{id}
  - New API without tests
  - New API without scenarios

Phase 2: Coverage Analysis
⚠️  Orphan APIs: 1
  - PATCH /api/customers/{id}
    Status: No scenarios, No tests
    Priority: Critical
```

### Verification Checklist

- [ ] New API detected
- [ ] Marked as ADDED in change detection
- [ ] AI generates scenarios for new API
- [ ] All scenarios marked with 🆕
- [ ] Report shows "Orphan API" section
- [ ] Critical priority assigned
- [ ] Recommendations: Add scenarios + tests

---

## Test Case 7: API Removed

### Objective
Test detection when developer removes an API endpoint.

### Setup

```bash
# 1. Note current APIs in baseline
grep "^[A-Z]" .traceability/test-cases/baseline/customer-service.yml

# 2. Remove DELETE endpoint from controller
# Comment out or delete the DELETE method

# 3. Stage changes
git add services/customer-service/src/main/java/com/pulse/customerservice/controller/CustomerController.java
```

### Execute

```bash
npm run generate
npm run continue
```

### Expected Output

```
Phase 1: AI Generation
✓ Detected 1 API changes
  - Removed: DELETE /api/customers/{id}

Phase 2: Coverage Analysis
⚠️  Stale scenarios detected
  - DELETE /api/customers/{id} (3 scenarios)
  - Recommendation: Remove from baseline
  - Recommendation: Archive/remove tests
```

### Verification Checklist

- [ ] Removed API detected
- [ ] Marked as REMOVED in change detection
- [ ] System identifies stale scenarios
- [ ] Recommendations to cleanup baseline
- [ ] Recommendations to remove/archive tests
- [ ] Report shows API removal section

---

## Test Case 8: Full Coverage Success

### Objective
Test successful scenario with 100% coverage and no issues.

### Setup

```bash
# 1. Ensure baseline has all scenarios (25)
cat .traceability/test-cases/baseline/customer-service.yml | grep "^    -" | wc -l
# Should show: 25

# 2. Create complete test file with all 25 tests
# Each test should match a baseline scenario

# 3. No orphan tests
# 4. No code changes
```

### Execute

```bash
npm run generate
npm run continue
```

### Expected Output

```
Phase 1: AI Generation
✓ Generated scenarios
✓ All marked ✅ (in baseline)
✅ Phase 1 Complete

Phase 2: Coverage Analysis
✓ Baseline: 25 scenarios
✓ Unit tests: 25 found
📈 Coverage: 100%
✅ Covered: 25/25
⚠️  Gaps: 0
🔍 Orphans: 0

╔══════════════════════════════════════╗
║     ✅ VALIDATION SUCCESSFUL         ║
║  🚀 Proceeding with commit...        ║
╚══════════════════════════════════════╝
```

### Verification Checklist

- [ ] Coverage: 100%
- [ ] All 25 scenarios covered
- [ ] 0 gaps
- [ ] 0 orphan tests
- [ ] No P0/P1 issues
- [ ] **Commit ALLOWED** ✅
- [ ] Report shows success status
- [ ] All indicators green

---

## Testing Checklist

### Pre-Test Verification
- [ ] Node.js and npm installed
- [ ] Claude API key configured
- [ ] Git repository initialized
- [ ] Config file present
- [ ] Baseline file exists

### Phase 1: AI Generation Tests
- [ ] Discovers APIs from Swagger
- [ ] Discovers APIs from code scan
- [ ] Generates comprehensive scenarios
- [ ] Compares with baseline correctly
- [ ] Marks ✅ for existing scenarios
- [ ] Marks 🆕 for new suggestions
- [ ] Detects git changes
- [ ] Identifies affected tests
- [ ] Saves to ai_cases/

### Phase 2: Coverage Analysis Tests
- [ ] Loads baseline scenarios correctly
- [ ] Parses Java unit tests
- [ ] Matches tests to scenarios (semantic matching)
- [ ] Calculates coverage percentage
- [ ] Detects gaps (scenarios without tests)
- [ ] Categorizes orphan tests
  - [ ] Technical tests (P3)
  - [ ] Business tests (P0-P2)
- [ ] Checks scenario completeness
- [ ] Detects orphan APIs

### Reporting Tests
- [ ] HTML report generated
- [ ] JSON report generated
- [ ] CSV report generated
- [ ] Markdown report generated
- [ ] HTML report auto-opens
- [ ] Reports contain all sections:
  - [ ] Coverage overview
  - [ ] Coverage gaps
  - [ ] Orphan tests
  - [ ] Orphan APIs
  - [ ] Change impact
  - [ ] Recommendations

### Blocking Logic Tests
- [ ] Blocks commit with P0 gaps
- [ ] Blocks commit with P1 gaps
- [ ] Allows commit with only P2 gaps
- [ ] Allows commit with only P3 gaps
- [ ] Allows commit with 100% coverage

---

## Common Issues & Solutions

### Issue 1: API Key Not Found

**Error:**
```
❌ ERROR: Claude API key not found!
```

**Solution:**
```bash
export CLAUDE_API_KEY="sk-ant-your-key-here"
# OR
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

### Issue 2: Baseline Not Found

**Error:**
```
❌ ERROR: Baseline not found: .traceability/test-cases/baseline/customer-service-baseline.yml
```

**Solution:**
```bash
# Check if file exists
ls .traceability/test-cases/baseline/

# Ensure correct filename
mv customer-service-baseline.yml customer-service.yml
```

### Issue 3: No Unit Tests Found

**Expected (Test Case 1):**
```
✓ Unit tests: 0 found
```

**If unexpected:**
```bash
# Check test directory
ls services/customer-service/src/test/

# Ensure Java test files exist
find services/customer-service/src/test -name "*Test.java"
```

### Issue 4: Service Won't Start

**Error:**
```
⚠️ Service failed to start
```

**Solution:**
```bash
# Check if ports are already in use
lsof -i :8080

# Update config.json with correct health check URL
nano .traceability/config.json
```

### Issue 5: Git Changes Not Detected

**Expected:**
```
✓ Detected 0 API changes
```

**Solution:**
```bash
# Make changes and stage them
git add services/customer-service/src/main/java/com/pulse/customerservice/controller/*.java

# Verify git status
git status

# Re-run
npm run generate
```

---

## Quick Reference

### Run Commands
```bash
# Generate AI scenarios
npm run generate

# Analyze coverage
npm run continue

# Full pre-commit validation
git commit -m "test"
# (pre-commit hook runs automatically)
```

### File Locations
```
Baseline (QA-managed):
  .traceability/test-cases/baseline/customer-service.yml

AI Cases (Auto-generated):
  .traceability/test-cases/ai_cases/customer-service-ai.yml

Reports:
  .traceability/reports/customer-service-report.html
  .traceability/reports/customer-service-report.json
  .traceability/reports/customer-service-report.csv
  .traceability/reports/customer-service-report.md
```

### Marker Meanings
- ✅ = Scenario in baseline (covered)
- 🆕 = New AI suggestion (QA review)
- 🔧 = API modified (code changed)
- ⚠️ = Verify needed (test may be affected)

---

## Testing Timeline

### Day 1: Basic Tests
- [ ] Test Case 1: Fresh Start
- [ ] Test Case 2: Partial Coverage
- [ ] Test Case 8: Full Coverage

### Day 2: Advanced Tests
- [ ] Test Case 3: Orphan Tests
- [ ] Test Case 4: Scenario Completeness
- [ ] Test Case 5: Code Changes

### Day 3: Edge Cases
- [ ] Test Case 6: New API
- [ ] Test Case 7: API Removed
- [ ] Multiple simultaneous changes

---

## Success Criteria

✅ **System is working correctly if:**
1. All 8 test cases pass
2. Reports generated in all formats
3. Correct blocking/allowing behavior
4. Change detection works
5. Orphan categorization accurate
6. Scenario completeness detection works
7. AI generates meaningful suggestions
8. Coverage calculations accurate

---

## Support

For issues or questions:
1. Check this testing guide
2. Review system documentation
3. Check generated reports for details
4. Review console output for errors

---

**Last Updated:** December 10, 2025  
**Version:** 1.0  
**System:** AI-Driven Traceability Matrix
