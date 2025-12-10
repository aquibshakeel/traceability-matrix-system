# System Statistics & Coverage Analysis

**Service:** customer-service  
**Generated:** December 10, 2025  
**Version:** 6.1.0

---

## 📊 Overall Statistics

### APIs
- **Total APIs:** 6
- **APIs with Scenarios:** 5
- **Orphan APIs:** 1

| API | Method | Scenarios | Status |
|-----|--------|-----------|--------|
| `/v1/customers` | POST | 12 | ❌ No tests |
| `/v1/customers` | GET | 10 | ✅ 100% covered |
| `/v1/customers/{id}` | GET | 0 | 🔴 **ORPHAN API** |
| `/v1/customers/{id}` | PUT | 5 | 80% covered |
| `/v1/customers/{id}` | DELETE | 5 | ✅ 100% covered |
| `/v1/customers/{id}/email` | PATCH | 3 | ⚠️ **33% partial coverage** |

---

### Test Cases (Baseline Scenarios)
- **Total Baseline Scenarios:** 35

**Breakdown by API:**
- POST /v1/customers: 12 scenarios
- GET /v1/customers: 10 scenarios
- GET /v1/customers/{id}: 0 scenarios (ORPHAN API)
- PUT /v1/customers/{id}: 5 scenarios
- DELETE /v1/customers/{id}: 5 scenarios
- PATCH /v1/customers/{id}/email: 3 scenarios

---

### Unit Tests
- **Total Unit Tests:** 31
- **Matched to Baseline:** 21 tests
- **Orphan Tests:** 10 tests

**Unit Test Files:**
- `CustomerControllerTest.java`: 10 tests
- `CustomerControllerGetAllTest.java`: 10 tests
- `CustomerControllerUpdateTest.java`: 4 tests
- `CustomerControllerDeleteTest.java`: 5 tests
- `CustomerControllerEmailTest.java`: 2 tests

---

## 🎯 Coverage Analysis

### Overall Coverage: **57.1%** (20/35 scenarios)

**Coverage Distribution:**
- ✅ **Fully Covered:** 19 scenarios
- ⚠️ **Partially Covered:** 1 scenario
- ❌ **Not Covered:** 15 scenarios

---

## ⚠️ Gaps Found: **13 Total**

### Gap Priority Breakdown:
- **P0 (Critical):** 1 gap
- **P1 (High):** 1 gap
- **P2 (Medium):** 0 gaps
- **P3 (Low):** 11 gaps

### P0 Gaps (Blocks Commit):
1. **POST /v1/customers**
   - `When request is made without authentication token, return 401`

### P1 Gaps (Should Fix):
1. **POST /v1/customers**
   - `When customer is created with invalid email format, return 400`

### P3 Gaps (11 total):
All from POST /v1/customers endpoint (remaining 11 scenarios without tests)

---

## 🔍 Orphan Tests: **10 Total**

### Business Tests (Need Scenarios): **8 tests**

**Priority Breakdown:**
- **P0:** 3 orphan tests
- **P1:** 3 orphan tests
- **P2:** 2 orphan tests

**Examples:**

1. **P0 Orphan - testGetCustomerById_WithValidId_Returns200**
   - File: `CustomerControllerTest.java`
   - Missing Scenario: "When customer by id with valid id, returns 200"
   - Action: QA must add this scenario to baseline

2. **P0 Orphan - testGetCustomerById_WithExistingCustomer_ReturnsCompleteObject**
   - File: `CustomerControllerTest.java`
   - Missing Scenario: "When requesting existing customer, return complete customer object"
   - Action: QA must add this scenario to baseline

3. **P1 Orphan - testGetCustomerById_WithNonExistentId_ThrowsException**
   - File: `CustomerControllerTest.java`
   - Missing Scenario: "When customer ID does not exist, throw CustomerNotFoundException"
   - Action: QA must add this scenario to baseline

### Technical Tests (No Action Needed): **2 tests**

1. **testGetCustomerById_WithSQLInjection_HandledSafely** (P1)
   - Security validation test
   - No baseline scenario required

2. **testGetCustomerById_WithXSSPayload_HandledSafely** (P1)
   - Security validation test
   - No baseline scenario required

---

## 🔴 Orphan APIs: **1 Total**

### GET /v1/customers/{id}
- **Status:** No baseline scenarios AND no unit tests
- **Impact:** Critical - completely untracked endpoint
- **Action Required:** 
  - QA: Create baseline scenarios
  - DEV: Implement unit tests

---

## 🤖 AI Coverage Status Logic

### When AI Calls Tests "FULLY_COVERED"

**Criteria:**
1. Baseline scenario exists
2. At least one unit test matches the scenario
3. Test assertions verify all aspects of the scenario

**Example:**
```yaml
Baseline Scenario: "When requesting all customers with valid authentication, return 200 and list of customers"

Matching Unit Test: 
- testGetAllCustomers_WithAuthentication_ReturnsListSuccessfully()
- Assertions: 
  - ✅ Checks HTTP 200
  - ✅ Verifies response body not null
  - ✅ Validates list returned
  - ✅ Confirms authentication used

Result: FULLY_COVERED ✅
```

**Real Example from System:**
- **Scenario:** "When requesting customers by age zero, return 200 and customers with age 0"
- **Test:** `testGetCustomers_WithAgeZero_ReturnsMatchingCustomers()`
- **Status:** ✅ FULLY_COVERED
- **File:** CustomerControllerGetAllTest.java, Line 130

---

### When AI Calls Tests "PARTIALLY_COVERED"

**Criteria:**
1. Baseline scenario exists
2. Unit test exists and matches scenario partially
3. Test is missing some assertions or edge cases

**Example:**
```yaml
Baseline Scenario: "When customer is updated with partial data, return 200 and update only provided fields"

Unit Test: testUpdateCustomer_WithPartialData_UpdatesSuccessfully()
Issues:
- ✅ Checks HTTP 200
- ✅ Calls update service
- ❌ MISSING: Verification that unprovided fields remain unchanged
- ❌ MISSING: Assertion that only provided fields updated

Result: PARTIALLY_COVERED ⚠️
```

**Note:** Currently, our system has **0 partially covered** scenarios.

---

### When AI Calls Tests "NOT_COVERED"

**Criteria:**
1. Baseline scenario exists
2. NO matching unit test found

**Example:**
```yaml
Baseline Scenario: "When customer is created with duplicate email, return 409"

Unit Tests Searched: All tests scanned
Match Found: NONE

Result: NOT_COVERED ❌
Action: Developer must create unit test
```

**Real Examples from System (13 total):**

1. **POST /v1/customers** - "When customer is created with valid data, return 201 and customer ID"
   - Status: ❌ NOT_COVERED
   - No matching test found
   - Priority: P3

2. **POST /v1/customers** - "When request is made without authentication token, return 401"
   - Status: ❌ NOT_COVERED
   - No matching test found
   - Priority: **P0** (CRITICAL - blocks commit)

3. **PUT /v1/customers/{id}** - "When updating with duplicate email, return 409"
   - Status: ❌ NOT_COVERED
   - No matching test found
   - Priority: P3

---

### When AI Detects "ORPHAN API"

**Criteria:**
1. API endpoint exists in code
2. NO baseline scenarios defined
3. NO unit tests exist

**Example:**
```yaml
API Discovered: GET /v1/customers/{id}

Baseline Check: 
GET /v1/customers/{id}:
  # Empty - no scenarios

Unit Test Search: No tests found matching this API

Result: ORPHAN API 🔴
Impact: Critical - endpoint completely untracked
```

**Real Example from System:**
- **API:** GET /v1/customers/{id}
- **Baseline Scenarios:** 0
- **Unit Tests:** 0
- **Status:** 🔴 ORPHAN API
- **Action:** QA must create scenarios, DEV must create tests

---

### When AI Detects "ORPHAN UNIT TEST"

**Criteria:**
1. Unit test exists in code
2. NO matching baseline scenario found
3. Test covers business logic (not technical/infrastructure)

**Example:**
```yaml
Unit Test Found: testGetCustomerById_WithValidId_Returns200()
File: CustomerControllerTest.java

Baseline Search:
- Searched all scenarios for GET /v1/customers/{id}
- No match found

Test Type Analysis:
- File: ControllerTest.java → Business test
- Checks: HTTP 200 status → Business behavior
- Priority: P0 (critical business logic)

Result: ORPHAN UNIT TEST ⚠️
Category: BUSINESS
Action: QA must add scenario to baseline
```

**Real Examples from System (10 total):**

1. **P0 Orphan:**
   - Test: `testGetCustomerById_WithValidId_Returns200()`
   - File: CustomerControllerTest.java
   - Category: BUSINESS (Controller Test)
   - 💡 AI Suggestion: "When customer by id with valid id, returns 200"
   - Action: QA add to baseline

2. **P1 Orphan:**
   - Test: `testGetCustomerById_WithInvalidIdFormat_HandlesGracefully()`
   - File: CustomerControllerTest.java
   - Category: BUSINESS (input validation)
   - 💡 AI Suggestion: "When customer by id with invalid id format handles gracefully, process successfully"
   - Action: QA add to baseline

3. **P1 Technical (No Action):**
   - Test: `testGetCustomerById_WithSQLInjection_HandledSafely()`
   - File: CustomerControllerTest.java
   - Category: TECHNICAL (Security validation)
   - Action: ✓ No action needed

---

## 📈 Coverage by API

### POST /v1/customers
- **Scenarios:** 12
- **Coverage:** 0% (0/12)
- **Fully Covered:** 0
- **Not Covered:** 12
- **Status:** ❌ Critical - needs all tests

### GET /v1/customers
- **Scenarios:** 10
- **Coverage:** 100% (10/10) ✅
- **Fully Covered:** 10
- **Not Covered:** 0
- **Status:** ✅ Complete

### GET /v1/customers/{id}
- **Scenarios:** 0
- **Unit Tests:** 10
- **Status:** 🔴 **ORPHAN API** - completely untracked

### PUT /v1/customers/{id}
- **Scenarios:** 5
- **Coverage:** 80% (4/5)
- **Fully Covered:** 4
- **Not Covered:** 1
- **Status:** ⚠️ Almost complete

### DELETE /v1/customers/{id}
- **Scenarios:** 5
- **Coverage:** 100% (5/5) ✅
- **Fully Covered:** 5
- **Not Covered:** 0
- **Status:** ✅ Complete

---

## 🎯 Examples: All Coverage Status Types

### Example 1: FULLY_COVERED ✅

```yaml
# Baseline Scenario
GET /v1/customers:
  happy_case:
    - When requesting customers filtered by valid age, return 200 and filtered list

# Matching Unit Test
File: CustomerControllerGetAllTest.java
Test: testGetCustomers_WithValidAgeFilter_ReturnsFilteredList()
Line: 61

Assertions:
  assertEquals(HttpStatus.OK, response.getStatusCode())
  assertNotNull(response.getBody())
  assertEquals(2, response.getBody().size())
  assertEquals(30, response.getBody().get(0).getAge())
  verify(customerService, times(1)).getCustomersByAge(30)

Match Confidence: HIGH
Status: ✅ FULLY_COVERED
```

---

### Example 2: PARTIALLY_COVERED ⚠️

```yaml
# Baseline Scenario
PATCH /v1/customers/{id}/email:
  happy_case:
    - When customer email is updated with valid email format, return 200 and send verification email and update email after verification

# Matching Unit Test
File: CustomerControllerEmailTest.java
Test: testUpdateEmail_WithValidFormat_Returns200()
Line: 20

Assertions Present:
  assertEquals(HttpStatus.OK, status) ✅

Missing Assertions:
  ❌ Verification that verification email was sent
  ❌ Verification that email update happens AFTER verification
  ❌ Assertion that old email is preserved until verification
  ❌ Check that verification token was generated

Status: ⚠️ PARTIALLY_COVERED
Reason: Test ONLY checks status code, not the complete business logic
Impact: Critical aspects of the scenario (email verification workflow) are not tested
```

**Real Example:** PATCH /v1/customers/{id}/email - 1 scenario partially covered

---

### Example 3: NOT_COVERED ❌

```yaml
# Baseline Scenario
POST /v1/customers:
  security:
    - When request is made without authentication token, return 401

# Unit Test Search Result
Search: All unit test files scanned
Match: NONE

Status: ❌ NOT_COVERED
Priority: P0 (CRITICAL)
Action: Developer must create test:
  - testCreateCustomer_WithoutAuthToken_Returns401()
```

---

### Example 4: ORPHAN API 🔴

```yaml
# API Discovered in Code
Endpoint: GET /v1/customers/{id}
Controller: CustomerController.java
Method: getCustomerById(Long id)

# Baseline Check
GET /v1/customers/{id}:
  # Empty - no scenarios defined

# Unit Test Search
Tests Found: 10 tests exist BUT not linked to baseline
Tests: testGetCustomerById_WithValidId_Returns200(), etc.

Status: 🔴 ORPHAN API
Reason: API has NO baseline scenarios AND NO linked tests
Impact: Critical - endpoint completely untracked

Action Required:
1. QA: Create baseline scenarios for this endpoint
2. Link existing 10 unit tests to scenarios
```

---

### Example 5: ORPHAN UNIT TEST (Business) ⚠️

```yaml
# Unit Test Found
File: CustomerControllerTest.java
Test: testGetCustomerById_WithValidId_Returns200()
Line: 32

Test Details:
  - Checks: HTTP 200 status
  - Verifies: Customer object returned
  - Validates: All customer fields present

# Baseline Search
Searched: GET /v1/customers/{id}
Result: No scenarios defined for this API

# AI Analysis
Category: BUSINESS
Reason: ControllerTest checking HTTP status - critical business behavior
Priority: P0
Action Required: YES

💡 AI Suggested Scenario:
  "When customer by id with valid id, returns 200"

Status: ⚠️ ORPHAN UNIT TEST (BUSINESS)
Action: QA must add this scenario to baseline YAML
```

---

### Example 6: ORPHAN UNIT TEST (Technical) ✓

```yaml
# Unit Test Found
File: CustomerControllerTest.java
Test: testGetCustomerById_WithSQLInjection_HandledSafely()
Line: 221

Test Details:
  - Checks: SQL injection payload rejected
  - Verifies: IllegalArgumentException thrown
  - Security: Validates input sanitization

# Baseline Search
Searched: GET /v1/customers/{id}
Result: No scenarios

# AI Analysis
Category: TECHNICAL
Reason: ONLY tests SQL injection validation - security infrastructure
Priority: P1
Action Required: NO

Status: ✓ ORPHAN UNIT TEST (TECHNICAL)
Action: No action needed - technical test doesn't require baseline scenario
```

---

## 📋 Summary Table: When Each Status is Used

| Status | Baseline Exists? | Unit Test Exists? | Test Complete? | Example |
|--------|------------------|-------------------|----------------|---------|
| **FULLY_COVERED** ✅ | Yes | Yes | Yes | GET /v1/customers scenarios (10/10) |
| **PARTIALLY_COVERED** ⚠️ | Yes | Yes | No | Test missing some assertions |
| **NOT_COVERED** ❌ | Yes | No | N/A | POST /v1/customers scenarios (0/12) |
| **ORPHAN API** 🔴 | No | No | N/A | GET /v1/customers/{id} |
| **ORPHAN TEST (Business)** ⚠️ | No | Yes | N/A | testGetCustomerById_WithValidId (8 total) |
| **ORPHAN TEST (Technical)** ✓ | No | Yes | N/A | SQL/XSS tests (2 total) |

---

## 🚀 Action Items

### Immediate (P0 - Blocks Commit):
1. **Create test** for: "When request is made without authentication token, return 401"
2. **Add scenarios** for 3 P0 orphan tests:
   - testGetCustomerById_WithValidId_Returns200
   - testGetCustomerById_WithExistingCustomer_ReturnsCompleteObject
   - testGetCustomerById_WithAuthentication_ReturnsSuccessfully

### High Priority (P1):
1. **Create test** for: "When customer is created with invalid email format, return 400"
2. **Add scenarios** for 3 P1 orphan tests

### Medium Priority (P2):
1. **Add scenarios** for 2 P2 orphan tests

### Low Priority (P3):
1. **Create 11 tests** for remaining POST /v1/customers scenarios
2. **Create 1 test** for PUT duplicate email scenario

### Critical (ORPHAN API):
1. **GET /v1/customers/{id}:**
   - QA: Create baseline scenarios
   - DEV: Link 10 existing unit tests to scenarios

---

## 📊 Progress Tracking

- **Current Coverage:** 59.4% (19/32)
- **Target Coverage:** 100%
- **Scenarios to Cover:** 13 remaining
- **Orphan Tests to Link:** 8 business tests
- **Orphan APIs to Track:** 1 API

**Estimated Effort:**
- Create 13 new unit tests: ~2-3 days
- Link 8 orphan tests with scenarios: ~1 hour
- Document orphan API scenarios: ~30 minutes

---

**Generated:** December 10, 2025  
**System Version:** 6.1.0  
**Report Source:** customer-service-report.html
