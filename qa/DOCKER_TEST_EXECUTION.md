# 🐳 Docker Test Execution Guide

Complete guide for running QA tests via Docker with flexible execution modes and timestamped reports.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Test Execution Modes](#test-execution-modes)
- [Report Generation](#report-generation)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Docker-based QA test execution system provides:

- ✅ **Complete test suite execution**
- ✅ **Single test file execution**
- ✅ **Folder-based test execution**
- ✅ **Single test case execution (by pattern)**
- ✅ **Automatic timestamped reports**
- ✅ **Automatic Traceability Matrix generation**
- ✅ **Isolated test environment (MongoDB + Kafka + Service)**

## 📦 Prerequisites

- Docker and Docker Compose installed
- Onboarding service built (`docker-compose build service`)

## 🚀 Quick Start

### Run Complete Test Suite

```bash
cd qa
./scripts/run-tests.sh --env docker
```

This will:
1. Build the onboarding service
2. Start MongoDB, Kafka, and the service
3. Run all tests
4. Generate test report with timestamp
5. Generate traceability matrix with timestamp
6. Clean up containers

## 🎮 Test Execution Modes

### 1. Complete Test Suite (All Tests)

```bash
./scripts/run-tests.sh --env docker
```

**Output:**
- `reports/html/test-report-YYYYMMDD_HHMMSS.html`
- `reports/html/traceability-matrix-YYYYMMDD_HHMMSS.html`

### 2. Single Test

```bash
./scripts/run-tests.sh --env docker --target 'TS001'
```

**Output:**
- Runs only tests matching "TS001"
- Generates timestamped reports

### 3. Multiple Tests

```bash
./scripts/run-tests.sh --env docker --target 'TS001' --target 'TS005'
```

**Output:**
- Runs specified tests
- Generates timestamped reports

### 4. Service Tests

```bash
# Run all identity tests
./scripts/run-tests.sh --env docker --target 'identity'

# Run all onboarding tests
./scripts/run-tests.sh --env docker --target 'onboarding'
```

**Output:**
- Runs all tests for the specified service
- Generates timestamped reports

## 📊 Report Generation

### Automatic Report Generation

Every test run automatically generates two reports with timestamps:

1. **Test Report** - Detailed test execution results
   - Format: `test-report-YYYYMMDD_HHMMSS.html`
   - Location: `qa/reports/html/`
   
2. **Traceability Matrix** - Unit test coverage analysis
   - Format: `traceability-matrix-YYYYMMDD_HHMMSS.html`
   - Location: `qa/reports/html/`

### Report Details

All test executions automatically generate both test and traceability matrix reports. Reports are timestamped to prevent overwriting previous runs.

## 🔧 Advanced Usage

### Direct Docker Compose Usage

For more control, use docker-compose directly:

```bash
cd qa

# Run all tests
TEST_TARGET="all" docker-compose -f docker-compose.qa.yml up --build --abort-on-container-exit

# Run single file
TEST_TARGET="e2e/identity/ts005_profile_crud.spec.ts" docker-compose -f docker-compose.qa.yml up --build --abort-on-container-exit

# Run without TM generation
TEST_TARGET="all" GENERATE_TM="false" docker-compose -f docker-compose.qa.yml up --build --abort-on-container-exit

# Cleanup
docker-compose -f docker-compose.qa.yml down
```

### Environment Variables

Available environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_TARGET` | Test target (all/file/folder/pattern) | `all` |
| `GENERATE_TM` | Generate traceability matrix | `true` |
| `API_BASE_URL` | Service API base URL | `http://service:3000` |
| `NODE_ENV` | Node environment | `test` |

### Custom Test Patterns

Run tests matching specific patterns:

```bash
# Run specific tests by ID
./scripts/run-tests.sh --env docker --target 'TS001'

# Run all tests from a service
./scripts/run-tests.sh --env docker --target 'onboarding'

# Run multiple specific tests
./scripts/run-tests.sh --env docker --target 'TS001' --target 'TS005'
```

## 📂 Report Structure

```
qa/reports/html/
├── test-report-20231205_123045.html         # Test execution report
├── test-report-20231205_123045.json         # Raw test data
├── traceability-matrix-20231205_123045.html # TM report
├── traceability-matrix-20231205_123045.json # Raw TM data
└── test-report-latest.json                  # Latest test data (for TM)
```

## 🐞 Troubleshooting

### Issue: Service image not found

**Solution:**
```bash
cd /path/to/project
docker-compose build service
```

### Issue: Port already in use

**Solution:**
```bash
# Stop any running containers
docker-compose down
cd qa
docker-compose -f docker-compose.qa.yml down

# Check for rogue containers
docker ps
docker stop <container-id>
```

### Issue: Tests failing due to service not ready

The script includes a 5-second wait time. If tests still fail:

1. Increase wait time in `qa/scripts/docker-run-tests.sh`:
   ```bash
   sleep 10  # Instead of sleep 5
   ```

2. Check service health:
   ```bash
   docker-compose -f docker-compose.qa.yml ps
   ```

### Issue: Reports not generated

Check that the `reports` directory is mounted:

```bash
# Verify volume mount
docker-compose -f docker-compose.qa.yml config
```

Should show:
```yaml
volumes:
  - ./reports:/qa/reports
```

## 📝 Examples

### Example 1: Daily Full Regression

```bash
#!/bin/bash
# daily-regression.sh
cd qa
./scripts/run-tests.sh --env docker
```

### Example 2: Smoke Test (Key Tests)

```bash
#!/bin/bash
# smoke-test.sh
cd qa
./scripts/run-tests.sh --env docker --target 'TS001' --target 'TS005'
```

### Example 3: Profile Service Tests Only

```bash
#!/bin/bash
# profile-tests.sh
cd qa
./scripts/run-tests.sh --env docker --target 'identity'
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: QA Tests

on: [push, pull_request]

jobs:
  qa-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Build service
        run: docker-compose build service
      
      - name: Run QA tests
        run: |
          cd qa
          ./scripts/run-tests.sh --env docker
      
      - name: Upload reports
        uses: actions/upload-artifact@v2
        with:
          name: qa-reports
          path: qa/reports/html/*.html
```

### Jenkins Example

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'docker-compose build service'
            }
        }
        
        stage('QA Tests') {
            steps {
                dir('qa') {
                    sh './scripts/run-tests.sh --env docker'
                }
            }
        }
        
        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'qa/reports/html/*.html', fingerprint: true
                publishHTML([
                    reportDir: 'qa/reports/html',
                    reportFiles: 'test-report-*.html',
                    reportName: 'QA Test Report'
                ])
            }
        }
    }
}
```

## 📚 Related Documentation

- [QA README](./README.md) - Main QA documentation
- [Selective Test Execution](./SELECTIVE_TEST_EXECUTION.md) - Selective testing guide
- [TM Automation](./TM_AUTOMATION_IMPLEMENTATION.md) - Traceability Matrix details

## 🤝 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Docker logs: `docker-compose -f docker-compose.qa.yml logs`
3. Check service health: `docker ps`

---

**Last Updated:** December 2024  
**Version:** 1.0.0
