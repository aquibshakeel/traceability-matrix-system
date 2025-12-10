# Expected Test Results Configuration

## Overview
This document defines the exact expected behavior for the traceability matrix validation system using the customer-service as a test case.

## Test Configuration Matrix

### 1. POST_CreateCustomer (POST /v1/customers)
**Configuration:**
- ✅ Baseline Test Cases: 12 scenarios
- ❌ Unit Tests: 0 (no test file exists)

**Expected Result:**
- Coverage: 0% (0/12)
- Status: ❌ BLOCKING - All 12 scenarios go into gaps bucket
- Priority: AI decides (expected P0/P1 for critical scenarios like auth, validation)
- Report Section: Critical Gaps

**Test Cases:**
1. When customer is created with valid data, return 201 and customer ID
2. When customer is created with all optional fields, return 201 and store all fields
3. When customer name has special characters, accept and store correctly
4. When customer name is at maximum length (255 chars), accept successfully
5. When customer email has unusual but valid format, accept successfully
6. When customer is created with missing required fields, return 400
7. When customer is created with invalid email format, return 400
8. When customer is created with duplicate email, return 409
9. When customer name exceeds maximum length, return 400
10. When customer name contains SQL injection attempt, reject with 400
11. When customer name contains XSS attempt, sanitize and accept
12. When request is made without authentication token, return 401

---

### 2. GET_ListAllCustomers (GET /v1/customers)
**Configuration:**
- ✅ Baseline Test Cases: 10 scenarios
- ✅ Unit Tests: 10 tests (CustomerControllerGetAllTest.java)

**Expected Result:**
- Coverage: 100% (10/10) ✅
- Status: ✅ PASSING - Perfect 1:1 mapping
- Gaps: 0 critical gaps
- AI Suggestions: May suggest additional scenarios (informational only)
- Report Section: Fully Covered

**Test Mapping:**
| Baseline Scenario | Unit Test |
|-------------------|-----------|
| When requesting all customers with valid authentication, return 200 and list | testGetAllCustomers_WithAuthentication_ReturnsListSuccessfully |
| When requesting customers filtered by valid age, return 200 and filtered list | testGetCustomers_WithValidAgeFilter_ReturnsFilteredList |
| When requesting all customers with empty database, return 200 and empty array | testGetAllCustomers_WithEmptyDatabase_ReturnsEmptyList |
| When requesting customers by age and multiple match, return 200 and all matching | testGetCustomers_WithMultipleMatches_ReturnsAllMatches |
| When requesting customers by age zero, return 200 and customers with age 0 | testGetCustomers_WithAgeZero_ReturnsMatchingCustomers |
| When requesting customers by maximum age value (120), return 200 and matching | testGetCustomers_WithMaximumAge_ReturnsMatchingCustomers |
| When requesting customers by age with no matches, return 200 and empty array | testGetCustomers_WithNoMatches_ReturnsEmptyList |
| When requesting customers with invalid age format (negative), return 400 | testGetCustomers_WithNegativeAge_ThrowsException |
| When requesting customers without authentication token, return 401 | testGetCustomers_WithoutAuthentication_ThrowsUnauthorizedException |
| When requesting customers with SQL injection in age parameter, reject safely | testGetCustomers_WithSQLInjectionInAge_HandledSafely |

---

### 3. GET_CustomerById (GET /v1/customers/{id})
**Configuration:**
- ❌ Baseline Test Cases: 0 (empty section)
- ❌ Unit Tests: 0

**Expected Result:**
- Coverage: N/A
- Status: ⚠️ ORPHAN API - Flagged as critical risk
- Report Section: Orphan APIs
- AI Action: Should generate suggestions for QA to add baseline scenarios

**Baseline:**
```yaml
GET_CustomerById:
  # Empty - No scenarios defined
```

---

### 4. PUT_UpdateCustomer (PUT /v1/customers/{id})
**Configuration:**
- ❌ Baseline Test Cases: 0 (commented out)
- ❌ Unit Tests: 0

**Expected Result:**
- Coverage: N/A
- Status: ⚠️ ORPHAN API - Flagged as critical risk
- Report Section: Orphan APIs
- Reason: Scenarios exist but are commented (treated as 0)

**Baseline:**
```yaml
PUT_UpdateCustomer:
  # Commented scenarios - treated as no baseline
  # happy_case:
  #   - When customer is updated with valid data, return 200 and updated data
  #   - When customer is updated with partial data, return 200 and update only provided fields
  # ...
```

---

### 5. DELETE_DeleteCustomer (DELETE /v1/customers/{id})
**Configuration:**
- ✅ Baseline Test Cases: 5 scenarios
- ✅ Unit Tests: 5 tests (CustomerControllerDeleteTest.java)

**Expected Result:**
- Coverage: 100% (5/5) ✅
- Status: ✅ FULLY COVERED
- AI Suggestions: May suggest 10-15 additional scenarios (informational, not blocking)
- Report Section: Fully Covered

**Test Mapping:**
| Baseline Scenario | Unit Test |
|-------------------|-----------|
| When customer is deleted by valid ID, return 204 | testDeleteCustomer_WithValidId_Returns204 |
| When customer is deleted successfully, verify no longer exists | testDeleteCustomer_VerifiesCustomerDeleted |
| When deleting non-existent customer, return 404 | testDeleteCustomer_WithNonExistentId_ThrowsNotFoundException |
| When deleting without authentication, return 401 | testDeleteCustomer_WithoutAuthentication_ThrowsUnauthorizedException |
| When deleting with invalid ID format, return 400 | testDeleteCustomer_WithInvalidIdFormat_ThrowsBadRequestException |

**Note:** AI will suggest additional scenarios like:
- Boundary value testing (min/max ID)
- Permission-based deletion (403)
- Cascade deletion scenarios
- These are NOT gaps, just enhancement suggestions

---

### 6. PATCH_UpdateCustomerEmail (PATCH /v1/customers/{id}/email)
**Configuration:**
- ✅ Baseline Test Cases: 3 scenarios
- ⚠️ Unit Tests: 2 tests (CustomerControllerEmailTest.java)

**Expected Result:**
- Coverage: 67% (2/3) ⚠️
- Status: ⚠️ PARTIAL COVERAGE
- Gaps: 1 scenario not covered (expected P1/P2)
- Report Section: Partially Covered

**Test Mapping:**
| Baseline Scenario | Unit Test | Status |
|-------------------|-----------|--------|
| When customer email is updated with valid format, return 200 | testUpdateEmail_WithValidFormat_Returns200 | ✅ Covered |
| When updating email with invalid format, return 400 | testUpdateEmail_WithInvalidFormat_Returns400 | ✅ Covered |
| When updating email that already exists, return 409 | (missing) | ❌ Gap |

---

## Summary Statistics

### Expected Coverage Report
```
Total APIs: 6
Total Scenarios: 35
  - POST_CreateCustomer: 12
  - GET_ListAllCustomers: 10
  - GET_CustomerById: 0
  - PUT_UpdateCustomer: 0 (commented)
  - DELETE_DeleteCustomer: 5
  - PATCH_UpdateCustomerEmail: 3

Total Unit Tests: 27
  - POST: 0
  - GET /customers: 10
  - GET /customers/{id}: 0
  - PUT: 0
  - DELETE: 5
  - PATCH: 2

Coverage:
  - Fully Covered: 15/35 (42.9%)
    * GET_ListAllCustomers: 10
    * DELETE_DeleteCustomer: 5
  - Partially Covered: 2/35 (5.7%)
    * PATCH_UpdateCustomerEmail: 2
  - Not Covered: 12/35 (34.3%)
    * POST_CreateCustomer: 12
  - N/A (Orphan APIs): 6 scenarios pending
    * GET_CustomerById: pending scenarios
    * PUT_UpdateCustomer: pending scenarios

Critical Gaps: 12 (all from POST endpoint)
Priority Breakdown:
  - P0: ~4-5 (auth, critical validation)
  - P1: ~4-5 (error cases)
  - P2: ~2-3 (edge cases)

Orphan APIs: 2
  - GET_CustomerById
  - PUT_UpdateCustomer

Orphan Tests: ~10
  - GET_CustomerById tests without scenarios (business orphans)
```

### Expected Validation Outcome
**Result:** ❌ BLOCKING - Cannot commit

**Reasons:**
1. 12 P0/P1 gaps in POST_CreateCustomer endpoint
2. 2 Orphan APIs require scenarios
3. 1 gap in PATCH_UpdateCustomerEmail

**Actions Required:**
1. **DEV:** Create unit tests for POST_CreateCustomer (12 tests needed)
2. **QA:** Add baseline scenarios for GET_CustomerById
3. **QA:** Uncomment and refine PUT_UpdateCustomer scenarios
4. **DEV:** Create unit test for duplicate email scenario in PATCH endpoint

---

## File Structure

### Baseline File
Location: `.traceability/test-cases/baseline/customer-service-baseline.yml`

Structure:
```yaml
service: customer-service

api_mapping:
  POST_CreateCustomer: "POST /v1/customers"
  GET_ListAllCustomers: "GET /v1/customers"
  GET_CustomerById: "GET /v1/customers/{id}"
  PUT_UpdateCustomer: "PUT /v1/customers/{id}"
  DELETE_DeleteCustomer: "DELETE /v1/customers/{id}"
  PATCH_UpdateCustomerEmail: "PATCH /v1/customers/{id}/email"

POST_CreateCustomer:
  # 12 scenarios

GET_ListAllCustomers:
  # 10 scenarios

GET_CustomerById:
  # Empty

PUT_UpdateCustomer:
  # Commented out

DELETE_DeleteCustomer:
  # 5 scenarios

PATCH_UpdateCustomerEmail:
  # 3 scenarios
```

### Unit Test Files
Location: `services/customer-service/src/test/java/com/pulse/customerservice/controller/`

Files:
- CustomerControllerGetAllTest.java (10 tests for GET /customers)
- CustomerControllerDeleteTest.java (5 tests for DELETE)
- CustomerControllerEmailTest.java (2 tests for PATCH)
- CustomerControllerTest.java (10 tests for GET /{id} - orphans)

Missing:
- CustomerControllerCreateTest.java (needs to be created with 12 tests)
- CustomerControllerUpdateTest.java (commented out or deleted)

---

## Validation Command
```bash
git add .
git commit -m "test message"
```

Expected console output will show:
- ✅ Secrets scanning passed
- ❌ Unit-Test Traceability validation FAILED
- Coverage: 42.9%
- P0 Gaps: 4-5
- P1 Gaps: 4-5
- Orphan APIs: 2
- Blocking commit

---

## Notes

1. **Unique API Keys:** The system uses unique keys (POST_CreateCustomer, GET_ListAllCustomers, etc.) with an api_mapping section to avoid cross-endpoint test matching confusion.

2. **Filtering Logic:** Tests are filtered by endpoint using both path segments and HTTP method keywords to ensure accurate matching.

3. **AI Suggestions:** The AI generates additional scenario suggestions based on API spec analysis. These are informational and not counted as gaps unless a unit test exists without a corresponding baseline scenario.

4. **Orphan Categorization:** Tests without baseline scenarios are categorized as Technical (no scenario needed) or Business (scenario required). Business orphans are flagged for QA attention.

5. **Partial Coverage:** Scenarios with unit tests that don't fully verify all aspects are marked as "partially covered" but don't block commits unless the gap is critical (P0/P1).
