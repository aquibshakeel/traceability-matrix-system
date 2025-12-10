# 🎯 Partial Coverage Demo & Test Mapping Guide

**Purpose:** Demonstrate how partial coverage works, how test mapping expands, and best practices for understanding traceability.

---

## 📊 What is Partial Coverage?

**Partial Coverage** occurs when a baseline scenario is partially tested by unit tests - meaning the test exists but doesn't fully validate all aspects of the scenario.

### Coverage Levels:

| Status | Meaning | Example |
|--------|---------|---------|
| **FULLY_COVERED** | Unit test(s) completely validate the scenario | Scenario: "When customer ID exists, return 200 with customer data"<br>Test: Checks status=200 AND validates customer object |
| **PARTIALLY_COVERED** | Unit test(s) exist but validation incomplete | Scenario: "When customer ID exists, return 200 with customer data"<br>Test: Checks status=200 BUT doesn't validate customer object |
| **NOT_COVERED** | No unit tests found for this scenario | Scenario exists in baseline, but no matching test |

---

## 🔗 Test Mapping Expansion (Clickable Details)

The HTML report includes **expandable test mapping** that shows exactly which unit tests cover each scenario.

### Example from Report:

```html
<details style="margin-top: 8px;">
  <summary style="cursor: pointer; color: #667eea;">
    📄 Show details
  </summary>
  <div style="margin-top: 10px; padding: 10px; background: #f8f9fa;">
    <div><strong>File:</strong> <code>CustomerControllerTest.java</code></div>
    <div><strong>Line:</strong> 45</div>
    <div><strong>Match Confidence:</strong> HIGH</div>
  </div>
</details>
```

### How It Works:

1. **Click** the "📄 Show details" to expand
2. **View** exact file path, line number, and confidence level
3. **Navigate** to the test file to verify coverage
4. **Assess** if the test truly validates the scenario

---

## 💡 Partial Coverage Example: Real-World Scenario

### Baseline Scenario:
```yaml
GET /v1/customers/{id}:
  happy_case:
    - "When customer ID exists, return 200 with complete customer object including name, email, age"
```

### Unit Test (Partial Coverage):
```java
@Test
public void getCustomerById_WithValidId_Returns200() {
    // Given
    String customerId = "123";
    
    // When
    ResponseEntity<?> response = controller.getCustomerById(customerId);
    
    // Then
    assertEquals(HttpStatus.OK, response.getStatusCode());  // ✅ Checks status
    // ❌ MISSING: Doesn't validate customer object content
}
```

### Why This is Partial Coverage:

| Scenario Requirement | Test Validation | Status |
|---------------------|----------------|---------|
| Return 200 status | ✅ Verified | Covered |
| Return customer object | ❌ Not checked | Missing |
| Validate name field | ❌ Not checked | Missing |
| Validate email field | ❌ Not checked | Missing |
| Validate age field | ❌ Not checked | Missing |

**Result:** PARTIALLY_COVERED (1/5 validations)

### How to Fix:

```java
@Test
public void getCustomerById_WithValidId_ReturnsCompleteCustomer() {
    // Given
    String customerId = "123";
    
    // When
    ResponseEntity<CustomerResponse> response = controller.getCustomerById(customerId);
    
    // Then
    assertEquals(HttpStatus.OK, response.getStatusCode());  // ✅
    assertNotNull(response.getBody());                      // ✅
    assertEquals("John Doe", response.getBody().getName()); // ✅
    assertEquals("john@example.com", response.getBody().getEmail()); // ✅
    assertEquals(30, response.getBody().getAge());          // ✅
}
```

**Result:** FULLY_COVERED (5/5 validations)

---

## 🚀 Test Mapping Confidence Levels

The AI analyzer assigns confidence levels to test-scenario matches:

### HIGH Confidence (✅)
- Test name semantically matches scenario
- Test validates expected behavior
- Strong keyword overlap (4+ common words)
- **Action:** Trust this mapping

### MEDIUM Confidence (⚠️)
- Test name partially matches scenario
- Test validates some but not all aspects
- Moderate keyword overlap (2-3 common words)
- **Action:** Review test to ensure full coverage

### LOW Confidence (❌)
- Test name weakly matches scenario
- Unclear if test validates scenario
- Minimal keyword overlap (1-2 common words)
- **Action:** Verify if this is correct match, may need refactoring

---

## 📋 Best Practices

### For QA Teams:

1. **Review Partial Coverage**
   - Click "Show details" to see which tests are linked
   - Navigate to test files and verify completeness
   - Update baseline if scenarios are too broad

2. **Prioritize Gaps**
   - Focus on P0 gaps first (critical scenarios)
   - Use AI suggestions for additional scenarios
   - Copy YAML format for quick baseline updates

3. **Validate Traceability**
   - Check "Traceability Matrix" section
   - Ensure HIGH confidence matches
   - Investigate MEDIUM/LOW confidence matches

### For Dev Teams:

1. **Write Complete Tests**
   - Validate ALL aspects of scenario
   - Don't just check status codes
   - Include assertions for data validation

2. **Use Descriptive Test Names**
   - Match baseline scenario wording
   - Use "When X, then Y" format
   - Helps AI matching accuracy

3. **Fix Partial Coverage**
   - Expand tests to cover all validations
   - Split complex scenarios if needed
   - Aim for FULLY_COVERED status

---

## 🎨 Visual Guide: Report Sections

### 1. Coverage Gaps (Top Priority)
```
⚠️ Coverage Gaps (5)
├─ P0: Critical scenarios without tests
├─ P1: Important scenarios missing coverage
└─ P2: Nice-to-have scenarios
```

### 2. API Coverage Analysis
```
🎯 API Coverage Analysis
├─ Actual Coverage (Baseline vs Unit Tests)
│  ├─ 7 Fully covered
│  ├─ 2 Partially covered ⚠️
│  └─ 1 Missing unit tests ❌
└─ AI-Powered Analysis (from API Spec)
   └─ 10 additional scenarios suggested 🤖
```

### 3. Traceability Matrix (Expandable)
```
🔗 Traceability Matrix
└─ GET /v1/customers/{id}
   ├─ Scenario: "When customer exists..."
   │  └─ ✅ Matched Unit Tests (2)
   │     ├─ getCustomerById_WithValidId [HIGH]
   │     │  └─ 📄 Show details (clickable)
   │     └─ getCustomerById_ReturnsCustomer [MEDIUM]
   └─ [Click to expand each test]
```

### 4. Orphan Tests (Priority Sorted)
```
🔍 Orphan Unit Tests (10)
├─ 📋 Copy-Ready YAML (for QA)
└─ Sorted by Priority:
   ├─ P0: Critical tests (2) 🚨
   ├─ P1: Important tests (3)
   └─ P2: Normal tests (5)
```

---

## 🔍 Interactive Features

### 1. Expandable Sections
- Click **▼** next to section headers to collapse/expand
- Useful for focusing on specific areas
- Saves scrolling in large reports

### 2. Clickable Test Details
- Click **"📄 Show details"** to see:
  - Full file path
  - Line number
  - Match confidence
  - QA action (if needed)

### 3. Copy YAML Button
- One-click copy for orphan tests
- Pre-formatted for baseline YAML
- Grouped by API endpoint
- Categorized (happy_case, error_case, etc.)

---

## 📈 Metrics Tracking

### Coverage Percentage Calculation:
```
Coverage % = (Fully Covered / Total Scenarios) × 100
```

**Note:** Partial coverage is NOT counted as covered.

### Example:
- Total Scenarios: 35
- Fully Covered: 17
- Partially Covered: 3
- Not Covered: 15

**Coverage: 48.6%** (17/35, partial not counted)

### Gap Priority Breakdown:
```
Total Gaps: 18
├─ P0: 2 (Critical - blocks commit)
├─ P1: 3 (Important - review required)
└─ P2: 13 (Normal - nice to have)
```

---

## 🎯 Success Criteria

### Excellent Coverage (>90%)
- ✅ All critical scenarios covered
- ✅ No P0 gaps
- ✅ Most scenarios FULLY_COVERED
- ✅ Few orphan tests

### Good Coverage (70-90%)
- ✅ Critical scenarios covered
- ⚠️ Some P1/P2 gaps
- ⚠️ Some PARTIALLY_COVERED
- ⚠️ Some orphan tests

### Needs Improvement (<70%)
- ❌ Critical gaps exist
- ❌ Many NOT_COVERED
- ❌ Many PARTIALLY_COVERED
- ❌ Many orphan tests

---

## 💻 CLI Quick Reference

### Run Full Analysis:
```bash
npm run analyze
```

### Generate AI Test Cases:
```bash
npm run generate
```

### Generate Reports Only:
```bash
npm run continue
```

### Open HTML Report:
```bash
open .traceability/reports/customer-service-report.html
```

---

## 🎓 Learning Resources

1. **AI-PRIORITY-LOGIC.md** - How AI prioritizes gaps
2. **TWO-PHASE-ANALYSIS-EXPLAINED.md** - System architecture
3. **SCENARIO-COMPLETENESS-DETECTION.md** - AI suggestions explained
4. **QA_GUIDE.md** - Full QA team guide
5. **DEV_GUIDE.md** - Full developer guide

---

## 📞 Support

Need help? Check:
- 📖 Documentation: `docs/` folder
- 🐛 Report Issues: Use `/reportbug` in chat
- 💡 Feature Requests: Create GitHub issue

---

**Last Updated:** December 11, 2025
**Version:** 1.0.0
