# 🚀 Enhancement Roadmap - Implementation Plan

## Current Status Assessment
- ✅ Multi-service architecture working
- ✅ Dynamic TM generation functional
- ✅ Rich HTML reports generated
- ✅ 36 onboarding unit tests passing
- ⚠️ 0 identity service unit tests (CRITICAL)
- ⚠️ Limited E2E coverage for identity
- ⚠️ Missing separate coverage columns in TM

---

## Priority 1: Critical Production Readiness

### 1.1 Identity Service Unit Tests (CRITICAL) 🔴
**Status**: NOT STARTED  
**Priority**: P0  
**Impact**: Cannot claim production ready with 0 tests

**Tasks**:
- [ ] ProfileService unit tests (~10 tests)
  - Create profile (happy path)
  - Create with validation errors
  - Get profile by ID
  - Get profile by user ID
  - Update profile
  - Delete profile
  - Age validation (0-150)
  
- [ ] MongoProfileRepository unit tests (~8 tests)
  - CRUD operations
  - Index creation
  - Error handling
  - Invalid ObjectId
  
- [ ] ProfileController unit tests (~8 tests)
  - HTTP status codes
  - Request validation
  - Error responses
  - Success responses

**Estimate**: ~25 unit tests for identity service

### 1.2 Identity Service E2E Tests 🔴
**Status**: NOT STARTED  
**Priority**: P0

**Tasks**:
- [ ] Create E2E test file: `qa/tests/e2e/identity/ts001_profile_happy.spec.ts`
- [ ] Status code validations (200, 201, 204, 400, 404, 409)
- [ ] CRUD operations testing
- [ ] Validation error testing
- [ ] Integration with onboarding service

**Estimate**: ~15 E2E tests for identity

### 1.3 Enhanced Onboarding E2E Tests 🟡
**Status**: PARTIAL (24 tests exist)  
**Priority**: P1

**Tasks**:
- [ ] Add status code validation tests
- [ ] Add comprehensive error handling tests
- [ ] Add request/response schema validation
- [ ] Add performance/timeout tests

**Estimate**: Add ~10 more tests

---

## Priority 2: TM Enhancements

### 2.1 Separate Coverage Columns 🟡
**Status**: NOT STARTED  
**Priority**: P1  
**Need**: Unit Test Coverage vs Automation Coverage

**Implementation**:
- [ ] Update TM data model to track coverage types
- [ ] Modify scenario mapper to calculate both coverages
- [ ] Update HTML report to show dual columns
- [ ] Update markdown report

**Columns Needed**:
| Scenario | Unit Test Coverage | Automation Coverage | Overall |
|----------|-------------------|---------------------|---------|
| HF001    | ✅ Fully (3 tests) | ✅ Covered (TS001) | ✅      |
| NF003    | ❌ None           | ✅ Covered (TS002) | ⚠️      |

### 2.2 Orphan Test Detection 🟡
**Status**: NOT STARTED  
**Priority**: P1

**Tasks**:
- [ ] Implement reverse mapping (tests → scenarios)
- [ ] Identify tests without scenario mapping
- [ ] Add "Orphan Tests" section to reports

---

## Priority 3: Advanced Features

### 3.1 Prompt-Based Gap Analysis 🟢
**Status**: DOCUMENTED  
**Priority**: P2

**Use Cases**:
```bash
# Example 1: Service-specific analysis
npm run analyze -- "Find gaps in identity service"

# Example 2: Priority-based
npm run analyze -- "Show all P0 gaps"

# Example 3: Coverage query
npm run analyze -- "Which scenarios have no unit tests?"
```

**Implementation**:
- [ ] Create `qa/matrix/ai-gap-analyzer.ts`
- [ ] Integrate OpenAI/Claude API
- [ ] Parse natural language queries
- [ ] Generate filtered reports
- [ ] Add to npm scripts

### 3.2 Service-Specific Filtering 🟢
**Status**: NOT STARTED  
**Priority**: P2

**Implementation**:
- [ ] Add CLI argument parser
- [ ] Filter tests by service
- [ ] Filter TM by service
- [ ] Generate service-specific reports

**Commands**:
```bash
npm run generate:matrix -- --service identity-service
npm test -- tests/e2e/identity/**/*.spec.ts
```

### 3.3 Selective Scenario Execution 🟢
**Status**: NOT STARTED  
**Priority**: P2

**Implementation**:
- [ ] Add scenario ID filter
- [ ] Run specific scenarios
- [ ] Generate filtered TM
- [ ] Update both reports

**Commands**:
```bash
npm test -- --scenarios HF001,NF003,EC001
npm run generate:matrix -- --scenarios HF001,NF003
```

---

## Priority 4: Reporting Enhancements

### 4.1 Rich UI Test Report 🟢
**Status**: PARTIAL (Mochawesome exists)  
**Priority**: P2

**Enhancements**:
- [ ] Add screenshots on failure
- [ ] Add request/response traces
- [ ] Add execution timeline
- [ ] Add error stack traces
- [ ] Link to TM report

### 4.2 PDF Documentation 🟢
**Status**: NOT STARTED  
**Priority**: P2

**Content**:
- [ ] TM benefits and usage
- [ ] Implementation approach
- [ ] Gap detection examples
- [ ] AI development integration
- [ ] ROI demonstration
- [ ] Best practices

**Tools**: Puppeteer to convert HTML to PDF

---

## Implementation Order

### Phase 1: Production Readiness (THIS SESSION)
1. ✅ Identity service unit tests (25 tests)
2. ✅ Identity service E2E tests (15 tests)
3. ✅ Enhanced onboarding E2E tests (10 tests)
4. ✅ Separate coverage columns in TM
5. ✅ Verify all tests pass

### Phase 2: Advanced Features (NEXT)
1. Prompt-based gap analysis
2. Service-specific filtering
3. Selective scenario execution
4. Enhanced test reports
5. PDF documentation

---

## Success Criteria

### Must Have (This Session)
- [ ] Identity service: 25+ unit tests passing
- [ ] Identity service: 15+ E2E tests passing
- [ ] Onboarding: 34+ E2E tests total
- [ ] TM shows separate unit/automation coverage
- [ ] All existing tests still pass
- [ ] No breaking changes

### Nice to Have (Future)
- [ ] AI-powered gap analysis
- [ ] Service filtering
- [ ] Scenario selection
- [ ] PDF documentation

---

**Last Updated**: December 4, 2025, 11:21 PM  
**Status**: Phase 1 Starting  
**Target**: Complete critical items this session
