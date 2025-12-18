# Using External Repositories

This guide explains how to configure the traceability system to work with services and test scenarios stored in external repositories.

## Overview

The traceability system supports three-tier path resolution:

1. **Environment Variables** (Highest Priority) - Dynamic, great for CI/CD
2. **Config File** (Medium Priority) - Permanent setup
3. **Default Paths** (Lowest Priority) - Backward compatible

## Quick Start

### Option 1: Environment Variables (Recommended for Testing)

```bash
# Set paths to external repositories
export SERVICE_PATH=/path/to/service-repo
export TEST_SCENARIO_PATH=/path/to/qa-scenarios/baseline

# Run analysis
cd traceability-matrix-system
node bin/ai-continue identity-service
```

### Option 2: Config File (Permanent Setup)

Edit `.traceability/config.json`:

```json
{
  "externalPaths": {
    "servicesRoot": "/absolute/path/to/services",
    "testCasesRoot": "/absolute/path/to/qa-scenarios"
  },
  "services": [
    {
      "name": "identity-service",
      "enabled": true,
      "path": "identity-service",
      "language": "java",
      "testFramework": "junit"
    }
  ]
}
```

### Option 3: Default (No Changes Required)

The system works as before with services in `./services/` and scenarios in `./.traceability/test-cases/baseline/`.

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `SERVICE_PATH` | Path to service repository | `/Users/you/repos/services` |
| `SERVICES_ROOT` | Root directory containing multiple services | `/Users/you/repos/all-services` |
| `TEST_SCENARIO_PATH` | Path to baseline scenarios directory | `/Users/you/repos/qa-scenarios/baseline` |
| `TEST_CASES_ROOT` | Root directory for test cases | `/Users/you/repos/qa-scenarios` |

## Example Scenarios

### Scenario 1: Local Development (No Changes)

```bash
# Current setup - works unchanged
cd traceability-matrix-system
node bin/ai-continue identity-service
```

**Output:**
```
📁 Path Configuration:
   Services: ./services/ (default)
   Scenarios: ./.traceability/test-cases/baseline/ (default)
   Reports: ./.traceability/reports/ (always local)
```

### Scenario 2: External Service Repository

```bash
# Services in separate repo
export SERVICE_PATH=/Users/aquib/repos/pulse-services
cd traceability-matrix-system
node bin/ai-continue identity-service
```

**Output:**
```
📁 Path Configuration:
   Services: /Users/aquib/repos/pulse-services (ENV: SERVICE_PATH)
   Scenarios: ./.traceability/test-cases/baseline/ (default)
   Reports: ./.traceability/reports/ (always local)
```

### Scenario 3: Both External

```bash
# Both services and scenarios external
export SERVICE_PATH=/Users/aquib/repos/pulse-services
export TEST_SCENARIO_PATH=/Users/aquib/repos/qa-scenarios/baseline
cd traceability-matrix-system
node bin/ai-continue identity-service
```

**Output:**
```
📁 Path Configuration:
   Services: /Users/aquib/repos/pulse-services (ENV: SERVICE_PATH)
   Scenarios: /Users/aquib/repos/qa-scenarios/baseline (ENV: TEST_SCENARIO_PATH)
   Reports: ./.traceability/reports/ (always local)
```

### Scenario 4: CI/CD Pipeline

```yaml
# .github/workflows/traceability.yml
name: Traceability Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Service Code
        uses: actions/checkout@v3
        with:
          path: service

      - name: Checkout QA Scenarios
        uses: actions/checkout@v3
        with:
          repository: your-org/qa-test-scenarios
          token: ${{ secrets.GH_PAT }}
          path: scenarios

      - name: Checkout Traceability Engine
        uses: actions/checkout@v3
        with:
          repository: your-org/traceability-matrix-system
          token: ${{ secrets.GH_PAT }}
          path: traceability

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: |
          cd traceability
          npm install

      - name: Run Analysis
        env:
          SERVICE_PATH: ${{ github.workspace }}/service
          TEST_SCENARIO_PATH: ${{ github.workspace }}/scenarios/baseline
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
        run: |
          cd traceability
          node bin/ai-continue identity-service

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: traceability-report
          path: traceability/.traceability/reports/
```

## Repository Structure Examples

### Monorepo Setup

```
workspace/
├── traceability-matrix-system/    # Analysis engine
├── services/                       # All services
│   ├── identity-service/
│   └── customer-service/
└── qa-test-scenarios/             # QA scenarios
    ├── baseline/
    └── ai_cases/
```

**Configuration:**
```bash
export SERVICES_ROOT=/path/to/workspace/services
export TEST_CASES_ROOT=/path/to/workspace/qa-test-scenarios
```

### Separate Repos Setup

```
repos/
├── traceability-matrix-system/    # Engine repo
├── pulse-services/                 # Services repo
│   ├── identity-service/
│   └── customer-service/
└── qa-scenarios/                   # QA repo
    ├── baseline/
    └── ai_cases/
```

**Configuration:**
```bash
export SERVICE_PATH=/path/to/repos/pulse-services
export TEST_SCENARIO_PATH=/path/to/repos/qa-scenarios/baseline
```

## Path Resolution Priority

The system resolves paths in this order:

1. **ENV Variables** → Check `SERVICE_PATH` / `TEST_SCENARIO_PATH`
2. **Config File** → Check `config.externalPaths`
3. **Default** → Use `./services/` and `./.traceability/`

This ensures:
- ✅ Environment variables always win (dynamic override)
- ✅ Config file provides permanent setup
- ✅ Defaults ensure backward compatibility

## Troubleshooting

### Path Not Found Errors

```bash
# Check path resolution
node bin/ai-continue identity-service

# Look for this output:
📁 Path Configuration:
   Services: /your/path (ENV: SERVICE_PATH)
   Scenarios: /your/path (ENV: TEST_SCENARIO_PATH)
```

### Verify Paths Exist

```bash
# Check service path
ls $SERVICE_PATH/identity-service

# Check scenario path
ls $TEST_SCENARIO_PATH/identity-service-baseline.yml
```

### Clear Environment Variables

```bash
# Reset to defaults
unset SERVICE_PATH
unset SERVICES_ROOT
unset TEST_SCENARIO_PATH
unset TEST_CASES_ROOT

# Should use default paths
node bin/ai-continue identity-service
```

## Best Practices

1. **Use ENV for CI/CD** - Dynamic paths per pipeline
2. **Use Config for Team** - Shared setup in config.json
3. **Keep Reports Local** - Always generated in traceability repo
4. **Test Locally First** - Verify paths before CI/CD
5. **Document Your Setup** - Add README in your workspace

## Migration Guide

### Moving from Internal to External

**Step 1:** Test with ENV variables first
```bash
export SERVICE_PATH=/new/location/services
node bin/ai-continue identity-service
```

**Step 2:** If working, update config.json
```json
{
  "externalPaths": {
    "servicesRoot": "/new/location/services"
  }
}
```

**Step 3:** Commit config, remove ENV variables

**Step 4:** Remove old `./services/` directory (optional)

## Support

For issues or questions:
- Check path resolution output in console
- Verify file permissions on external paths
- Ensure paths are absolute, not relative
- Review this guide for common scenarios
