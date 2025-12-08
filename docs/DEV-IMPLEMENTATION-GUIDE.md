# Developer Implementation Guide
## Universal Unit-Test Traceability Validator

**Version:** 2.0.0  
**Last Updated:** December 2025  
**Target Audience:** Developers, DevOps Engineers

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Getting Started](#getting-started)
4. [Integration Steps](#integration-steps)
5. [Writing Unit Tests](#writing-unit-tests)
6. [Pre-Commit Workflow](#pre-commit-workflow)
7. [Configuration](#configuration)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [FAQ](#faq)

---

## 🎯 Overview

The Universal Unit-Test Traceability Validator is a **language-agnostic system** that:

- ✅ Maps business scenarios to unit tests
- ✅ Detects missing test coverage automatically
- ✅ Blocks commits when critical gaps exist
- ✅ Generates comprehensive traceability reports
- ✅ Supports Java, TypeScript, Python, Go, and more

### What Problem Does It Solve?

**Before:**
- Business scenarios exist in documents/JIRA but no clear mapping to tests
- Developers add features without corresponding unit tests
- QA can't verify if business requirements have test coverage
- Regressions occur when APIs are removed without updating tests

**After:**
- Automated validation on every commit
- Clear traceability matrix showing scenario → test mapping
- P0 gaps block commits, ensuring critical features are tested
- Gap reports guide developers on what tests to write

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer Workflow                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Git Pre-Commit Hook                         │
│  • Detects changed files                                         │
│  • Triggers validation for affected services                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Universal Validator Core                       │
│                                                                   │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐         │
│  │   Scenario   │  │  Test Parser  │  │   Semantic   │         │
│  │    Loader    │  │    Factory    │  │    Matcher   │         │
│  └──────────────┘  └───────────────┘  └──────────────┘         │
│         │                 │                    │                 │
│         └─────────────────┴────────────────────┘                │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Report Generator                             │
│  • HTML (visual dashboard)                                       │
│  • JSON (machine-readable)                                       │
│  • Markdown (documentation)                                      │
│  • CSV (spreadsheet import)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Responsibility |
|-----------|---------------|
| **ScenarioLoader** | Loads scenarios from YAML/JSON/Markdown/TXT files |
| **TestParser** | Parses unit tests from Java/TypeScript/Python/Go |
| **SemanticMatcher** | Maps scenarios to tests using fuzzy/semantic matching |
| **UniversalValidator** | Orchestrates validation and gap analysis |
| **ReportGenerator** | Creates multi-format reports |
| **Pre-Commit Hook** | Integrates validation into git workflow |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** (for pre-commit hooks)

### Installation

1. **Add the validator to your project:**

```bash
cd your-microservice-root
npm install --save-dev @universal/unit-test-traceability-validator
```

2. **Initialize configuration:**

```bash
npx utt-validate --init
```

This creates:
- `.traceability/config.json` - Main configuration
- `.traceability/scenarios/` - Scenario files directory
- `.traceability/reports/` - Report output directory

3. **Install git hooks:**

```bash
npm run install:hooks
```

---

## 🔧 Integration Steps

### Step 1: Configure Your Service

Edit `.traceability/config.json`:

```json
{
  "projectRoot": ".",
  "services": [
    {
      "name": "your-service",
      "enabled": true,
      "path": "src",
      "language": "java",              // java | typescript | python | go
      "testFramework": "junit",         // junit | jest | pytest | go-test
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java",
      "scenarioFile": ".traceability/scenarios/your-service.scenarios.yaml",
      "scenarioFormat": "yaml"          // yaml | json | markdown | txt
    }
  ],
  "validation": {
    "blockOnCriticalGaps": true,        // Block commits on P0 gaps
    "minimumCoveragePercent": 70        // Minimum required coverage
  }
}
```

### Step 2: Create Scenario File

Create `.traceability/scenarios/your-service.scenarios.yaml`:

```yaml
scenarios:
  - id: API-001
    description: When user creates a new order, system should validate and save it
    apiEndpoint: /api/orders
    httpMethod: POST
    priority: P1
    riskLevel: High
    category: Happy Path
    tags: [api, orders, create]
```

**Supported Formats:**
- ✅ **YAML** - Best for structured scenarios with metadata
- ✅ **JSON** - Best for programmatic generation
- ✅ **Markdown** - Best for documentation-style scenarios
- ✅ **Plain Text** - Simplest format for QA team

### Step 3: Write Unit Tests

Ensure your unit tests are **discoverable** by the parser:

#### Java/JUnit Example

```java
@Test
@DisplayName("When user creates order with valid data, system saves order")
public void testCreateOrderWithValidData() {
    // Arrange
    OrderRequest request = new OrderRequest("item123", 5);
    
    // Act
    OrderResponse response = orderService.createOrder(request);
    
    // Assert
    assertEquals(201, response.getStatusCode());
    assertNotNull(response.getOrderId());
}
```

#### TypeScript/Jest Example

```typescript
describe('OrderService', () => {
  it('should create order with valid data', async () => {
    // Arrange
    const request = { itemId: 'item123', quantity: 5 };
    
    // Act
    const response = await orderService.createOrder(request);
    
    // Assert
    expect(response.statusCode).toBe(201);
    expect(response.orderId).toBeDefined();
  });
});
```

### Step 4: Run Validation

```bash
# Validate all services
npm run validate

# Validate specific service
npm run validate -- --service your-service

# Validate with verbose output
npm run validate -- --all --verbose
```

### Step 5: Review Reports

Reports are generated in `.traceability/reports/`:

- **traceability-report.html** - Visual dashboard (open in browser)
- **traceability-report.json** - Machine-readable data
- **traceability-report.md** - Markdown documentation
- **traceability-report.csv** - Spreadsheet import

---

## ✍️ Writing Unit Tests

### Naming Conventions

The system uses **intelligent matching** to map scenarios to tests. Follow these patterns:

#### Good Test Names ✅

```java
// Clear, descriptive
testCreateOrderWithValidData()
testGetOrderReturns404WhenNotFound()
shouldRejectOrderWithInvalidQuantity()

// With @DisplayName (JUnit 5)
@DisplayName("When order is deleted, system marks as cancelled")
public void testDeleteOrder() { }
```

#### Poor Test Names ❌

```java
// Too generic
test1()
testOrder()
myTest()
```

### Test Structure

```java
@Test
public void testScenarioName() {
    // 1. Arrange - Set up test data
    Customer customer = new Customer("John", "john@example.com");
    
    // 2. Act - Execute the code under test
    CustomerResponse response = service.createCustomer(customer);
    
    // 3. Assert - Verify the outcome
    assertEquals(201, response.getStatusCode());
    assertNotNull(response.getCustomerId());
}
```

### Linking Tests to Scenarios

**Option 1: Use descriptive test names**
```java
@Test
public void testGetCustomerWithValidIdReturns200() {
    // Matches scenario: CUST-001
}
```

**Option 2: Reference scenario ID in test**
```java
/**
 * Tests scenario CUST-001: Get customer with valid ID
 */
@Test
public void testGetCustomerById() {
    // ...
}
```

**Option 3: Use tags**
```java
@Test
@Tag("CUST-001")
public void testGetCustomer() {
    // ...
}
```

---

## 🔄 Pre-Commit Workflow

### Automatic Validation

Once hooks are installed, validation runs automatically:

```bash
git add .
git commit -m "Add new customer API"

# Validator runs automatically:
# ╔════════════════════════════════════════════╗
# ║  Unit-Test Traceability Validator          ║
# ╚════════════════════════════════════════════╝
# 
# 📝 Changed files detected:
#    src/main/java/CustomerService.java
#    src/test/java/CustomerServiceTest.java
#
# 🔍 Running validation...
# ✓ Loaded 10 scenarios
# ✓ Found 8 unit tests
# ✓ Completed mapping analysis
#
# ✓ VALIDATION PASSED
# Coverage: 80%
```

### Handling Failures

If validation fails:

```bash
# ✗ VALIDATION FAILED
# ❌ Critical (P0) Gaps: 2
#    - CUST-001: Get customer by ID (no test found)
#    - CUST-004: Authentication required (no test found)
#
# 📊 View detailed report:
#    file:///path/to/.traceability/reports/traceability-report.html
#
# 💡 To bypass (not recommended):
#    git commit --no-verify
```

**What to do:**
1. Open the HTML report to see gaps
2. Write missing unit tests
3. Commit again

### Manual Execution

```bash
# Run manually for specific service
./scripts/pre-commit.sh --service customer-service

# Force bypass (emergency only)
./scripts/pre-commit.sh --force && git commit

# Verbose output
./scripts/pre-commit.sh --all --verbose
```

---

## ⚙️ Configuration

### Validation Rules

```json
{
  "validation": {
    "requireScenarioForEveryTest": false,
    "requireTestForEveryScenario": true,
    "blockOnCriticalGaps": true,
    "blockOnHighRiskGaps": false,
    "minimumCoveragePercent": 70,
    "allowOrphanTests": true,
    "maxOrphanTestsWarning": 10,
    "strictMode": false
  }
}
```

| Setting | Description | Recommended |
|---------|-------------|-------------|
| `blockOnCriticalGaps` | Block commits when P0 scenarios lack tests | `true` |
| `minimumCoveragePercent` | Minimum % of scenarios with tests | `70` |
| `strictMode` | Block on any gap (very strict) | `false` |
| `allowOrphanTests` | Allow tests without scenarios | `true` |

### Matching Strategies

```json
{
  "matching": {
    "strategies": ["exact", "fuzzy", "semantic", "keyword"],
    "defaultThreshold": 0.65,
    "weights": {
      "exact": 2.0,
      "fuzzy": 1.5,
      "semantic": 1.2,
      "keyword": 1.0
    }
  }
}
```

**Strategies:**
- **exact** - Exact string match (API endpoints, scenario IDs)
- **fuzzy** - Token-based similarity (handles typos, variations)
- **semantic** - Context-aware with synonyms
- **keyword** - Matches important keywords
- **levenshtein** - Edit distance algorithm

---

## 🐛 Troubleshooting

### Issue: "No tests found"

**Cause:** Test pattern doesn't match your files

**Solution:** Check `testPattern` in config:
```json
{
  "testPattern": "*Test.java"  // For Java
  // or
  "testPattern": "*.test.ts"    // For TypeScript
  // or
  "testPattern": "test_*.py"    // For Python
}
```

### Issue: "Scenario file not found"

**Cause:** Incorrect scenario file path

**Solution:** Verify path in config:
```json
{
  "scenarioFile": ".traceability/scenarios/your-service.scenarios.yaml"
}
```

### Issue: "Low match scores"

**Cause:** Test descriptions don't match scenario descriptions

**Solution:**
1. Improve test naming to be more descriptive
2. Lower the `defaultThreshold` in config (temporarily)
3. Add explicit matching rules in scenarios

### Issue: "Pre-commit hook not running"

**Cause:** Hooks not installed

**Solution:**
```bash
npm run install:hooks
# or
chmod +x scripts/install-hooks.sh
./scripts/install-hooks.sh
```

---

## ✅ Best Practices

### 1. Scenario Writing

```yaml
# ✅ GOOD - Clear, specific, testable
- id: API-001
  description: When user creates order with valid data, system saves order and returns 201
  apiEndpoint: /api/orders
  priority: P1

# ❌ BAD - Vague, not testable
- id: API-001
  description: Order stuff works
```

### 2. Test Naming

```java
// ✅ GOOD - Descriptive method name
@Test
public void shouldReturn404WhenCustomerNotFound() { }

// ❌ BAD - Generic name
@Test
public void test1() { }
```

### 3. Coverage Strategy

- **P0 scenarios** → Must have tests (blocks commits)
- **P1 scenarios** → Should have tests (warnings)
- **P2/P3 scenarios** → Nice to have tests

### 4. Maintenance

- Review orphan tests monthly
- Update scenarios when APIs change
- Run full validation before releases

---

## ❓ FAQ

**Q: Does this replace code coverage tools like JaCoCo?**  
A: No. This validates **business scenario coverage**, not code coverage. Use both!

**Q: What if I need to commit without tests?**  
A: Use `git commit --no-verify` (emergency only). Better: write the tests!

**Q: Can I use multiple scenario formats?**  
A: Yes! Each service can use YAML, JSON, Markdown, or TXT independently.

**Q: How do I add a new language?**  
A: Create a new parser implementing the `TestParser` interface. See `lib/parsers/` for examples.

**Q: Can QA run validation without committing?**  
A: Yes! Run `./scripts/pre-commit.sh --all` manually.

**Q: Performance impact on commits?**  
A: Typically 2-5 seconds for small services. Use `validateChangedServicesOnly: true` to speed up.

---

## 📚 Additional Resources

- [QA User Guide](./QA-USER-GUIDE.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Reference](./API-REFERENCE.md)
- [GitHub Repository](https://github.com/aquibshakeel/ai-testing-framework)

---

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/aquibshakeel/ai-testing-framework/issues)
- **Discussions:** [GitHub Discussions](https://github.com/aquibshakeel/ai-testing-framework/discussions)
- **Email:** support@example.com

---

**Last Updated:** December 2025  
**Version:** 2.0.0
