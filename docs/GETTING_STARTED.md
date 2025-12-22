# 🚀 Getting Started Guide

**Version:** 6.3.0 (V2)  
**Last Updated:** December 22, 2025  
**Time to Complete:** 15 minutes  
**Difficulty:** Beginner

---

## 📖 What You'll Learn

In 15 minutes you'll:
- ✅ Install and configure the system
- ✅ Run your first AI-powered analysis
- ✅ Understand the V2 report
- ✅ Know next steps

---

## 🎯 What Is This?

**Problem:** Are your unit tests complete? What's missing? Do tests match requirements?

**Solution:** AI-powered coverage analysis that:
1. Scans your APIs and unit tests
2. Matches tests to QA baseline scenarios
3. Identifies gaps with P0/P1/P2/P3 priorities
4. Generates interactive V2 HTML reports

**Result:** Know exactly what needs testing.

---

## 📋 Prerequisites

**Required:**
- Node.js v16+ (`node --version`)
- Git (`git --version`)
- AI API key (Claude or OpenAI)

**Your Project:**
- APIs (Java/TypeScript/Python/Go)
- Unit tests (JUnit/Jest/PyTest)

---

## 🛠 Installation

### Step 1: Install

```bash
npm install
npm run build
```

### Step 2: Set AI Key

```bash
# Claude (recommended)
export CLAUDE_API_KEY="sk-ant-your-key"

# Or OpenAI
export OPENAI_API_KEY="sk-your-key"
export AI_PROVIDER="openai"
```

**Make it permanent:**
```bash
echo 'export CLAUDE_API_KEY="sk-ant-your-key"' >> ~/.bashrc
source ~/.bashrc
```

---

## ⚙️ Configure Service

Edit `.traceability/config.json`:

```json
{
  "services": [
    {
      "name": "my-service",
      "enabled": true,
      "path": "./path/to/service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java"
    }
  ]
}
```

**Quick Reference:**

| Field | Example | Description |
|-------|---------|-------------|
| `language` | `"java"` | `java` / `typescript` / `python` / `go` |
| `testFramework` | `"junit"` | `junit` / `jest` / `pytest` |
| `testPattern` | `"*Test.java"` | Pattern to match test files |

---

## 🎬 Run Your First Analysis

### Option 1: Config File (Same Repo)

```bash
# Step 1: Generate AI scenarios
npm run generate

# Step 2: Analyze coverage
npm run continue
```

### Option 2: External Repos (CLI)

```bash
# Analyze service from external repo
npm run continue -- customer-service \
  --service-path=/path/to/service \
  --baseline-path=/path/to/baseline.yml
```

**Output:**
```
✅ HTML: .traceability/reports/service-report.html
✅ JSON: .traceability/reports/service-report.json
✅ CSV:  .traceability/reports/service-report.csv
```

Report auto-opens in browser!

---

## 📊 Understanding the V2 Report

The V2 report has **3 focused cards**:

### Card 1: Total Scenarios Panel

**Summary Metrics:**
```
30 Total Baseline | 3 APIs | 60% Coverage | 18 Covered | 12 Gaps
```

**API Coverage Breakdown Table:**
- One row per scenario
- Direct status (✅ Covered / ⚠️ Partial / ❌ Not Covered)
- Test file mapping with line numbers
- Confidence levels (HIGH/MEDIUM/LOW)

**Example Row:**
```
API: POST /identity/login
Scenario: When login with valid credentials, return 200
Status: ✅ COVERED
Test: LoginWithValidReturns200 | IdentityControllerTest Line: 35 HIGH
```

### Card 2: Orphan Unit Tests

Tests without baseline scenarios.

**Categories:**
- 💼 **Business Tests** → QA must add scenarios
- 🔧 **Technical Tests** → No action needed (infrastructure)

**Copy-Ready YAML:**
- Click "📋 Copy YAML" button
- Paste into baseline file
- Re-run analysis

### Card 3: AI Suggested Scenarios

High-priority (P0/P1) AI recommendations.

**Example:**
```
API: POST /identity/login
• 🆕 When multiple failed attempts, implement rate limiting
• 🆕 When SQL injection in password, sanitize safely
```

**These are optional** - review and add if relevant.

---

## 🎯 Take Action

### Priority Guide

**P0 Gaps (Critical)**
- Security issues, data integrity
- **Action:** Fix immediately (this week)

**P1 Gaps (High)**
- Error handling, key features
- **Action:** Current sprint

**P2/P3 Gaps (Medium/Low)**
- Edge cases, enhancements
- **Action:** Future sprints

### Fix a Gap

1. **Find gap in Card 1 table**
   ```
   Scenario: When account locked, return 403
   Status: ❌ NOT COVERED
   ```

2. **Create unit test**
   ```java
   @Test
   public void testLogin_WithLockedAccount_Returns403() {
       // Test implementation
   }
   ```

3. **Re-run analysis**
   ```bash
   npm run continue
   ```

4. **Verify in report** - Should now show ✅ COVERED

### Handle Orphan Tests

**Business Orphans:**
1. Review test code
2. QA creates baseline scenario
3. Re-run analysis

**Technical Orphans:**
- No action needed
- Infrastructure tests are expected

---

## 🔄 Daily Workflow

```bash
# Morning
npm run continue              # Check current coverage
# Review P0/P1 gaps

# During Development
# 1. Make changes
# 2. Add/update tests
npm run continue              # Verify coverage
# 3. Fix gaps

# Before Commit
npm run continue              # Final check
# Ensure no P0 gaps
```

---

## ❓ Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not set" | `export CLAUDE_API_KEY="sk-ant-..."` |
| "No scenarios found" | Run `npm run generate` first |
| "Build failed" | `rm -rf node_modules && npm install && npm run build` |
| "Report doesn't open" | Open manually: `.traceability/reports/*.html` |

---

## 🚀 Next Steps

### Learn More

**By Role:**
- 👨‍💻 Developer → [Developer Guide](DEV_GUIDE.md)
- 🧪 QA Engineer → [QA Guide](QA_GUIDE.md)
- 📊 Reports → [Reports Guide](REPORTS_GUIDE.md)

**By Topic:**
- ⚙️ Configuration → [Configuration Guide](CONFIGURATION.md)
- 🏗 Architecture → [Architecture](ARCHITECTURE.md)
- ❓ Issues → [Troubleshooting](TROUBLESHOOTING.md)

### Advanced Features

- **External Repos** - Services/scenarios in separate repos
- **Historical Trends** - 30-day coverage tracking
- **CI/CD Integration** - Automate in pipelines
- **Pre-commit Hooks** - Block commits with P0 gaps

See [Configuration Guide](CONFIGURATION.md) for setup.

---

## 📚 Key Commands

```bash
npm run generate   # Generate AI scenarios
npm run continue   # Analyze coverage
npm run build      # Build TypeScript
```

## 📁 Important Paths

```
.traceability/
├── config.json              # Configuration
├── test-cases/
│   ├── ai_cases/            # AI-generated
│   └── baseline/            # QA-approved
└── reports/
    └── service-report.html  # V2 dashboard
```

---

## 🎓 What You've Learned

✅ Installation and configuration  
✅ Running first analysis  
✅ Understanding V2 report (3 cards)  
✅ Taking action on gaps  
✅ Daily workflow  
✅ Next steps

**You're ready to use the system!** 🎉

For deeper knowledge, explore the role-specific guides linked above.

---

**Version:** 6.3.0 (V2) | **Status:** Production Ready ✅
