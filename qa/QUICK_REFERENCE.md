# 🚀 Quick Reference - Test Execution Commands

## Local Execution (Without Docker)

### Single Test File
```bash
cd qa
mocha --require ts-node/register tests/e2e/identity/ts005_profile_crud.spec.ts
```

### Entire Test Suite
```bash
cd qa
npm test
```

### With HTML Report
```bash
cd qa
npm run test:report
```

### With Report + Traceability Matrix (Timestamped)
```bash
cd qa
npm run test:with-matrix
```
**Output:** HTML test report + timestamped TM (e.g., `traceability-matrix-2025-12-04_19-19-00.html`)

## Docker Execution (With Timestamped Reports)

### Complete Test Suite
```bash
cd qa
./scripts/run-tests.sh --env docker
```
**Output:** 
- `test-report-YYYYMMDD_HHMMSS.html`
- `traceability-matrix-YYYYMMDD_HHMMSS.html`

### Single Test
```bash
cd qa
./scripts/run-tests.sh --env docker --target 'TS001'
```

### Multiple Tests
```bash
cd qa
./scripts/run-tests.sh --env docker --target 'TS001' --target 'TS005'
```

### All Tests from a Service
```bash
cd qa
# All identity tests
./scripts/run-tests.sh --env docker --target 'identity'

# All onboarding tests  
./scripts/run-tests.sh --env docker --target 'onboarding'
```

## Advanced Docker Commands

### Using Docker Compose Directly
```bash
cd qa

# Complete suite
TEST_TARGET="all" docker-compose -f docker-compose.qa.yml up --build --abort-on-container-exit

# Single file
TEST_TARGET="e2e/identity/ts005_profile_crud.spec.ts" docker-compose -f docker-compose.qa.yml up --build --abort-on-container-exit

# Folder
TEST_TARGET="e2e/onboarding" docker-compose -f docker-compose.qa.yml up --build --abort-on-container-exit

# Test case pattern
TEST_TARGET="should create user" docker-compose -f docker-compose.qa.yml up --build --abort-on-container-exit

# Cleanup
docker-compose -f docker-compose.qa.yml down
```

## Report Locations

All reports are generated in: `qa/reports/html/`

- Test Reports: `test-report-YYYYMMDD_HHMMSS.html`
- Traceability Matrix: `traceability-matrix-YYYYMMDD_HHMMSS.html`

## Full Service Stack (Docker)

### Start Full Stack
```bash
docker-compose up --build
```

Services started:
- MongoDB (port 27017)
- Kafka (port 9092)
- Onboarding Service (port 3000)

### Run Tests Against Running Stack
```bash
cd qa
npm run test:report
```

## Generate Traceability Matrix Only

### Full TM (All Scenarios) - Timestamped
```bash
cd qa
npm run generate:tm
```
**Output:** `traceability-matrix-YYYY-MM-DD_HH-MM-SS.html`

### Selective TM (Executed Scenarios Only) - Timestamped
```bash
cd qa
npm run generate:tm:selective
```
**Output:** `selective-traceability-matrix-YYYY-MM-DD_HH-MM-SS.html`

## Useful Commands

### Clean Reports
```bash
cd qa
npm run clean
```

### Check Docker Status
```bash
docker ps
docker-compose ps
cd qa && docker-compose -f docker-compose.qa.yml ps
```

---

For detailed documentation, see:
- [Docker Test Execution Guide](./DOCKER_TEST_EXECUTION.md)
- [Main QA README](./README.md)
