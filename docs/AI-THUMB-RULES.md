# AI Thumb Rules for Traceability Matrix System

**CRITICAL: These are mandatory rules that MUST be followed for ALL future work on this project.**

---

## 🎯 Core Principles

### 1. **Orphan API Detection (MANDATORY)**

**Rule:** An API is "orphan" if it has BOTH:
- ❌ NO test scenarios in baseline (0 scenarios OR empty entry OR commented)
- ❌ NO unit tests

**Implementation Checklist:**
```typescript
✅ Check for empty baseline entries (null, '', {})
✅ Check for commented entries (#API_KEY:)
✅ Use api_mapping for reverse lookup
✅ Verify unit tests exist using APIScanner
```

**Test Cases:**
- `GET_CustomerById:` (empty) → ORPHAN ✅
- `#PUT_UpdateCustomer:` (commented) → ORPHAN ✅
- `POST_CreateCustomer:` (12 scenarios, 0 tests) → NOT ORPHAN ❌

---

### 2. **Test Filtering (MANDATORY)**

**Rule:** Filter unit tests by BOTH endpoint AND method to prevent cross-contamination.

**Special Cases:**
```typescript
// PATCH endpoints - check file patterns
if (method === 'PATCH') {
  if (file.includes('patch') || file.includes('email')) {
    return true; // Include
  }
}

// Path segments must match (singular or plural)
const segments = ['customer', 'customers'];
if (!testDesc.includes(segment)) return false;
```

**Common Issues to Avoid:**
- ❌ GET /{id} tests matching POST scenarios
- ❌ PATCH tests excluded due to 'update' keyword overlap with PUT
- ❌ Cross-endpoint test matching

---

### 3. **AI Gap Analysis (MANDATORY)**

**Rule:** AI MUST analyze and comment on EVERY endpoint, including 100% covered ones.

**For 100% Coverage:**
```
✅ Covered: 10/10
🤖 AI Analysis:
   Status: EXCELLENT
   Message: "All baseline scenarios covered! However, API spec suggests 
            12 additional scenarios for comprehensive testing."
   Missing Scenarios: [list of 12 scenarios]
```

**For <100% Coverage:**
```
⚠️ Gaps: 3 not covered
🤖 AI Analysis:
   Status: NEEDS_IMPROVEMENT
   Message: "Critical gaps found in authentication and error handling"
   P0 Gaps: [list with priorities]
```

---

### 4. **Priority Sorting (MANDATORY)**

**Rule:** ALL lists MUST be sorted by priority: P0 → P1 → P2 → P3

**Apply to:**
- ✅ Orphan tests table
- ✅ Gap analysis
- ✅ Test coverage details
- ✅ Recommendations

**Implementation:**
```typescript
items.sort((a, b) => {
  const order = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
  return order[a.priority] - order[b.priority];
});
```

---

### 5. **Test Mapping Details (MANDATORY)**

**Rule:** "FULLY COVERED (N tests)" MUST be expandable/clickable to show test details.

**Display Format:**
```
When customer is created with valid data, return 201
  FULLY COVERED (2 tests) 👁️ Click to expand
  
  Expanded View:
  ├─ ✅ testCreateCustomer_WithValidData_Returns201Created
  │   📁 CustomerControllerTest.java:42
  │   ⚙️ Confidence: HIGH
  │
  └─ ✅ testCreateCustomer_AllFields_StoresCorrectly  
      📁 CustomerControllerTest.java:58
      ⚙️ Confidence: HIGH
```

---

### 6. **Partial Coverage Detection (MANDATORY)**

**Rule:** Detect and explain WHY a scenario is partially covered.

**Example:**
```
When updating email that already exists, return 409
  PARTIALLY COVERED (1 test)
  
  🤖 AI Explanation:
  Test validates the 409 status code BUT does not verify:
  - Error message format
  - Response body structure
  - Case-insensitive email check
  
  Recommendation: Add assertions for error message and case handling
```

---

## 📊 Report Requirements

### 1. **Coverage Report Sections (MANDATORY ORDER)**

```
1. Executive Summary
   - Total Coverage %
   - P0/P1/P2 Gap counts
   - Orphan API count
   
2. API Coverage Details (sorted by coverage %)
   - 100% covered first (with AI analysis!)
   - Partially covered
   - Not covered last
   
3. Gap Analysis (sorted P0 → P1 → P2 → P3)
   - Each gap with priority, reason, recommendations
   
4. Orphan Tests (sorted by priority)
   - Business tests requiring scenarios
   - Technical tests (informational)
   
5. Orphan APIs
   - APIs with no scenarios AND no tests
   - AI-generated summary
   
6. Recommendations
   - Prioritized action items
```

---

### 2. **Data Integrity (MANDATORY)**

**Rule:** ALWAYS verify data consistency before generating reports.

**Checks:**
```typescript
// Before report generation:
✅ Verify orphan count matches discovered APIs
✅ Verify scenario counts match baseline
✅ Verify test counts match parser results
✅ Verify no duplicate entries
✅ Verify priority assignments are correct
```

---

## 🔍 Validation Rules

### 1. **Pre-Commit Validation (MANDATORY)**

**Blocking Issues (❌ FAIL):**
- P0 gaps detected
- New APIs without tests
- Orphan APIs detected

**Warning Issues (⚠️  WARN):**
- P1 gaps detected
- Orphan tests detected
- Coverage below threshold

---

### 2. **Baseline Validation (MANDATORY)**

**Required Checks:**
```yaml
✅ Valid YAML syntax
✅ api_mapping present
✅ All API keys match mapping
✅ No duplicate endpoints
✅ All scenarios are non-empty
✅ Proper indentation (2 spaces)
✅ No tabs used
```

---

## 🎨 UI/UX Requirements

### 1. **Visual Indicators (MANDATORY)**

```
✅ Fully Covered (green)
⚠️  Partially Covered (yellow)
❌ Not Covered (red)
🔍 Orphan Test (blue)
🚨 Orphan API (red, flashing)
🤖 AI Comment (purple)
```

### 2. **Interactive Elements (MANDATORY)**

- All coverage items must be expandable
- Priority badges must be color-coded
- Test names must link to source files
- Tooltips for all icons and badges

---

## 🧪 Testing Requirements

### 1. **Unit Test Categories**

**Business Tests:** NEED baseline scenarios
- Controller tests (except pure SQL/XSS validation)
- Service tests
- HTTP status checks
- Authentication/authorization
- Error handling
- Data validation
- Business rules

**Technical Tests:** NO baseline needed
- DTO/Entity validation
- Mapper/utility tests
- Pure SQL injection validation
- Pure XSS validation
- Configuration loading

---

### 2. **Test Naming Conventions**

**Pattern:** `test[Method]_[Condition]_[ExpectedResult]`

```java
✅ testCreateCustomer_WithValidData_Returns201Created
✅ testUpdateEmail_WithInvalidFormat_Returns400
✅ testDeleteCustomer_WithNonExistentId_ThrowsNotFoundException

❌ test1()
❌ testCustomer()
❌ itShouldWork()
```

---

## 📝 Baseline Format (MANDATORY)

```yaml
service: service-name

# API Mapping - Maps unique keys to actual endpoints
api_mapping:
  POST_CreateCustomer: "POST /v1/customers"
  GET_ListCustomers: "GET /v1/customers"
  
POST_CreateCustomer:
  happy_case:
    - Scenario description here
  error_case:
    - Another scenario
    
# Empty entries are ORPHAN APIs
GET_CustomerById:

# Commented entries are ORPHAN APIs  
#PUT_UpdateCustomer:
#  happy_case:
#    - Scenario here
```

---

## 🚀 Performance Requirements

1. **Analysis Speed:** <30 seconds per service
2. **Report Generation:** <5 seconds
3. **Cache Invalidation:** Automatic on file changes
4. **Concurrent Processing:** Support multi-service analysis

---

## 🔒 Security Requirements

1. **API Key Management:** Never log or expose API keys
2. **Git Hooks:** Validate before commit
3. **Secrets Scanning:** Mandatory via Gitleaks
4. **Input Validation:** Sanitize all user inputs

---

## 📈 Metrics to Track

### 1. **Coverage Metrics**
- Total coverage %
- Coverage by priority (P0, P1, P2)
- Coverage trend over time
- Gap reduction rate

### 2. **Quality Metrics**
- Orphan API count
- Orphan test count  
- Partial coverage count
- Validation failures

### 3. **Efficiency Metrics**
- Analysis duration
- Report generation time
- False positive rate
- AI accuracy rate

---

## ⚠️ Common Pitfalls to AVOID

1. ❌ Using actual endpoint strings instead of unique keys for lookup
2. ❌ Not checking for empty/commented baseline entries
3. ❌ Filtering tests too broadly (cross-endpoint contamination)
4. ❌ Not analyzing 100% covered endpoints
5. ❌ Not sorting by priority
6. ❌ Making "FULLY COVERED" text non-expandable
7. ❌ Ignoring partial coverage
8. ❌ Missing AI comments
9. ❌ Inconsistent priority assignments
10. ❌ Not validating data integrity

---

## 🎯 Success Criteria

### For Each Analysis Run:

✅ **Orphan Detection:**
- All empty baseline entries flagged
- All commented entries flagged
- All APIs without tests flagged

✅ **Test Filtering:**
- No cross-endpoint contamination
- All relevant tests found
- PATCH endpoints work correctly

✅ **AI Analysis:**
- Every endpoint has AI comments
- 100% covered endpoints analyzed
- Partial coverage explained
- Missing scenarios identified

✅ **Report Quality:**
- Priority sorted throughout
- Test mapping expandable
- Data integrity verified
- Visual indicators present

✅ **Validation:**
- Baseline valid
- No false positives
- Clear error messages
- Actionable recommendations

---

## 📚 Reference Implementation

See these files for reference:
- `lib/core/EnhancedCoverageAnalyzer.ts` - Analysis logic
- `lib/core/ReportGenerator.ts` - Report creation
- `lib/templates/enhanced-report.html` - HTML template
- `.traceability/test-cases/baseline/*.yml` - Baseline format

---

## 🔄 Continuous Improvement

This document MUST be updated when:
1. New edge cases discovered
2. Validation rules change
3. Report format evolves
4. Performance optimizations applied
5. User feedback incorporated

**Last Updated:** 2025-01-11  
**Version:** 1.0.0  
**Status:** MANDATORY FOR ALL AI OPERATIONS
