# ⚙️ Configuration Guide

**Version:** 6.3.0  
**Last Updated:** December 20, 2025  
**Difficulty:** Intermediate  
**Prerequisites:** [Getting Started Guide](GETTING_STARTED.md)

---

## 📖 Overview

This guide covers all configuration options for the AI-Driven Test Coverage System. You'll learn how to:
- Configure AI providers and models
- Set up multiple services
- Use environment variables effectively
- Configure external repositories
- Customize analysis behavior
- Set up pre-commit hooks

---

## 📂 Configuration File Location

The main configuration file is:
```
.traceability/config.json
```

This JSON file controls all aspects of the system.

---

## 🎯 Basic Configuration Structure

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
  },
  "reporting": {
    "autoOpen": true,
    "formats": ["html", "json", "csv", "markdown"]
  },
  "preCommit": {
    "enabled": false,
    "blockOnP0Gaps": true,
    "blockOnP1Gaps": false
  }
}
```

---

## 🤖 AI Provider Configuration

### Supported Providers

The system supports multiple AI providers:

| Provider | Models Available | API Key |
|----------|-----------------|---------|
| **Anthropic** | Claude 4.5 Sonnet, Claude 3.7, Claude 3.5 | `CLAUDE_API_KEY` |
| **OpenAI** | GPT-4 Turbo, GPT-4, GPT-3.5 | `OPENAI_API_KEY` |

### Configuration Options

```json
{
  "ai": {
    "provider": "anthropic",        // "anthropic" or "openai"
    "model": "auto",                 // "auto" or specific model
    "temperature": 0.3,              // 0.0-1.0 (creativity level)
    "maxTokens": 2000                // Max response length
  }
}
```

### Provider Field Options

**`provider`** - Which AI service to use
- `"anthropic"` - Uses Claude (default, recommended)
- `"openai"` - Uses GPT models

**`model`** - Which specific model to use
- `"auto"` - Automatically selects best available model (recommended)
- Specific models:
  - Anthropic: `"claude-4.5-sonnet-latest"`, `"claude-3-7-sonnet-latest"`, `"claude-3-5-sonnet-latest"`
  - OpenAI: `"gpt-4-turbo"`, `"gpt-4"`, `"gpt-3.5-turbo"`

**`temperature`** - Controls randomness (0.0 = deterministic, 1.0 = creative)
- Recommended: `0.3` for test analysis (balanced)
- Use `0.0` for completely deterministic outputs
- Use `0.5-0.7` for more creative scenario generation

**`maxTokens`** - Maximum response length
- Recommended: `2000` for scenario generation
- Increase to `4000` for complex APIs
- Decrease to `1000` for simple endpoints (faster, cheaper)

### Setting Up API Keys

#### Option 1: Environment Variables (Recommended)

**For Anthropic/Claude:**
```bash
export CLAUDE_API_KEY="sk-ant-api-key-here"
```

**For OpenAI:**
```bash
export OPENAI_API_KEY="sk-openai-key-here"
```

**Make Permanent:**
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export CLAUDE_API_KEY="sk-ant-your-key"' >> ~/.bashrc
source ~/.bashrc
```

#### Option 2: .env File

Create `.env` in project root:
```bash
# AI Provider Configuration
CLAUDE_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-openai-key

# Optional overrides
AI_PROVIDER=anthropic
AI_MODEL=auto
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=2000
```

**Note:** Add `.env` to `.gitignore` to keep keys private!

### Configuration Priority

The system checks settings in this order:
1. **Environment Variables** (highest priority)
2. **Config File** (`.traceability/config.json`)
3. **Defaults**

Example:
```bash
# This overrides config.json
export AI_PROVIDER="openai"
export AI_TEMPERATURE="0.5"
```

### Switching Between Providers

**Quick Switch to OpenAI:**
```bash
# Method 1: Environment variable
export AI_PROVIDER="openai"
export OPENAI_API_KEY="sk-your-key"

# Method 2: Edit config.json
{
  "ai": { "provider": "openai" }
}
```

**Quick Switch Back to Claude:**
```bash
export AI_PROVIDER="anthropic"
# or remove the environment variable
unset AI_PROVIDER
```

---

## 🏢 Service Configuration

### Single Service Example

```json
{
  "services": [
    {
      "name": "customer-service",
      "enabled": true,
      "path": "./services/customer-service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java",
      "apiSpec": "src/main/resources/swagger.json",
      "baselineFile": ".traceability/test-cases/baseline/customer-service-baseline.yml",
      "journeyFile": ".traceability/test-cases/journeys/customer-service-journeys.yml"
    }
  ]
}
```

### Multiple Services Example

```json
{
  "services": [
    {
      "name": "customer-service",
      "enabled": true,
      "path": "./services/customer-service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java"
    },
    {
      "name": "identity-service",
      "enabled": true,
      "path": "./services/identity-service",
      "language": "typescript",
      "testFramework": "jest",
      "testDirectory": "src/__tests__",
      "testPattern": "*.test.ts"
    },
    {
      "name": "payment-service",
      "enabled": false,  // Temporarily disabled
      "path": "./services/payment-service",
      "language": "python",
      "testFramework": "pytest",
      "testDirectory": "tests",
      "testPattern": "test_*.py"
    }
  ]
}
```

### Service Configuration Fields

| Field | Required | Description | Examples |
|-------|----------|-------------|----------|
| `name` | ✅ Yes | Unique service identifier | `"customer-service"` |
| `enabled` | ✅ Yes | Whether to analyze | `true`, `false` |
| `path` | ✅ Yes | Path to service root | `"./services/customer-service"` |
| `language` | ✅ Yes | Programming language | `"java"`, `"typescript"`, `"python"`, `"go"` |
| `testFramework` | ✅ Yes | Testing framework | `"junit"`, `"jest"`, `"pytest"`, `"go test"` |
| `testDirectory` | ✅ Yes | Test location | `"src/test/java"`, `"tests"` |
| `testPattern` | ✅ Yes | Test file pattern | `"*Test.java"`, `"*.test.ts"` |
| `apiSpec` | ❌ No | API specification file | `"swagger.json"`, `"openapi.yaml"` |
| `baselineFile` | ❌ No | Custom baseline path | Custom path to baseline YAML |
| `journeyFile` | ❌ No | Custom journey path | Custom path to journeys YAML |

### Language-Specific Configurations

#### Java Projects

```json
{
  "name": "java-service",
  "language": "java",
  "testFramework": "junit",
  "testDirectory": "src/test/java",
  "testPattern": "*Test.java"
}
```

#### TypeScript/JavaScript Projects

```json
{
  "name": "ts-service",
  "language": "typescript",
  "testFramework": "jest",
  "testDirectory": "src/__tests__",
  "testPattern": "*.test.ts"
}
```

#### Python Projects

```json
{
  "name": "python-service",
  "language": "python",
  "testFramework": "pytest",
  "testDirectory": "tests",
  "testPattern": "test_*.py"
}
```

#### Go Projects

```json
{
  "name": "go-service",
  "language": "go",
  "testFramework": "go test",
  "testDirectory": ".",
  "testPattern": "*_test.go"
}
```

---

## 🔗 External Repository Configuration

For production environments, store services and test scenarios in separate repositories.

### Option 1: CLI Arguments (v6.3.0) 🆕

**NEW:** Pass paths directly via command line - most flexible approach!

```bash
# Analyze with external paths
npm run continue -- customer-service \
  --service-path=/Users/username/pulse-services/customer-service \
  --baseline-path=/Users/username/qa-test-scenario/baseline/customer-service-baseline.yml

# Another example
npm run continue -- identity-service \
  --service-path=/Users/username/pulse-services/identity-service \
  --baseline-path=/Users/username/qa-test-scenario/baseline/identity-service-baseline.yml
```

**Benefits:**
- ✅ No configuration file changes needed
- ✅ Perfect for CI/CD pipelines
- ✅ Override config on-the-fly
- ✅ Different paths per run

### Option 2: Using Environment Variables

**Option 1: Shared Paths (All Services)**
```bash
export SERVICE_PATH=/path/to/services-repo
export TEST_SCENARIO_PATH=/path/to/test-scenarios-repo/baseline
```

**Option 2: Per-Service Paths (Granular Control)**
```bash
# Service paths
export CUSTOMER_SERVICE_PATH=/path/to/services/customer-service
export IDENTITY_SERVICE_PATH=/path/to/services/identity-service

# Baseline paths
export CUSTOMER_SERVICE_BASELINE=/path/to/scenarios/customer-baseline.yml
export IDENTITY_SERVICE_BASELINE=/path/to/scenarios/identity-baseline.yml
```

### Path Resolution Priority

The system resolves paths using a **4-tier fallback system**:

1. **Per-Service Environment Variables** (highest priority)
   - `{SERVICE_NAME}_PATH`
   - `{SERVICE_NAME}_BASELINE`

2. **Shared Environment Variables**
   - `SERVICE_PATH`
   - `TEST_SCENARIO_PATH`

3. **Config File Paths**
   - `config.json` → `services[].path`
   - `config.json` → `services[].baselineFile`

4. **Default Paths** (lowest priority)
   - `./services/{service-name}`
   - `.traceability/test-cases/baseline/{service}-baseline.yml`

### Example Setup

**Directory Structure:**
```
/
├── microservices-repo/           # Services repository
│   ├── customer-service/
│   └── identity-service/
├── qa-scenarios-repo/             # QA repository
│   ├── baseline/
│   │   ├── customer-service-baseline.yml
│   │   └── identity-service-baseline.yml
│   └── journeys/
└── traceability-system/           # This framework
    └── .traceability/config.json
```

**Configuration:**
```bash
# In ~/.bashrc or CI environment
export SERVICE_PATH=/path/to/microservices-repo
export TEST_SCENARIO_PATH=/path/to/qa-scenarios-repo/baseline
```

**Benefits:**
- ✅ Services and QA scenarios in separate repos
- ✅ Different teams can manage their repos independently
- ✅ Framework remains repository-agnostic
- ✅ Easy CI/CD integration

---

## 📊 Reporting Configuration

```json
{
  "reporting": {
    "autoOpen": true,
    "formats": ["html", "json", "csv", "markdown"],
    "outputDir": ".traceability/reports"
  }
}
```

### Reporting Options

**`autoOpen`** - Auto-open HTML report in browser
- `true` - Opens report automatically (default)
- `false` - Report generated but not opened

**`formats`** - Which report formats to generate
- `["html"]` - Only HTML
- `["html", "json"]` - HTML + JSON for CI/CD
- `["html", "json", "csv", "markdown"]` - All formats (default)

**`outputDir`** - Where to save reports
- Default: `".traceability/reports"`
- Custom: `"./reports"` or any path

### Environment Variable Overrides

```bash
# Disable auto-open
export AUTO_OPEN_REPORTS=false

# Generate only JSON for CI
export REPORT_FORMATS="json"
```

---

## 🔨 Pre-Commit Hook Configuration

Automatically run coverage analysis on every commit.

```json
{
  "preCommit": {
    "enabled": false,
    "blockOnP0Gaps": true,
    "blockOnP1Gaps": false,
    "blockOnP2Gaps": false,
    "skipGitDetection": false
  }
}
```

### Pre-Commit Options

**`enabled`** - Enable/disable pre-commit hook
- `false` - Hook disabled (default)
- `true` - Hook runs on every commit

**`blockOnP0Gaps`** - Block commits if P0 gaps exist
- `true` - Commit fails if critical gaps found (recommended)
- `false` - Allow commit with warning

**`blockOnP1Gaps`** - Block commits if P1 gaps exist
- `false` - Allow P1 gaps (default)
- `true` - Block on high priority gaps

**`blockOnP2Gaps`** - Block commits if P2 gaps exist
- `false` - Allow P2 gaps (default)
- `true` - Block on medium priority gaps

**`skipGitDetection`** - Skip Git change detection
- `false` - Detect API changes (default)
- `true` - Skip change detection (faster)

### Installing Pre-Commit Hook

```bash
# Install the hook
npm run install:hooks

# Or manually
chmod +x scripts/pre-commit.sh
ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit
```

### Temporarily Bypass Hook

```bash
# Skip hook for one commit
git commit --no-verify -m "message"
```

---

## 🌍 Environment Variables Reference

### Core Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CLAUDE_API_KEY` | Anthropic API key | - | `sk-ant-...` |
| `ANTHROPIC_API_KEY` | Alias for Claude key | - | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API key | - | `sk-...` |
| `AI_PROVIDER` | AI provider to use | `anthropic` | `openai` |
| `AI_MODEL` | Specific model | `auto` | `gpt-4` |
| `AI_TEMPERATURE` | AI creativity | `0.3` | `0.0-1.0` |
| `AI_MAX_TOKENS` | Max response length | `2000` | `1000-8000` |

### Service Paths

| Variable | Description | Example |
|----------|-------------|---------|
| `SERVICE_PATH` | Shared service path | `/path/to/services` |
| `TEST_SCENARIO_PATH` | Shared baseline path | `/path/to/scenarios/baseline` |
| `{SERVICE}_PATH` | Per-service path | `/path/to/customer-service` |
| `{SERVICE}_BASELINE` | Per-service baseline | `/path/to/customer-baseline.yml` |

### Feature Flags

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VERBOSE` | Verbose logging | `false` | `true` |
| `AUTO_OPEN_REPORTS` | Auto-open HTML | `true` | `false` |
| `SKIP_GIT_DETECTION` | Skip Git changes | `false` | `true` |
| `HEALTH_CHECK_TIMEOUT` | Health check timeout | `5000` | `10000` |

### Setting Multiple Variables

**Bash/Zsh:**
```bash
export CLAUDE_API_KEY="sk-ant-..."
export AI_PROVIDER="anthropic"
export AI_TEMPERATURE="0.3"
export VERBOSE="true"
```

**Windows CMD:**
```cmd
set CLAUDE_API_KEY=sk-ant-...
set AI_PROVIDER=anthropic
```

**Windows PowerShell:**
```powershell
$env:CLAUDE_API_KEY="sk-ant-..."
$env:AI_PROVIDER="anthropic"
```

---

## 🎨 Advanced Configuration

### Custom Baseline Paths

```json
{
  "services": [
    {
      "name": "customer-service",
      "path": "./services/customer-service",
      "baselineFile": "/external/qa-repo/baselines/customer.yml",
      "journeyFile": "/external/qa-repo/journeys/customer-journeys.yml"
    }
  ]
}
```

### Multiple Environments

**Development:**
```json
{
  "ai": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-latest",  // Faster, cheaper
    "temperature": 0.5,
    "maxTokens": 1000
  }
}
```

**Production:**
```json
{
  "ai": {
    "provider": "anthropic",
    "model": "claude-4.5-sonnet-latest",  // Most accurate
    "temperature": 0.0,                    // Deterministic
    "maxTokens": 4000
  }
}
```

### CI/CD Configuration

```json
{
  "reporting": {
    "autoOpen": false,           // Don't open browser in CI
    "formats": ["json"],         // Only JSON for automation
    "outputDir": "./ci-reports"
  },
  "preCommit": {
    "enabled": false,            // Managed by CI
    "blockOnP0Gaps": true
  }
}
```

---

## ✅ Validation

### Verify Configuration

```bash
# Test configuration is valid
node -e "require('./.traceability/config.json')"

# Check if paths exist
ls -la ./services/customer-service
ls -la ./services/customer-service/src/test/java
```

### Check Environment Variables

```bash
# Show all AI-related variables
env | grep -E "(CLAUDE|OPENAI|AI_)"

# Verify API key is set
if [ -z "$CLAUDE_API_KEY" ]; then
  echo "⚠️ CLAUDE_API_KEY not set"
else
  echo "✅ API key configured"
fi
```

---

## 🔧 Troubleshooting

### "Configuration file not found"

**Solution:** Create the config file
```bash
mkdir -p .traceability
cp .traceability/config.example.json .traceability/config.json
```

### "Invalid JSON in config file"

**Solution:** Validate JSON syntax
```bash
# Use online validator or
node -e "JSON.parse(require('fs').readFileSync('.traceability/config.json'))"
```

### "API key not recognized"

**Solution:** Check key format and environment
```bash
# Anthropic keys start with: sk-ant-
# OpenAI keys start with: sk-

echo $CLAUDE_API_KEY | head -c 10  # Should show "sk-ant-"
```

### "Service path not found"

**Solution:** Use absolute paths or verify relative paths
```bash
# Convert to absolute path
export CUSTOMER_SERVICE_PATH=$(realpath ./services/customer-service)
```

---

## 📚 Configuration Examples

### Minimal Configuration

```json
{
  "services": [
    {
      "name": "my-service",
      "enabled": true,
      "path": "./my-service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java"
    }
  ]
}
```

### Full-Featured Configuration

```json
{
  "services": [
    {
      "name": "customer-service",
      "enabled": true,
      "path": "./services/customer-service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java",
      "apiSpec": "src/main/resources/swagger.json",
      "baselineFile": ".traceability/test-cases/baseline/customer-service-baseline.yml",
      "journeyFile": ".traceability/test-cases/journeys/customer-service-journeys.yml"
    }
  ],
  "ai": {
    "provider": "anthropic",
    "model": "auto",
    "temperature": 0.3,
    "maxTokens": 2000
  },
  "reporting": {
    "autoOpen": true,
    "formats": ["html", "json", "csv", "markdown"],
    "outputDir": ".traceability/reports"
  },
  "preCommit": {
    "enabled": true,
    "blockOnP0Gaps": true,
    "blockOnP1Gaps": false,
    "skipGitDetection": false
  }
}
```

---

## 🔗 Related Documentation

- **📖 [Getting Started](GETTING_STARTED.md)** - First-time setup
- **📊 [Reports Guide](REPORTS_GUIDE.md)** - Understanding reports
- **👥 [QA Guide](QA_GUIDE.md)** - For QA team
- **⚙️ [Developer Guide](DEV_GUIDE.md)** - For developers
- **❓ [Troubleshooting](TROUBLESHOOTING.md)** - Common issues

---

**Version:** 6.3.0 | **Status:** Production Ready ✅
