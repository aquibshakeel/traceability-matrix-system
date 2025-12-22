# ⚙️ Configuration Guide

**Version:** 6.3.0  
**Last Updated:** December 22, 2025  
**Prerequisites:** [Getting Started](GETTING_STARTED.md)

---

## 📖 Overview

Complete reference for all configuration options.

**Topics:**
- AI provider setup
- Service configuration
- External repositories
- Report customization
- Pre-commit hooks

---

## 📂 Configuration File

**Location:** `.traceability/config.json`

**Basic Structure:**
```json
{
  "services": [
    {
      "name": "service-name",
      "enabled": true,
      "path": "./path/to/service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java"
    }
  ],
  "ai": {
    "provider": "anthropic",
    "model": "auto",
    "temperature": 0.3,
    "maxTokens": 2000
  }
}
```

---

## 🤖 AI Provider

### Supported Providers

| Provider | Models | API Key Variable |
|----------|--------|------------------|
| **Anthropic** | Claude 4.5/3.7/3.5 Sonnet | `CLAUDE_API_KEY` |
| **OpenAI** | GPT-4 Turbo/GPT-4/GPT-3.5 | `OPENAI_API_KEY` |

### Configuration

```json
{
  "ai": {
    "provider": "anthropic",
    "model": "auto",
    "temperature": 0.3,
    "maxTokens": 2000
  }
}
```

**Fields:**
- `provider`: `"anthropic"` (default) or `"openai"`
- `model`: `"auto"` (recommended) or specific model name
- `temperature`: `0.0-1.0` (0.3 recommended for analysis)
- `maxTokens`: `1000-8000` (2000 recommended)

### API Keys

**Set via environment:**
```bash
# Claude (recommended)
export CLAUDE_API_KEY="sk-ant-your-key"

# Or OpenAI
export OPENAI_API_KEY="sk-your-key"
export AI_PROVIDER="openai"
```

**Make permanent:**
```bash
echo 'export CLAUDE_API_KEY="sk-ant-your-key"' >> ~/.bashrc
source ~/.bashrc
```

**Or use .env file:**
```bash
CLAUDE_API_KEY=sk-ant-your-key
AI_PROVIDER=anthropic
AI_TEMPERATURE=0.3
```

### Priority Order

1. Environment variables (highest)
2. Config file
3. Defaults (lowest)

---

## 🏢 Service Configuration

### Single Service

```json
{
  "services": [{
    "name": "customer-service",
    "enabled": true,
    "path": "./services/customer-service",
    "language": "java",
    "testFramework": "junit",
    "testDirectory": "src/test/java",
    "testPattern": "*Test.java"
  }]
}
```

### Multiple Services

```json
{
  "services": [
    {
      "name": "customer-service",
      "language": "java",
      "testFramework": "junit",
      "testPattern": "*Test.java"
    },
    {
      "name": "identity-service",
      "language": "typescript",
      "testFramework": "jest",
      "testPattern": "*.test.ts"
    },
    {
      "name": "payment-service",
      "enabled": false,  // Temporarily disabled
      "language": "python",
      "testFramework": "pytest",
      "testPattern": "test_*.py"
    }
  ]
}
```

### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ | Service identifier |
| `enabled` | ✅ | Analyze this service? |
| `path` | ✅ | Service directory |
| `language` | ✅ | `java`/`typescript`/`python`/`go` |
| `testFramework` | ✅ | `junit`/`jest`/`pytest`/`go test` |
| `testDirectory` | ✅ | Test location |
| `testPattern` | ✅ | Test file pattern |
| `apiSpec` | ❌ | Swagger/OpenAPI file (optional) |
| `baselineFile` | ❌ | Custom baseline path (optional) |

### Language Templates

**Java:**
```json
{
  "language": "java",
  "testFramework": "junit",
  "testDirectory": "src/test/java",
  "testPattern": "*Test.java"
}
```

**TypeScript:**
```json
{
  "language": "typescript",
  "testFramework": "jest",
  "testDirectory": "src/__tests__",
  "testPattern": "*.test.ts"
}
```

**Python:**
```json
{
  "language": "python",
  "testFramework": "pytest",
  "testDirectory": "tests",
  "testPattern": "test_*.py"
}
```

**Go:**
```json
{
  "language": "go",
  "testFramework": "go test",
  "testDirectory": ".",
  "testPattern": "*_test.go"
}
```

---

## 🔗 External Repositories

### CLI Arguments (v6.3.0) 🆕

**Most flexible - pass paths directly:**

```bash
npm run continue -- customer-service \
  --service-path=/path/to/service \
  --baseline-path=/path/to/baseline.yml
```

**Benefits:** No config changes, perfect for CI/CD

### Environment Variables

**Shared paths:**
```bash
export SERVICE_PATH=/path/to/services-repo
export TEST_SCENARIO_PATH=/path/to/scenarios/baseline
```

**Per-service paths:**
```bash
export CUSTOMER_SERVICE_PATH=/path/to/customer-service
export CUSTOMER_SERVICE_BASELINE=/path/to/customer-baseline.yml
```

### Path Resolution Priority

```
1. Per-service env vars     (highest)
2. Shared env vars
3. Config file paths
4. Defaults                 (lowest)
```

### Example Setup

**Directory structure:**
```
/repos/
├── services/              # Dev repo
│   ├── customer-service/
│   └── identity-service/
├── qa-scenarios/          # QA repo
│   └── baseline/
│       ├── customer-baseline.yml
│       └── identity-baseline.yml
└── traceability/          # This tool
    └── .traceability/
```

**Configuration:**
```bash
export SERVICE_PATH=/repos/services
export TEST_SCENARIO_PATH=/repos/qa-scenarios/baseline
```

---

## 📊 Reporting

### Configuration

```json
{
  "reporting": {
    "autoOpen": true,
    "formats": ["html", "json", "csv", "markdown"],
    "outputDir": ".traceability/reports"
  }
}
```

### Options

- `autoOpen`: Auto-open HTML report (`true`/`false`)
- `formats`: Report types to generate
- `outputDir`: Output directory

### Environment Overrides

```bash
export AUTO_OPEN_REPORTS=false  # Disable auto-open
export REPORT_FORMATS="json"    # Only JSON
```

---

## 🔨 Pre-Commit Hooks

### Configuration

```json
{
  "preCommit": {
    "enabled": false,
    "blockOnP0Gaps": true,
    "blockOnP1Gaps": false
  }
}
```

### Options

- `enabled`: Enable pre-commit hook
- `blockOnP0Gaps`: Block commit if P0 gaps exist (recommended: `true`)
- `blockOnP1Gaps`: Block commit if P1 gaps exist
- `skipGitDetection`: Skip Git change detection

### Installation

```bash
npm run install:hooks
```

### Bypass Once

```bash
git commit --no-verify -m "message"
```

---

## 🌍 Environment Variables

### Core Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_API_KEY` | Anthropic API key | - |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `AI_PROVIDER` | Provider to use | `anthropic` |
| `AI_MODEL` | Specific model | `auto` |
| `AI_TEMPERATURE` | Creativity (0-1) | `0.3` |
| `AI_MAX_TOKENS` | Max response | `2000` |
| `VERBOSE` | Verbose logging | `false` |
| `AUTO_OPEN_REPORTS` | Auto-open HTML | `true` |

### Service Paths

| Variable | Description |
|----------|-------------|
| `SERVICE_PATH` | Shared service path |
| `TEST_SCENARIO_PATH` | Shared baseline path |
| `{SERVICE}_PATH` | Per-service path |
| `{SERVICE}_BASELINE` | Per-service baseline |

---

## 🎨 Advanced Examples

### Development Environment

```json
{
  "ai": {
    "model": "claude-3-5-sonnet-latest",
    "temperature": 0.5,
    "maxTokens": 1000
  }
}
```

### Production Environment

```json
{
  "ai": {
    "model": "claude-4.5-sonnet-latest",
    "temperature": 0.0,
    "maxTokens": 4000
  }
}
```

### CI/CD Environment

```json
{
  "reporting": {
    "autoOpen": false,
    "formats": ["json"]
  },
  "preCommit": {
    "enabled": false
  }
}
```

---

## ✅ Validation

### Verify Configuration

```bash
# Validate JSON
node -e "require('./.traceability/config.json')"

# Check paths
ls -la ./services/customer-service
```

### Check Environment

```bash
# Show AI variables
env | grep -E "(CLAUDE|OPENAI|AI_)"

# Verify API key
echo $CLAUDE_API_KEY | head -c 10  # Should show "sk-ant-"
```

---

## 🔧 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Config not found | `mkdir -p .traceability && cp config.example.json .traceability/config.json` |
| Invalid JSON | Validate with `node -e "require('./.traceability/config.json')"` |
| API key not recognized | Check format: `sk-ant-` (Claude) or `sk-` (OpenAI) |
| Path not found | Use absolute paths: `export PATH=$(realpath ./service)` |

For detailed troubleshooting, see [Troubleshooting Guide](TROUBLESHOOTING.md).

---

## 📚 Related Documentation

- **[Getting Started](GETTING_STARTED.md)** - Setup guide
- **[Reports Guide](REPORTS_GUIDE.md)** - Understanding reports
- **[QA Guide](QA_GUIDE.md)** - For QA team
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues

---

**Version:** 6.3.0 | **Status:** Production Ready ✅
