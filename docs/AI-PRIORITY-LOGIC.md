# 🎯 AI Priority Determination Logic

## How AI Assigns Priorities (P0/P1/P2/P3)

### The System Uses Consistent, Rule-Based Logic

The AI doesn't randomly assign priorities - it follows a **deterministic, keyword-based algorithm** that's consistent across the entire framework.

---

## 🔍 Priority Assignment Rules

> **Design Philosophy:** The priority system uses a **small, focused set of keywords** to keep logic simple, predictable, and maintainable. This intentional simplicity ensures consistent behavior across all services and avoids false positives.

### P0 - CRITICAL (Blocking)
**Triggers:** Security vulnerabilities, authentication/authorization failures, critical business issues

**Keywords that trigger P0:**
- `critical` - Business-critical failures or blocking issues
- `security` - Security vulnerabilities, exploits, breaches
- `auth` - Authentication/authorization issues (covers "authentication", "authorization", etc.)

**Examples:**
```
❌ When deleting without authentication, return 401
   → P0 (contains "auth")
   
❌ When security validation fails on customer creation, reject with 400
   → P0 (contains "security")
   
❌ When critical business rule is violated, return 400
   → P0 (contains "critical")
```

**Why P0:**
- Security holes can be exploited immediately
- Authentication failures expose sensitive data
- Critical issues block business operations
- These MUST be tested before release

---

### P1 - HIGH (Important)
**Triggers:** Error handling, input validation, failure scenarios

**Keywords that trigger P1:**
- `error` - Error handling, error responses, error cases
- `invalid` - Invalid input, invalid format, invalid data
- `fail` - Failure scenarios, failed operations (covers "failure", "failed", etc.)

**Examples:**
```
⚠️ When creating customer with invalid email format, return 400
   → P1 (contains "invalid")
   
⚠️ When operation fails due to system error, return 500
   → P1 (contains "error" and "fail")
   
⚠️ When creating customer with invalid phone number fails, return 400
   → P1 (contains "invalid" and "fail")
```

**Why P1:**
- Error handling prevents application crashes
- Input validation prevents data corruption
- Failure scenarios must be handled gracefully
- These should be tested early in QA cycle

---

### P2 - MEDIUM (Standard)
**Triggers:** Edge cases, boundary conditions

**Keywords that trigger P2:**
- `edge` - Edge cases, edge scenarios, edge conditions
- `boundary` - Boundary testing, boundary values, boundary limits

**Examples:**
```
💡 When testing edge case with maximum length name, accept successfully
   → P2 (contains "edge")
   
💡 When customer age is at boundary value (120), return 200
   → P2 (contains "boundary")
   
💡 When testing edge case with empty string, handle appropriately
   → P2 (contains "edge")
```

**Why P2:**
- Edge cases are important for robustness
- Boundary testing prevents off-by-one errors
- These improve quality but aren't blocking

---

### P3 - LOW (Nice to Have)
**Triggers:** Happy path scenarios, standard functionality, nominal cases

**Default assignment when no P0/P1/P2 keywords match**

**Common patterns for P3:**
- Any scenario without P0/P1/P2 keywords
- Happy path scenarios
- Standard CRUD operations
- Valid input with expected success

**Examples:**
```
✅ When customer is created with valid data, return 201 and customer ID
   → P3 (no trigger keywords, default)
   
✅ When requesting all customers, return 200 with customer list
   → P3 (happy path, basic functionality)
   
✅ When customer is updated with valid data, return 200
   → P3 (standard operation)
```

**Why P3:**
- Happy path tests are essential baseline coverage
- Standard CRUD operations validate core functionality
- These provide foundation but aren't urgent

---

## 📋 Priority Decision Tree

```
Does scenario contain "critical", "security", or "auth"?
  ├─ YES → P0 (CRITICAL)
  └─ NO ↓

Does scenario contain "error", "invalid", or "fail"?
  ├─ YES → P1 (HIGH)
  └─ NO ↓

Does scenario contain "edge" or "boundary"?
  ├─ YES → P2 (MEDIUM)
  └─ NO ↓

DEFAULT → P3 (LOW)
```

**Note:** Matching is case-insensitive and uses substring matching (e.g., "authentication" matches "auth", "failure" matches "fail").

---

## 🎯 Priority Distribution in Practice

### Typical API Endpoint Priority Breakdown

For a well-designed API endpoint, you'd expect:

```
P0 (Critical):  10-20% of scenarios
  - Authentication checks
  - Authorization rules
  - Security validations
  
P1 (High):      30-40% of scenarios
  - Error handling
  - Input validation
  - Conflict detection
  
P2 (Medium):    20-30% of scenarios
  - Edge cases
  - Boundary tests
  - Special inputs
  
P3 (Low):       20-30% of scenarios
  - Happy paths
  - Basic CRUD
  - Standard flows
```

---

## 💻 Code Implementation

### inferPriority Method
**File:** `lib/core/EnhancedCoverageAnalyzer.ts`

```typescript
private inferPriority(scenario: string): Priority {
  const lower = scenario.toLowerCase();
  
  // P0: Critical security/auth issues
  if (lower.includes('critical') || 
      lower.includes('security') || 
      lower.includes('auth')) {
    return 'P0';
  }
  
  // P1: Error handling and validation
  if (lower.includes('error') || 
      lower.includes('invalid') || 
      lower.includes('fail')) {
    return 'P1';
  }
  
  // P2: Edge cases and boundaries
  if (lower.includes('edge') || 
      lower.includes('boundary')) {
    return 'P2';
  }
  
  // P3: Everything else (happy paths)
  return 'P3';
}
```

---

## ✅ Consistency Guarantees

### The System is Consistent Because:

1. **Same Algorithm Everywhere:**
   - Same `inferPriority()` method used for all scenarios
   - No manual overrides or exceptions
   - Deterministic output for same input

2. **Framework-Wide Application:**
   - Used in gap analysis
   - Used in orphan test categorization
   - Used in AI recommendations
   - Used in report generation

3. **Keyword-Based Logic:**
   - Clear, documented trigger words
   - Case-insensitive matching
   - Simple substring checks
   - No ambiguity

4. **Version Controlled:**
   - Logic is in code (not configuration)
   - Changes are tracked via Git
   - Review process for modifications
   - Consistent across deployments

---

## 🔍 Examples from Our Test Cases

### Case 4: GET /v1/customers

```yaml
# P3 - Happy paths (no trigger keywords)
- When requesting all customers with valid data, return 200
- When requesting customers filtered by valid age, return 200
- When requesting all customers with empty database, return 200
- When requesting customers by age and multiple match, return 200

# P2 - Edge cases (contains "edge")
- When testing edge case with age zero, return 200
- When testing boundary case with maximum age value, return 200
- When testing edge case with no matches, return 200

# P1 - Error handling (contains "invalid")
- When requesting customers with invalid age format, return 400

# P0 - Security/Auth (contains "auth")
- When requesting customers without authentication token, return 401
- When requesting with auth token expired, return 401
```

**Distribution:**
- P0: 2 scenarios (20%)
- P1: 1 scenario (10%)
- P2: 3 scenarios (30%)
- P3: 4 scenarios (40%)

---

### Case 5: DELETE /v1/customers/{id}

```yaml
# P3 - Happy paths (no trigger keywords)
- When customer is deleted by valid ID, return 204
- When customer is deleted successfully, verify customer no longer exists

# P1 - Error handling (contains "error" or "invalid")
- When deleting with error due to non-existent customer, return 404
- When deleting with invalid ID format, return 400

# P0 - Security/Auth (contains "auth")
- When deleting without authentication, return 401
```

**Distribution:**
- P0: 1 scenario (20%)
- P1: 2 scenarios (40%)
- P2: 0 scenarios (0%)
- P3: 2 scenarios (40%)

---

## 📊 Impact on Reports

### How Priorities Affect Output

1. **Gap Prioritization:**
   - Gaps sorted by priority (P0 → P1 → P2 → P3)
   - P0 gaps shown first with red highlighting
   - Action items prioritized by urgency

2. **Coverage Metrics:**
   - "P0 gaps: X" shown prominently
   - Critical issues flagged separately
   - Release readiness based on P0/P1 coverage

3. **Recommendations:**
   - P0 recommendations marked as "CRITICAL"
   - P1 recommendations marked as "IMPORTANT"
   - P2/P3 as "SUGGESTED"

4. **Visual Charts:**
   - Gap priority breakdown pie chart
   - P0 gaps highlighted in red
   - Progress tracking by priority

---

## 🎯 Benefits of Consistent Priority Logic

### For QA Teams:
- Know which gaps to fix first
- Understand release blockers vs nice-to-haves
- Consistent prioritization across projects

### For Development Teams:
- Clear guidance on what to implement first
- Understand business impact
- Predictable priority assignments

### For Management:
- Risk assessment based on P0/P1 gaps
- Data-driven release decisions
- Consistent metrics across services

---

## 🔧 Customization Options

### While the default logic is consistent, teams can:

1. **Extend keyword lists** (code changes required):
   ```typescript
   // Add more P0 triggers
   if (lower.includes('critical') || 
       lower.includes('security') || 
       lower.includes('auth') ||
       lower.includes('payment') ||  // Custom addition
       lower.includes('pii')) {      // Custom addition
     return 'P0';
   }
   ```

2. **Override specific scenarios** (in baseline YAML):
   ```yaml
   # Add priority hint in scenario name
   - When deleting customer [P0], verify hard delete
   ```

3. **Configure per-project** (future enhancement):
   ```json
   {
     "priorityRules": {
       "P0Keywords": ["security", "auth", "payment"],
       "P1Keywords": ["error", "invalid", "fail"]
     }
   }
   ```

---

## ✅ Summary

**Priority Assignment is:**
- ✅ Consistent across the framework
- ✅ Deterministic and rule-based
- ✅ Keyword-driven and transparent
- ✅ Applied uniformly to all scenarios
- ✅ Documented and version-controlled
- ✅ Testable and verifiable

**The same scenario will ALWAYS get the same priority, regardless of:**
- Which service it's in
- Who runs the analysis
- When the analysis is run
- What environment it's deployed to

**This consistency ensures:**
- Fair comparison across services
- Reliable risk assessment
- Predictable behavior
- Trust in the system

---

**File:** `lib/core/EnhancedCoverageAnalyzer.ts`  
**Method:** `inferPriority(scenario: string): Priority`  
**Last Updated:** December 10, 2025  
**Status:** ✅ Production-Ready & Consistent
