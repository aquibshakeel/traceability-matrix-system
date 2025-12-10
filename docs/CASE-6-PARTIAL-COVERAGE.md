# 🎯 Case 6: Partial Coverage Demonstration

## PUT /v1/customers/{id} - Mixed Coverage States

**Objective:** Demonstrate PARTIALLY_COVERED status and how AI identifies incomplete test coverage

---

## 📊 Implementation Summary

### API: `PUT /v1/customers/{id}`
**Baseline Scenarios:** 5  
**Unit Tests:** 4  
**File:** `CustomerControllerUpdateTest.java`

### Coverage Breakdown:
- ✅ **FULLY_COVERED:** 2 scenarios (40%)
- ⚠️ **PARTIALLY_COVERED:** 2 scenarios (40%)
- ❌ **NOT_COVERED:** 1 scenario (20%)
- **Overall:** 40% fully covered, 60% has gaps

---

## 📋 Baseline Scenarios

```yaml
PUT /v1/customers/{id}:
  happy_case:
    1. When customer is updated with valid data, return 200 and updated data
    2. When customer is updated with partial data, return 200 and update only provided fields

  edge_case:
    3. When updating customer with same data, return 200 without changes

  error_case:
    4. When updating non-existent customer, return 404
    5. When updating with duplicate email, return 409
```

**Total:** 5 scenarios  
**Priority:** P3: 3, P1: 2

---

## 🎯 Scenario-by-Scenario Analysis

### ✅ Scenario 1: FULLY_COVERED

**Baseline:**
```
When customer is updated with valid data, return 200 and updated data
```

**Unit Test:**
```java
@Test
@DisplayName("When customer is updated with valid data, return 200 and updated data")
void testUpdateCustomer_WithValidData_Returns200()
```

**Coverage Status:** ✅ FULLY_COVERED  
**Match Confidence:** HIGH  
**Why Fully Covered:**
- ✅ Test exists with exact matching @DisplayName
- ✅ Tests valid data update flow
- ✅ Validates 200 status code
- ✅ Verifies updated data returned
- ✅ Confirms service method called correctly

**Priority:** P3 (Happy path)

---

### ⚠️ Scenario 2: PARTIALLY_COVERED

**Baseline:**
```
When customer is updated with partial data, return 200 and update only provided fields
```

**Unit Test:**
```java
@Test
@DisplayName("Update customer with partial data")
void testUpdateCustomer_WithPartialData_UpdatesSuccessfully()
```

**Coverage Status:** ⚠️ PARTIALLY_COVERED  
**Match Confidence:** MEDIUM  
**Why Partially Covered:**
- ✅ Test exists for partial data update
- ✅ Tests basic update flow
- ✅ Validates 200 status code
- ❌ **Missing:** Verification that OTHER fields remained unchanged
- ❌ **Missing:** Assertion to confirm ONLY email was updated
- ❌ **Missing:** Should fetch original customer and compare

**Gap Details:**
```
What's Missing:
1. Verify unprovided fields (firstName, lastName, age) remain unchanged
2. Fetch customer before and after update to confirm selective update
3. Add assertions comparing original vs updated state
4. Test that null/missing fields don't overwrite existing values

Recommendation:
Add assertions like:
- assertEquals(originalFirstName, updatedCustomer.getFirstName())
- assertEquals(originalLastName, updatedCustomer.getLastName())
- assertEquals(originalAge, updatedCustomer.getAge())
- assertNotEquals(originalEmail, updatedCustomer.getEmail())
```

**Priority:** P3 (Happy path but critical behavior)

---

### ⚠️ Scenario 3: PARTIALLY_COVERED

**Baseline:**
```
When updating customer with same data, return 200 without changes
```

**Unit Test:**
```java
@Test
@DisplayName("Update customer with same data")
void testUpdateCustomer_WithSameData_Returns200()
```

**Coverage Status:** ⚠️ PARTIALLY_COVERED  
**Match Confidence:** MEDIUM  
**Why Partially Covered:**
- ✅ Test exists for same data scenario
- ✅ Tests update with identical data
- ✅ Validates 200 status code
- ❌ **Missing:** Verification that NO database write occurred
- ❌ **Missing:** Check that service detects "same data" condition
- ❌ **Missing:** Assertion on "without changes" optimization

**Gap Details:**
```
What's Missing:
1. Verify service.updateCustomer was NOT actually called (or called but skipped DB write)
2. Check for "no changes" optimization in response/behavior
3. Validate that last modified timestamp didn't change
4. Confirm no unnecessary database operations

Recommendation:
Add behavior checks:
- Mock repository to verify save() was never called
- Or verify service returns early without DB write
- Check response indicates "no changes made"
- Validate optimization for performance
```

**Priority:** P2 (Edge case - performance optimization)

---

### ✅ Scenario 4: FULLY_COVERED

**Baseline:**
```
When updating non-existent customer, return 404
```

**Unit Test:**
```java
@Test
@DisplayName("When updating non-existent customer, return 404")
void testUpdateCustomer_WithNonExistentId_ThrowsNotFoundException()
```

**Coverage Status:** ✅ FULLY_COVERED  
**Match Confidence:** HIGH  
**Why Fully Covered:**
- ✅ Test exists with exact matching @DisplayName
- ✅ Tests non-existent customer scenario
- ✅ Validates CustomerNotFoundException thrown
- ✅ Verifies 404 error handling
- ✅ Confirms service method called

**Priority:** P1 (Error case)

---

### ❌ Scenario 5: NOT_COVERED

**Baseline:**
```
When updating with duplicate email, return 409
```

**Unit Test:**
```
❌ NO TEST EXISTS
```

**Coverage Status:** ❌ NOT_COVERED  
**Match Confidence:** NONE  
**Why Not Covered:**
- ❌ No test found for this scenario
- ❌ Duplicate email conflict not tested
- ❌ 409 status code validation missing
- ❌ Business rule (unique email) not verified

**Gap Details:**
```
What's Missing:
COMPLETE TEST - No coverage at all

Required Test:
@Test
@DisplayName("When updating with duplicate email, return 409")
void testUpdateCustomer_WithDuplicateEmail_ThrowsConflictException() {
    // Arrange
    String customerId = "123";
    CustomerRequest request = CustomerRequest.builder()
        .email("existing@example.com") // Already exists for another customer
        .build();
    
    when(customerService.updateCustomer(customerId, request))
        .thenThrow(new DuplicateEmailException("Email already exists"));
    
    // Act & Assert
    assertThrows(DuplicateEmailException.class, () -> {
        customerController.updateCustomer(customerId, request);
    });
}

Recommendation:
- Priority: P1 (High) - Data integrity violation
- Impact: Critical business rule not tested
- Risk: Duplicate emails could be allowed
- Action: Create complete unit test ASAP
```

**Priority:** P1 (Error case - data integrity)

---

## 📊 Expected Analysis Output

### Console Output:
```
📊 Analyzing: customer-service
======================================================================
✓ Baseline: 5 scenarios for PUT /v1/customers/{id}
✓ Unit tests: 4 found

PUT /v1/customers/{id}:
  ✅ Covered: 2/5 (40%)
  ⚠️  Partially: 2/5 (40%)
  ❌ Not Covered: 1/5 (20%)
  
  Status: MIXED COVERAGE - Action Required

Gaps Identified:
  - Scenario 2: Partial - Missing field-level validation
  - Scenario 3: Partial - Missing "no changes" verification  
  - Scenario 5: Not Covered - Duplicate email test missing

======================================================================
📈 Coverage: 40% fully covered
⚠️  Gaps: P1=1, P2=1, P3=2
```

---

### HTML Report Sections:

**1. Coverage Dashboard:**
```
PUT /v1/customers/{id}
Status: ⚠️ PARTIALLY COVERED (40%)

Breakdown:
✅ Fully Covered: 2 scenarios (40%)
⚠️  Partially Covered: 2 scenarios (40%)
❌ Not Covered: 1 scenario (20%)

Action Required: 3 gaps need attention
```

**2. Detailed Gap Analysis:**

**Gap 1: Partial Coverage - Scenario 2**
```
📋 Scenario: "When customer is updated with partial data..."
⚠️  Status: PARTIALLY_COVERED
🎯 Priority: P3 (Medium)

What's Missing:
- Verification that unprovided fields remain unchanged
- Field-level update validation
- Before/after state comparison

Recommendations:
1. Add assertions to verify selective field updates
2. Fetch and compare original vs updated customer
3. Test that null fields don't overwrite existing data

Current Test: testUpdateCustomer_WithPartialData_UpdatesSuccessfully()
File: CustomerControllerUpdateTest.java
Line: 74
```

**Gap 2: Partial Coverage - Scenario 3**
```
📋 Scenario: "When updating customer with same data..."
⚠️  Status: PARTIALLY_COVERED
🎯 Priority: P2 (Low-Medium)

What's Missing:
- Verification of "without changes" optimization
- Database write prevention check
- Performance optimization validation

Recommendations:
1. Verify service skips unnecessary DB writes
2. Check that save() method not called
3. Validate "no changes" response indicator

Current Test: testUpdateCustomer_WithSameData_Returns200()
File: CustomerControllerUpdateTest.java
Line: 102
```

**Gap 3: No Coverage - Scenario 5**
```
📋 Scenario: "When updating with duplicate email, return 409"
❌ Status: NOT_COVERED
🎯 Priority: P1 (HIGH - Data Integrity)

What's Missing:
- COMPLETE TEST MISSING
- Duplicate email validation not tested
- 409 Conflict response not verified
- Business rule enforcement not checked

Recommendations:
1. CREATE NEW TEST immediately
2. Test DuplicateEmailException thrown
3. Verify 409 status code returned
4. Validate unique email constraint enforced

⚠️  CRITICAL: This is a data integrity issue
```

---

## 🎯 Action Items by Priority

### P1 (HIGH) - Immediate Action Required
```
❌ Create test for duplicate email scenario
   - File: CustomerControllerUpdateTest.java
   - Add: testUpdateCustomer_WithDuplicateEmail_ThrowsConflictException()
   - Impact: Data integrity violation possible
   - Timeline: Before next release
```

### P2 (MEDIUM) - Should Fix
```
⚠️  Enhance "same data" test
   - File: CustomerControllerUpdateTest.java
   - Method: testUpdateCustomer_WithSameData_Returns200()
   - Add: Verification of optimization behavior
   - Impact: Performance not validated
```

### P3 (LOW-MEDIUM) - Nice to Have
```
⚠️  Enhance "partial data" test
   - File: CustomerControllerUpdateTest.java
   - Method: testUpdateCustomer_WithPartialData_UpdatesSuccessfully()
   - Add: Field-level change verification
   - Impact: Behavior not fully validated
```

---

## 📈 Coverage Improvement Path

### Current State:
```
PUT /v1/customers/{id}
├── ✅ Fully Covered: 40% (2/5)
├── ⚠️  Partially: 40% (2/5)
└── ❌ Not Covered: 20% (1/5)

Overall: 40% → ⚠️  NEEDS IMPROVEMENT
```

### After Fixing P1 Gap:
```
PUT /v1/customers/{id}
├── ✅ Fully Covered: 60% (3/5)
├── ⚠️  Partially: 40% (2/5)
└── ❌ Not Covered: 0% (0/5)

Overall: 60% → ⚠️  BETTER BUT STILL PARTIAL
```

### After Fixing All Gaps:
```
PUT /v1/customers/{id}
├── ✅ Fully Covered: 100% (5/5)
├── ⚠️  Partially: 0% (0/5)
└── ❌ Not Covered: 0% (0/5)

Overall: 100% → ✅ FULLY COVERED
```

---

## 🎨 Visual Traceability Matrix

```
BASELINE SCENARIO                                 ←→ UNIT TEST                    STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Update with valid data, return 200             ←→ testUpdateCustomer_WithValid...   ✅ FULL
   Priority: P3 | Line 38 | HIGH confidence

2. Update with partial data, only provided fields ←→ testUpdateCustomer_WithPartial... ⚠️ PARTIAL
   Priority: P3 | Line 74 | MEDIUM confidence
   Missing: Field-level validation, unchanged field verification

3. Update with same data, no changes              ←→ testUpdateCustomer_WithSame...    ⚠️ PARTIAL
   Priority: P2 | Line 102 | MEDIUM confidence
   Missing: "Without changes" behavior, DB optimization check

4. Update non-existent customer, return 404       ←→ testUpdateCustomer_WithNonEx...   ✅ FULL
   Priority: P1 | Line 132 | HIGH confidence

5. Update with duplicate email, return 409        ←→ [NO TEST]                         ❌ NONE
   Priority: P1 | CRITICAL GAP
   Missing: COMPLETE TEST - Data integrity risk!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COVERAGE: 2 FULL + 2 PARTIAL + 1 NONE = 40% Fully Covered ⚠️
```

---

## ✅ What Case 6 Demonstrates

### 1. **PARTIALLY_COVERED Detection**
- ✅ AI recognizes when test exists but is incomplete
- ✅ Identifies specific missing validations
- ✅ Differentiates between "some coverage" and "full coverage"
- ✅ Provides actionable remediation steps

### 2. **Mixed Coverage States**
- ✅ Shows 3 different coverage statuses in one API
- ✅ Demonstrates real-world test quality issues
- ✅ Highlights incremental coverage improvement
- ✅ Prioritizes gaps by business impact

### 3. **Detailed Gap Analysis**
- ✅ Explains WHY coverage is partial
- ✅ Lists specific missing assertions
- ✅ Suggests concrete improvements
- ✅ Provides code examples for fixes

### 4. **Priority-Driven Actions**
- ✅ Flags P1 gap (duplicate email) as critical
- ✅ Marks P2/P3 gaps as improvements
- ✅ Helps teams focus on high-impact gaps first
- ✅ Supports incremental quality improvement

---

## 🎯 Comparison with Other Cases

| Aspect | Case 4 (Full) | Case 5 (Baseline 100%) | Case 6 (Partial) |
|--------|---------------|------------------------|------------------|
| **API** | GET /v1/customers | DELETE /v1/customers/{id} | PUT /v1/customers/{id} |
| **Scenarios** | 10 | 5 | 5 |
| **Tests** | 10 | 5 | 4 |
| **Full Coverage** | 100% (10/10) | 100% (5/5) | 40% (2/5) |
| **Partial Coverage** | 0% | 0% | 40% (2/5) |
| **Not Covered** | 0% | 0% | 20% (1/5) |
| **Status** | ✅ Complete | ✅ Baseline OK | ⚠️ Needs Work |
| **Message** | "Fully covered" | "Baseline + AI gaps" | "Partial - Fix 3 gaps" |

---

## 📚 Key Learnings

1. **Partial coverage is common in real projects**
   - Tests exist but don't fully validate behavior
   - Easy to miss edge cases and assertions
   - AI helps identify what's missing

2. **3 coverage states matter:**
   - FULLY_COVERED = Complete validation ✅
   - PARTIALLY_COVERED = Some coverage, incomplete ⚠️
   - NOT_COVERED = No test at all ❌

3. **Partial > None > Nothing:**
   - Better to have partial than nothing
   - Can incrementally improve from partial to full
   - System guides improvement path

4. **AI provides actionable feedback:**
   - Not just "it's partial"
   - Explains WHAT'S missing
   - Suggests HOW to fix
   - Prioritizes by impact

---

**Generated:** December 10, 2025  
**Status:** ✅ Case 6 Complete  
**Coverage:** 40% fully covered (mixed states)  
**Demonstrates:** PARTIALLY_COVERED detection and gap analysis
