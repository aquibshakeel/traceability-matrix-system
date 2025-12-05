# 🎯 Unified Test Command Reference

## 📋 Overview

This document provides all available test execution commands with automatic report generation.

**Every command generates:**
- ✅ **Mochawesome HTML Test Report** (Rich UI with charts, graphs, code highlighting)
- ✅ **Unit Test Traceability Matrix Report** (HTML with scenario mapping)
- ✅ **Timestamped filenames** (never overwrites previous reports)

---

## 🖥️ LOCAL EXECUTION

### 1. Run Single Test Case

```bash
cd qa
npm run test:case TS001
```

**What it does:**
- Runs only tests with `[TS001]` tag
- Generates selective test report
- Generates TM with only TS001 scenarios

---

### 2. Run Multiple Test Cases

```bash
cd qa
npm run test:cases TS001,TS002,TS003
```

**What it does:**
- Runs tests with `[TS001]`, `[TS002]`, or `[TS003]` tags
- Generates selective test report
- Generates TM with only executed scenarios

---

### 3. Run Specific Test File

```bash
cd qa
npm run test:file e2e/onboarding/ts002_create_user_negative.spec.ts
```

**What it does:**
- Runs only specified test file
- Generates selective test report
- Generates TM with only scenarios from that file

---

### 4. Run Entire Folder

```bash
cd qa
npm run test:folder onboarding
```

**What it does:**
- Runs all tests in `tests/e2e/onboarding/` folder
- Generates selective test report
- Generates TM with all scenarios from that folder

**Available folders:**
- `onboarding` - All onboarding service tests
- `identity` - All identity service tests

---

### 5. Run Complete Test Suite

```bash
cd qa
npm run test:all
```

**OR simply:**

```bash
cd qa
npm test
```

**What it does:**
- Runs ALL tests across all services
- Generates full test report
- Generates complete TM with all scenarios

---

## 🐳 DOCKER EXECUTION

### 1. Run Single Test Case in Docker

```bash
cd qa
TEST_MODE=case TEST_TARGET=TS001 docker-compose -f docker-compose.qa.yml up --build
```

**Alternative using docker-compose run:**
```bash
cd qa
docker-compose -f docker-compose.qa.yml run -e TEST_MODE=case -e TEST_TARGET=TS001 qa-tests
```

---

### 2. Run Multiple Test Cases in Docker

```bash
cd qa
TEST_MODE=cases TEST_TARGET=TS001,TS002,TS003 docker-compose -f docker-compose.qa.yml up --build
```

---

### 3. Run Specific File in Docker

```bash
cd qa
TEST_MODE=file TEST_TARGET=e2e/onboarding/ts002_create_user_negative.spec.ts docker-compose -f docker-compose.qa.yml up --build
```

---

### 4. Run Folder in Docker

```bash
cd qa
TEST_MODE=folder TEST_TARGET=onboarding docker-compose -f docker-compose.qa.yml up --build
```

---

### 5. Run Complete Suite in Docker

```bash
cd qa
TEST_MODE=all docker-compose -f docker-compose.qa.yml up --build
```

**OR simply:**

```bash
cd qa
docker-compose -f docker-compose.qa.yml up --build
```

**Note:** Reports are automatically mounted to your local `qa/reports/` directory via Docker volumes.

---

## 📊 VIEW REPORTS

### List All Reports

```bash
ls -lh qa/reports/html/*.html
```

### Open Latest Test Report

```bash
# For selective tests
open qa/reports/html/selective-test-report-*.html

# For full suite
open qa/reports/html/test-report-*.html
```

### Open Latest TM Report

```bash
# For selective execution
open qa/reports/html/selective-traceability-matrix-*.html

# For full suite
open qa/reports/html/traceability-matrix-*.html
```

---

## 🧹 CLEAN REPORTS

```bash
cd qa
npm run clean
```

**Removes:**
- All HTML reports
- All screenshots
- Preserves directory structure

---

## 📝 REPORT DETAILS

### Test Report (Mochawesome)

**Features:**
- ✅ Interactive charts and graphs
- ✅ Pass/fail statistics
- ✅ Test duration timing
- ✅ Code snippet highlighting
- ✅ Expandable test suites
- ✅ Filter by status
- ✅ Search functionality

### TM Report (Custom HTML)

**Features:**
- ✅ 6 interactive stat cards (Coverage, P0/P1 Gaps, Unit Tests, Orphan Tests)
- ✅ Scenario-to-unit-test mapping table
- ✅ Service identification
- ✅ Coverage status (Fully/Partially/Not Covered)
- ✅ Gap analysis with AI test generation prompts
- ✅ Critical gaps (P0) section
- ✅ High priority gaps (P1) section
- ✅ Orphan tests detection
- ✅ Purple gradient design with hover effects

---

## 🎯 EXAMPLES

### Example 1: Quick Single Test

```bash
cd qa
npm run test:case TS001
```

**Output:**
- `selective-test-report-20251205_035800.html`
- `selective-traceability-matrix-20251205_035800.html`

---

### Example 2: Test Multiple Scenarios

```bash
cd qa
npm run test:cases TS001,NF004,EC001
```

**Output:**
- Test report with only TS001, NF004, EC001 tests
- TM report showing only those 3 scenarios + their unit tests

---

### Example 3: Test Entire Service

```bash
cd qa
npm run test:folder onboarding
```

**Output:**
- Test report with all onboarding tests (TS001-TS004)
- TM report showing all onboarding scenarios

---

### Example 4: Full Regression

```bash
cd qa
npm test
```

**Output:**
- Complete test report (all services)
- Complete TM report (all scenarios, all unit tests)

---

## 🚨 TROUBLESHOOTING

### Tests Not Running?

**Check:**
1. Are you in the `qa` directory? → `cd qa`
2. Dependencies installed? → `npm install`
3. Service running? → Check if backend is up

### Reports Not Generated?

**Check:**
1. Reports directory exists? → Should auto-create
2. Check console for errors
3. Verify timestamps in filenames

### TM Shows Wrong Data?

**Ensure:**
1. Using correct mode (--case, --cases, --file, --folder, --all)
2. Test scenarios have proper tags: `[TS001]`, `[NF004]`, etc.
3. Unit tests are properly mapped in `scenario-definitions.ts`

---

## ✅ SUMMARY

**Total Commands Available:** 11

**Execution Modes:** 5 (case, cases, file, folder, all)

**Environments:** 2 (Local + Docker)

**Reports Generated:** 2 per execution (Test Report + TM Report)

**All reports are timestamped and never overwrite each other!** 🎉
