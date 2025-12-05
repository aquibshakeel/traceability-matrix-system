# 🚀 QA Automation Framework - Quick Start

**Get started with QA automation in 5 minutes!**

---

## ⚡ Super Quick Start (TL;DR)

```bash
# Navigate to QA directory
cd qa

# Install dependencies
npm install

# Run tests (option 1: against existing service)
npm test

# Run tests (option 2: with Docker - full stack)
./scripts/run-tests.sh

# View results
open reports/html/test-report.html
```

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Docker & Docker Compose installed
- [ ] Node.js 18+ installed
- [ ] Git repository cloned
- [ ] Basic understanding of API testing

---

## 🎯 Three Ways to Run Tests

### Option 1: Quick Test (No Docker) ⚡

**When to use:** Quick validation during development

```bash
cd qa
npm install
npm test
```

**Requirements:** Service must be running at `localhost:3000`

---

### Option 2: Full Docker Suite 🐳

**When to use:** Complete end-to-end testing with isolated environment

```bash
cd qa
./scripts/run-tests.sh
```

**What it does:**
1. ✅ Cleans old artifacts
2. ✅ Starts MongoDB
3. ✅ Starts Kafka
4. ✅ Starts Service
5. ✅ Runs QA tests in container
6. ✅ Generates HTML report
7. ✅ Cleans up containers

---

### Option 3: Against Running Service 🎪

**When to use:** Testing against existing development environment

```bash
# From project root - start service
docker-compose up -d

# Run QA tests
cd qa
npm run test:report

# View report
open reports/html/test-report.html
```

---

## 📊 Understanding Results

### Console Output

```
[TS001] Create User - Happy Path (HF001)
  ✅ should create a user with valid payload and return 201
  ✅ should create multiple users with unique emails

[TS002] Create User - Negative Flows
  NF001 - Missing Required Fields
    ✅ should return 400 when email is missing
    ⚠️  should return 400 when name is missing (NF006 - GAP TEST)
  
  NF003 - Malformed JSON (CRITICAL GAP)
    ⚠️  should return 400 for malformed JSON payload
```

**Legend:**
- ✅ = Test passed
- ⚠️ = Gap detected (test validates a missing unit test scenario)
- ❌ = Test failed

### HTML Report

Location: `qa/reports/html/test-report.html`

Features:
- 📊 Visual test results
- ⏱️ Execution times
- 📈 Pass/fail statistics
- 🔍 Detailed error messages
- 📸 Screenshots (if enabled)

### Traceability Matrix

Location: `qa/matrix/TRACEABILITY_MATRIX.md`

Shows:
- 📋 All business scenarios
- ✅ Coverage status
- 🚨 Identified gaps
- 📊 Risk assessment
- 🎯 Priority levels

---

## 🔍 Exploring Test Scenarios

### View All Scenarios

```bash
# List all test files
ls qa/tests/e2e/onboarding/

# Output:
# ts001_create_user_happy.spec.ts    - Happy path tests
# ts002_create_user_negative.spec.ts - Negative flow tests
# ts003_get_user.spec.ts             - Get user tests
# ts004_edge_cases.spec.ts           - Edge case & boundary tests
```

### Run Specific Test

```bash
cd qa

# Run only happy path tests
npm test -- --grep "TS001"

# Run only negative tests
npm test -- --grep "TS002"

# Run only gap tests
npm test -- --grep "GAP"
```

---

## 🎨 Customization

### Change API Base URL

```bash
# For local testing
export API_BASE_URL=http://localhost:3000
npm test

# For staging
export API_BASE_URL=https://staging-api.company.com
npm test
```

### Add New Test Scenario

1. Create test file in `tests/e2e/onboarding/`
2. Use existing tests as template
3. Add scenario to traceability matrix
4. Run tests

Example:
```typescript
// tests/e2e/onboarding/ts005_my_test.spec.ts
import { expect } from 'chai';
import { apiClient } from '../../utils/apiClient';
import { TestFixtures } from '../../utils/fixtures';

describe('[TS005] My New Test', () => {
  it('should validate my scenario', async () => {
    const response = await apiClient.createUser(
      TestFixtures.createValidUser()
    );
    expect(response.status).to.equal(201);
  });
});
```

---

## 🐛 Troubleshooting

### Problem: Tests hang or timeout

**Solution:**
```bash
# Check service is responding
curl http://localhost:3000/health

# If not, restart service
docker-compose restart
```

### Problem: Docker build fails

**Solution:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild
cd qa
docker-compose -f docker-compose.qa.yml build --no-cache
```

### Problem: Permission denied on scripts

**Solution:**
```bash
# Make scripts executable
chmod +x qa/scripts/*.sh
```

### Problem: Module not found

**Solution:**
```bash
# Reinstall dependencies
cd qa
rm -rf node_modules package-lock.json
npm install
```

---

## 📖 Next Steps

Once you're comfortable with basics:

1. **Study the Traceability Matrix**
   ```bash
   cat qa/matrix/TRACEABILITY_MATRIX.md
   ```

2. **Read Full Documentation**
   ```bash
   cat qa/docs/README.md
   ```

3. **Learn Gap Detection**
   ```bash
   cat qa/docs/QA_GAP_DETECTION_PROMPT.md
   ```

4. **Explore Test Code**
   ```bash
   # Look at test structure
   cat qa/tests/e2e/onboarding/ts001_create_user_happy.spec.ts
   
   # Look at fixtures
   cat qa/tests/utils/fixtures.ts
   ```

5. **Run AI Gap Detection**
   - Copy prompt from `QA_GAP_DETECTION_PROMPT.md`
   - Paste into Claude/ChatGPT
   - Add your unit tests and scenarios
   - Get automated gap analysis!

---

## 🎯 Client Demo Preparation

### 5-Minute Demo Script

```bash
# 1. Show QA structure
tree qa -L 2

# 2. Show traceability matrix
cat qa/matrix/TRACEABILITY_MATRIX.md | head -100

# 3. Run tests
cd qa && ./scripts/run-tests.sh

# 4. Open HTML report
open reports/html/test-report.html

# 5. Explain gaps
# Point out the ⚠️ warnings in test output
# Show how matrix maps to unit tests
# Demonstrate AI gap detection prompt
```

**Key Points to Highlight:**
- ✅ 50% unit test coverage detected
- 🚨 4 P0 critical gaps found
- ⚠️ 6 P1/P2 gaps identified
- 🤖 AI can generate missing tests
- 📊 Audit-ready documentation

---

## 💡 Pro Tips

### Tip 1: Use Watch Mode for Development

```bash
cd qa
npm run test:watch
```

Tests automatically re-run when you save files.

### Tip 2: Generate Coverage Report

```bash
cd qa
npm test -- --coverage
```

### Tip 3: Run Tests in Parallel

```bash
cd qa
npm test -- --parallel
```

### Tip 4: Filter by Tag

```bash
# Run only critical gap tests
npm test -- --grep "CRITICAL GAP"

# Run only P0 scenarios
npm test -- --grep "P0"
```

### Tip 5: Clean Before Important Runs

```bash
cd qa
./scripts/clean-artifacts.sh
npm test
```

---

## 🆘 Getting Help

### Documentation

- **Quick Start:** `qa/QUICKSTART.md` (this file)
- **Full Guide:** `qa/docs/README.md`
- **Gap Detection:** `qa/docs/QA_GAP_DETECTION_PROMPT.md`
- **Traceability Matrix:** `qa/matrix/TRACEABILITY_MATRIX.md`

### Common Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with HTML report
npm run test:report

# Clean artifacts
./scripts/clean-artifacts.sh

# Run with Docker
./scripts/run-tests.sh

# Make scripts executable
chmod +x scripts/*.sh
```

### Support Channels

- 📧 Email: qa-team@company.com
- 💬 Slack: #qa-automation
- 📝 Wiki: confluence.company.com/qa
- 🐛 Issues: JIRA project "TEST"

---

## ✅ Success Checklist

After completing quick start, you should be able to:

- [ ] Install QA dependencies
- [ ] Run tests locally
- [ ] Run tests with Docker
- [ ] View HTML reports
- [ ] Understand traceability matrix
- [ ] Identify test gaps
- [ ] Add new test scenarios
- [ ] Troubleshoot common issues

---

## 🎉 You're Ready!

Congratulations! You now have a production-ready QA automation framework with:

✅ **Comprehensive test coverage**  
✅ **Gap detection capability**  
✅ **Beautiful HTML reports**  
✅ **Docker isolation**  
✅ **AI-ready analysis**  
✅ **Audit-ready documentation**

**Start testing with confidence!** 🚀

---

**Version:** 1.0.0  
**Last Updated:** December 4, 2025  
**Maintained By:** QA Automation Team
