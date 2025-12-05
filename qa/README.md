# QA Framework Documentation

Comprehensive E2E testing framework with automated traceability matrix and gap analysis.

## 🎯 Overview

This QA framework provides:
- ✅ E2E test automation using Mocha/Chai
- ✅ Automated traceability matrix generation
- ✅ Gap analysis with priority scoring (P0/P1/P2)
- ✅ HTML reports with interactive UI
- ✅ **Allure reporting with rich visualizations**
- ✅ Selective test execution
- ✅ Docker support for isolated testing
- ✅ Unit test to scenario mapping

## 📁 Directory Structure

```
qa/
├── tests/
│   ├── e2e/
│   │   ├── onboarding/          # Onboarding service tests
│   │   │   ├── ts001_create_user_happy.spec.ts
│   │   │   ├── ts002_create_user_negative.spec.ts
│   │   │   ├── ts003_get_user.spec.ts
│   │   │   └── ts004_edge_cases.spec.ts
│   │   └── identity/            # Identity service tests
│   │       └── ts005_profile_crud.spec.ts
│   └── utils/
│       ├── apiClient.ts         # HTTP client wrapper
│       └── fixtures.ts          # Test data generators
├── matrix/
│   ├── scenario-definitions.ts   # Business scenario catalog
│   ├── scenario-mapper.ts        # Scenario to test mapper
│   ├── parse-unit-tests.ts      # Unit test parser
│   └── generate-traceability-matrix.ts
├── reports/
│   └── html/                    # Generated HTML reports
├── scripts/
│   ├── run-tests.sh             # Local test runner
│   ├── docker-run-tests.sh      # Docker test runner
│   └── unified-test-runner.sh   # Unified runner
├── docker/
│   └── Dockerfile               # QA container
├── docker-compose.qa.yml        # QA stack orchestration
└── package.json
```

## 🚀 Quick Start

### Run All Tests
```bash
cd qa
npm test
```

### Run Single Test
```bash
npm run test:case TS001
```

### Run Specific File
```bash
npm run test:file e2e/onboarding/ts002_create_user_negative.spec.ts
```

### Run in Docker
```bash
npm run test:docker
```

## 📊 Test Scenarios

### TS001 - Create User Happy Path
**File:** `tests/e2e/onboarding/ts001_create_user_happy.spec.ts`

**Scenarios Covered:**
- HF001: Create user with valid payload

**Tests:**
- Should create user with valid email and name
- Should return 201 status code
- Should return user with generated ID
- Should have timestamps (createdAt, updatedAt)

### TS002 - Create User Negative Flows
**File:** `tests/e2e/onboarding/ts002_create_user_negative.spec.ts`

**Scenarios Covered:**
- NF001: Missing email field
- NF003: Malformed JSON payload
- NF004: Duplicate email
- NF005: Invalid email format
- NF006: Missing name field
- NF007: Empty string values
- KAF003: Kafka timeout handling

**Tests:**
- Should return 400 when email is missing
- Should return 400 when name is missing
- Should return 400 for malformed JSON
- Should return 409 for duplicate email
- Should return 400 for invalid email format
- Should return 400 for empty strings
- Should handle Kafka timeout gracefully

### TS003 - Get User Tests
**File:** `tests/e2e/onboarding/ts003_get_user.spec.ts`

**Scenarios Covered:**
- HF002: Get user with valid ID
- NF002: Get user with invalid ID

**Tests:**
- Should retrieve user with valid ID (200)
- Should return 404 for non-existent ID
- Should return 400 for invalid ID format
- Should return 400 for empty ID

### TS004 - Edge Cases
**File:** `tests/e2e/onboarding/ts004_edge_cases.spec.ts`

**Scenarios Covered:**
- EC001: Boundary condition input
- EC002: Very long email
- EC003: Special characters in name

**Tests:**
- Should handle maximum length strings
- Should handle very long emails (>254 chars)
- Should handle special characters
- Should handle Unicode/emoji in names

### TS005 - Identity Service Profile CRUD
**File:** `tests/e2e/identity/ts005_profile_crud.spec.ts`

**Scenarios Covered:**
- Profile creation, retrieval, update, deletion

**Tests:**
- Should create profile
- Should get profile by ID
- Should update profile
- Should delete profile
- Should handle errors appropriately

## 🎨 Test Execution Modes

### Mode 1: All Tests
Runs complete test suite with full traceability matrix.

```bash
cd qa
npm test
```

**Output:**
- `reports/html/test-report-YYYYMMDD_HHMMSS.html`
- `reports/html/traceability-matrix-YYYYMMDD_HHMMSS.html`

### Mode 2: Single Test Case
Runs tests with specific scenario ID tag.

```bash
cd qa
npm run test:case TS002
```

**Output:**
- `reports/html/selective-test-report-YYYYMMDD_HHMMSS.html`
- `reports/html/selective-traceability-matrix-YYYYMMDD_HHMMSS.html`

### Mode 3: Multiple Test Cases
Runs multiple specific test cases.

```bash
cd qa
npm run test:cases TS001,TS002,TS005
```

### Mode 4: Test File
Runs a specific test file.

```bash
cd qa
npm run test:file e2e/onboarding/ts002_create_user_negative.spec.ts
```

### Mode 5: Test Folder
Runs all tests in a folder.

```bash
cd qa
npm run test:folder onboarding  # All onboarding tests
npm run test:folder identity    # All identity tests
```

### Mode 6: Docker Execution
Runs tests in isolated Docker container.

```bash
cd qa
npm run test:docker
```

## 📈 Traceability Matrix

### What is it?
The traceability matrix maps:
1. **Business Scenarios** → E2E Tests
2. **Business Scenarios** → Unit Tests
3. **Coverage Gaps** → Development priorities

### How it Works

```
1. Scenario Definitions (scenario-definitions.ts)
   ↓
2. Unit Test Parsing (parse-unit-tests.ts)
   ↓
3. Scenario Mapping (scenario-mapper.ts)
   ↓
4. Gap Analysis & Report Generation
   ↓
5. HTML Report with Interactive UI
```

### Scenario Categories

**Positive Flows (HF###)**
- HF001: Create user with valid payload
- HF002: Get user with valid ID

**Negative Flows (NF###)**
- NF001: Missing email field
- NF002: Invalid ID (404)
- NF003: Malformed JSON
- NF004: Duplicate email
- NF005: Invalid email format
- NF006: Missing name field
- NF007: Empty string values

**Edge Cases (EC###)**
- EC001: Boundary conditions
- EC002: Very long email
- EC003: Special characters

**Database Failures (DB###)**
- DB001: DB timeout
- DB002: DB connection failure
- DB003: Duplicate key error

**Kafka Failures (KAF###)**
- KAF001: Kafka publish failure
- KAF002: Kafka connection failure
- KAF003: Kafka timeout

### Priority Levels

**P0 - Critical**
- Production blockers
- Data loss scenarios
- Security vulnerabilities

**P1 - High Priority**
- Major functional gaps
- Performance issues
- Resilience concerns

**P2 - Medium Priority**
- Input validation gaps
- Error handling improvements

**P3 - Low Priority**
- Edge cases
- Nice-to-have validations

## 📊 Reports

### Mochawesome Test Report
**Location:** `reports/html/test-report-*.html`

**Features:**
- Pass/fail statistics
- Test duration metrics
- Suite hierarchy
- Stack traces for failures
- Filter by status
- Search functionality

### Allure Test Report (NEW!)
**Location:** `reports/allure-report/index.html`

**Features:**
- Rich interactive dashboard
- Test history and trends
- Timeline view of execution
- Categorized test organization
- Detailed error reporting
- Screenshots and attachments support

**Quick Commands:**
```bash
npm run allure:generate  # Generate report
npm run allure:open      # Open in browser
npm run allure:serve     # Generate and serve
npm run allure:clean     # Clean Allure artifacts
```

**📖 Full Documentation:** See [ALLURE.md](./ALLURE.md) for detailed Allure reporting guide.

### Traceability Matrix Report
**Location:** `reports/html/traceability-matrix-*.html`

**Features:**
- Coverage percentage
- 6 interactive stat cards
- Scenario-to-test mapping table
- Priority-based gap analysis
- Service identification
- AI test generation prompts
- Orphan test detection

**Stat Cards:**
1. Coverage % (scenarios covered)
2. P0 Critical Gaps
3. P1 High Priority Gaps
4. Total Unit Tests
5. Orphan Tests
6. Partial Coverage

### Selective Traceability Matrix
**Location:** `reports/html/selective-traceability-matrix-*.html`

**Special Features:**
- 🔴 **Unit Test Gap**: Missing unit tests
- 🟡 **E2E Coverage Gap**: Not executed in this run
- ✅ **Fully Covered**: Executed with unit tests

## 🛠️ API Client

### Usage Example
```typescript
import { apiClient } from '../utils/apiClient';

// Create user
const response = await apiClient.createUser({
  email: 'test@example.com',
  name: 'Test User'
});

// Get user
const user = await apiClient.getUserById(userId);

// Response structure
interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
```

### Available Methods
- `createUser(payload)` - POST /api/user
- `getUserById(id)` - GET /api/user/:id
- `createUserMalformed(payload)` - Test malformed JSON
- `createProfile(payload)` - POST /api/profile (identity service)
- `getProfileById(id)` - GET /api/profile/:id
- `updateProfile(id, payload)` - PUT /api/profile/:id
- `deleteProfile(id)` - DELETE /api/profile/:id

## 🎭 Test Fixtures

### Usage Example
```typescript
import { TestFixtures } from '../utils/fixtures';

// Valid user
const user = TestFixtures.createValidUser();

// Invalid users
const missingEmail = TestFixtures.invalidUsers.missingEmail;
const invalidEmail = TestFixtures.invalidUsers.invalidEmailFormat;

// Malformed payloads
const malformed = TestFixtures.malformedPayloads.notJSON;
```

### Available Fixtures
```typescript
TestFixtures.createValidUser()          // Random valid user
TestFixtures.validUser                  // Static valid user
TestFixtures.invalidUsers.missingEmail
TestFixtures.invalidUsers.missingName
TestFixtures.invalidUsers.invalidEmailFormat
TestFixtures.invalidUsers.invalidEmailNoAt
TestFixtures.invalidUsers.emptyEmail
TestFixtures.invalidUsers.emptyName
TestFixtures.invalidUsers.longEmail
TestFixtures.invalidUsers.specialCharsName
TestFixtures.malformedPayloads.notJSON
TestFixtures.malformedPayloads.unclosedBrace
```

## 🐳 Docker Testing

### Architecture
```
┌─────────────┐
│  QA Tests   │
│  Container  │
└──────┬──────┘
       │
┌──────▼───────────────────────┐
│   Services Under Test        │
│  ┌────────┐  ┌────────┐     │
│  │ Onboard│  │Identity│     │
│  │Service │  │Service │     │
│  └────┬───┘  └────┬───┘     │
│       │           │          │
│  ┌────▼───────────▼────┐    │
│  │     MongoDB         │    │
│  └─────────────────────┘    │
│                              │
│  ┌─────────────────────┐    │
│  │   Kafka + Zookeeper │    │
│  └─────────────────────┘    │
└──────────────────────────────┘
```

### Benefits
- Isolated test environment
- Consistent test execution
- No local dependencies required
- CI/CD ready

### Commands
```bash
# Build and run
docker-compose -f docker-compose.qa.yml up --build

# Specific test
TEST_MODE=case TEST_TARGET=TS001 docker-compose -f docker-compose.qa.yml up

# Cleanup
docker-compose -f docker-compose.qa.yml down
```

## 🔧 Configuration

### Environment Variables
```bash
API_BASE_URL=http://localhost:3000
NODE_ENV=test
TEST_MODE=all|case|cases|file|folder
TEST_TARGET=<test identifier>
GENERATE_TM=true|false
```

### Mocha Configuration
**File:** `.mocharc.json`

```json
{
  "require": "ts-node/register",
  "spec": "tests/**/*.spec.ts",
  "timeout": 10000,
  "reporter": "mochawesome",
  "reporter-options": [
    "reportDir=reports/html",
    "reportFilename=test-report",
    "html=true",
    "json=true"
  ]
}
```

## 📝 Writing New Tests

### Test File Template
```typescript
/**
 * TS006 - Test Description
 * Scenario IDs: SCENARIO_IDS_HERE
 * Description: What this test file covers
 */

import { expect } from 'chai';
import { apiClient } from '../../utils/apiClient';
import { TestFixtures } from '../../utils/fixtures';

describe('[TS006] Test Name', () => {
  
  describe('Scenario Description (SCENARIO_ID)', () => {
    it('should do something (SCENARIO_ID)', async function() {
      // Arrange
      const payload = TestFixtures.createValidUser();
      
      // Act
      const response = await apiClient.createUser(payload);
      
      // Assert
      expect(response.status).to.equal(201);
      expect(response.data).to.exist;
      
      console.log('✅ SCENARIO_ID: Test passed');
    });
  });
});
```

### Best Practices
1. **Tag tests with scenario IDs** in test descriptions
2. **Use descriptive test names** that explain what's being tested
3. **Follow AAA pattern** (Arrange, Act, Assert)
4. **Add console logs** for test execution visibility
5. **Handle async properly** with async/await
6. **Clean up test data** if needed
7. **Test one thing per test** for clarity

### Adding New Scenarios

1. **Define scenario** in `matrix/scenario-definitions.ts`:
```typescript
{
  id: 'NF008',
  description: 'New validation scenario',
  category: 'Negative',
  apiEndpoint: 'POST /api/user',
  unitTestPatterns: ['pattern.*to.*match'],
  expectedCoverage: 'full',
  riskLevel: 'Medium',
  priority: 'P2',
  businessImpact: 'Data quality'
}
```

2. **Write E2E test** that covers the scenario
3. **Tag test with scenario ID** in description
4. **Run tests** and generate traceability matrix
5. **Verify mapping** in generated report

## 🧹 Maintenance

### Clean Reports
```bash
cd qa
npm run clean
```

### Update Dependencies
```bash
cd qa
npm update
```

### Regenerate Matrix Only
```bash
cd qa
npm run generate:tm              # Full matrix
npm run generate:tm:selective    # Selective matrix
```

## 📚 Additional Resources

- [Allure Reporting Guide](./ALLURE.md) - **NEW!** Complete Allure documentation
- [Test Scenarios Catalog](./matrix/scenario-definitions.ts)
- [API Client Implementation](./tests/utils/apiClient.ts)
- [Test Fixtures](./tests/utils/fixtures.ts)
- [Docker Configuration](./docker-compose.qa.yml)

## 🎯 Current Test Coverage

**Overall:** 57% (4/7 scenarios)

**Covered:**
- ✅ HF001: Create user happy path
- ✅ NF001: Missing email validation
- ✅ NF004: Duplicate email handling
- ✅ NF005: Invalid email format

**High Priority Gaps (P1):**
- 🟡 NF003: Malformed JSON handling
- 🟡 KAF003: Kafka timeout scenarios

## 🚀 Next Steps

1. Add unit tests for NF003 (malformed JSON)
2. Add unit tests for KAF003 (Kafka timeout)
3. Expand identity service test coverage
4. Add performance tests
5. Add security tests
6. Integrate with CI/CD pipeline

---

**Last Updated:** December 5, 2025
