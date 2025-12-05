# Docker Testing Guide

Run all QA tests in isolated Docker containers - **identical to local setup**!

## Quick Start

```bash
cd qa

# Run single test case
npm run docker:case HF001

# Run multiple test cases
npm run docker:cases HF001,NF001

# Run test file
npm run docker:file onboarding/ts001

# Run folder
npm run docker:folder onboarding

# Run all tests
npm run docker:all
```

## Command Comparison

| Local Command | Docker Command | Description |
|--------------|----------------|-------------|
| `npm run test:case HF001` | `npm run docker:case HF001` | Run single test |
| `npm run test:cases HF001,NF001` | `npm run docker:cases HF001,NF001` | Run multiple tests |
| `npm run test:file path` | `npm run docker:file path` | Run specific file |
| `npm run test:folder name` | `npm run docker:folder name` | Run folder |
| `npm run test:all` | `npm run docker:all` | Run all tests |

## Features

✅ **Identical to Local Setup**
- Same unified-test-runner.sh script
- Same test execution modes
- Same report generation
- Same traceability matrix

✅ **Docker Benefits**
- Isolated environment (no port conflicts)
- Clean database for each run
- No local dependencies needed
- Automatic service startup/cleanup
- CI/CD ready

✅ **Reports Persist**
- All reports saved to `qa/reports/`
- Accessible from host machine
- Timestamped for tracking

## Architecture

```
┌─────────────┐
│  QA Tests   │
│  Container  │
└──────┬──────┘
       │
┌──────▼──────────────┐
│ Onboarding Service  │
│        +            │
│     MongoDB         │
│        +            │
│  Kafka + Zookeeper  │
└─────────────────────┘
```

## Direct Script Usage

```bash
cd qa
./scripts/docker-test.sh --case HF001
./scripts/docker-test.sh --folder onboarding
./scripts/docker-test.sh --all
```

## Manual Container Management

```bash
cd qa

# Start only services
docker-compose -f docker-compose.qa.yml up -d mongodb zookeeper kafka onboarding-service

# Build test container
docker-compose -f docker-compose.qa.yml build qa-tests

# Run tests manually
docker-compose -f docker-compose.qa.yml run --rm qa-tests npm run test:case HF001

# Stop all
docker-compose -f docker-compose.qa.yml down
```

## View Logs

```bash
# All services
docker-compose -f docker-compose.qa.yml logs -f

# Specific service
docker-compose -f docker-compose.qa.yml logs -f onboarding-service
```

## Troubleshooting

### Clean Everything
```bash
docker-compose -f docker-compose.qa.yml down -v
docker system prune -f
```

### Permission Issues
```bash
chmod -R 777 qa/reports
```

## CI/CD Example

```yaml
name: QA Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Docker Tests
        run: |
          cd qa
          npm run docker:all
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: qa/reports/html/
