# 🧪 QA Engineer Guide

**Version:** 6.3.0  
**Last Updated:** December 20, 2025  
**Difficulty:** Intermediate  
**Prerequisites:** [Getting Started](GETTING_STARTED.md)

---

## 📖 Overview

This guide is for QA engineers who:
- Write and maintain baseline test scenarios
- Review AI-generated scenario suggestions
- Monitor test coverage metrics
- Define business journeys (E2E workflows)
- Work with developers on gap resolution

**Note:** This guide assumes you've read:
- [Getting Started](GETTING_STARTED.md) - Basic setup and usage
- [Reports Guide](REPORTS_GUIDE.md) - Understanding reports

---

## 🎯 QA Role in the System

### What QA Manages

**1. Baseline Scenarios** (`.traceability/test-cases/baseline/`)
- Authoritative test requirements
- Version-controlled YAML files
- One file per service

**2. Business Journeys** (`.traceability/test-cases/journeys/`)
- End-to-end user workflows
- Multi-step API sequences
- E2E test verification

**3. Coverage Quality**
- Review AI suggestions
- Validate traceability
- Prioritize gaps
- Track metrics

### What System Provides

**1. AI-Generated Suggestions** (`.traceability/test-cases/ai_cases/`)
- Auto-generated from API specs
- Not version-controlled
- For QA review only

**2. Coverage Reports** (`.traceability/reports/`)
- HTML dashboards
- Gap analysis
- Orphan detection
- Historical trends

**3. Automated Validation**
- Pre-commit hooks
- CI/CD integration
- Blocking on P0 gaps

---

## 🔄 Daily QA Workflows

### Workflow 1: Morning Coverage Check

```bash
# 1. Run analysis
npm run continue

# 2. Open report
open .traceability/reports/customer-service-report.html

# 3. Review:
# - Coverage percentage (target: >80%)
# - P0 gaps (should be 0)
# - New orphan tests
# - Historical trend
```

### Workflow 2: Reviewing AI Suggestions

```bash
# 1. Generate fresh AI scenarios
npm run generate

# 2. Review AI suggestions
cat .traceability/test-cases/ai_cases/customer-service-ai.yml

# 3. Compare with baseline
diff .traceability/test-cases/baseline/customer-service-baseline.yml \
     .traceability/test-cases/ai_cases/customer-service-ai.yml

# 4. Add valuable suggestions to baseline
# Edit: .traceability/test-cases/baseline/customer-service-baseline.yml

# 5. Re-analyze
npm run continue
```

### Workflow 3: Adding New Service Scenarios

```bash
# 1. Create baseline file
touch .traceability/test-cases/baseline/new-service-baseline.yml

# 2. Write initial scenarios
cat > .traceability/test-cases/baseline/new-service-baseline.yml << 'EOF'
service: new-service

POST /api/resource:
  happy_case:
    - When resource created with valid data, return 201
  error_case:
    - When resource created with missing field, return 400
EOF

# 3. Analyze
npm run continue

# 4. Review coverage
open .traceability/reports/new-service-report.html
```

### Workflow 4: Sprint Planning

```bash
# 1. Generate coverage report
npm run continue

# 2. Export to CSV
# Open: .traceability/reports/customer-service-report.csv

# 3. Filter by priority
# In Excel: Filter "Priority" column for P0, P1

# 4. Add to sprint backlog
# Create tickets for gaps

# 5. Track progress
# Re-run npm run continue daily
```

---

## ✍️ Writing Baseline Scenarios

### Scenario Format

**Template:**
```
When [condition], [expected result]
```

**Good Examples:**
```yaml
service: customer-service

POST /api/customers:
  happy_case:
    - When customer created with valid data, return 201 with customer ID
    - When customer created with all optional fields, save complete profile
  
  error_case:
    - When customer created with missing email, return 400 with validation error
    - When customer created with invalid email format, return 400
    - When customer created with duplicate email, return 409
  
  edge_case:
    - When customer name is at maximum length (255 chars), accept successfully
    - When customer age is 0, accept as valid
    - When customer age is 120, accept as valid
  
  security:
    - When customer created without authentication token, return 401
    - When customer name contains SQL injection attempt, sanitize and return 400
    - When customer email contains XSS payload, sanitize and return 400
```

### Scenario Categories

| Category | Purpose | Priority | Examples |
|----------|---------|----------|----------|
| `happy_case` | Normal success flows | P3 | Valid data returns 201 |
| `error_case` | Expected failures | P1-P2 | Missing fields return 400 |
| `edge_case` | Boundary conditions | P2 | Max length, zero values |
| `security` | Auth, injection, XSS | P0 | No auth returns 401 |

### Best Practices

**✅ Do:**
```yaml
# Specific and testable
- When customer created with email "test@example.com", return 201

# Includes expected status code
- When login fails with wrong password, return 401

# Clear condition and result
- When OTP expired, return 401 with "OTP expired" message
```

**❌ Don't:**
```yaml
# Too vague
- When customer is created, it works

# Missing status code
- When login fails, show error

# Unclear condition
- When something goes wrong, handle it
```

### Scenario Naming Convention

```yaml
# Pattern: When [actor] [action] [condition], [system] [result]

# Good examples:
- When user registers with valid email, system creates account and returns 201
- When admin deletes customer by ID, system removes record and returns 204
- When API called without token, system rejects with 401

# Keep it:
# - Descriptive (clear what's being tested)
# - Specific (exact condition and result)
# - Testable (dev can write unit test from it)
# - Business-focused (non-technical language)
```

---

## 🚀 Managing Business Journeys

### What Are Business Journeys?

End-to-end user workflows across multiple API endpoints.

**Example:**
```
Registration Flow:
  Step 1: POST /identity/register (Create account)
  Step 2: POST /identity/verify-otp (Verify email)
  Step 3: GET /identity/profile (Get profile)
  
Result: User has verified, active account
```

### Journey File Format

**Create:** `.traceability/test-cases/journeys/{service}-journeys.yml`

```yaml
service: identity-service

business_journeys:
  - id: user-registration
    name: "Complete User Registration Flow"
    description: "User registers, verifies email, and accesses profile"
    priority: P0
    steps:
      - api: "POST /identity/register"
        description: "Create new user account"
        required: true
      - api: "POST /identity/verify-otp"  
        description: "Verify email with OTP"
        required: true
      - api: "GET /identity/profile"
        description: "Retrieve user profile"
        required: false
    e2e_tests:
      - file: "RegistrationFlowE2ETest.java"
        methods:
          - "testCompleteRegistrationFlow"
          - "testRegistrationWithInvalidOTP"
    tags: ["onboarding", "authentication"]
    
  - id: password-reset
    name: "Password Reset Journey"
    description: "User requests reset, receives email, sets new password"
    priority: P1
    steps:
      - api: "POST /identity/forgot-password"
        description: "Request password reset"
        required: true
      - api: "POST /identity/reset-password"
        description: "Set new password with token"
        required: true
      - api: "POST /identity/login"
        description: "Login with new password"
        required: true
    e2e_tests:
      - file: "PasswordResetE2ETest.java"
        methods:
          - "testPasswordResetFlow"
    tags: ["authentication", "security"]
```

### Journey Priorities

| Priority | When to Use | Example |
|----------|-------------|---------|
| **P0** | Critical user flows | Registration, Login, Checkout |
| **P1** | Important features | Password reset, Profile update |
| **P2** | Secondary features | Email preferences, Export data |
| **P3** | Nice-to-have | UI customization, Themes |

### Journey Status Meanings

**FULLY_COVERED (🟢)**
- All steps have unit tests (>80% coverage)
- E2E test exists for complete flow
- No action needed

**PARTIALLY_COVERED (🟡)**
- Some steps have unit tests
- OR missing E2E test
- Action: Complete coverage

**AT_RISK (🟠)**
- Has E2E test but weak unit tests
- OR has unit tests but no E2E
- Action: Add missing layer

**NOT_COVERED (🔴)**
- No unit tests
- No E2E test
- Action: Immediate attention

### Reviewing Journey Coverage

```bash
# 1. Run analysis
npm run continue

# 2. Open report and find "Business Journeys" section
open .traceability/reports/identity-service-report.html

# 3. Review each journey:
# - Check journey status badge
# - Identify weak steps (low coverage)
# - Verify E2E test exists
# - Read recommendations

# 4. Take action:
# - Work with dev to add missing tests
# - Create E2E test if needed
# - Update journey file if steps changed
```

---

## 📊 Working with Reports

### Understanding Report Sections

For detailed report documentation, see [Reports Guide](REPORTS_GUIDE.md).

**Key sections for QA:**

**1. Executive Summary**
- Quick health check
- Coverage percentage
- P0 gap count

**2. Coverage Gaps**
- Prioritized list of missing tests
- What needs attention first
- AI suggestions for gaps

**3. Orphan Tests**
- Tests without scenarios
- Business vs Technical categorization
- Copy-ready YAML for baseline

**4. Business Journeys**
- E2E workflow coverage
- Step-by-step analysis
- Weak point identification

**5. AI Suggestions**
- Additional scenarios from API spec
- Not in baseline yet
- Consider adding

### Daily Report Review

```bash
# Open latest report
open .traceability/reports/customer-service-report.html

# Check these metrics:
1. Coverage % - Target: >80%
2. P0 Gaps - Target: 0
3. P1 Gaps - Target: <5
4. Orphan Business Tests - Review for baseline addition
5. Journey Status - All should be Fully Covered or Partial

# Export for stakeholders
# CSV available at: .traceability/reports/customer-service-report.csv
```

---

## 🔍 Reviewing Orphan Tests

### What Are Orphan Tests?

Unit tests that exist in codebase but aren't linked to any baseline scenario.

### Two Categories

**Business Orphans** (Action Required)
- Controller tests
- Service tests
- API tests
- Need baseline scenarios

**Technical Orphans** (No Action)
- Entity tests
- DTO tests
- Mapper tests
- Infrastructure tests

### Workflow for Business Orphans

```bash
# 1. Open report
open .traceability/reports/customer-service-report.html

# 2. Find "Orphan Tests" section

# 3. For each Business orphan:
#    a. Read test name/file
#    b. Check AI suggestion (if available)
#    c. Decide: Add to baseline or mark as technical

# 4. Add to baseline:
cat >> .traceability/test-cases/baseline/customer-service-baseline.yml << 'EOF'

POST /api/customers/bulk:
  happy_case:
    - When customers created in bulk with valid data, return 201
EOF

# 5. Re-analyze to verify
npm run continue
```

### Example Orphan Review

**Report Shows:**
```
💼 Business Orphan [P1]
Test: testBulkCreateCustomers
File: CustomerControllerTest.java:145
💡 AI Suggestion: "When customers created in bulk with valid data array, 
                    return 201 with list of customer IDs"

Action: Add scenario to baseline
```

**QA Action:**
```yaml
# Add to baseline/customer-service-baseline.yml

POST /api/customers/bulk:
  happy_case:
    - When customers created in bulk with valid data array, return 201 with list of customer IDs
  error_case:
    - When bulk create with invalid customer data, return 400 with error details
```

---

## 🎯 Gap Management

### Gap Priorities

| Priority | Action | Timeframe | Owner |
|----------|--------|-----------|-------|
| **P0** | Block commit | Immediate | Dev + QA |
| **P1** | Current sprint | This week | Dev + QA |
| **P2** | Next sprint | 1-2 weeks | Dev |
| **P3** | Backlog | Future | Dev |

### Gap Resolution Workflow

**For P0 Gaps:**
```
1. QA: Create detailed scenario in baseline
2. Dev: Write unit test
3. QA: Verify coverage in report
4. Both: Commit when gap closed
```

**For P1 Gaps:**
```
1. QA: Add scenarios to sprint backlog
2. QA: Work with dev to clarify requirements
3. Dev: Implement tests during sprint
4. QA: Validate at sprint end
```

**For P2/P3 Gaps:**
```
1. QA: Document in baseline with TODO marker
2. QA: Track in backlog
3. Address when capacity allows
```

### Creating Tickets from Gaps

**Example Ticket Format:**
```
Title: [P0 Gap] Add unit test for customer duplicate email validation

Description:
Coverage Gap: POST /api/customers
Scenario: When customer created with duplicate email, return 409
Priority: P0 (Blocks commit)
Status: NOT_COVERED

Acceptance Criteria:
- Unit test verifies duplicate email returns 409
- Error message includes "Email already exists"
- Test name matches scenario description

Test Location: CustomerControllerTest.java
Baseline Reference: customer-service-baseline.yml:15
```

---

## 🤝 Collaborating with Developers

### Communication Tips

**When Reviewing AI Suggestions:**
```
❌ "The AI suggested 50 scenarios, add them all"
✅ "I reviewed AI suggestions and marked 8 high-value ones 
    for this sprint"
```

**When Reporting Gaps:**
```
❌ "You have 20 gaps"
✅ "We have 3 P0 gaps blocking deployment and 5 P1 gaps 
    for this sprint"
```

**When Discussing Orphans:**
```
❌ "Fix these 15 orphan tests"
✅ "These 5 business orphans need scenarios. The other 10 
    are technical tests (no action needed)"
```

### Weekly Sync Agenda

```
1. Coverage Metrics (5 min)
   - Current: X%
   - Target: Y%
   - Trend: Up/Down

2. P0/P1 Gaps (10 min)
   - How many?
   - Owners?
   - Blockers?

3. New Features (10 min)
   - APIs added this week
   - Baseline scenarios needed
   - Test coverage plan

4. Orphan Review (5 min)
   - New business orphans
   - Scenarios to add
   - Technical orphans to ignore

5. Journey Health (5 min)
   - Journey status update
   - E2E test gaps
   - Weak steps

Total: 35 minutes
```

---

## 📈 Metrics and Reporting

### Key Metrics for QA

**Coverage Metrics:**
```
- Overall Coverage %
- Coverage by Priority (P0/P1/P2/P3)
- Coverage by API
- Coverage Trend (30 days)
```

**Gap Metrics:**
```
- P0 Gaps (should be 0)
- P1 Gaps (target: <5)
- P2 Gaps (track)
- P3 Gaps (backlog)
```

**Quality Metrics:**
```
- Orphan Business Tests (decreasing?)
- Orphan APIs (should be 0)
- Journey Coverage (target: 100% P0 journeys)
- Partially Covered Scenarios (decreasing?)
```

### Monthly Report for Stakeholders

```bash
# 1. Generate latest report
npm run continue

# 2. Open CSV for export
# File: .traceability/reports/customer-service-report.csv

# 3. Create summary slides:
Slide 1: Coverage Overview
  - Current: X%
  - Last Month: Y%
  - Trend: +Z%

Slide 2: Gap Analysis
  - P0: 0 (✅ Good)
  - P1: 3 (⚠️ Tracking)
  - Action Items: ...

Slide 3: Journey Health
  - P0 Journeys: 5/5 covered (✅)
  - P1 Journeys: 8/10 covered (⚠️)
  - E2E Tests: 12/15 exist

Slide 4: Quality Improvements
  - Orphan Tests: 20 → 5 (📉 Good)
  - API Coverage: 75% → 85% (📈 Good)
  - New Features: 3 fully covered
```

---

## 🚀 Advanced QA Tasks

### Task 1: Bulk Scenario Updates

```bash
# Scenario: New security requirement across all APIs
# All endpoints need authentication check

# 1. Update all baseline files
for file in .traceability/test-cases/baseline/*.yml; do
  echo "Updating $file..."
  # Add security scenario to each API
done

# 2. Use script for consistency
cat > add-auth-scenario.sh << 'EOF'
#!/bin/bash
# Adds authentication scenario to all POST endpoints
for file in .traceability/test-cases/baseline/*.yml; do
  sed -i '/POST.*:/a\  security:\n    - When request made without authentication token, return 401' "$file"
done
EOF

chmod +x add-auth-scenario.sh
./add-auth-scenario.sh

# 3. Verify changes
npm run continue
```

### Task 2: Cross-Service Journey

```yaml
# Journey spanning multiple services

service: customer-service

business_journeys:
  - id: complete-order-flow
    name: "Complete Order Processing"
    description: "Create order → Process payment → Ship order"
    priority: P0
    steps:
      - api: "POST /api/orders"
        service: "order-service"
        description: "Create new order"
      - api: "POST /api/payments"
        service: "payment-service"
        description: "Process payment"
      - api: "POST /api/shipments"
        service: "shipping-service"
        description: "Create shipment"
    e2e_tests:
      - file: "OrderFlowE2ETest.java"
        service: "integration-tests"
    tags: ["cross-service", "critical"]
```

### Task 3: Scenario Templates

Create reusable templates for common patterns:

```yaml
# template-crud.yml
POST /api/{resource}:
  happy_case:
    - When {resource} created with valid data, return 201
  error_case:
    - When {resource} created with missing required field, return 400
    - When {resource} created with invalid format, return 400
  security:
    - When {resource} created without auth, return 401

GET /api/{resource}:
  happy_case:
    - When {resource} retrieved by valid ID, return 200
  error_case:
    - When {resource} retrieved by non-existent ID, return 404
  security:
    - When {resource} retrieved without auth, return 401

# Usage: Copy and replace {resource} with actual resource name
```

---

## 📚 Related Documentation

- **📖 [Getting Started](GETTING_STARTED.md)** - Initial setup
- **📊 [Reports Guide](REPORTS_GUIDE.md)** - Understanding reports
- **⚙️ [Configuration](CONFIGURATION.md)** - System configuration
- **👨‍💻 [Developer Guide](DEV_GUIDE.md)** - For developers
- **❓ [Troubleshooting](TROUBLESHOOTING.md)** - Common issues

---

## 🎯 QA Checklist

### Daily
- [ ] Run `npm run continue` to check coverage
- [ ] Review P0 gaps (should be 0)
- [ ] Check for new orphan business tests
- [ ] Monitor coverage trend

### Weekly
- [ ] Review AI suggestions
- [ ] Update baseline with valuable scenarios
- [ ] Sync with dev team on gaps
- [ ] Review journey coverage
- [ ] Update sprint backlog with P1 gaps

### Sprint Planning
- [ ] Generate coverage report
- [ ] Export CSV for analysis
- [ ] Prioritize gaps for sprint
- [ ] Create tickets for P0/P1 gaps
- [ ] Define E2E test requirements

### Monthly
- [ ] Generate stakeholder report
- [ ] Track coverage trend
- [ ] Review quality metrics
- [ ] Update journey definitions
- [ ] Archive historical reports

---

**Version:** 6.3.0 | **Status:** Production Ready ✅
