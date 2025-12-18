# 🚀 Complete CLI Path Arguments Workflow

## Overview

Both `ai-generate` and `ai-continue` now support CLI path arguments, allowing you to work with services and baselines from any location.

---

## 📊 Two-Step Workflow

### **Step 1: Generate AI Cases**
```bash
npm run generate <service-name> --service-path=<path-to-service>
```

### **Step 2: Analyze Coverage**
```bash
npm run continue <service-name> \
  --service-path=<path-to-service> \
  --baseline-path=<path-to-baseline.yml>
```

---

## 🎯 Complete Example

### **Scenario: External Service & Baseline**

```bash
# Step 1: Generate AI test suggestions
npm run generate identity-service \
  --service-path=/Users/you/external-services/identity-service

# This creates: .traceability/ai_cases/identity-service-ai.yml

# Step 2: Analyze coverage
npm run continue identity-service \
  --service-path=/Users/you/external-services/identity-service \
  --baseline-path=/Users/you/qa-scenarios/identity-baseline.yml

# This generates reports with AI suggestions included
```

---

## 📝 Command Reference

### **ai-generate**

**Syntax:**
```bash
npm run generate <service-name> [--service-path=<path>]
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `<service-name>` | Yes | Service to generate cases for |
| `--service-path=` | No | Path to service directory |

**Examples:**
```bash
# With CLI path
npm run generate identity-service \
  --service-path=/custom/path/identity-service

# Without CLI path (uses ENV/config/default)
npm run generate identity-service
```

---

### **ai-continue**

**Syntax:**
```bash
npm run continue <service-name> [--service-path=<path>] [--baseline-path=<path>]
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `<service-name>` | Yes | Service to analyze |
| `--service-path=` | No | Path to service directory |
| `--baseline-path=` | No | Path to baseline YAML file |

**Examples:**
```bash
# Override both paths
npm run continue identity-service \
  --service-path=/custom/services/identity-service \
  --baseline-path=/custom/baselines/identity-baseline.yml

# Override just baseline
npm run continue identity-service \
  --baseline-path=/tmp/test-baseline.yml

# No overrides (uses ENV/config/default)
npm run continue identity-service
```

---

## 🔄 Complete Workflows

### **Workflow 1: First-Time Setup**

```bash
# 1. Set API key
export CLAUDE_API_KEY="sk-ant-..."

# 2. Generate AI cases
npm run generate identity-service \
  --service-path=/Users/you/services/identity-service

# 3. Review AI cases
cat .traceability/ai_cases/identity-service-ai.yml

# 4. Run analysis
npm run continue identity-service \
  --service-path=/Users/you/services/identity-service \
  --baseline-path=/Users/you/qa/identity-baseline.yml

# 5. Check reports
open .traceability/reports/identity-service-report.html
```

---

### **Workflow 2: Testing New Baseline**

```bash
# QA created new baseline, test before committing
npm run continue customer-service \
  --baseline-path=/Users/qa/draft/customer-baseline-v2.yml

# Service path from ENV, baseline from CLI
# AI cases already exist from previous run
```

---

### **Workflow 3: CI/CD Pipeline**

```bash
#!/bin/bash
# ci-pipeline.sh

export CLAUDE_API_KEY="${CI_CLAUDE_API_KEY}"

SERVICES="identity customer payment"

for service in $SERVICES; do
  echo "Processing $service..."
  
  # Step 1: Generate AI cases
  npm run generate $service \
    --service-path=${WORKSPACE}/services/$service
  
  # Step 2: Analyze coverage
  npm run continue $service \
    --service-path=${WORKSPACE}/services/$service \
    --baseline-path=${WORKSPACE}/qa-scenarios/${service}-baseline.yml
  
  # Check exit code
  if [ $? -ne 0 ]; then
    echo "❌ Coverage check failed for $service"
    exit 1
  fi
done

echo "✅ All services passed"
```

---

### **Workflow 4: Multi-Environment Testing**

```bash
# Test same service against different environments

# Development
npm run generate api-service \
  --service-path=/dev/services/api-service
npm run continue api-service \
  --service-path=/dev/services/api-service \
  --baseline-path=/dev/baselines/api-baseline.yml

# Staging
npm run generate api-service \
  --service-path=/staging/services/api-service
npm run continue api-service \
  --service-path=/staging/services/api-service \
  --baseline-path=/staging/baselines/api-baseline.yml
```

---

## 🎯 Why Two Commands?

### **ai-generate**
- Scans service APIs from Swagger/code
- Generates comprehensive test scenarios
- Uses AI to suggest scenarios based on API spec
- **Output:** `.traceability/ai_cases/` (stored locally)

### **ai-continue**
- Loads baseline scenarios (QA-approved test cases)
- Loads AI-generated suggestions
- Compares baseline vs unit tests
- Identifies gaps and orphans
- Shows AI suggestions in reports
- **Output:** `.traceability/reports/` (HTML, JSON, CSV, MD)

---

## 📁 File Locations

### **Input Files** (can be external)
```
/Users/you/
├── services/                    ← External services repo
│   └── identity-service/        ← --service-path points here
│       ├── src/
│       └── test/
│
└── qa-scenarios/                ← External QA repo
    └── baseline/                ← --baseline-path points here
        └── identity-baseline.yml
```

### **Output Files** (always local in framework)
```
/Users/you/traceability-matrix-system/
└── .traceability/
    ├── ai_cases/                ← AI-generated suggestions
    │   └── identity-service-ai.yml
    │
    └── reports/                 ← Generated reports
        ├── identity-service-report.html
        ├── identity-service-report.json
        ├── identity-service-report.csv
        └── identity-service-report.md
```

---

## 🔍 Verification

### **Check AI Cases Generated**
```bash
ls -la .traceability/ai_cases/
# Should see: identity-service-ai.yml
```

### **Check Reports Include AI Suggestions**
```bash
# Open HTML report
open .traceability/reports/identity-service-report.html

# Look for section: "AI-Powered Analysis (from API Spec)"
# Should show suggested scenarios marked with 🆕
```

---

## ❓ Troubleshooting

### **AI Suggestions Not Showing in Report**

**Problem:**
```
AI SUGGESTION
📊 Coverage Assessment:
❌ Critical gaps! Only 0.0% covered.
```

**Solution:**
Run `ai-generate` first to create AI cases:
```bash
npm run generate identity-service \
  --service-path=/Users/you/services/identity-service
```

---

### **"Service path not found" Error**

**Problem:**
```
❌ Failed: Service path not found
```

**Solutions:**

1. **Check path exists:**
```bash
ls -la /Users/you/services/identity-service
```

2. **Use absolute path:**
```bash
# Good
--service-path=/Users/you/services/identity-service

# Bad (relative paths may not work)
--service-path=../services/identity-service
```

3. **Check service structure:**
```bash
# Service must have src/ directory
ls -la /Users/you/services/identity-service/src
```

---

### **"Baseline not found" Error**

**Problem:**
```
❌ ERROR: Baseline not found: identity-service-baseline.yml
```

**Solutions:**

1. **Use full path:**
```bash
--baseline-path=/Users/you/qa-scenarios/baseline/identity-service-baseline.yml
```

2. **Check file name matches:**
```bash
# Must be: <service-name>-baseline.yml
ls /Users/you/qa-scenarios/baseline/ | grep identity
```

---

## 📊 Priority System

Both commands respect the same 5-tier priority:

```
1. CLI Arguments (--service-path, --baseline-path)  ← HIGHEST
      ↓
2. Per-Service ENV (IDENTITY_SERVICE_PATH, IDENTITY_SERVICE_BASELINE)
      ↓
3. Shared ENV (SERVICE_PATH, TEST_SCENARIO_PATH)
      ↓
4. Config File (.traceability/config.json)
      ↓
5. Default (./services/, ./.traceability/test-cases/)  ← LOWEST
```

---

## ✅ Best Practices

### **1. Generate First, Analyze Second**
```bash
# Always run in this order:
npm run generate <service> --service-path=<path>
npm run continue <service> --service-path=<path> --baseline-path=<path>
```

### **2. Use ENV for Repeated Work**
```bash
# If always using same paths, set ENV variables:
export SERVICE_PATH=/Users/you/services
export TEST_SCENARIO_PATH=/Users/you/qa-scenarios/baseline

# Then just:
npm run generate identity-service
npm run continue identity-service
```

### **3. Use CLI for One-Off Tests**
```bash
# Testing new service location:
npm run generate new-service --service-path=/tmp/new-service
npm run continue new-service \
  --service-path=/tmp/new-service \
  --baseline-path=/tmp/new-baseline.yml
```

### **4. Commit AI Cases (Optional)**
```bash
# AI cases can be committed to track suggestions over time
git add .traceability/ai_cases/
git commit -m "chore: Update AI test suggestions"
```

---

## 🎉 Summary

**Complete Feature:**
- ✅ `ai-generate` supports `--service-path`
- ✅ `ai-continue` supports `--service-path` and `--baseline-path`
- ✅ AI suggestions appear in reports
- ✅ Both commands work with external repos
- ✅ 5-tier priority system
- ✅ Fully tested and documented

**Version:** v6.4.0  
**Status:** 🟢 Production Ready  
**Date:** December 18, 2025
