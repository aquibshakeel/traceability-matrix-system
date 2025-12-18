# 🎯 CLI Path Arguments - Dynamic Path Specification

## Overview

You can now pass service and baseline paths directly in the command line, giving you **complete flexibility** without needing `.env` files or config changes.

## Usage

```bash
npm run continue <service-name> --service-path=<path> --baseline-path=<path>
```

## Priority Hierarchy (5 Tiers)

The system checks paths in this order:

1. **CLI Arguments** (HIGHEST - overrides everything)
2. **Per-Service Environment Variables** (`IDENTITY_SERVICE_PATH`, `IDENTITY_SERVICE_BASELINE`)
3. **Shared Environment Variables** (`SERVICE_PATH`, `TEST_SCENARIO_PATH`)
4. **Config File** (`.traceability/config.json`)
5. **Default** (local `services/` directory)

---

## Examples

### Example 1: Analyze Any Service/Baseline Dynamically

```bash
# Analyze identity-service with custom paths
npm run continue identity-service \
  --service-path=/Users/you/projects/my-services/identity-service \
  --baseline-path=/Users/you/qa-repo/identity-baseline.yml
```

### Example 2: Test Different Baseline Versions

```bash
# Test against v1 baseline
npm run continue customer-service \
  --service-path=/Users/you/services/customer-service \
  --baseline-path=/Users/you/baselines/v1/customer-baseline.yml

# Test against v2 baseline
npm run continue customer-service \
  --service-path=/Users/you/services/customer-service \
  --baseline-path=/Users/you/baselines/v2/customer-baseline.yml
```

### Example 3: CI/CD Integration

```bash
#!/bin/bash
# ci-test-coverage.sh

SERVICE_NAME=$1
SERVICE_DIR="/workspace/services/${SERVICE_NAME}"
BASELINE_FILE="/workspace/qa-scenarios/${SERVICE_NAME}-baseline.yml"

# Run analysis with dynamic paths
npm run continue ${SERVICE_NAME} \
  --service-path=${SERVICE_DIR} \
  --baseline-path=${BASELINE_FILE}
```

### Example 4: Cross-Repo Testing

```bash
# Test service from repo A against baseline from repo B
npm run continue payment-service \
  --service-path=/Users/you/repo-a/payment-service \
  --baseline-path=/Users/you/repo-b/payment-baseline.yml
```

### Example 5: Override Just One Path

```bash
# Use env vars for service, but override baseline
export SERVICE_PATH=/Users/you/services
npm run continue identity-service \
  --baseline-path=/Users/you/custom-baseline.yml

# CLI baseline overrides env/config, service uses SERVICE_PATH
```

---

## Benefits

### ✅ **Maximum Flexibility**
- No need to edit `.env` or config files
- Test any combination of service + baseline
- Perfect for ad-hoc analysis

### ✅ **CI/CD Friendly**
- Pass paths as build parameters
- No file changes in CI pipeline
- Works with any CI system (Jenkins, GitHub Actions, GitLab CI)

### ✅ **Multi-Environment Testing**
```bash
# Dev environment
npm run continue my-service \
  --service-path=/dev/services/my-service \
  --baseline-path=/dev/baselines/my-baseline.yml

# Staging environment  
npm run continue my-service \
  --service-path=/staging/services/my-service \
  --baseline-path=/staging/baselines/my-baseline.yml

# Production environment
npm run continue my-service \
  --service-path=/prod/services/my-service \
  --baseline-path=/prod/baselines/my-baseline.yml
```

### ✅ **A/B Testing Baselines**
```bash
# Test current implementation against proposed baseline changes
npm run continue api-service \
  --service-path=/current/api-service \
  --baseline-path=/proposed/api-baseline-v2.yml
```

---

## Command Syntax

### Full Syntax
```bash
node bin/ai-continue <service-name> [--service-path=<path>] [--baseline-path=<path>]
```

### Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `<service-name>` | Yes | Service to analyze | `identity-service` |
| `--service-path=` | No | Path to service directory | `--service-path=/path/to/service` |
| `--baseline-path=` | No | Path to baseline YAML file | `--baseline-path=/path/to/baseline.yml` |

### Notes
- Paths can be **absolute** or **relative**
- If path doesn't exist, system will show clear error
- CLI arguments **override all other sources** (ENV, config, defaults)

---

## Real-World Scenarios

### Scenario 1: QA Testing New Baseline

**Problem:** QA created a new baseline and wants to test coverage before committing

**Solution:**
```bash
npm run continue customer-service \
  --baseline-path=/Users/qa/drafts/customer-baseline-draft.yml
# Service path from ENV, baseline from CLI argument
```

### Scenario 2: Developer Testing Branch

**Problem:** Developer working on feature branch wants to test against main branch baseline

**Solution:**
```bash
npm run continue payment-service \
  --service-path=/Users/dev/feature-branch/payment-service \
  --baseline-path=/Users/dev/main-branch/payment-baseline.yml
```

### Scenario 3: Automated Testing Pipeline

**Problem:** CI/CD needs to test multiple services with different paths

**Solution:**
```bash
# Jenkins/GitHub Actions script
for service in identity customer payment; do
  npm run continue ${service} \
    --service-path=${WORKSPACE}/services/${service} \
    --baseline-path=${WORKSPACE}/qa-scenarios/${service}-baseline.yml
done
```

### Scenario 4: External Auditor

**Problem:** Security auditor needs to analyze services without modifying configs

**Solution:**
```bash
npm run continue auth-service \
  --service-path=/tmp/audit/auth-service \
  --baseline-path=/tmp/audit/security-baseline.yml
# No config changes, temporary paths
```

---

## Migration Guide

### From .env to CLI Arguments

**Before (.env approach):**
```bash
# .env
IDENTITY_SERVICE_PATH=/path/to/service
IDENTITY_SERVICE_BASELINE=/path/to/baseline.yml

# Run
npm run continue identity-service
```

**After (CLI approach):**
```bash
# No .env needed - pass directly
npm run continue identity-service \
  --service-path=/path/to/service \
  --baseline-path=/path/to/baseline.yml
```

**Or Hybrid (best of both):**
```bash
# Keep .env for defaults
# Override when needed
npm run continue identity-service \
  --baseline-path=/path/to/custom-baseline.yml
# Uses IDENTITY_SERVICE_PATH from .env
# Uses CLI argument for baseline
```

---

## Troubleshooting

### Path Not Found

**Error:**
```
❌ ERROR: Service path not found: /wrong/path
```

**Solution:**
```bash
# Check path exists
ls -la /path/to/service

# Use absolute path
npm run continue my-service \
  --service-path=/Users/you/services/my-service
```

### Invalid Baseline

**Error:**
```
❌ ERROR: Baseline not found: /wrong/baseline.yml
```

**Solution:**
```bash
# Verify file exists
cat /path/to/baseline.yml

# Check file name matches service
npm run continue identity-service \
  --baseline-path=/path/identity-service-baseline.yml
```

---

## System Behavior

### What Gets Logged

When you use CLI arguments, the system shows:

```bash
📁 Path Configuration:
   Services: /Users/you/pulse-services (ENV: SERVICE_PATH)
   Scenarios: /Users/you/qa-test-scenario/baseline (ENV: TEST_SCENARIO_PATH)
   Reports: ./.traceability/reports/ (always local)

🎯 CLI Overrides (Highest Priority):
   Service Path: /custom/service/path (--service-path)
   Baseline Path: /custom/baseline.yml (--baseline-path)
```

### Priority Verification

To verify which path is being used:

```bash
# System logs show priority used
npm run continue identity-service \
  --service-path=/cli/path \
  --baseline-path=/cli/baseline.yml

# Output shows:
# 🎯 CLI Overrides (Highest Priority):
#    Service Path: /cli/path (--service-path)
#    Baseline Path: /cli/baseline.yml (--baseline-path)
```

---

## Best Practices

### 1. Use CLI for Ad-Hoc Analysis
```bash
# Quick test of new baseline
npm run continue my-service --baseline-path=/tmp/new-baseline.yml
```

### 2. Use ENV for Standard Setup
```bash
# .env for daily work
SERVICE_PATH=/Users/you/services
TEST_SCENARIO_PATH=/Users/you/baselines

# CLI only when needed
npm run continue special-service --service-path=/special/path
```

### 3. Use Config for Team Defaults
```json
// .traceability/config.json - team defaults
{
  "externalPaths": {
    "servicesRoot": "/team/shared/services",
    "testCasesRoot": "/team/shared/baselines"
  }
}
```

### 4. Document CI/CD Usage
```yaml
# .github/workflows/coverage.yml
- name: Analyze Coverage
  run: |
    npm run continue ${{ matrix.service }} \
      --service-path=${{ github.workspace }}/services/${{ matrix.service }} \
      --baseline-path=${{ github.workspace }}/qa-scenarios/${{ matrix.service }}-baseline.yml
```

---

## Summary

**CLI path arguments give you:**
- ✅ Complete flexibility
- ✅ No config file changes needed
- ✅ Perfect for CI/CD
- ✅ Easy A/B testing
- ✅ Multi-environment support
- ✅ Override any path on demand

**Priority Order:**
```
CLI Arguments (--service-path, --baseline-path)
    ↓ (if not provided)
Per-Service ENV (IDENTITY_SERVICE_PATH, IDENTITY_SERVICE_BASELINE)
    ↓ (if not set)
Shared ENV (SERVICE_PATH, TEST_SCENARIO_PATH)
    ↓ (if not set)
Config File (.traceability/config.json)
    ↓ (if not set)
Default (./services/, ./.traceability/test-cases/)
```

**Version:** v6.4.0 (CLI Path Arguments Feature)  
**Status:** ✅ Production Ready
