# 🎯 QA Commands Reference - Complete Guide

## Overview

All test commands **automatically generate both Test Reports and Traceability Matrix (TM) Reports**. You don't need to run separate commands for report generation.

**🎉 NEW:** Scripts have been consolidated! Use the unified `run-tests.sh` with flags for all scenarios.

---

## 📋 Quick Command Reference

| Command | Environment | Target | Generates Reports? |
|---------|-------------|--------|-------------------|
| `npm test` | Local | All tests | ✅ Test Report + TM |
| `npm test -- --grep "TS001"` | Local | Single test | ✅ Test Report + TM |
| `npm run test:console` | Local | All tests | ❌ Console only |
| `npm run test:selective -- --grep "TS001"` | Local | Selective | ✅ Test Report + TM |
| `./scripts/run-tests.sh` | Local | All tests | ✅ Test Report + TM |
| `./scripts/run-tests.sh --target 'TS001'` | Local | Single test | ✅ Test Report + TM |
| `./scripts/run-tests.sh --env docker` | Docker | All tests | ✅ Test Report + TM |
| `./scripts/run-tests.sh --env docker --target 'TS001'` | Docker | Single test | ✅ Test Report + TM |

---

## 🚀 Local Execution

### 1. Run All Tests (Default)

```bash
# Simple command - generates everything
npm test

# Or using the script
./scripts/run-tests.sh
```

**What happens:**
1. ✅ Runs all tests in `tests/**/*.spec.ts`
2. ✅ Generates HTML test report: `reports/html/test-report.html`
3. ✅ Generates TM report: `matrix/TRACEABILITY_MATRIX.md`
4. ✅ Console output shows test results

**Report Locations:**
- Test Report: `qa/reports/html/test-report.html`
- TM Report: `qa/matrix/TRACEABILITY_MATRIX.md`

### 2. Run Single Test

```bash
# Using npm
npm test -- --grep "TS001"

# Or specific test ID
npm test -- --grep "\[TS001\]"
```

**What happens:**
1. ✅ Runs only tests matching "TS001"
2. ✅ Generates HTML test report: `reports/html/test-report.html`
3. ✅ Generates TM report (full matrix, not selective)

### 3. Run Selective Tests (Recommended for specific tests)

```bash
# Single test
./scripts/run-tests.sh --target 'TS001'

# Multiple tests
./scripts/run-tests.sh --target 'TS001' --target 'TS005'

# All tests from a service
./scripts/run-tests.sh --target 'onboarding'
./scripts/run-tests.sh --target 'identity'
```

**What happens:**
1. ✅ Runs only specified tests
2. ✅ Generates HTML test report: `reports/html/selective-test-report.html`
3. ✅ Generates selective TM: `matrix/SELECTIVE_TRACEABILITY_MATRIX.md`
4. ✅ Shows coverage only for executed scenarios

**Benefits:**
- Faster execution
- Focused reports
- Clear gap indicators (🔴 Unit Test Gap vs 🟡 E2E Coverage Gap)

### 4. Console-Only Mode (No Reports)

```bash
# For quick testing without report generation
npm run test:console

# With grep
npm run test:console -- --grep "TS001"
```

**What happens:**
1. ✅ Runs tests
2. ❌ No HTML report generated
3. ❌ No TM report generated
4. ✅ Console output only

**Use Case:** Quick debugging, CI/CD pipeline checks

---

## 🐳 Docker Execution

### 1. Run All Tests in Docker

```bash
# Using npm script
npm run test:docker

# Or using unified script
./scripts/run-tests.sh --env docker
```

**What happens:**
1. ✅ Builds onboarding service Docker image
2. ✅ Starts QA container
3. ✅ Runs all tests
4. ✅ Generates timestamped reports:
   - `reports/html/test-report-YYYYMMDD_HHMMSS.html`
   - `reports/html/traceability-matrix-YYYYMMDD_HHMMSS.html`
5. ✅ Cleans up containers

### 2. Run Single Test in Docker

```bash
# Using unified script
./scripts/run-tests.sh --env docker --target 'TS001'
```

**What happens:**
1. ✅ Runs only test matching "TS001"
2. ✅ Generates timestamped reports
3. ✅ Selective TM report

### 3. Run Specific Tests in Docker

```bash
# Specific test by ID
./scripts/run-tests.sh --env docker --target 'TS001'

# Multiple tests
./scripts/run-tests.sh --env docker --target 'TS001' --target 'TS005'

# All tests from a service
./scripts/run-tests.sh --env docker --target 'onboarding'
```

---

## 📊 Report Generation Only

If you just want to regenerate reports without running tests:

### Generate TM Report

```bash
# Full TM
npm run generate:tm
# or
npm run generate:matrix
# or
npm run generate:html-tm

# Selective TM (based on last test run)
npm run generate:tm:selective
# or
npm run generate:selective-matrix
```

### View Reports

```bash
# Open test report
open qa/reports/html/test-report.html

# Open selective test report
open qa/reports/html/selective-test-report.html

# View TM in terminal
cat qa/matrix/TRACEABILITY_MATRIX.md

# View selective TM
cat qa/matrix/SELECTIVE_TRACEABILITY_MATRIX.md
```

---

## 🧹 Cleanup

```bash
# Clean all generated artifacts
npm run clean
```

**Removes:**
- `reports/html/*.html`
- `reports/html/*.json`
- `reports/screenshots/*`
- `matrix/*.md` (generated files)

---

## 📁 Report Locations

### Local Execution

```
qa/
└── reports/
    └── html/
        ├── test-report.html                    # Test execution report
        ├── test-report.json                    # Test data (JSON)
        ├── traceability-matrix-*.html          # TM report (timestamped)
        ├── traceability-matrix-*.json          # TM data (JSON)
        ├── selective-test-report.html          # Selective test report
        ├── selective-test-report.json          # Selective test data
        ├── selective-traceability-matrix-*.html # Selective TM report
        └── selective-traceability-matrix-*.json # Selective TM data
```

### Docker Execution (Timestamped)

```
qa/
└── reports/
    └── html/
        ├── test-report-20251205_023000.html
        ├── test-report-20251205_023000.json
        ├── traceability-matrix-20251205_023000.html
        └── traceability-matrix-20251205_023000.json
```

**Note:** All reports are HTML format. No markdown reports are generated.

---

## 🎯 Use Cases & Examples

### Use Case 1: Daily Development

```bash
# Run tests as you develop
npm test

# View results
open qa/reports/html/test-report.html
```

### Use Case 2: Demo Preparation

```bash
# Run one test from each service
./scripts/run-tests.sh --target 'TS001' --target 'TS005'

# Open selective reports
open qa/reports/html/selective-test-report.html
```

### Use Case 3: PR Validation

```bash
# Run specific changed tests
npm test -- --grep "TS001|TS002"

# Check TM for gaps
cat qa/matrix/TRACEABILITY_MATRIX.md
```

### Use Case 4: Production Validation

```bash
# Run in Docker (isolated environment)
npm run test:docker

# Check timestamped reports
ls -la qa/reports/html/
```

### Use Case 5: Debugging

```bash
# Quick console-only run
npm run test:console -- --grep "TS001"

# No report overhead
```

---

## 🔍 Advanced Grep Patterns

### By Test ID

```bash
# Single test
npm test -- --grep "TS001"

# Multiple tests (OR)
npm test -- --grep "TS001|TS005"

# Range (requires sequential naming)
npm test -- --grep "TS00[1-3]"
```

### By Test Type

```bash
# All happy path tests
npm test -- --grep "Happy Path"

# All negative tests
npm test -- --grep "Negative"

# All edge cases
npm test -- --grep "Edge"
```

### By Service

```bash
# Onboarding service only
npm test -- --grep "onboarding"

# Identity service only
npm test -- --grep "identity"
```

### Exclude Tests

```bash
# Exclude slow tests
npm test -- --grep "slow" --invert

# All except edge cases
npm test -- --grep "Edge" --invert
```

---

## 🛠️ Troubleshooting

### Issue: Reports not generated

**Problem:** `npm test` runs but no HTML reports

**Solution:**
```bash
# Check if mochawesome is installed
npm list mochawesome

# Reinstall dependencies
npm install

# Clean and retry
npm run clean
npm test
```

### Issue: TM generation fails

**Problem:** "Cannot find test files"

**Solution:**
```bash
# Verify unit tests exist
ls -la ../test/unit

# Check onboarding-service tests
ls -la ../test/unit/**/*.test.ts

# Check identity-service tests
ls -la ../identity-service/test/unit/**/*.test.ts
```

### Issue: Docker tests fail

**Problem:** Container exits immediately

**Solution:**
```bash
# Check logs
docker-compose -f docker-compose.qa.yml logs

# Rebuild with no cache
docker-compose -f docker-compose.qa.yml build --no-cache

# Verify service is built
docker images | grep onboarding
```

---

## 📊 Understanding Report Output

### Test Report (HTML)

**Location:** `reports/html/test-report.html`

**Contains:**
- ✅ Pass/Fail summary
- ✅ Execution time per test
- ✅ Test hierarchy
- ✅ Stack traces for failures
- ✅ Screenshots (future)

### TM Report (Markdown)

**Location:** `matrix/TRACEABILITY_MATRIX.md`

**Contains:**
- ✅ Overall coverage metrics
- ✅ Service-wise breakdown
- ✅ Gap analysis (P0/P1/P2)
- ✅ Scenario-to-test mapping
- ✅ Recommendations

### Selective TM Report

**Location:** `matrix/SELECTIVE_TRACEABILITY_MATRIX.md`

**Special Features:**
- 🔴 **Unit Test Gap**: Missing unit tests
- 🟡 **E2E Coverage Gap**: Not executed in this run
- ✅ **Fully Covered**: Executed with unit tests

---

## 🎨 Best Practices

### ✅ DO

1. **Always run `npm test`** for full validation
2. **Use selective tests** for demos and quick checks
3. **Check TM reports** after each test run
4. **Clean artifacts** before important runs
5. **Use Docker** for production-like validation

### ❌ DON'T

1. **Don't skip report generation** - it's automated
2. **Don't modify report files** - they're regenerated
3. **Don't commit reports to git** - they're in .gitignore
4. **Don't run tests without service running** (local mode)

---

## 🔗 Related Documentation

- **[README.md](./README.md)** - Complete framework guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick start
- **[SELECTIVE_TEST_EXECUTION.md](./SELECTIVE_TEST_EXECUTION.md)** - Selective testing guide
- **[DOCKER_TEST_EXECUTION.md](./DOCKER_TEST_EXECUTION.md)** - Docker testing guide
- **[matrix/README.md](./matrix/README.md)** - TM system details

---

## 📞 Support

**Need help?**
1. Check this guide
2. Review [README.md](./README.md)
3. Check [Troubleshooting](#troubleshooting) section
4. Create an issue with details

---

**Last Updated:** December 5, 2025  
**Version:** 2.0.0  
**All commands now auto-generate Test Reports + TM Reports!** ✅
