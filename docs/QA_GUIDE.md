# 🧪 QA Engineer Guide

**Version:** 6.3.0 (V2)  
**Last Updated:** December 22, 2025  
**Difficulty:** Intermediate

---

## 📖 Overview

This guide is for QA engineers who manage baseline test scenarios and ensure coverage quality.

**Prerequisites:** Read [Getting Started](GETTING_STARTED.md) first.

---

## 🎯 QA Responsibilities

### What You Manage

**1. Baseline Scenarios**
- Location: `.traceability/test-cases/baseline/{service}-baseline.yml`
- Version-controlled YAML files
- Authoritative test requirements

**2. Coverage Quality**
- Review AI suggestions
- Validate gaps
- Prioritize fixes
- Track metrics

### What System Provides

**1. AI-Generated Suggestions**
- Location: `.traceability/test-cases/ai_cases/`
- Auto-generated from APIs
- For review only (not version-controlled)

**2. V2 Reports**
- Interactive HTML dashboard
- 3 focused cards
- Gap analysis with priorities
- Orphan test detection

---

## 🔄 Daily Workflows

### Morning Check

```bash
# Run analysis
npm run continue

# Review V2 report
open .traceability/reports/service-report.html

# Check:
# - Coverage % (target: >80%)
# - P0 gaps (should be 0)
# - New orphan business tests
```

### Review AI Suggestions

```bash
# Generate suggestions
npm run generate

# Review
cat .traceability/test-cases/ai_cases/service-ai.yml

# Add valuable ones to baseline
# Edit: .traceability/test-cases/baseline/service-baseline.yml

# Verify
npm run continue
```

### Add New Scenarios

```bash
# Create baseline for new service
cat > .traceability/test-cases/baseline/new-service-baseline.yml << 'EOF'
service: new-service

POST /api/resource:
  happy_case:
    - When resource created with valid data, return 201
  error_case:
    - When resource created with missing field, return 400
  security:
    - When request without authentication, return 401
EOF

# Analyze
npm run continue
```

---

## ✍️ Writing Baseline Scenarios

### Format

**Template:**
```
When [condition], [expected result]
```

### Example Baseline

```yaml
service: customer-service

POST /api/customers:
  happy_case:
    - When customer created with valid data, return 201 with customer ID
    - When customer created with all optional fields, save complete profile
  
  error_case:
    - When customer created with missing email, return 400
    - When customer created with invalid email format, return 400
    - When customer created with duplicate email, return 409
  
  edge_case:
    - When customer name is at maximum length (255 chars), accept
    - When customer age is 0, accept as valid
    - When customer age is 120, accept as valid
  
  security:
    - When request without authentication token, return 401
    - When customer name contains SQL injection, sanitize and return 400
    - When customer email contains XSS payload, sanitize and return 400
```

### Categories & Priorities

| Category | Priority | Examples |
|----------|----------|----------|
| `security` | P0 | Auth checks, injection protection |
| `error_case` | P1 | Validation errors, duplicates |
| `edge_case` | P2 | Boundary values, limits |
| `happy_case` | P3 | Normal success flows |

### Best Practices

**✅ Good:**
```yaml
- When customer created with email "test@example.com", return 201
- When login fails with wrong password, return 401
- When OTP expired, return 401 with error message
```

**❌ Avoid:**
```yaml
- When customer is created, it works  # Too vague
- When login fails, show error  # Missing status code
- When something wrong, handle it  # Unclear
```

---

## 📊 Working with V2 Reports

The V2 report has **3 focused cards**:

### Card 1: Total Scenarios Panel

**What to Check:**
- Coverage percentage
- Total gaps count
- API breakdown table

**Table shows:**
- One row per scenario
- Status (✅ Covered / ⚠️ Partial / ❌ Not Covered)
- Test file mapping
- Confidence levels

**Action:** Create tests for ❌ NOT COVERED scenarios.

### Card 2: Orphan Unit Tests

**Two Categories:**
- 💼 **Business** - Need scenarios (your action)
- 🔧 **Technical** - No action needed

**Workflow:**
1. Review business orphans
2. Click "📋 Copy YAML"
3. Paste into baseline
4. Re-run analysis

### Card 3: AI Suggested Scenarios

**High-priority (P0/P1) recommendations**

**Workflow:**
1. Review suggestions
2. Discuss with team
3. Add relevant ones to baseline
4. Ignore if not applicable

---

## 🎯 Gap Management

### Priority Guide

| Priority | Action | Timeframe |
|----------|--------|-----------|
| **P0** | Fix immediately | This week |
| **P1** | Current sprint | 1-2 weeks |
| **P2** | Next sprint | 2-4 weeks |
| **P3** | Backlog | Future |

### Resolution Workflow

**P0 Gaps:**
```
1. Create detailed scenario in baseline
2. Notify dev team (blocks commit)
3. Dev creates unit test
4. Verify in next report
```

**P1 Gaps:**
```
1. Add to sprint backlog
2. Clarify requirements with dev
3. Track completion
4. Validate at sprint end
```

### Creating Tickets

```
Title: [P0] Add test for duplicate email validation

Scenario: When customer created with duplicate email, return 409
Priority: P0
Status: NOT_COVERED
API: POST /api/customers

Acceptance:
- Unit test verifies 409 response
- Error message includes "Email already exists"
- Test passes in CI/CD
```

---

## 🔍 Handling Orphan Tests

### What Are Orphans?

Tests without baseline scenarios.

### Categories

**Business Orphans (💼) - Action Required:**
- Controller tests
- Service tests
- API integration tests
- **Action:** Add scenarios to baseline

**Technical Orphans (🔧) - No Action:**
- Entity/DTO tests
- Mapper tests
- Utility tests
- **Action:** None (expected)

### Workflow

```bash
# 1. Open V2 report
open .traceability/reports/service-report.html

# 2. Navigate to Card 2 (Orphan Unit Tests)

# 3. For each business orphan:
#    - Review test description
#    - Check AI suggestion
#    - Decide to add or mark as technical

# 4. Add to baseline:
# Edit: .traceability/test-cases/baseline/service-baseline.yml

# 5. Re-analyze
npm run continue
```

---

## 🤝 Dev Collaboration

### Communication Tips

**Effective:**
```
✅ "3 P0 gaps blocking deployment"
✅ "5 business orphans need scenarios this sprint"
✅ "AI suggested 8 high-value scenarios for review"
```

**Ineffective:**
```
❌ "You have 20 gaps"
❌ "Fix all orphan tests"
❌ "The AI suggested 50 scenarios, add them all"
```

### Weekly Sync (30 min)

```
1. Coverage Metrics (5 min)
   Current: X% | Target: Y% | Trend: ↑/↓

2. P0/P1 Gaps (10 min)
   Count, owners, blockers

3. New Features (10 min)
   APIs added, scenarios needed, coverage plan

4. Orphan Review (5 min)
   New business orphans, scenarios to add
```

---

## 📈 Key Metrics

### Track These

**Coverage:**
- Overall percentage (target: >80%)
- Coverage by priority
- Coverage trend (30 days)

**Gaps:**
- P0 count (target: 0)
- P1 count (target: <5)
- P2/P3 for backlog

**Quality:**
- Orphan business tests (decreasing?)
- Partially covered scenarios (decreasing?)
- New APIs without scenarios (0?)

### Monthly Stakeholder Report

```
Slide 1: Coverage
  Current: 85%
  Last Month: 78%
  Trend: +7% 📈

Slide 2: Gaps
  P0: 0 ✅
  P1: 2 ⚠️
  Action: In progress

Slide 3: Quality
  Orphans: 15 → 3 📉
  New APIs: All covered ✅
```

---

## 🚀 Advanced Tasks

### Bulk Updates

```bash
# Add security scenario to all APIs

for file in .traceability/test-cases/baseline/*.yml; do
  echo "Updating $file..."
  # Add security check
done
```

### Scenario Templates

```yaml
# Template for CRUD operations

POST /api/{resource}:
  happy_case:
    - When {resource} created with valid data, return 201
  error_case:
    - When {resource} created with missing field, return 400
  security:
    - When {resource} created without auth, return 401

# Usage: Copy and replace {resource}
```

---

## 📚 Related Guides

- **[Getting Started](GETTING_STARTED.md)** - Setup & first run
- **[Reports Guide](REPORTS_GUIDE.md)** - V2 report deep dive
- **[Configuration](CONFIGURATION.md)** - System config
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues

---

## ✅ QA Checklists

### Daily
- [ ] Run `npm run continue`
- [ ] Check P0 gaps (0?)
- [ ] Review new orphan business tests
- [ ] Monitor coverage trend

### Weekly
- [ ] Review AI suggestions
- [ ] Update baseline scenarios
- [ ] Sync with dev on gaps
- [ ] Review V2 report metrics

### Sprint
- [ ] Generate coverage report
- [ ] Export CSV for analysis
- [ ] Create tickets for P0/P1 gaps
- [ ] Track gap resolution

### Monthly
- [ ] Stakeholder report
- [ ] Coverage trend analysis
- [ ] Quality metrics review
- [ ] Archive reports

---

**Version:** 6.3.0 (V2) | **Status:** Production Ready ✅
