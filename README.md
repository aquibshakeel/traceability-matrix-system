# Universal Unit-Test Traceability Validator

**Version 2.0.0** | **Language-Agnostic** | **Production-Ready**

A comprehensive, adoptable library that validates business scenarios against microservice unit tests and generates traceability reports during pre-commit.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## ✨ Features

### 🎯 Core Capabilities
- ✅ **Universal Language Support** - Java, TypeScript, Python, Go, Ruby, C#, Kotlin, PHP, Rust
- ✅ **Multi-Format Scenarios** - YAML, JSON, Markdown, Plain Text
- ✅ **Semantic Matching** - Fuzzy, exact, keyword, Levenshtein, Jaccard, Regex
- ✅ **Pre-Commit Integration** - Automatic validation on every commit
- ✅ **Gap Detection** - Identifies missing tests, orphan scenarios, API changes
- ✅ **Intelligent Orphan Categorization** - Technical vs Business test detection
- ✅ **Rich Reports** - HTML, JSON, Markdown, CSV formats
- ✅ **Traceability Matrix** - Complete scenario-to-test mapping
- ✅ **Zero Hardcoding** - Fully configurable, adoptable to any project

### 🚀 What Makes It Universal?

| Feature | Description |
|---------|-------------|
| **Language Agnostic** | Supports any programming language with pluggable parsers |
| **Framework Agnostic** | JUnit, Jest, Pytest, TestNG, Go-Test, RSpec, and more |
| **Scenario Formats** | YAML, JSON, Markdown, or plain text - your choice |
| **Matching Strategies** | 7 different AI/semantic matching algorithms |
| **Reporting Formats** | HTML, JSON, Markdown, CSV - for any audience |
| **Configuration Driven** | No code changes needed to adopt in new projects |

---

## 📊 What Problems Does It Solve?

### Before
❌ Business scenarios in documents, no link to tests  
❌ Developers add features without unit tests  
❌ No way to verify scenario coverage  
❌ Manual tracking is error-prone  
❌ Regressions when APIs are removed  

### After
✅ Automated scenario → test validation  
✅ Pre-commit blocks when critical scenarios lack tests  
✅ Beautiful reports showing full traceability  
✅ P0 gaps prevent commits automatically  
✅ API changes detected immediately  

---

## 🎬 Quick Start

### Installation

```bash
# Install in your project root
npm install --save-dev @universal/unit-test-traceability-validator

# Or clone for development
git clone https://github.com/aquibshakeel/ai-testing-framework.git
cd ai-testing-framework
npm install
```

### Setup (2 minutes)

```bash
# 1. Install git hooks
npm run install:hooks

# 2. Configure your service (.traceability/config.json created automatically)

# 3. Create scenario file
# .traceability/scenarios/your-service.scenarios.yaml

# 4. Run validation
npm run validate
```

### Example Scenario File (YAML)

```yaml
scenarios:
  - id: API-001
    description: When user creates order with valid data, system returns 201
    apiEndpoint: /api/orders
    httpMethod: POST
    priority: P1
    riskLevel: High
    category: Happy Path
    tags: [api, orders, create]
    acceptanceCriteria:
      - Response status is 201
      - Order ID is returned
      - Order is saved in database
```

### Example Unit Test (Java)

```java
@Test
@DisplayName("When user creates order with valid data, system returns 201")
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

**System automatically maps them together!** ✨

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Git Pre-Commit Hook                       │
│  Triggers on every commit, validates changed services        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Universal Validator Core                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Scenario   │  │     Test     │  │   Semantic   │      │
│  │    Loader    │  │    Parser    │  │    Matcher   │      │
│  │              │  │              │  │              │      │
│  │ • YAML       │  │ • Java       │  │ • Fuzzy      │      │
│  │ • JSON       │  │ • TypeScript │  │ • Exact      │      │
│  │ • Markdown   │  │ • Python     │  │ • Keyword    │      │
│  │ • Plain Text │  │ • Go         │  │ • Semantic   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  Loads scenarios → Parses tests → Maps with AI → Analyzes   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Report Generator                          │
│  • HTML (visual dashboard)                                   │
│  • JSON (machine-readable)                                   │
│  • Markdown (documentation)                                  │
│  • CSV (spreadsheet import)                                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Purpose | Extensible |
|-----------|---------|------------|
| **ScenarioLoader** | Loads scenarios from multiple formats | ✅ Add new formats |
| **TestParserFactory** | Creates language-specific parsers | ✅ Add new languages |
| **SemanticMatcher** | Maps scenarios to tests with AI | ✅ Add new strategies |
| **UniversalValidator** | Orchestrates validation logic | ✅ Add new rules |
| **ReportGenerator** | Produces multi-format reports | ✅ Add new formats |
| **Pre-Commit Hook** | Git integration | ✅ Customize behavior |

---

## 📚 Complete Documentation

### For Developers
📖 **[Developer Implementation Guide](docs/DEV-IMPLEMENTATION-GUIDE.md)**
- How to integrate into your service
- Writing unit tests that map correctly
- Configuration options
- Pre-commit workflow
- Troubleshooting
- Best practices

### For QA Engineers
📖 **[QA User Guide](docs/QA-USER-GUIDE.md)**
- What is the system and how it works
- Matching techniques explained
- Writing business scenarios
- Managing scenarios (add/update/delete)
- Understanding reports
- Manual validation workflow
- E2E workflow examples

### Architecture & Technical
📖 **[Architecture Documentation](docs/ARCHITECTURE.md)** *(See system design above)*

---

## 🎯 Usage Examples

### Command Line

```bash
# Validate all services
npm run validate
# or
utt-validate --all

# Validate specific service
utt-validate --service customer-service

# Validate only changed services (git diff)
utt-validate --changed

# Generate specific report format
utt-validate --all --format html

# Verbose output
utt-validate --all --verbose

# Dry run (don't fail, just report)
utt-validate --all --dry-run
```

### Manual Execution (QA)

```bash
# QA can run validation anytime without committing
./scripts/pre-commit.sh --all

# Validate specific service
./scripts/pre-commit.sh --service customer-service

# Force bypass (emergency only)
./scripts/pre-commit.sh --force
```

### Programmatic API

```typescript
import { UniversalValidator } from '@universal/unit-test-traceability-validator';

// Load configuration
const config = loadConfig('.traceability/config.json');

// Create validator
const validator = new UniversalValidator(config);

// Run validation
const result = await validator.validateAll();

// Check success
if (result.success) {
  console.log(`✓ Coverage: ${result.summary.coveragePercent}%`);
} else {
  console.log(`✗ P0 Gaps: ${result.summary.p0Gaps}`);
}

// Generate reports
await validator.generateReports(result);
```

---

## ⚙️ Configuration

### Complete Example

```json
{
  "projectRoot": ".",
  "services": [
    {
      "name": "customer-service",
      "enabled": true,
      "path": "customer-service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java",
      "scenarioFile": ".traceability/scenarios/customer-service.scenarios.yaml"
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
    },
    "normalization": {
      "lowercase": true,
      "removePunctuation": true,
      "synonymExpansion": true,
      "stemming": true,
      "removeStopWords": true
    },
    "synonyms": {
      "create": ["add", "insert", "new", "post"],
      "read": ["get", "fetch", "retrieve", "find"],
      "update": ["modify", "edit", "change", "put"],
      "delete": ["remove", "destroy", "drop"]
    }
  },
  "reporting": {
    "formats": ["html", "json", "markdown", "csv"],
    "outputDirectory": ".traceability/reports",
    "includeOrphans": true,
    "includeGaps": true,
    "includeStatistics": true
  },
  "validation": {
    "blockOnCriticalGaps": true,
    "minimumCoveragePercent": 70,
    "allowOrphanTests": true,
    "maxOrphanTestsWarning": 10
  },
  "preCommit": {
    "enabled": true,
    "blockOnP0Gaps": true,
    "blockOnP1Gaps": false,
    "validateChangedServicesOnly": true
  }
}
```

---

## 🎨 Report Examples

### HTML Report
Beautiful, interactive dashboard with:
- **Coverage Statistics** - Real-time metrics with trend indicators
- **Visual Analytics** - Interactive Chart.js visualizations:
  - Coverage distribution pie chart
  - Gap priority breakdown bar chart
  - Orphan test priority breakdown chart (NEW!)
  - Coverage trend over time line chart
- **Smart Filters**:
  - Priority filters (P0/P1/P2/P3) - Toggle to show/hide by priority
  - Status filters (All/Covered/Partial/Not Covered)
  - Smart search (3+ characters) - Auto-scrolls and highlights matches
- **Gap Analysis** - Priority-coded badges with recommendations
- **Orphan Test Table** - Sortable, filterable with:
  - Business tests shown first
  - Priority column with color coding
  - Category badges (Business vs Technical)
  - Search and filter capabilities
- **Dark Mode** - Toggle between light and dark themes
- **Export Options** - Print to PDF
- **Actionable recommendations** with clear ownership

**Preview:** Open `.traceability/reports/traceability-report.html` in browser

### JSON Report
Machine-readable format for:
- CI/CD integration
- Custom tooling
- Data analysis
- Trend tracking

### Markdown Report
Documentation-friendly format for:
- README inclusion
- Wiki pages
- Sprint reports
- Stakeholder communication

### CSV Report
Spreadsheet format for:
- Excel/Google Sheets import
- Pivot tables
- Data analysis
- Metric tracking

---

## 🔧 Supported Languages & Frameworks

| Language | Frameworks | Status |
|----------|-----------|--------|
| **Java** | JUnit 4, JUnit 5, TestNG | ✅ Full Support |
| **TypeScript** | Jest, Mocha, Jasmine | ✅ Full Support |
| **JavaScript** | Jest, Mocha, Jasmine | ✅ Full Support |
| **Python** | Pytest, Unittest | ✅ Full Support |
| **Go** | Go Test | ✅ Full Support |
| **Ruby** | RSpec | ✅ Full Support |
| **C#** | NUnit, xUnit | ✅ Full Support |
| **Kotlin** | JUnit | ✅ Full Support |
| **PHP** | PHPUnit | ✅ Full Support |
| **Rust** | Cargo Test | ✅ Full Support |

**Add Your Own:** Implement `TestParser` interface for any language!

---

## 🎯 Scenarios Detected

The system automatically detects and reports:

### ✅ Coverage Validation
- Scenarios with full test coverage
- Scenarios with partial coverage
- Scenarios without any tests (gaps)

### 🚨 Gap Detection
- **P0 Gaps** → Blocks commits (critical scenarios without tests)
- **P1 Gaps** → Warnings (high priority scenarios)
- **P2/P3 Gaps** → Informational

### 🔍 Intelligent Orphan Analysis
- **Orphan Tests** - Automatically categorized as:
  - **Technical Tests** (No action needed) - Entity, DTO, Mapper, Validation, Infrastructure, Database tests
  - **Business Tests** (QA action required) - Controller, Service, API tests needing scenarios
- **Smart Priority Assignment**:
  - **P0 (Critical)** - Controller/API tests without scenarios
  - **P1 (High)** - Business logic tests without scenarios
  - **P2 (Medium)** - Service layer tests without scenarios
  - **P3 (Low)** - Technical/infrastructure tests
- **Orphan Scenarios** - Scenarios without any tests
- **Actionable Recommendations** - Clear QA vs Dev actions

### 📡 API Change Detection
- **API Removed** - Endpoint deleted but scenario still exists
- **API Modified** - Endpoint changed, tests need update
- **New API** - Endpoint added without tests

### ⚠️ Risk Analysis
- Critical risk scenarios
- High risk scenarios
- Business impact assessment

---

## 💡 Best Practices

### For Developers

1. **Write Descriptive Test Names**
   ```java
   // ✅ GOOD
   testGetCustomerWithValidIdReturns200()
   
   // ❌ BAD
   test1()
   ```

2. **Use @DisplayName (JUnit 5)**
   ```java
   @Test
   @DisplayName("When customer is created, system returns 201")
   public void testCustomerCreation() { }
   ```

3. **Reference Scenario IDs**
   ```java
   /** Tests scenario CUST-001 */
   @Test
   public void testGetCustomer() { }
   ```

### For QA

1. **Write Clear Scenarios**
   ```yaml
   # ✅ GOOD - Specific and testable
   description: When user creates customer with valid email, system returns 201
   
   # ❌ BAD - Vague
   description: Customer stuff works
   ```

2. **Use Priority Levels Correctly**
   - **P0** - Critical, blocks commits
   - **P1** - High priority, warnings
   - **P2** - Medium priority, informational
   - **P3** - Low priority, nice to have

3. **Include Acceptance Criteria**
   ```yaml
   acceptanceCriteria:
     - Response status is 201
     - Customer ID is returned
     - Data is saved in database
   ```

---

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
name: Traceability Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run validate
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: traceability-reports
          path: .traceability/reports/
```

### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Validate Traceability') {
            steps {
                sh 'npm install'
                sh 'npm run validate'
            }
        }
        stage('Archive Reports') {
            steps {
                publishHTML([
                    reportDir: '.traceability/reports',
                    reportFiles: 'traceability-report.html',
                    reportName: 'Traceability Report'
                ])
            }
        }
    }
}
```

---

## 📈 Metrics & KPIs

The system tracks:

- **Coverage Percentage** - % of scenarios with tests (with trend indicators)
- **Gap Count** - Total gaps by priority (P0/P1/P2/P3)
- **Orphan Count** - Tests and scenarios without mapping
  - Technical Tests (no action needed)
  - Business Tests (QA action required)
  - **Priority Distribution** - P0/P1/P2/P3 breakdown of orphan tests
- **Match Confidence** - Average match score across mappings
- **API Changes** - Detected additions/removals
- **Trend Analysis** - Coverage over time (with history snapshots)
- **Visual Analytics** - Interactive charts showing:
  - Coverage distribution
  - Gap priority breakdown
  - Orphan test priorities
  - Historical trends

---

## 🤝 Contributing

We welcome contributions! Areas for enhancement:

- 🌐 Additional language parsers
- 🎨 New report formats
- 🧠 Advanced matching algorithms
- 🔌 Third-party integrations (JIRA, TestRail, etc.)
- 📊 Metrics dashboards
- 🌍 Internationalization

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🎯 Requirements Coverage - 100% Complete ✅

### Core Requirements (✅ All Implemented)
- [x] Universal validation system (language-agnostic)
- [x] Pre-commit workflow with single script
- [x] Mapping rules & validations (all 3 scenarios)
- [x] Business scenario management (folder structure, formats)
- [x] QA + Dev system isolation
- [x] Complete project refactor
- [x] Zero hardcoding (fully configurable)
- [x] Comprehensive documentation
- [x] Pre-commit master script
- [x] Multiple rich scenario formats (YAML, JSON, Markdown, TXT)

### Scenario Detection (✅ All Implemented)
- [x] **Scenario 1:** New service validation
- [x] **Scenario 2:** New API without test detection
- [x] **Scenario 3:** Removed API detection with orphan scenario analysis
- [x] QA manual execution support

### Features (✅ All Implemented)
- [x] Multiple scenario formats (YAML, JSON, Markdown, TXT)
- [x] Semantic matching with fuzzy logic
- [x] 7 matching strategies (exact, fuzzy, semantic, keyword, levenshtein, jaccard, regex)
- [x] Synonym expansion & stop word removal
- [x] Comprehensive gap analysis
- [x] Orphan test detection
- [x] Orphan scenario detection
- [x] API change detection
- [x] Multi-format reports (HTML, JSON, Markdown, CSV)
- [x] Traceability matrix generation
- [x] Priority-based blocking (P0/P1)
- [x] Risk level assessment

### Documentation (✅ All Completed)
- [x] DEV implementation guide (comprehensive)
- [x] QA user guide (comprehensive with E2E workflow)
- [x] Architecture documentation
- [x] Scenario format examples
- [x] Best practices
- [x] Troubleshooting guides
- [x] FAQ sections

---

## 📞 Support & Contact

- **Documentation:** See `docs/` folder
- **Issues:** [GitHub Issues](https://github.com/aquibshakeel/ai-testing-framework/issues)
- **Discussions:** [GitHub Discussions](https://github.com/aquibshakeel/ai-testing-framework/discussions)

---

## 🙏 Acknowledgments

Built with ❤️ for QA teams and developers who value quality and traceability.

**Technologies Used:**
- TypeScript
- Node.js
- Semantic Matching Algorithms
- YAML/JSON parsing
- Git hooks
- Multi-format report generation

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by the Universal Validator Team

</div>
