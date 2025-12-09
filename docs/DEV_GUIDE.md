# Developer Guide (DEV_GUIDE.md)
## AI-Driven Test Coverage System

**Version:** 5.0.0  
**Last Updated:** December 10, 2025  
**Audience:** Developers, DevOps Engineers, Tech Leads

---

## 📋 Table of Contents

1. [What is This System?](#what-is-this-system)
2. [What's New in v5.0.0](#whats-new-in-v50)
3. [Quick Setup (5 Minutes)](#quick-setup-5-minutes)
4. [Integration Guide](#integration-guide)
5. [How the System Works](#how-the-system-works)
6. [Running Locally](#running-locally)
7. [Pre-Commit Hook](#pre-commit-hook)
8. [Interpreting Reports](#interpreting-reports)
9. [Understanding Scenario Completeness](#understanding-scenario-completeness)
10. [Fixing Orphan Tests](#fixing-orphan-tests)
11. [Writing Unit Tests - Best Practices](#writing-unit-tests---best-practices)
12. [Troubleshooting](#troubleshooting)
13. [Integration Acceptance Checklist](#integration-acceptance-checklist)

---

## ⭐ What's New in v5.0.0

### Major Features Added

#### 1. Bidirectional Scenario Completeness Detection
The system now performs **3-layer intelligent analysis** to ensure true API completeness:

**Layer 1: Forward Check (API Spec → Baseline)**
- Analyzes API specifications to find missing scenarios
- Checks if unit tests exist for missing scenarios
- Categorizes gaps as CRITICAL or completeness issues

**Layer 1b: Reverse Check (Unit Tests → Baseline)**
- Finds unit tests without baseline scenarios
- Reports as "No test case for: [test]"
- Dual reporting in both completeness gaps AND orphan tests

**Layer 2: Baseline ↔ Unit Tests (Core Matching)**
- AI-powered semantic matching
- Initial coverage status determination

**Layer 3: Status Adjustment (Intelligence)**
- FULLY_COVERED only when baseline + API complete
- PARTIALLY_COVERED when baseline covered but API incomplete
- Smart status based on API spec analysis

**Console Output Example:**
```
POST /api/customers:
  ⚠️  API Completeness: 3 additional scenarios suggested
     - No unit test for: "When created with invalid email..."
     - Unit test exists for: "When created with duplicate..."
  
  🔍 Checking for unit tests without test cases...
  ⚠️  Found 2 unit tests without baseline scenarios
     - No test case for: "createCustomer_ShouldValidateEmail"
```

#### 2. Change Impact Analysis
Tracks which tests are affected when code changes:

- Detects git changes (added/modified/removed files)
- Finds affected unit tests
- Tracks lines changed with before/after diff
- Documents impact in ai_cases with 🔧 markers
- Provides recommendations for re-verification

**Benefits:**
- Know which tests to re-run after changes
- See impact of code modifications
- Track coverage degradation
- Before/after code comparison

#### 3. Enhanced Console Output
- Real-time completeness checking progress
- "No test case for" warnings
- "No unit test for" warnings
- Status adjustment notifications
- Detailed gap categorization

See `docs/SCENARIO-COMPLETENESS-DETECTION.md` for complete details.

---

## 🎯 What is This System?

### Purpose

The **Universal Unit-Test Traceability Validator** is a language-agnostic system that automatically validates whether your **business scenarios** (requirements) have corresponding **unit test coverage**. It runs automatically on every commit via pre-commit hooks and blocks commits when critical scenarios lack tests.

### Key Capabilities

✅ **Language Agnostic** - Supports Java, TypeScript, Python, Go, and more  
✅ **Semantic Matching** - Uses AI/fuzzy matching to map scenarios to tests  
✅ **Pre-Commit Integration** - Runs automatically, blocks P0 gaps  
✅ **Gap Detection** - Identifies missing test coverage  
✅ **Orphan Analysis** - Categorizes tests as technical vs business  
✅ **Rich Reports** - HTML, JSON, Markdown, CSV outputs  
✅ **Config-Driven** - Zero hardcoding, fully adoptable  

### What Problems Does It Solve?

**Before:**
- ❌ Business scenarios exist in documents but no clear link to tests
- ❌ Developers add features without unit tests
- ❌ No automated way to verify scenario coverage
- ❌ Manual tracking is error-prone and time-consuming

**After:**
- ✅ Automated validation on every commit
- ✅ Clear traceability: scenario → test mapping
- ✅ P0 gaps block commits automatically
- ✅ Beautiful reports showing full coverage
- ✅ API change detection

---

## ⚡ Quick Setup (5 Minutes)

### Prerequisites

```bash
# Check Node.js version (must be >= 18)
node --version

# Check npm version
npm --version

# Verify git is installed
git --version
```

### Installation Steps

```bash
# 1. Navigate to your project root
cd /path/to/your-microservice

# 2. Install the validator
npm install --save-dev @universal/unit-test-traceability-validator

# 3. Install git hooks
npm run install:hooks

# 4. Initialize configuration (creates .traceability folder structure)
npx utt-validate --init

# 5. Run first validation to verify setup
npm run validate
```

**Expected Output:**
```
✓ Configuration loaded
✓ Found 1 service(s)
✓ Validation complete
📊 Coverage: X%
```

### Folder Structure Created

```
your-project/
├── .traceability/
│   ├── config.json          # Main configuration
│   ├── scenarios/           # Scenario files go here
│   │   └── your-service.scenarios.yaml
│   └── reports/            # Generated reports
│       ├── traceability-report.html
│       ├── traceability-report.json
│       ├── traceability-report.md
│       └── traceability-report.csv
├── .git/
│   └── hooks/
│       └── pre-commit      # Auto-installed hook
└── package.json
```

---

## 🔧 Integration Guide

### Step 1: Configure Your Service

Edit `.traceability/config.json`:

```json
{
  "projectRoot": ".",
  "services": [
    {
      "name": "your-service-name",
      "enabled": true,
      "path": "services/your-service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java",
      "scenarioFile": ".traceability/scenarios/your-service.scenarios.yaml",
      "scenarioFormat": "yaml"
    }
  ],
  "matching": {
    "strategies": ["exact", "fuzzy", "semantic", "keyword", "levenshtein"],
    "defaultThreshold": 0.65,
    "weights": {
      "exact": 2.0,
      "fuzzy": 1.5,
      "semantic": 1.2,
      "keyword": 1.0
    }
  },
  "reporting": {
    "formats": ["html", "json", "markdown", "csv"],
    "outputDirectory": ".traceability/reports"
  },
  "validation": {
    "blockOnCriticalGaps": true,
    "minimumCoveragePercent": 70,
    "allowOrphanTests": true
  },
  "preCommit": {
    "enabled": true,
    "blockOnP0Gaps": true,
    "blockOnP1Gaps": false,
    "validateChangedServicesOnly": true
  }
}
```

### Configuration Parameters Explained

| Parameter | Description | Example Values |
|-----------|-------------|----------------|
| **name** | Service identifier | "customer-service", "auth-service" |
| **language** | Programming language | "java", "typescript", "python", "go" |
| **testFramework** | Test framework used | "junit", "jest", "pytest", "go-test" |
| **testDirectory** | Path to tests | "src/test/java", "test/" |
| **testPattern** | File name pattern | "*Test.java", "*.test.ts", "test_*.py" |
| **scenarioFile** | Path to scenario file | ".traceability/scenarios/my-service.scenarios.yaml" |
| **scenarioFormat** | Format of scenarios | "yaml", "json", "markdown", "txt" |

### Step 2: Create Scenario File

Create `.traceability/scenarios/your-service.scenarios.yaml`:

```yaml
scenarios:
  - id: API-001
    description: When user creates resource with valid data, system returns 201
    apiEndpoint: /api/resource
    httpMethod: POST
    priority: P1
    riskLevel: High
    category: Happy Path
    tags: [api, create, resource]
    acceptanceCriteria:
      - Response status is 201
      - Resource ID is returned
      - Resource is saved in database

  - id: API-002
    description: When user requests resource with invalid ID, returns 404
    apiEndpoint: /api/resource/:id
    httpMethod: GET
    priority: P0
    riskLevel: Critical
    category: Error Handling
    tags: [api, get, 404]
```

### Step 3: Verify Configuration

```bash
# Validate configuration syntax
npx utt-validate --validate-config

# Test scenario file loads correctly
npx utt-validate --service your-service-name --dry-run
```

### Step 4: Run First Validation

```bash
# Run validation
npm run validate

# Open generated report
open .traceability/reports/traceability-report.html
```

---

## ⚙️ How the Validator Works

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TRIGGER: Developer commits code                          │
│    git commit -m "Add feature"                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PRE-COMMIT HOOK: Executes scripts/pre-commit.sh          │
│    • Detects changed files                                  │
│    • Identifies affected services                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. LOAD CONFIGURATION: Reads .traceability/config.json      │
│    • Service paths                                          │
│    • Test patterns                                          │
│    • Matching strategies                                    │
│    • Blocking rules                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. LOAD SCENARIOS: Reads scenario files                     │
│    • YAML/JSON/Markdown/TXT formats                         │
│    • Parses scenario metadata                               │
│    • Extracts priorities, risk levels                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PARSE TESTS: Language-specific parsers                   │
│    • Java: Scans @Test annotations                          │
│    • TypeScript: Finds describe/it blocks                   │
│    • Python: Locates test_ functions                        │
│    • Extracts test names, descriptions                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SEMANTIC MATCHING: Maps scenarios to tests               │
│    • Exact matching (API endpoints, IDs)                    │
│    • Fuzzy matching (similar text)                          │
│    • Semantic matching (synonyms, context)                  │
│    • Keyword matching (important terms)                     │
│    • Calculates match confidence (0-100%)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. GAP ANALYSIS: Identifies coverage gaps                   │
│    • Scenarios without tests                                │
│    • Tests without scenarios (orphans)                      │
│    • API changes detected                                   │
│    • Categorizes by priority (P0/P1/P2/P3)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. GENERATE REPORTS: Multi-format outputs                   │
│    • HTML (visual dashboard)                                │
│    • JSON (machine-readable)                                │
│    • Markdown (documentation)                               │
│    • CSV (spreadsheet)                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. DECISION: Pass or Fail                                   │
│    • If P0 gaps exist → BLOCK commit                        │
│    • If coverage >= minimum → ALLOW commit                  │
│    • Exit code: 0 = pass, non-zero = fail                   │
└─────────────────────────────────────────────────────────────┘
```

### Matching Strategies Explained

1. **Exact Matching (Weight: 2.0)**
   - Direct string match
   - Used for API endpoints, scenario IDs
   - Example: "/api/customer/:id" matches exactly

2. **Fuzzy Matching (Weight: 1.5)**
   - Token-based similarity
   - Handles typos, word order variations
   - Example: "get customer by id" ≈ "customer id get"

3. **Semantic Matching (Weight: 1.2)**
   - Context-aware, synonym expansion
   - Example: "delete" = "remove" = "destroy"

4. **Keyword Matching (Weight: 1.0)**
   - Matches important keywords
   - Example: "customer", "404", "invalid", "id"

5. **Levenshtein Distance**
   - Edit distance algorithm
   - Catches typos: "customr" vs "customer"

### Match Score Calculation

```typescript
finalScore = (exact * 2.0) + (fuzzy * 1.5) + (semantic * 1.2) + (keyword * 1.0)
confidence = finalScore / maxPossibleScore * 100

// Decision thresholds:
if (confidence >= 75%)  → "Fully Covered"
if (confidence >= 60%)  → "Partially Covered"
if (confidence < 60%)   → "Not Covered"
```

---

## 🚀 Running Locally

### Basic Commands

```bash
# Validate all services
npm run validate

# Validate specific service
npm run validate -- --service customer-service

# Validate multiple services
npm run validate -- --service service1 --service service2

# Validate only changed services (based on git diff)
npm run validate -- --changed

# Dry run (don't fail, just report)
npm run validate -- --all --dry-run

# Verbose output (shows matching details)
npm run validate -- --all --verbose

# Force validation (ignore cache)
npm run validate -- --all --force
```

### Advanced Usage

```bash
# Generate only specific report format
npm run validate -- --all --format html

# Output to custom directory
npm run validate -- --all --output /path/to/reports

# Strict mode (block on any gap)
npm run validate -- --all --strict

# Skip pre-commit hooks for testing
npm run validate -- --all --no-hooks
```

### Dry-Run Mode

**Purpose:** Test validation without failing the build

```bash
# Run in dry-run mode
npm run validate -- --dry-run

# What it does:
# ✓ Loads configuration
# ✓ Parses scenarios and tests
# ✓ Performs matching
# ✓ Generates reports
# ✗ Does NOT fail/exit with error code
# ✗ Does NOT block commits
```

**Use Cases:**
- Testing new configurations
- Experimenting with thresholds
- QA validation without committing
- CI/CD reporting without blocking

### Watch Mode (Development)

```bash
# Watch for file changes and re-validate
npm run validate:watch

# Useful during development to see real-time coverage
```

---

## 🔗 Pre-Commit Hook

### How It Works

When you run `git commit`, the pre-commit hook automatically:

1. **Detects Changed Files**
   ```bash
   git diff --cached --name-only
   ```

2. **Identifies Affected Services**
   - Maps changed files to service definitions
   - Only validates affected services (unless `validateChangedServicesOnly: false`)

3. **Runs Validation**
   - Loads scenarios
   - Parses tests
   - Performs matching
   - Checks for P0/P1 gaps

4. **Decides: Block or Allow**
   - **BLOCK** if P0 gaps exist (configurable)
   - **ALLOW** if coverage meets requirements
   - Displays report location

### Pre-Commit Configuration

In `.traceability/config.json`:

```json
{
  "preCommit": {
    "enabled": true,
    "blockOnP0Gaps": true,
    "blockOnP1Gaps": false,
    "validateChangedServicesOnly": true
  }
}
```

| Setting | Description | Default |
|---------|-------------|---------|
| **enabled** | Enable/disable pre-commit validation | `true` |
| **blockOnP0Gaps** | Block commits when P0 scenarios lack tests | `true` |
| **blockOnP1Gaps** | Block commits when P1 scenarios lack tests | `false` |
| **validateChangedServicesOnly** | Only validate services with changes | `true` |

### Opting In/Out

**Disable for Single Commit:**
```bash
# Bypass pre-commit hook (not recommended)
git commit --no-verify -m "Emergency fix"

# Or set environment variable
SKIP_VALIDATION=true git commit -m "Skip validation"
```

**Disable Globally (Local Development):**

**Option 1: Edit Config**
```json
{
  "preCommit": {
    "enabled": false
  }
}
```

**Option 2: Remove Hook**
```bash
# Temporarily disable
mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled

# Re-enable later
mv .git/hooks/pre-commit.disabled .git/hooks/pre-commit
```

**Option 3: Environment Variable**
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc)
export SKIP_UTT_VALIDATION=true

# Or per session
export SKIP_UTT_VALIDATION=true
```

### Re-Installing Hooks

```bash
# If hooks get accidentally deleted
npm run install:hooks

# Verify hook exists
ls -la .git/hooks/pre-commit
```

---

## 📊 Interpreting Reports

### HTML Report Sections

**1. Summary Statistics**
```
Coverage: 85%
Total Scenarios: 20
Fully Covered: 17
Not Covered: 3
P0 Gaps: 1
```

**What to Look For:**
- Coverage should be >= 70% (configurable)
- P0 Gaps should be 0
- Check trend indicators (↑ improving, ↓ declining)

**2. Coverage Gaps**
```
🚨 CUST-001 [P0]
Description: Get customer by ID returns 200
API: GET /api/customer/:id
Impact: Critical scenario without test coverage
Action Required: Developer - Create Test
```

**What to Do:**
- **P0 Gaps:** MUST fix immediately (blocks commits)
- **P1 Gaps:** Should fix soon (warnings only)
- **P2/P3 Gaps:** Nice to have (informational)

**3. Orphan Tests**
```
Test ID: CustomerMapperTest.testMapToDto()
Category: 🔧 Technical
Priority: P3
Suggested Fix: No action needed
```

**Categories:**
- **🔧 Technical** - Infrastructure tests (DTOs, Mappers, etc.) - No action needed
- **💼 Business** - Business logic tests - QA should create scenario

**4. Suggested Fixes (NEW!)**

Each orphan test now shows:
```
Suggested Fix: QA Action: Create scenario for this controller test
Suggested ID: CUST-NEW-001
```

**Action:**
- If business test: QA creates scenario
- If technical test: No action needed

**5. Traceability Matrix**

Shows scenario-to-test mapping:
```
Scenario    | Test                          | Match %
------------|-------------------------------|--------
CUST-001    | testGetCustomerById()         | 95%
CUST-002    | testGetCustomerNotFound()     | 88%
CUST-003    | -                             | 0% (GAP)
```

---

## 🔧 Fixing Orphan Tests

### What are Orphan Tests?

**Orphan tests** are unit tests that don't have a corresponding business scenario. They fall into two categories:

1. **Technical Tests** (No Action Needed)
   - Entity/DTO tests
   - Mapper tests
   - Utility class tests
   - Database repository tests
   - Configuration tests

2. **Business Tests** (QA Action Required)
   - Controller tests
   - Service layer tests
   - API endpoint tests
   - Business logic tests

### Fixing Orphan Business Tests

#### Template 1: Create New Scenario

**Orphan Test Found:**
```java
@Test
public void testUpdateCustomerEmailReturns200() {
    // Test implementation
}
```

**Action: QA Creates Scenario**
```yaml
- id: CUST-NEW-001
  description: When user updates customer email with valid data, system returns 200
  apiEndpoint: /api/customer/:id
  httpMethod: PUT
  priority: P2
  riskLevel: Medium
  category: Update
  tags: [api, update, customer, email]
  acceptanceCriteria:
    - Response status is 200
    - Email is updated in database
    - Validation is performed
```

#### Template 2: Link Existing Scenario

**Orphan Test:**
```java
@Test
public void testDeleteCustomerSoftDelete() {
    // Test implementation
}
```

**If scenario already exists (CUST-010):**

**Option A: Improve Test Naming**
```java
// Rename test to match scenario description
@Test
@DisplayName("When user deletes customer, system marks as deleted (CUST-010)")
public void testDeleteCustomerSoftDelete() {
    // ...
}
```

**Option B: Update Scenario Description**
```yaml
# Make description match test name better
- id: CUST-010
  description: Delete customer performs soft delete
  # Or add explicit test reference
  testId: "testDeleteCustomerSoftDelete"
```

### Example Scenarios for Common Orphan Tests

#### Controller Tests

```yaml
# For: testCreateCustomerWithValidData()
- id: CTRL-001
  description: When valid customer data is posted, controller returns 201 and customer ID
  apiEndpoint: /api/customer
  httpMethod: POST
  priority: P1
  riskLevel: High

# For: testGetCustomerReturns404WhenNotFound()
- id: CTRL-002
  description: When customer ID does not exist, controller returns 404
  apiEndpoint: /api/customer/:id
  httpMethod: GET
  priority: P0
  riskLevel: Critical
```

#### Service Layer Tests

```yaml
# For: testCustomerServiceCreatesWithValidation()
- id: SVC-001
  description: Customer service validates input before saving to database
  priority: P1
  riskLevel: High
  category: Business Logic

# For: testCustomerServiceHandlesDatabaseErrors()
- id: SVC-002
  description: Service handles database connection failures gracefully
  priority: P0
  riskLevel: Critical
  category: Error Handling
```

### Bulk Fixing Orphans

**Step 1: Export Orphan List**
```bash
# Run validation and check report
npm run validate

# Open JSON report
cat .traceability/reports/traceability-report.json | \
  jq '.orphanTests[] | select(.orphanCategory.type == "business")'
```

**Step 2: Create Scenario Template**
```yaml
# Add to your scenarios file
# Template for orphan test: testXXX
- id: GEN-001
  description: [FILL FROM TEST NAME]
  apiEndpoint: [FILL IF APPLICABLE]
  httpMethod: [GET/POST/PUT/DELETE]
  priority: P2  # Adjust based on importance
  riskLevel: Medium
  category: [Business Logic/API/Error Handling]
  tags: []
```

**Step 3: Run Validation Again**
```bash
npm run validate
# Verify orphan count decreased
```

---

## ✍️ Writing Unit Tests - Best Practices

### Test Naming Conventions

**❌ Bad Test Names**
```java
@Test
public void test1() { }

@Test
public void testMethod() { }

@Test
public void testCustomer() { }
```

**✅ Good Test Names**
```java
@Test
public void testGetCustomerWithValidIdReturns200() { }

@Test
public void testCreateCustomerWithInvalidEmailReturns400() { }

@Test
public void testDeleteCustomerMarksAsDeleted() { }
```

### Using @DisplayName (JUnit 5)

```java
@Test
@DisplayName("When user requests customer with valid ID, system returns 200 with customer data")
public void testGetCustomer() {
    // Test implementation
}
```

**Benefits:**
- Better semantic matching
- Report shows clear description
- Self-documenting tests

### Linking Tests to Scenarios

**Method 1: Scenario ID in Comment**
```java
/**
 * Tests scenario CUST-001: Get customer by ID
 */
@Test
public void testGetCustomerById() {
    // ...
}
```

**Method 2: Tag Annotation**
```java
@Test
@Tag("CUST-001")
@Tag("P0")
public void testGetCustomerById() {
    // ...
}
```

**Method 3: Descriptive Naming**
```java
@Test
public void testGetCustomerWithValidIdReturns200_CUST001() {
    // ...
}
```

### Test Structure Format

**AAA Pattern (Arrange-Act-Assert)**
```java
@Test
public void testCreateCustomerWithValidData() {
    // ARRANGE - Set up test data
    CustomerRequest request = new CustomerRequest();
    request.setName("John Doe");
    request.setEmail("john@example.com");
    
    when(repository.save(any())).thenReturn(savedCustomer);
    
    // ACT - Execute the method under test
    CustomerResponse response = service.createCustomer(request);
    
    // ASSERT - Verify the outcome
    assertNotNull(response);
    assertEquals(201, response.getStatusCode());
    assertEquals("John Doe", response.getName());
    verify(repository).save(any());
}
```

### What to Include in Every Test

1. **Clear Purpose** - Test name explains what it tests
2. **Single Responsibility** - Tests one thing
3. **Isolated** - No dependencies on other tests
4. **Repeatable** - Same result every time
5. **Fast** - Runs quickly
6. **Assertions** - Verifies expected behavior

### Testing Scenarios Format Requirements

**For Successful Matching, Include:**

```java
// ✅ Includes action, condition, and expected result
testGetCustomerWithValidIdReturns200()

// ✅ Includes error condition and response
testCreateCustomerWithInvalidEmailReturns400()

// ✅ Includes authentication scenario
testGetCustomerWithoutAuthTokenReturns401()
```

**Keywords for Better Matching:**
- HTTP methods: GET, POST, PUT, DELETE
- Status codes: 200, 201, 400, 401, 404, 500, 503
- Actions: create, get, update, delete, validate
- Conditions: valid, invalid, missing, empty, malformed
- Entities: customer, order, user, product

### Example Test Suite

```java
@SpringBootTest
public class CustomerControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    /**
     * Tests CUST-001: Happy path - Get customer by ID
     */
    @Test
    @DisplayName("When user requests customer with valid ID, returns 200 with customer data")
    public void testGetCustomerWithValidIdReturns200() {
        // Arrange
        String customerId = "123";
        Customer customer = new Customer(customerId, "John", "john@example.com");
        when(customerService.getById(customerId)).thenReturn(customer);
        
        // Act & Assert
        mockMvc.perform(get("/api/customer/" + customerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(customerId))
            .andExpect(jsonPath("$.name").value("John"));
    }
    
    /**
     * Tests CUST-002: Error handling - Invalid ID
     */
    @Test
    @DisplayName("When customer ID does not exist, returns 404")
    public void testGetCustomerWithInvalidIdReturns404() {
        // Arrange
        String customerId = "999";
        when(customerService.getById(customerId))
            .thenThrow(new CustomerNotFoundException(customerId));
        
        // Act & Assert
        mockMvc.perform(get("/api/customer/" + customerId))
            .andExpect(status().isNotFound());
    }
    
    /**
     * Tests CUST-003: Security - Authentication required
     */
    @Test
    @DisplayName("When request lacks auth token, returns 401")
    public void testGetCustomerWithoutAuthReturns401() {
        // Act & Assert
        mockMvc.perform(get("/api/customer/123"))
            .andExpect(status().isUnauthorized());
    }
}
```

---

## 🐛 Troubleshooting

### Common Error 1: "Configuration file not found"

**Error Message:**
```
Error: Configuration file not found at .traceability/config.json
```

**Solution:**
```bash
# Initialize configuration
npx utt-validate --init

# Or manually create config
mkdir -p .traceability/scenarios
cat > .traceability/config.json << 'EOF'
{
  "projectRoot": ".",
  "services": [],
  "matching": {},
  "reporting": {},
  "validation": {}
}
EOF
```

### Common Error 2: "No tests found"

**Error Message:**
```
Warning: No tests found for service: customer-service
```

**Possible Causes:**
1. Wrong `testDirectory` path
2. Wrong `testPattern`
3. Tests not in expected location

**Solution:**
```bash
# Check test directory path
ls -la services/customer-service/src/test/java

# Verify test pattern matches files
find services/customer-service/src/test -name "*Test.java"

# Update config.json with correct paths
{
  "testDirectory": "src/test/java",  // Adjust this
  "testPattern": "*Test.java"         // And this
}
```

### Common Error 3: "Scenario file not found"

**Error Message:**
```
Error: Scenario file not found: .traceability/scenarios/my-service.scenarios.yaml
```

**Solution:**
```bash
# Create scenario file
cat > .traceability/scenarios/my-service.scenarios.yaml << 'EOF'
scenarios:
  - id: EXAMPLE-001
    description: Example scenario
    priority: P2
    riskLevel: Medium
EOF

# Verify path in config matches
cat .traceability/config.json | grep scenarioFile
```

### Common Error 4: "Low match scores"

**Error Message:**
```
Warning: Many scenarios have low match scores (< 60%)
```

**Possible Causes:**
1. Test names don't match scenario descriptions
2. Threshold is too high
3. Insufficient matching strategies

**Solution:**
```bash
# Option 1: Improve test naming to match scenarios
# Rename tests to be more descriptive

# Option 2: Lower threshold temporarily
# Edit config.json
{
  "matching": {
    "defaultThreshold": 0.50  # Lower from 0.65
  }
}

# Option 3: Enable more matching strategies
{
  "matching": {
    "strategies": ["exact", "fuzzy", "semantic", "keyword", "levenshtein", "jaccard"]
  }
}
```

### Common Error 5: "Pre-commit hook not running"

**Error Message:**
```
# No validation occurs when committing
```

**Solution:**
```bash
# Check if hook exists
ls -la .git/hooks/pre-commit

# Re-install hooks
npm run install:hooks

# Make executable
chmod +x .git/hooks/pre-commit

# Verify content
cat .git/hooks/pre-commit
```

### Common Error 6: "Module not found"

**Error Message:**
```
Error: Cannot find module '@universal/unit-test-traceability-validator'
```

**Solution:**
```bash
# Re-install dependencies
rm -rf node_modules package-lock.json
npm install

# Or install validator specifically
npm install --save-dev @universal/unit-test-traceability-validator

# Verify installation
npm list @universal/unit-test-traceability-validator
```

---

## ✅ Integration Acceptance Checklist

Use this checklist to verify successful integration of the validator into your microservice:

### Phase 1: Installation & Configuration

- [ ] Node.js >= 18.0.0 installed
- [ ] npm packages installed successfully
- [ ] `.traceability/` folder structure created
- [ ] `config.json` exists and is valid JSON
- [ ] Service configuration added to `config.json`
- [ ] Scenario file created (even if minimal)
- [ ] Pre-commit hook installed in `.git/hooks/`
- [ ] Hook is executable (`chmod +x`)

### Phase 2: Basic Validation

- [ ] `npm run validate` executes without errors
- [ ] Configuration loads successfully
- [ ] Service is detected
- [ ] Test files are found and parsed
- [ ] Scenario file loads without errors
- [ ] Reports are generated in `.traceability/reports/`
- [ ] HTML report opens in browser
- [ ] JSON report is valid JSON

### Phase 3: Scenario-Test Mapping

- [ ] At least one scenario matches a test
- [ ] Match confidence scores are reasonable (> 60%)
- [ ] Coverage percentage is calculated
- [ ] Gaps are identified correctly
- [ ] Orphan tests are categorized (technical vs business)
- [ ] Priority levels (P0/P1/P2/P3) are respected

### Phase 4: Pre-Commit Integration

- [ ] Pre-commit hook runs automatically on `git commit`
- [ ] Validation output is displayed
- [ ] P0 gaps block commits (if configured)
- [ ] Successful commits proceed normally
- [ ] Report location is displayed after validation
- [ ] `git commit --no-verify` bypasses validation

### Phase 5: Report Quality

- [ ] HTML report is visually appealing
- [ ] All sections render correctly
- [ ] Summary statistics are accurate
- [ ] Coverage gaps are clearly listed
- [ ] Orphan tests section shows suggested fixes
- [ ] Traceability matrix is complete
- [ ] JSON report contains all data
- [ ] Markdown report is readable
- [ ] CSV report imports correctly to Excel

### Phase 6: Edge Cases

- [ ] Handles missing scenario file gracefully
- [ ] Handles invalid config gracefully
- [ ] Handles no tests found gracefully
- [ ] Handles API changes detection
- [ ] Handles orphan scenarios
- [ ] Handles orphan APIs
- [ ] Error messages are clear and actionable

### Phase 7: Team Adoption

- [ ] Documentation is accessible to team
- [ ] Developers understand how to write matching tests
- [ ] QA understands how to write scenarios
- [ ] Pre-commit behavior is documented
- [ ] Troubleshooting guide is available
- [ ] Team has reviewed HTML report format
- [ ] Escalation path defined for issues

### Phase 8: CI/CD Integration (Optional)

- [ ] Validator runs in CI/CD pipeline
- [ ] Build fails on P0 gaps
- [ ] Reports are archived as artifacts
- [ ] Trend analysis is tracked
- [ ] Notifications configured
- [ ] Dashboard integration (if applicable)

### Final Sign-Off

**Service Name:** ____________________  
**Integrated By:** ____________________  
**Date:** ____________________  
**Coverage at Integration:** ____%  
**P0 Gaps:** ____  
**Status:** [ ] Approved [ ] Needs Work

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## 📚 Additional Resources

- **QA Guide:** `docs/QA_GUIDE.md` - For QA team
- **System Testing Guide:** `docs/SYSTEM-TESTING-GUIDE.md` - For comprehensive testing
- **GitHub Repository:** [Universal Validator Repo](https://github.com/aquibshakeel/ai-testing-framework)
- **Issue Tracker:** [GitHub Issues](https://github.com/aquibshakeel/ai-testing-framework/issues)

---

## 🆘 Getting Help

**Internal Support:**
- Ask your team lead
- Check team wiki
- Review existing scenarios/tests for examples

**External Support:**
- GitHub Discussions
- Create an issue with error details
- Check FAQ in README.md

---

## 🎯 Quick Reference Card

```bash
# Installation
npm install --save-dev @universal/unit-test-traceability-validator
npm run install:hooks

# Basic Commands
npm run validate                           # Validate all
npm run validate -- --service my-service   # Validate one
npm run validate -- --dry-run              # Test mode

# Report Locations
.traceability/reports/traceability-report.html   # Main report
.traceability/reports/traceability-report.json   # Data export

# Bypass Hook (Emergency)
git commit --no-verify -m "message"

# Configuration
.traceability/config.json                  # Main config
.traceability/scenarios/*.yaml             # Scenario files

# Common Fixes
npm run install:hooks                      # Reinstall hooks
npx utt-validate --init                    # Initialize config
```

---

**Version:** 5.0.0  
**Last Updated:** December 10, 2025  
**Maintained By:** AI-Driven Test Coverage Team

---

**🎉 Congratulations! You're now ready to use the AI-Driven Test Coverage System v5.0.0!**
