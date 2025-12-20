# 🚀 Getting Started with AI-Driven Test Coverage System

**Version:** 6.3.0  
**Last Updated:** December 20, 2025  
**Difficulty:** Beginner  
**Time to Complete:** 15 minutes

---

## 📖 What You'll Learn

By the end of this guide, you will:
- ✅ Understand what this system does and why it matters
- ✅ Install and configure the system on your machine
- ✅ Run your first AI-powered coverage analysis
- ✅ Understand the generated reports
- ✅ Know where to go next for advanced features

---

## 🎯 What Is This System?

### The Problem

As a development team, you face these challenges:
- **Are our unit tests complete?** Do they cover all business scenarios?
- **What's missing?** Which critical scenarios lack tests?
- **Do tests match requirements?** Is there traceability between QA scenarios and unit tests?
- **What changed?** Which APIs were modified and need retesting?

### The Solution

This system provides **AI-powered test coverage analysis** that:
1. **Analyzes your codebase** - Scans APIs and unit tests
2. **Compares with QA scenarios** - Matches tests to baseline requirements
3. **Detects gaps** - Identifies missing or incomplete tests with priority levels
4. **Generates premium reports** - Beautiful, interactive HTML dashboards
5. **Tracks trends** - Shows coverage progress over time

### Key Capabilities

- 🤖 **100% AI-Powered** - Uses Claude/OpenAI for intelligent analysis
- 📊 **Premium Reports** - Enterprise-grade visualizations
- 🚀 **Business Journeys** - Tracks end-to-end user workflows
- 📈 **Historical Trends** - 30-day coverage tracking
- 🔍 **Orphan Detection** - Finds tests without scenarios and APIs without tests
- 🎯 **Priority-Based** - P0/P1/P2/P3 gap categorization
- 🔄 **Git Integration** - Detects API changes automatically

---

## 📋 Prerequisites

Before you begin, ensure you have:

### Required

1. **Node.js & npm** (v16 or higher)
   ```bash
   node --version  # Should be v16+
   npm --version   # Should be 7+
   ```

2. **Git** (for change detection)
   ```bash
   git --version
   ```

3. **AI API Key** (at least one)
   - **Option A:** Claude/Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
   - **Option B:** OpenAI API key from [platform.openai.com](https://platform.openai.com)

### Recommended

- **Code Editor** (VS Code, IntelliJ, etc.)
- **Terminal** (bash, zsh, or equivalent)
- **Basic YAML knowledge** (for baseline scenarios)

### Your Project Should Have

- Source code with API endpoints (Java, TypeScript, Python, Go)
- Unit tests (JUnit, Jest, PyTest, etc.)
- (Optional) API specifications (Swagger/OpenAPI)

---

## 🛠 Installation

### Step 1: Clone or Download

```bash
# If you haven't already, get the system
git clone <your-repo-url>
cd traceability-matrix-system
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages.

### Step 3: Build TypeScript

```bash
npm run build
```

This compiles the TypeScript code to JavaScript.

### Verify Installation

```bash
# Check if build was successful
ls dist/index.js  # Should exist
```

---

## 🔑 Configure AI Provider

The system needs an AI provider to analyze your code. Choose one:

### Option 1: Using Claude (Anthropic) - Recommended

```bash
# Set your API key
export CLAUDE_API_KEY="sk-ant-your-api-key-here"

# Verify it's set
echo $CLAUDE_API_KEY
```

**To make it permanent:**
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export CLAUDE_API_KEY="sk-ant-your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### Option 2: Using OpenAI (GPT)

```bash
# Set your API key
export OPENAI_API_KEY="sk-your-api-key-here"

# Configure to use OpenAI
export AI_PROVIDER="openai"

# Verify
echo $OPENAI_API_KEY
echo $AI_PROVIDER
```

### Configuration Priority

The system checks in this order:
1. **Environment Variables** (highest priority)
2. **Config File** (`.traceability/config.json`)
3. **Defaults** (Claude/Anthropic)

---

## ⚙️ Configure Your First Service

### Step 1: Locate Config File

Open `.traceability/config.json` in your editor.

### Step 2: Add Your Service

Replace the example with your service details:

```json
{
  "services": [
    {
      "name": "my-service",
      "enabled": true,
      "path": "./path/to/your/service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java",
      "apiSpec": "src/main/resources/swagger.json"
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

### Configuration Fields Explained

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Service identifier | `"customer-service"` |
| `enabled` | Whether to analyze this service | `true` |
| `path` | Path to service root | `"./services/customer-service"` |
| `language` | Programming language | `"java"`, `"typescript"`, `"python"`, `"go"` |
| `testFramework` | Testing framework | `"junit"`, `"jest"`, `"pytest"` |
| `testDirectory` | Where tests are located | `"src/test/java"` |
| `testPattern` | Test file pattern | `"*Test.java"`, `"*.test.ts"` |
| `apiSpec` | (Optional) API specification | `"swagger.json"` |

### Step 3: Verify Configuration

```bash
# Check if service path exists
ls ./path/to/your/service

# Check if test directory exists
ls ./path/to/your/service/src/test/java
```

---

## 🎬 Your First Analysis

Now you're ready to run your first analysis! This is a **two-phase process**:

### Option 1: Using Config File (Internal Services)

If your services are in the same repo, use the config file approach:

### Phase 1: Generate AI Test Scenarios

First, let the AI analyze your APIs and generate test scenarios:

```bash
npm run generate
```

**What This Does:**
- Scans your API endpoints
- Analyzes API specifications (if provided)
- Uses AI to generate comprehensive test scenarios
- Creates baseline file: `.traceability/test-cases/ai_cases/my-service-ai.yml`

**Expected Output:**
```
🤖 AI Test Case Generation
============================

📝 Analyzing APIs...
✅ Found 5 endpoints

🤖 Generating test scenarios with AI...
✅ POST /api/customers: 12 scenarios generated
✅ GET /api/customers: 10 scenarios generated
✅ GET /api/customers/{id}: 8 scenarios generated

💾 Saved to: .traceability/test-cases/ai_cases/my-service-ai.yml

✨ Generation complete!
```

### Phase 2: Analyze Coverage

Now analyze how well your unit tests cover the scenarios:

```bash
npm run continue
```

---

### Option 2: External Repositories (v6.3.0) 🆕

**NEW in v6.3.0:** Analyze services and scenarios in separate repositories!

This is perfect when:
- Services are in one repo, test scenarios in another
- Multiple teams manage different repositories
- QA scenarios are version-controlled separately

#### Usage

```bash
# Analyze customer-service
npm run continue -- customer-service \
  --service-path=/Users/username/pulse-services/customer-service \
  --baseline-path=/Users/username/qa-test-scenario/baseline/customer-service-baseline.yml

# Analyze identity-service
npm run continue -- identity-service \
  --service-path=/Users/username/pulse-services/identity-service \
  --baseline-path=/Users/username/qa-test-scenario/baseline/identity-service-baseline.yml
```

#### Parameters Explained

| Parameter | Description | Example |
|-----------|-------------|---------|
| `service-name` | Service identifier (first argument) | `customer-service` |
| `--service-path` | Absolute path to service directory | `/Users/username/pulse-services/customer-service` |
| `--baseline-path` | Absolute path to baseline YAML file | `/Users/username/qa-scenarios/customer-service-baseline.yml` |

#### Benefits

✅ **Flexible Architecture** - Services and scenarios in different repos  
✅ **Team Independence** - QA and Dev teams work independently  
✅ **Version Control** - Scenarios versioned separately from code  
✅ **CI/CD Friendly** - Easy to integrate in pipelines  

#### Example Directory Structure

```
/Users/username/
├── pulse-services/              # Dev repo
│   ├── customer-service/
│   │   └── src/test/java/
│   └── identity-service/
│       └── src/test/java/
│
├── qa-test-scenario/            # QA repo
│   └── baseline/
│       ├── customer-service-baseline.yml
│       └── identity-service-baseline.yml
│
└── traceability-matrix-system/  # This tool
    └── .traceability/
        └── reports/             # Reports generated here
```

#### Complete Example

```bash
# Set AI key
export CLAUDE_API_KEY="sk-ant-your-key-here"

# Analyze customer service
npm run continue -- customer-service \
  --service-path=/Users/username/pulse-services/customer-service \
  --baseline-path=/Users/username/qa-test-scenario/baseline/customer-service-baseline.yml

# Output:
# ✅ HTML: .traceability/reports/customer-service-report.html
# ✅ JSON: .traceability/reports/customer-service-report.json
# ✅ CSV: .traceability/reports/customer-service-report.csv
```

#### CLI Arguments Take Priority

When using CLI arguments:
- `--service-path` overrides config file `path`
- `--baseline-path` overrides default baseline location
- Config file settings still used for other options (language, test framework, etc.)

---

**What This Does:**
- Scans your unit tests
- Uses AI to match tests to scenarios
- Detects gaps and orphan tests
- Generates premium HTML report
- Auto-opens report in browser

**Expected Output:**
```
🔍 AI-Powered Coverage Analysis
================================

📊 Analyzing coverage...
✅ Found 25 unit tests

🤖 Matching tests to scenarios...
✅ 15 scenarios fully covered
⚠️  3 scenarios partially covered
❌ 7 scenarios not covered

📝 Generating reports...
✅ HTML: .traceability/reports/my-service-report.html
✅ JSON: .traceability/reports/my-service-report.json
✅ CSV:  .traceability/reports/my-service-report.csv
✅ MD:   .traceability/reports/my-service-report.md

🎉 Analysis complete!
```

---

## 📊 Understanding Your First Report

The HTML report opens automatically. Let's understand each section:

### 1. Executive Summary (Top)

```
60% Coverage
15 ✅ Fully Covered | 3 ⚠️ Partial | 7 ❌ Not Covered
```

This tells you:
- **Overall coverage percentage** - How many scenarios have tests
- **Status breakdown** - Distribution of coverage states

### 2. Coverage Gaps (First Section)

Shows scenarios that need attention, sorted by priority:

```
⚠️ P0 (Critical) - 2 gaps
⚠️ P1 (High) - 3 gaps
⚠️ P2 (Medium) - 2 gaps
```

**What To Do:**
- Focus on **P0 gaps first** - These are critical security/business issues
- Create unit tests for these scenarios

### 3. API Coverage Analysis

Per-endpoint detailed view:

```
POST /api/customers
✅ 8 Fully covered
⚠️ 2 Partially covered
❌ 2 Missing unit tests
```

Shows exactly which scenarios are covered/missing for each API.

### 4. Traceability Matrix

Maps scenarios to actual test files:

```
Scenario: When customer is created with valid data, return 201
✅ Test: testCreateCustomer_WithValidData_Returns201
   File: CustomerControllerTest.java Line: 45
   Confidence: HIGH
```

This proves traceability between requirements and tests.

### 5. Orphan Tests

Tests that exist but aren't linked to any scenario:

```
🔍 11 Orphan Tests Found
💼 8 Business Tests - Need baseline scenarios
🔧 3 Technical Tests - No action needed
```

**What To Do:**
- For **Business Tests**: Add scenarios to baseline YAML
- For **Technical Tests**: Ignore (infrastructure/utility tests)

---

## 🎯 Next Steps

### Immediate Actions

1. **Review P0 Gaps**
   ```bash
   # Open the HTML report
   open .traceability/reports/my-service-report.html
   ```
   - Create unit tests for P0 scenarios first

2. **Add Baseline Scenarios**
   - The AI generated scenarios are in `.traceability/test-cases/ai_cases/`
   - QA should review and create official baseline in `.traceability/test-cases/baseline/`

3. **Run Analysis Regularly**
   ```bash
   # After adding tests, re-analyze
   npm run continue
   ```

### Learning More

Now that you've completed your first analysis, explore:

1. **📖 [Configuration Guide](CONFIGURATION.md)** - All configuration options
2. **📊 [Reports Guide](REPORTS_GUIDE.md)** - Deep dive into reports
3. **👥 [QA Guide](QA_GUIDE.md)** - For QA team members
4. **⚙️ [Developer Guide](DEV_GUIDE.md)** - For developers extending the system
5. **🏗 [Architecture](ARCHITECTURE.md)** - System design and concepts

### Advanced Features

Once comfortable with basics, explore:

- **Business Journeys** - Track end-to-end user workflows
- **Historical Trends** - View coverage over time
- **Git Integration** - Detect API changes automatically
- **CI/CD Integration** - Automate in your pipeline
- **Pre-commit Hooks** - Block commits with P0 gaps

---

## ❓ Troubleshooting

### "Claude API key not set"

```bash
# Solution: Set the environment variable
export CLAUDE_API_KEY="sk-ant-your-key-here"

# Verify
echo $CLAUDE_API_KEY
```

### "No scenarios found"

**Cause:** Baseline file doesn't exist yet

**Solution:** Run generation first
```bash
npm run generate
```

### "Build failed"

**Solution:** Clean and reinstall
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### "Report doesn't open"

**Solution:** Open manually
```bash
open .traceability/reports/my-service-report.html
# Or on Linux
xdg-open .traceability/reports/my-service-report.html
```

### "AI responses are slow"

**This is normal!** AI analysis takes time:
- First run: 2-5 minutes (generating scenarios)
- Subsequent runs: 1-2 minutes (matching only)

---

## 🎓 Common Workflows

### Daily Development Workflow

```bash
# 1. Make code changes
# 2. Add/update unit tests
# 3. Run analysis
npm run continue
# 4. Review report
# 5. Fix gaps if any
```

### QA Workflow

```bash
# 1. Review AI-generated scenarios
cat .traceability/test-cases/ai_cases/my-service-ai.yml

# 2. Create baseline from reviewed scenarios
# Edit: .traceability/test-cases/baseline/my-service-baseline.yml

# 3. Run analysis to check coverage
npm run continue

# 4. Report gaps to dev team
```

### CI/CD Integration

```bash
# In your CI pipeline
npm run continue

# Check exit code
if [ $? -eq 0 ]; then
  echo "Coverage check passed"
else
  echo "Coverage check failed"
  exit 1
fi
```

---

## 📚 Summary

You've learned:
- ✅ What the system does and why it matters
- ✅ How to install and configure it
- ✅ How to run your first analysis
- ✅ How to read and understand reports
- ✅ Where to go for advanced features

### Key Commands to Remember

```bash
npm run generate   # Generate AI test scenarios
npm run continue   # Analyze coverage
npm run build      # Build TypeScript
```

### Important Paths

```
.traceability/
├── config.json                    # Your configuration
├── test-cases/
│   ├── ai_cases/                  # AI-generated scenarios
│   └── baseline/                  # QA-approved scenarios
└── reports/                       # Generated reports
    ├── {service}-report.html      # Main report
    ├── {service}-report.json      # For CI/CD
    └── {service}-report.csv       # For spreadsheets
```

---

## 🚀 Ready to Go Deeper?

Pick your role and continue learning:

- **👨‍💻 Developer?** → Read [Developer Guide](DEV_GUIDE.md)
- **🧪 QA Engineer?** → Read [QA Guide](QA_GUIDE.md)
- **📊 Need Reports?** → Read [Reports Guide](REPORTS_GUIDE.md)
- **⚙️ Configure More?** → Read [Configuration Guide](CONFIGURATION.md)
- **🏗 Understand System?** → Read [Architecture](ARCHITECTURE.md)

---

**Questions or Issues?** Check [Troubleshooting Guide](TROUBLESHOOTING.md) or [FAQ](TROUBLESHOOTING.md#faq)

**Version:** 6.3.0 | **Status:** Production Ready ✅
