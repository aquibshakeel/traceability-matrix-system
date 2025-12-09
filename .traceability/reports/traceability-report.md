# Unit Test Traceability Report

**Generated:** 12/9/2025, 7:40:55 AM  
**Duration:** 120ms  
**Status:** ❌ FAILED

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Total Scenarios** | 16 |
| **Fully Covered** | 6 (69%) |
| **Partially Covered** | 5 |
| **Not Covered** | 5 |
| **Total Tests** | 63 |
| **Orphan Tests** | 44 |
| **Coverage Gaps** | 5 |
| **P0 Gaps** | 5 |
| **P1 Gaps** | 0 |
| **Services Analyzed** | 2 |

---

## 🚨 Coverage Gaps


### CUST-004 - **P0**

**Description:** When user requests customer without authentication token, then the system should return 401 unauthorized error
  
**API:** /api/customer/:id  
**Risk Level:** Critical  
**Action Required:** Developer - Create Test

**Impact:** P0 priority scenario without coverage. Risk: Critical

**Recommendations:**
- Create unit test for: When user requests customer without authentication token, then the system should return 401 unauthorized error

- Target API: /api/customer/:id
- Risk Level: Critical
- Business Impact: Not specified

---


### CUST-012 - **P0**

**Description:** When user tries to delete already deleted customer, then the system should return 410 gone error
  
**API:** /api/customer/:id  
**Risk Level:** Critical  
**Action Required:** Developer - Create Test

**Impact:** P0 priority scenario without coverage. Risk: Critical

**Recommendations:**
- Create unit test for: When user tries to delete already deleted customer, then the system should return 410 gone error

- Target API: /api/customer/:id
- Risk Level: Critical
- Business Impact: Not specified

---


### CUST-013 - **P0**

**Description:** When database connection fails during customer fetch, then the system should return 503 service unavailable, log the error, and attempt retry with exponential backoff
  
**API:** N/A  
**Risk Level:** Critical  
**Action Required:** Developer - Create Test

**Impact:** P0 priority scenario without coverage. Risk: Critical

**Recommendations:**
- Create unit test for: When database connection fails during customer fetch, then the system should return 503 service unavailable, log the error, and attempt retry with exponential backoff

- Target API: N/A
- Risk Level: Critical
- Business Impact: Not specified

---


### CUST-014 - **P0**

**Description:** When database query times out after 5 seconds, then the system should cancel query and return 504 timeout error
  
**API:** N/A  
**Risk Level:** Critical  
**Action Required:** Developer - Create Test

**Impact:** P0 priority scenario without coverage. Risk: Critical

**Recommendations:**
- Create unit test for: When database query times out after 5 seconds, then the system should cancel query and return 504 timeout error

- Target API: N/A
- Risk Level: Critical
- Business Impact: Not specified

---


### IDENTITY-001 - **P0**

**Description:** User login with valid credentials  
**API:** /identity/login  
**Risk Level:** Critical  
**Action Required:** Developer - Create Test

**Impact:** P0 priority scenario without coverage. Risk: Critical

**Recommendations:**
- Create unit test for: User login with valid credentials
- Target API: /identity/login
- Risk Level: Critical
- Business Impact: Users must be able to log in to access the system

---



## 🔍 Orphan Tests (44)

Tests without corresponding business scenarios:

- **CustomerMapperTest.toEntity_ShouldMapRequestToEntity**: To Entity  Should Map Request To Entity (CustomerMapperTest.java)
- **CustomerMapperTest.toResponse_ShouldMapEntityToResponse**: To Response  Should Map Entity To Response (CustomerMapperTest.java)
- **CustomerMapperTest.updateEntity_ShouldUpdateExistingEntity**: Update Entity  Should Update Existing Entity (CustomerMapperTest.java)
- **CustomerTest.builder_ShouldCreateCustomerWithAllFields**: Builder  Should Create Customer With All Fields (CustomerTest.java)
- **CustomerTest.settersAndGetters_ShouldWorkCorrectly**: Setters And Getters  Should Work Correctly (CustomerTest.java)
- **CustomerTest.equals_ShouldReturnTrue_WhenCustomersAreEqual**: Equals  Should Return True  When Customers Are Equal (CustomerTest.java)
- **CustomerTest.toString_ShouldReturnStringRepresentation**: To String  Should Return String Representation (CustomerTest.java)
- **GlobalExceptionHandlerTest.handleCustomerNotFoundException_ShouldReturnNotFoundResponse**: Handle Customer Not Found Exception  Should Return Not Found Response (GlobalExceptionHandlerTest.java)
- **GlobalExceptionHandlerTest.handleValidationExceptions_ShouldReturnBadRequestWithValidationErrors**: Handle Validation Exceptions  Should Return Bad Request With Validation Errors (GlobalExceptionHandlerTest.java)
- **GlobalExceptionHandlerTest.handleGenericException_ShouldReturnInternalServerErrorResponse**: Handle Generic Exception  Should Return Internal Server Error Response (GlobalExceptionHandlerTest.java)
- **GlobalExceptionHandlerTest.errorResponse_ShouldBuildCorrectly**: Error Response  Should Build Correctly (GlobalExceptionHandlerTest.java)
- **GlobalExceptionHandlerTest.errorResponse_SettersAndGetters_ShouldWork**: Error Response  Setters And Getters  Should Work (GlobalExceptionHandlerTest.java)
- **GlobalExceptionHandlerTest.errorResponse_ToString_ShouldContainFields**: Error Response  To String  Should Contain Fields (GlobalExceptionHandlerTest.java)
- **GlobalExceptionHandlerTest.errorResponse_Equals_ShouldWork**: Error Response  Equals  Should Work (GlobalExceptionHandlerTest.java)
- **GlobalExceptionHandlerTest.errorResponse_AllArgsConstructor_ShouldWork**: Error Response  All Args Constructor  Should Work (GlobalExceptionHandlerTest.java)
- **CustomerNotFoundExceptionTest.constructor_ShouldCreateExceptionWithMessage**: Constructor  Should Create Exception With Message (CustomerNotFoundExceptionTest.java)
- **CustomerNotFoundExceptionTest.constructor_ShouldCreateExceptionWithEmptyMessage**: Constructor  Should Create Exception With Empty Message (CustomerNotFoundExceptionTest.java)
- **CustomerResponseTest.builder_ShouldCreateValidCustomerResponse**: Builder  Should Create Valid Customer Response (CustomerResponseTest.java)
- **CustomerResponseTest.settersAndGetters_ShouldWorkCorrectly**: Setters And Getters  Should Work Correctly (CustomerResponseTest.java)
- **CustomerResponseTest.equals_ShouldReturnTrue_WhenResponsesAreEqual**: Equals  Should Return True  When Responses Are Equal (CustomerResponseTest.java)


*Showing first 20 of 44 orphan tests*




## 💡 Recommendations


### Critical: 5 P0 scenario(s) without tests
P0 scenarios are critical and must have test coverage immediately

- **Priority:** P0
- **Effort:** High
- **Assigned to:** Developer


### Create scenarios for 44 orphan tests
Tests without scenarios make traceability difficult

- **Priority:** P2
- **Effort:** Medium
- **Assigned to:** QA



---

*Report generated by Universal Unit-Test Traceability Validator*
