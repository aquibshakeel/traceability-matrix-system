# 🎯 Selective Test Execution Guide

## Overview

This guide explains how to run **specific test scenarios** instead of the entire test suite, and how to generate focused traceability matrices for only the executed tests.

## Why Selective Test Execution?

### Use Cases
- **Sprint Demos**: Run only tests relevant to features developed in the sprint
- **Regression Testing**: Execute specific scenarios that might be affected by changes
- **Service-Specific Testing**: Test one service at a time (e.g., only Identity Service)
- **Quick Validation**: Run critical tests without waiting for full suite
- **Audit Requirements**: Generate reports for specific test scenarios

### Benefits
1. ⚡ **Faster Execution** - Run only what you need
2. 🎯 **Focused Reports** - Get TM for executed tests only
3. 📊 **Clear Gap Visibility** - Know if gaps are in unit tests or E2E scenarios
4. 🔍 **Audit Trail** - Document which specific tests were run
5. 💰 **Resource Efficiency** - Save time and CI/CD resources

---

## Quick Start

### Running Selective Tests

```bash
cd qa

# Run a single test
./scripts/run-tests.sh --target 'TS001'

# Run multiple specific tests
./scripts/run-tests.sh --target 'TS001' --target 'TS005'

# Run all tests from onboarding service
./scripts/run-tests.sh --target 'onboarding'

# Run all tests from identity service
./scripts/run-tests.sh --target 'identity'

# Run one test from each service (common for demos)
./scripts/run-tests.sh --target 'TS001' --target 'TS005'
```

### Output

After execution, you'll get:

1. **HTML Test Report**: `qa/reports/html/selective-test-report.html`
   - Beautiful, client-ready HTML report
   - Only shows executed tests
   - Pass/Fail status, execution time, screenshots

2. **Selective Traceability Matrix**: `qa/matrix/SELECTIVE_TRACEABILITY_MATRIX.md`
   - Maps ONLY executed scenarios to unit tests
   - Clear gap source indicators (🔴 Unit Test Gap vs 🟡 E2E Coverage Gap)
   - Focused recommendations for executed tests only

---

## Understanding Test Patterns

### Test Naming Convention

All E2E tests follow this format:
```
[TS00X] Test Name (SCENARIO_ID)
```

Example:
```typescript
describe('[TS001] Create User - Happy Path (HF001)', () => {
  // ...
});
```

Where:
- `TS001` = Test Scenario ID (for easy reference)
- `HF001` = Scenario ID (maps to traceability matrix)

### Available Test Patterns

#### By Test ID
```bash
./scripts/run-tests.sh --target 'TS001'  # Specific test
./scripts/run-tests.sh --target 'TS001' --target 'TS002'  # Multiple tests
```

#### By Service
```bash
./scripts/run-tests.sh --target 'onboarding'  # All onboarding tests
./scripts/run-tests.sh --target 'identity'     # All identity tests
```

#### By Scenario Category
```bash
./scripts/run-tests.sh --target 'Happy'      # All happy path tests
./scripts/run-tests.sh --target 'Negative'   # All negative tests
./scripts/run-tests.sh --target 'CRUD'       # All CRUD tests
```

#### Mixed Patterns
```bash
# One test from onboarding + all identity tests
./scripts/run-tests.sh --target 'TS001' --target 'identity'

# Happy path from onboarding + specific identity test
./scripts/run-tests.sh --target 'onboarding' --target 'TS005'
```

---

## Understanding the Reports

### 1. HTML Test Report

Location: `qa/reports/html/selective-test-report.html`

**Features:**
- Professional, stakeholder-ready format
- Test execution summary (passed/failed)
- Detailed test results with timing
- Error messages and stack traces (if any)
- Screenshots (for browser tests)

**When to Use:**
- Sprint demos and reviews
- Stakeholder presentations
- Quick visual verification of test results

### 2. Selective Traceability Matrix

Location: `qa/matrix/SELECTIVE_TRACEABILITY_MATRIX.md`

**Features:**
- Maps only executed E2E tests to unit tests
- Clear gap source indicators
- Focused coverage metrics
- Prioritized gap list

**Key Sections:**

#### Execution Summary
Shows which tests were executed:
```
E2E Tests Executed: 2
Scenarios Validated: 2
Scenarios Covered: HF001, PS001
```

#### Enhanced Gap Visibility
Each scenario clearly shows the gap source:

| Gap Indicator | Meaning | Who Fixes |
|---------------|---------|-----------|
| 🔴 **Unit Test Gap** | No unit tests for scenario | **Developers** |
| 🟡 **E2E Coverage Gap** | Unit tests exist but incomplete E2E | **QA Team** |
| 🟢 **Fully Covered** | Both unit and E2E tests complete | No action needed |

#### Example Entry
```markdown
| Scenario ID | Description | Unit Test IDs | Coverage | Gap Source | Gap Explanation |
|-------------|-------------|---------------|----------|------------|-----------------|
| NF006 | Missing name field (400) | None | ❌ Not Covered | 🔴 Unit Test Gap | No unit test validates missing name field |
```

**Clear Action Items:**
- If 🔴 **Unit Test Gap**: Escalate to development team
- If 🟡 **E2E Coverage Gap**: Enhance E2E test scenarios

---

## Selective vs Full Traceability Matrix

### Selective TM (SELECTIVE_TRACEABILITY_MATRIX.md)

**Generated by:** `npm run generate:selective-matrix`

**Characteristics:**
- Shows only executed test scenarios
- Focused gap analysis
- Smaller, more targeted report
- Perfect for sprint reviews and demos

**Example:**
```
Scenarios Covered: 2 (HF001, PS001)
Total Defined Scenarios: 20
Coverage: 10% of all scenarios
```

### Full TM (TRACEABILITY_MATRIX.md)

**Generated by:** `npm run generate:matrix`

**Characteristics:**
- Shows ALL defined scenarios (executed or not)
- Complete project coverage analysis
- Comprehensive gap list
- Used for sprint planning and audits

**Example:**
```
Scenarios Covered: 20 (all scenarios)
Total Defined Scenarios: 20
Coverage: 100% visibility
```

### When to Use Which?

| Situation | Use |
|-----------|-----|
| Sprint demo | **Selective TM** |
| Daily testing | **Selective TM** |
| Regression subset | **Selective TM** |
| Sprint planning | **Full TM** |
| Comprehensive audit | **Full TM** |
| Release checklist | **Full TM** |

---

## Common Scenarios

### Scenario 1: Sprint Demo - Show Only New Features

**Goal:** Run and report only tests for features developed in this sprint

```bash
# Assuming TS001 and TS005 are new features this sprint
cd qa
./scripts/run-tests.sh --target 'TS001' --target 'TS005'

# Open reports
open reports/html/selective-test-report.html
cat matrix/SELECTIVE_TRACEABILITY_MATRIX.md
```

**What You Get:**
- ✅ HTML report showing 2 tests executed
- 📊 TM showing only 2 scenarios with their unit test mapping
- 🎯 Clear gaps for just these 2 scenarios
- 📋 Professional reports ready for stakeholder review

### Scenario 2: Service-Specific Testing

**Goal:** Test only the Identity Service after making changes

```bash
cd qa
./scripts/run-tests.sh --target 'identity'

# Check results
open reports/html/selective-test-report.html
```

**What You Get:**
- All identity service tests executed
- TM showing identity scenarios only
- Gaps specific to identity service

### Scenario 3: Quick Smoke Test

**Goal:** Run one critical test from each service

```bash
cd qa
./scripts/run-tests.sh --target 'TS001' --target 'TS005'

# This runs:
# TS001 - Create User (Onboarding Service)
# TS005 - Profile CRUD (Identity Service)
```

**What You Get:**
- Fast execution (2 tests only)
- Basic health check of both services
- Minimal but meaningful coverage

### Scenario 4: Gap Analysis for Specific Features

**Goal:** Understand test coverage for a specific API endpoint

```bash
cd qa
./scripts/run-tests.sh --target 'create.*user'

# Check gap analysis
cat matrix/SELECTIVE_TRACEABILITY_MATRIX.md
```

**What You Get:**
- All tests matching "create user" pattern
- TM showing which unit tests cover these scenarios
- Clear action items (🔴 or 🟡) for gaps

---

## Gap Source Indicators - Detailed Guide

### 🔴 Unit Test Gap

**Meaning:** Missing or insufficient unit test coverage

**Example:**
```markdown
Scenario: NF006 - Missing name field (400)
Coverage: ❌ Not Covered
Gap Source: 🔴 Unit Test Gap
Gap Explanation: No unit test validates missing name field
Responsible: Development Team
```

**Action Required:**
1. Developer writes unit test
2. Re-run full TM: `npm run generate:matrix`
3. Verify gap is closed

**Developer Task:**
```typescript
// Add to UserController.test.ts
it('should return 400 when name field is missing', async () => {
  const invalidPayload = { email: 'test@example.com' };
  await expect(controller.createUser(invalidPayload))
    .rejects.toThrow('Name is required');
});
```

### 🟡 E2E Coverage Gap

**Meaning:** Unit tests exist but E2E test is incomplete

**Example:**
```markdown
Scenario: NF006 - Missing name field (400)
Coverage: ⚠️ Partially Covered
Gap Source: 🟡 E2E Coverage Gap
Gap Explanation: Some aspects covered, but incomplete validation
Unit Tests Found: 1
Responsible: QA Team
```

**Action Required:**
1. QA enhances E2E test scenario
2. Re-run selective tests with same pattern
3. Verify gap is closed

**QA Task:**
```typescript
// Enhance test in ts002_create_user_negative.spec.ts
it('should return 400 when name is missing', async () => {
  const response = await apiClient.createUser({ 
    email: 'test@example.com'
    // name intentionally missing
  });
  expect(response.status).to.equal(400);
  expect(response.error).to.include('name');
});
```

### 🟢 Fully Covered

**Meaning:** Both unit tests and E2E tests validate the scenario

**Example:**
```markdown
Scenario: HF001 - Create user with valid payload
Coverage: ✅ Fully Covered
Gap Source: 🟢 Fully Covered
Gap Explanation: None. Scenario properly validated.
```

**No Action Required!**

---

## Integration with CI/CD

### Example: GitHub Actions

```yaml
name: Selective QA Tests

on:
  pull_request:
    paths:
      - 'src/**'
      - 'identity-service/**'

jobs:
  selective-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run selective tests based on changed files
        run: |
          # Determine which service changed
          if git diff --name-only origin/main... | grep -q "identity-service/"; then
            cd qa
            ./scripts/run-tests.sh --target 'identity'
          elif git diff --name-only origin/main... | grep -q "src/"; then
            cd qa
            ./scripts/run-tests.sh --target 'onboarding'
          fi
      
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: selective-test-reports
          path: |
            qa/reports/html/selective-test-report.html
            qa/matrix/SELECTIVE_TRACEABILITY_MATRIX.md
```

---

## Troubleshooting

### Issue: No tests executed

**Error Message:**
```
Found 0 executed test(s)
```

**Causes:**
1. Pattern doesn't match any tests
2. Typo in test pattern
3. Tests not following naming convention

**Solution:**
```bash
# List all available tests
cd qa
find tests -name "*.spec.ts" -exec grep -l "describe" {} \;

# Check pattern matching
npm test -- --grep 'TS001' --dry-run
```

### Issue: Selective matrix generation fails

**Error Message:**
```
❌ Error: No selective test report found
```

**Cause:** Tests not executed or report not generated

**Solution:**
```bash
# Ensure tests run first
./scripts/run-tests.sh --target 'TS001'

# Manually generate matrix
npm run generate:selective-matrix
```

### Issue: Wrong scenarios in report

**Cause:** Scenario IDs not properly tagged in test names

**Solution:**
Ensure test descriptions follow format:
```typescript
// ✅ Correct
describe('[TS001] Create User - Happy Path (HF001)', () => {});

// ❌ Incorrect
describe('Create User Test', () => {});
```

---

## Best Practices

### 1. Clear Test Naming
Always include scenario IDs in test descriptions:
```typescript
describe('[TS001] Create User - Happy Path (HF001)', () => {
  it('should create a user with valid payload', async () => {
    // Test implementation
  });
});
```

### 2. Meaningful Patterns
Use descriptive patterns that are easy to remember:
```bash
# Good
./scripts/run-tests.sh --target 'TS001' --target 'TS005'
./scripts/run-tests.sh --target 'onboarding'

# Avoid complex regex unless necessary
./scripts/run-tests.sh --target '.*user.*create.*' --target '.*profile.*'
```

### 3. Document Test Runs
Keep a log of selective test executions for audits:
```bash
# Create a test run log
echo "$(date): Running selective tests - TS001, TS005" >> test-run-log.txt
./scripts/run-selective-tests.sh 'TS001' 'TS005'
```

### 4. Regular Full Test Runs
While selective testing is powerful, run full test suite regularly:
```bash
# Daily: Selective tests for quick feedback
./scripts/run-tests.sh --target 'critical'

# Weekly: Full test suite
./scripts/run-tests.sh
```

---

## Summary

### Key Commands

```bash
# Selective test execution
./scripts/run-tests.sh --target <pattern>

# Generate selective TM (auto-runs after tests)
npm run generate:selective-matrix

# Full test execution (for comparison)
./scripts/run-tests.sh

# Generate full TM
npm run generate:matrix
```

### Key Files

| File | Purpose |
|------|---------|
| `scripts/run-tests.sh` | Unified test runner (supports selective mode with --target) |
| `reports/html/selective-test-report.html` | HTML test report (executed tests only) |
| `matrix/SELECTIVE_TRACEABILITY_MATRIX.md` | Selective TM (executed scenarios only) |
| `matrix/TRACEABILITY_MATRIX.md` | Full TM (all scenarios) |

### Gap Visibility Summary

| Indicator | Meaning | Responsible | Action |
|-----------|---------|-------------|--------|
| 🔴 Unit Test Gap | No unit tests | Developers | Add unit tests |
| 🟡 E2E Coverage Gap | Incomplete E2E | QA Team | Enhance E2E tests |
| 🟢 Fully Covered | Complete coverage | No one | Keep it up! |

---

## Next Steps

1. **Try It Out:**
   ```bash
   cd qa
   ./scripts/run-tests.sh --target 'TS001'
   ```

2. **Review Reports:**
   - Open HTML report in browser
   - Read selective TM for gaps

3. **Address Gaps:**
   - 🔴 gaps → Developer adds unit tests
   - 🟡 gaps → QA enhances E2E tests

4. **Integrate with Workflow:**
   - Use for sprint demos
   - Add to CI/CD pipeline
   - Document in team processes

---

**For questions or issues, refer to:**
- Main QA README: `qa/README.md`
- Full TM documentation: `qa/TM_AUTOMATION_IMPLEMENTATION.md`
- Quickstart guide: `qa/QUICKSTART.md`
