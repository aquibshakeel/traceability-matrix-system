# 📊 Reports Guide - V2

**Version:** 6.3.0 (V2 Report Design)  
**Last Updated:** December 22, 2025  
**Difficulty:** Intermediate  
**Prerequisites:** [Getting Started Guide](GETTING_STARTED.md)

---

## 📖 Overview

This guide explains the **V2 Premium Report** - a simplified, action-oriented dashboard focusing on what matters most. Learn how to:
- Navigate the 3-card dashboard
- Interpret coverage metrics
- Act on gaps and orphans
- Use multiple report formats

---

## 🎯 Report Formats

| Format | Purpose | Location |
|--------|---------|----------|
| **HTML** | Interactive V2 dashboard | `.traceability/reports/{service}-report.html` |
| **JSON** | CI/CD automation | `.traceability/reports/{service}-report.json` |
| **CSV** | Excel analysis | `.traceability/reports/{service}-report.csv` |
| **Markdown** | Documentation | `.traceability/reports/{service}-report.md` |

```bash
# Generate all formats
npm run continue

# Auto-opens HTML report
```

---

## 🌟 V2 Report Structure

The V2 report is streamlined into **3 focused cards**:

```
┌─────────────────────────────────────┐
│  Header: Executive Summary           │ ← Coverage %, Status, Timestamp
├─────────────────────────────────────┤
│  Card 1: Total Scenarios Panel       │ ← Metrics + API Breakdown Table
├─────────────────────────────────────┤
│  Card 2: Orphan Unit Tests           │ ← Tests without scenarios
├─────────────────────────────────────┤
│  Card 3: AI Suggested Scenarios      │ ← P0/P1 recommendations
└─────────────────────────────────────┘
```

**What Changed in V2:**
- ✅ Simplified to 3 cards (removed Business Journeys)
- ✅ Single unified table in Card 1 (one row = one scenario)
- ✅ Removed redundant progress bars
- ✅ Direct status and mapping in table
- ✅ Focus on actionable insights

---

## 📊 Header: Executive Summary

Shows high-level metrics at a glance:

```
🎯 Unit-Test Traceability Report V2 | customer-service

Status: ✅ SUCCESS | Timestamp: 2025-12-22 04:30:00 | Duration: 1234ms
```

**Key Indicators:**
- Service name
- Overall status (Success/Failure)
- Analysis timestamp
- Execution time

---

## 📋 Card 1: Total Scenarios Panel

### Summary Metrics (5 boxes)

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   30        │     3       │    60%      │     18      │     12      │
│ Total       │  Total      │  Coverage   │  Covered    │   Total     │
│ Baseline    │  APIs       │             │  Scenarios  │   Gaps      │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**Quick Assessment:**
- **Coverage %** - Overall test coverage
- **Covered Scenarios** - Fully covered count
- **Total Gaps** - Partial + Not Covered

### Coverage Statistics (2 boxes)

```
┌─────────────────────┬─────────────────────┐
│        8            │        4            │
│ ⚠️ Partially Covered│ ❌ Not Covered      │
└─────────────────────┴─────────────────────┘
```

### API Coverage Breakdown (Single Table)

**NEW in V2:** One unified table showing all scenarios:

```
┌──────────────────┬─────────────────────────────┬──────────┬─────────────────────────┐
│ API              │ Baseline Scenario            │ Status   │ Unit Test / File Mapping│
├──────────────────┼─────────────────────────────┼──────────┼─────────────────────────┤
│ POST /identity/  │ When login with valid       │ ✅       │ LoginWithValidReturns200│
│ login            │ credentials, return 200      │ COVERED  │ IdentityControllerTest  │
│                  │                              │          │ Line: 35 HIGH           │
│ (same API -      ├─────────────────────────────┼──────────┼─────────────────────────┤
│  merged cell)    │ When email doesn't exist,   │ ✅       │ LoginWithNonExistent... │
│                  │ return 401                   │ COVERED  │ IdentityControllerTest  │
│                  │                              │          │ Line: 70 HIGH           │
│                  ├─────────────────────────────┼──────────┼─────────────────────────┤
│                  │ When password incorrect,    │ ⚠️       │ LoginWithIncorrect...   │
│                  │ return 401                   │ PARTIAL  │ IdentityControllerTest  │
│                  │                              │          │ Line: 90 MEDIUM         │
│                  ├─────────────────────────────┼──────────┼─────────────────────────┤
│                  │ When account is locked,     │ ❌ NOT   │ (No tests found)        │
│                  │ return 403                   │ COVERED  │                         │
├──────────────────┼─────────────────────────────┼──────────┼─────────────────────────┤
│ POST /identity/  │ When register with valid    │ ✅       │ RegisterWithValid...    │
│ register         │ data, return 201             │ COVERED  │ IdentityControllerTest  │
│                  │                              │          │ Line: 120 HIGH          │
└──────────────────┴─────────────────────────────┴──────────┴─────────────────────────┘
```

**Table Features:**
- **One row per scenario** - Clear, linear view
- **API column** - Merged cells for same endpoint
- **Status badges** - Visual coverage state
- **Direct mapping** - Test name, file, line, confidence in one column

**Status Badges:**
- ✅ **COVERED** - Has complete unit test
- ⚠️ **PARTIAL** - Has test but incomplete
- ❌ **NOT COVERED** - No test exists

**Match Confidence:**
- **HIGH** - Strong match, reliable
- **MEDIUM** - Partial match, may need review
- **LOW** - Weak match, verify manually

---

## 🔍 Card 2: Orphan Unit Tests

Tests that exist but aren't linked to baseline scenarios.

### Categories

```
┌──────────────────────────────┬──────────────────────────────┐
│ 💼 8 Business Tests          │ 🔧 3 Technical Tests         │
│                              │                              │
│ Cover business logic         │ Infrastructure/utility tests │
│ QA MUST add scenarios        │ No action needed             │
└──────────────────────────────┴──────────────────────────────┘
```

### Copy-Ready YAML

The report provides ready-to-paste YAML:

```yaml
# 📋 Copy this to your baseline file

service: identity-service

POST /identity/register:
  happy_case:
    - When register with valid credentials, return 201
  error_case:
    - When register with duplicate email, return 409
```

**How to Use:**
1. Click "📋 Copy YAML" button
2. Paste into baseline YAML file
3. Re-run analysis to verify

### Detailed Test List

Shows each orphan test with:
- Test description
- Category (Business/Technical)
- Priority (P0/P1/P2/P3)
- Required action

**Action Guide:**
- **Business Tests** → QA adds scenarios
- **Technical Tests** → No action needed

---

## 🤖 Card 3: AI Suggested Scenarios (P0/P1)

High-priority AI recommendations for additional test scenarios.

```
┌──────────────────────────────────────────────────────────────┐
│ API: POST /identity/login                                     │
│                                                               │
│ • 🆕 When multiple failed attempts, implement rate limiting   │
│ • 🆕 When SQL injection in password field, sanitize safely    │
│ • 🆕 When CSRF token missing, reject with 403                 │
└──────────────────────────────────────────────────────────────┘
```

**Understanding AI Suggestions:**
- **Not in baseline** - These are additional recommendations
- **P0/P1 only** - Only high-priority shown
- **Optional** - Consider adding to baseline
- **AI-generated** - Based on API analysis

**How to Use:**
1. Review suggestions
2. Discuss with team
3. Add relevant ones to baseline
4. Ignore if not applicable

---

## 📊 JSON Report (CI/CD)

### Structure

```json
{
  "service": "customer-service",
  "timestamp": "2025-12-22T04:30:00Z",
  "summary": {
    "coveragePercent": 66.7,
    "totalScenarios": 30,
    "fullyCovered": 18,
    "partiallyCovered": 8,
    "notCovered": 4,
    "p0Gaps": 2,
    "p1Gaps": 3
  },
  "apis": [...],
  "orphanTests": [...]
}
```

### CI/CD Integration

```bash
# Check coverage threshold
COVERAGE=$(jq '.summary.coveragePercent' report.json)
if (( $(echo "$COVERAGE < 80" | bc -l) )); then
  echo "❌ Coverage below 80%: $COVERAGE%"
  exit 1
fi

# Block on P0 gaps
P0_GAPS=$(jq '.summary.p0Gaps' report.json)
if [ "$P0_GAPS" -gt 0 ]; then
  echo "❌ P0 gaps detected: $P0_GAPS"
  exit 1
fi

echo "✅ Coverage check passed"
```

---

## 📈 CSV Report (Excel)

### Structure

```csv
API,Scenario,Status,Priority,Test,File,Line,Confidence
POST /api/login,"When login valid",FULLY_COVERED,P3,testLogin...,LoginTest.java,35,HIGH
POST /api/login,"When account locked",NOT_COVERED,P0,,,,
```

### Excel Analysis

**Create Pivot Table:**
1. Rows: Priority
2. Columns: Status
3. Values: Count

**Generate Charts:**
- Coverage by API
- Gaps by priority
- Status distribution

---

## 📝 Markdown Report

### Use Cases

- **Git commits** - Include in commit messages
- **Pull requests** - Add to PR description
- **Documentation** - Paste in wiki/Confluence
- **Email** - Send to stakeholders

### Example

```markdown
# Coverage Report: customer-service

**Coverage:** 66.7% (20/30)

## Summary
- ✅ 18 Fully Covered
- ⚠️ 8 Partially Covered
- ❌ 4 Not Covered

## P0 Gaps (2)
1. When SQL injection attempted
2. When account locked

## Action Required
Create unit tests for P0 scenarios
```

---

## 🎯 Daily Workflow

### Morning Check

```bash
# Run analysis
npm run continue

# Review V2 report (auto-opens)
# Note P0/P1 gaps
# Plan testing tasks
```

### During Development

```bash
# After adding tests
npm run continue

# Verify in V2 report:
# - Gaps closed ✅
# - Coverage improved 📈
# - No new orphans
```

### Before Commit

```bash
# Final validation
npm run continue

# Check V2 report:
# - No P0 gaps
# - Coverage acceptable
# - All tests mapped
```

---

## 🎯 Taking Action on Reports

### Priority-Based Approach

**P0 Gaps (Critical)**
```
When: Immediately (this week)
Who: Dev + QA pair
Focus: Security, data integrity
Goal: Zero P0 gaps before release
```

**P1 Gaps (High)**
```
When: Current sprint
Who: Development team
Focus: Error handling, key features
Goal: <5 P1 gaps at sprint end
```

**P2/P3 Gaps (Medium/Low)**
```
When: Future sprints
Who: Backlog planning
Focus: Edge cases, enhancements
Goal: Continuous improvement
```

### Addressing Orphan Tests

**Business Orphans:**
1. Review test code
2. Understand what it tests
3. QA creates baseline scenario
4. Verify mapping in next run

**Technical Orphans:**
- No action needed
- These are infrastructure tests
- Expected and acceptable

### Using AI Suggestions

1. **Review** - Read AI recommendations
2. **Discuss** - Team decides relevance
3. **Add** - Include in baseline if needed
4. **Test** - Dev creates unit tests
5. **Verify** - Re-run analysis

---

## 🆘 Report Troubleshooting

### Report Doesn't Open

```bash
# Open manually
open .traceability/reports/service-report.html

# Or use browser
firefox .traceability/reports/service-report.html
```

### Missing Data in Report

**Possible Causes:**
- Analysis didn't complete
- Service path incorrect
- Baseline file missing

**Solution:**
```bash
# Check service path
ls /path/to/service

# Verify baseline exists
ls .traceability/test-cases/baseline/service-baseline.yml

# Re-run with verbose logging
VERBOSE=true npm run continue
```

### Incorrect Coverage Numbers

**Common Issues:**
- Tests in wrong directory
- Test pattern mismatch
- Cache issues

**Solution:**
```bash
# Clear cache
rm -rf .traceability/cache

# Re-run analysis
npm run continue
```

---

## 📚 Related Documentation

### Core Guides
- **[Getting Started](GETTING_STARTED.md)** - First-time setup
- **[Configuration](CONFIGURATION.md)** - All config options
- **[QA Guide](QA_GUIDE.md)** - For QA team
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues

### Reference
- **[Architecture](ARCHITECTURE.md)** - System design
- **[Features](../FEATURES.md)** - Complete feature list
- **[Changelog](../CHANGELOG.md)** - Version history

---

## 🎓 Best Practices

### For Developers

✅ **Do:**
- Run analysis before committing
- Fix P0 gaps immediately
- Keep coverage above 80%
- Map tests to scenarios

❌ **Don't:**
- Ignore orphan business tests
- Skip pre-commit checks
- Let P0 gaps accumulate
- Write tests without scenarios

### For QA

✅ **Do:**
- Review AI suggestions
- Add scenarios for business orphans
- Prioritize P0/P1 coverage
- Keep baseline updated

❌ **Don't:**
- Ignore technical orphans (they're OK)
- Skip baseline updates
- Accept <80% coverage
- Add scenarios without verification

---

**Version:** 6.3.0 (V2 Report) | **Status:** Production Ready ✅
