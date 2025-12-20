# 🏗 Architecture Guide

**Version:** 6.3.0  
**Last Updated:** December 20, 2025  
**Difficulty:** Intermediate  
**Prerequisites:** [Getting Started Guide](GETTING_STARTED.md)

---

## 📖 Overview

This guide explains the system architecture of the AI-Driven Test Coverage System. You'll understand:
- High-level system design
- Component relationships
- Data flow and processing
- AI integration architecture
- Report generation pipeline
- Extension points

---

## 🎯 System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER INPUT                           │
│  (config.json, baseline YAML, service code)             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  ORCHESTRATION LAYER                     │
│  - ServiceManager: Coordinates analysis                  │
│  - PathResolver: Resolves service/baseline paths         │
│  - EnvConfig: Environment configuration                  │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│   SCANNERS   │  │   AI PROVIDERS   │
└──────┬───────┘  └────────┬─────────┘
       │                    │
       │  ┌─────────────────┘
       ▼  ▼
┌─────────────────────────────────────────────────────────┐
│                   ANALYSIS LAYER                         │
│  - AITestCaseGenerator: Generates scenarios              │
│  - EnhancedCoverageAnalyzer: Matches tests to scenarios  │
│  - JourneyCoverageAnalyzer: E2E workflow analysis        │
│  - GitChangeDetector: Detects API changes                │
│  - HistoryManager: Tracks trends over time               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   REPORT LAYER                           │
│  - ReportGenerator: Creates HTML/JSON/CSV/MD reports     │
│  - Enhanced Template: Premium UI with visualizations     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                      OUTPUT                              │
│  (HTML reports, JSON data, historical snapshots)         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Core Components

### 1. ServiceManager (`lib/core/ServiceManager.ts`)

**Purpose:** Central orchestrator for the entire analysis process.

**Responsibilities:**
- Load configuration from `.traceability/config.json`
- Iterate through enabled services
- Coordinate scanners and analyzers
- Trigger report generation

**Key Methods:**
```typescript
class ServiceManager {
  async analyzeAllServices(): Promise<void>
  async analyzeService(config: ServiceConfig): Promise<Report>
  private loadConfiguration(): Config
}
```

**Flow:**
```
1. Load config.json
2. For each enabled service:
   a. Scan APIs and tests
   b. Run AI analysis
   c. Generate reports
3. Save historical snapshots
```

---

### 2. PathResolver (`lib/utils/PathResolver.ts`)

**Purpose:** 4-tier fallback system for resolving file paths.

**Path Resolution Priority:**
```
1. Per-Service Environment Variables
   ↓ (if not found)
2. Shared Environment Variables
   ↓ (if not found)
3. Config File Paths
   ↓ (if not found)
4. Default Paths
```

**Key Methods:**
```typescript
class PathResolver {
  resolveServicePath(serviceName: string): string
  resolveBaselinePath(serviceName: string): string
  resolveJourneyPath(serviceName: string): string
}
```

**Example Resolution:**
```typescript
// Looking for customer-service path
1. Check: $CUSTOMER_SERVICE_PATH
2. Check: $SERVICE_PATH/customer-service
3. Check: config.services[].path
4. Default: ./services/customer-service
```

---

### 3. AI Provider Layer (`lib/ai/`)

**Purpose:** Multi-provider AI integration with abstraction layer.

**Architecture:**
```
AIProvider (interface)
    │
    ├── AnthropicProvider (Claude)
    └── OpenAIProvider (GPT)
```

**Key Components:**

**AIProvider Interface:**
```typescript
interface AIProvider {
  generateTestScenarios(apiSpec: string): Promise<Scenarios>
  matchTestToScenario(test: Test, scenarios: Scenario[]): Promise<Match>
  categorizeOrphanTest(test: Test): Promise<Category>
  suggestAdditionalScenarios(api: API): Promise<Scenarios>
}
```

**AIProviderFactory:**
```typescript
class AIProviderFactory {
  static create(config: AIConfig): AIProvider {
    switch(config.provider) {
      case 'anthropic': return new AnthropicProvider(config)
      case 'openai': return new OpenAIProvider(config)
    }
  }
}
```

**Provider Selection Flow:**
```
1. Check AI_PROVIDER env variable
2. Check config.ai.provider
3. Default to 'anthropic'
4. Create appropriate provider instance
5. Use throughout analysis
```

---

### 4. Scanner Layer

**APIScanner (`lib/core/APIScanner.ts`)**
- Scans service code for API endpoints
- Extracts HTTP methods, paths, parameters
- Parses Swagger/OpenAPI specs (if available)

**E2ETestScanner (`lib/core/E2ETestScanner.ts`)**
- Scans for end-to-end test files
- Identifies journey test methods
- Links E2E tests to business journeys

**TestParserFactory (`lib/core/TestParserFactory.ts`)**
- Creates language-specific test parsers
- Supported: JavaTestParser, TypeScriptTestParser, PythonTestParser, GoTestParser

**Language-Specific Parsers:**
```typescript
interface TestParser {
  parseTestFile(filePath: string): Test[]
  extractTestName(test: Test): string
  extractDisplayName(test: Test): string
}

// Implementations
- JavaTestParser (JUnit annotations)
- TypeScriptTestParser (Jest/describe blocks)
- PythonTestParser (pytest decorators)
- GoTestParser (Test functions)
```

---

### 5. Analysis Layer

**AITestCaseGenerator (`lib/core/AITestCaseGenerator.ts`)**

**Purpose:** Generate test scenarios from API specifications using AI.

**Process:**
```
1. Scan APIs from service
2. For each API endpoint:
   a. Build AI prompt with API details
   b. Request AI to generate scenarios
   c. Parse AI response into structured format
3. Save to ai_cases/{service}-ai.yml
```

**Prompt Structure:**
```
Analyze this API endpoint:
- Method: POST
- Path: /api/customers
- Parameters: {...}
- Expected responses: {...}

Generate comprehensive test scenarios covering:
- Happy cases
- Error cases
- Edge cases
- Security scenarios
```

---

**EnhancedCoverageAnalyzer (`lib/core/EnhancedCoverageAnalyzer.ts`)**

**Purpose:** Core coverage analysis with AI-powered matching.

**Responsibilities:**
- Load baseline scenarios
- Scan unit tests
- Match tests to scenarios using AI
- Detect coverage gaps
- Categorize orphan tests
- Calculate coverage metrics

**Matching Algorithm:**
```typescript
For each baseline scenario:
  1. Extract scenario description
  2. Send to AI with all unit tests
  3. AI returns:
     - Best matching test (if any)
     - Confidence level (HIGH/MEDIUM/LOW)
     - Coverage status (FULLY/PARTIALLY/NOT covered)
  4. Record match with file location and line number
```

**Coverage States:**
```
FULLY_COVERED:
  - Test exists
  - All aspects of scenario verified
  - Confidence: HIGH

PARTIALLY_COVERED:
  - Test exists
  - Some aspects missing
  - Confidence: MEDIUM

NOT_COVERED:
  - No matching test found
  - Gap identified
  - Priority assigned based on scenario category
```

---

**JourneyCoverageAnalyzer (`lib/core/JourneyCoverageAnalyzer.ts`)**

**Purpose:** Analyze end-to-end user workflow coverage.

**Process:**
```
1. Load journey definitions from journeys YAML
2. For each business journey:
   a. Get coverage for each step (API)
   b. Check for E2E test
   c. Calculate journey status:
      - FULLY_COVERED: All steps + E2E test
      - PARTIALLY_COVERED: Some steps, maybe E2E
      - AT_RISK: Missing pieces
      - NOT_COVERED: Nothing
   d. Identify weak points
3. Return journey analysis
```

**Journey Status Logic:**
```typescript
if (allStepsCovered && hasE2ETest) {
  status = 'FULLY_COVERED'
} else if (someStepsCovered || hasE2ETest) {
  status = 'PARTIALLY_COVERED'
} else if (hasE2ETest !== hasUnitTests) {
  status = 'AT_RISK'
} else {
  status = 'NOT_COVERED'
}
```

---

**GitChangeDetector (`lib/core/GitChangeDetector.ts`)**

**Purpose:** Detect API changes from Git history.

**Detection Process:**
```
1. Check if directory is git repo
2. Get recent commits (configurable range)
3. For each commit:
   a. Extract API-related changes
   b. Identify: Added, Modified, Removed APIs
   c. Determine impact on tests
4. Return change summary
```

**Change Categories:**
```
- ADDED: New API endpoints
- MODIFIED: Changed parameters/responses
- REMOVED: Deleted endpoints
```

---

**HistoryManager (`lib/core/HistoryManager.ts`)**

**Purpose:** Track coverage metrics over time.

**Storage:**
```
.traceability/history/
├── {service}-{date}.json
└── snapshots.json
```

**Snapshot Structure:**
```json
{
  "date": "2025-12-20",
  "coverage": 66.7,
  "totalScenarios": 30,
  "fullyCovered": 20,
  "gaps": {
    "p0": 2,
    "p1": 3,
    "p2": 5
  }
}
```

**Trend Calculation:**
```
1. Load all historical snapshots
2. Sort by date
3. Calculate changes:
   - Coverage delta
   - Scenario additions
   - Gap reduction
4. Generate trend data for charts
```

---

### 6. Report Layer

**ReportGenerator (`lib/core/ReportGenerator.ts`)**

**Purpose:** Generate multi-format reports from analysis data.

**Supported Formats:**
```
1. HTML - Premium interactive dashboard
2. JSON - CI/CD integration
3. CSV - Spreadsheet analysis
4. Markdown - Documentation
```

**Generation Process:**
```typescript
class ReportGenerator {
  async generateHTML(data: AnalysisData): Promise<string>
  async generateJSON(data: AnalysisData): Promise<string>
  async generateCSV(data: AnalysisData): Promise<string>
  async generateMarkdown(data: AnalysisData): Promise<string>
}
```

**HTML Report Flow:**
```
1. Load template: lib/templates/enhanced-report-v2.html
2. Inject analysis data:
   - Summary metrics
   - API coverage details
   - Traceability matrix
   - Gaps and orphans
   - Historical trends
3. Add visualizations (Chart.js)
4. Save to .traceability/reports/
5. Auto-open in browser (if enabled)
```

---

## 📊 Data Flow

### Complete Analysis Flow

```
START: npm run continue
│
├── Load Configuration
│   ├── Read .traceability/config.json
│   └── Resolve paths with PathResolver
│
├── For Each Service:
│   │
│   ├── 1. SCAN Phase
│   │   ├── APIScanner → Find APIs
│   │   ├── TestScanner → Find unit tests
│   │   └── E2ETestScanner → Find E2E tests
│   │
│   ├── 2. LOAD Phase
│   │   ├── Load baseline scenarios
│   │   └── Load journey definitions
│   │
│   ├── 3. ANALYSIS Phase
│   │   ├── AI Provider Factory → Create provider
│   │   ├── EnhancedCoverageAnalyzer
│   │   │   ├── Match tests to scenarios (AI)
│   │   │   ├── Detect gaps
│   │   │   └── Categorize orphans (AI)
│   │   ├── JourneyCoverageAnalyzer
│   │   │   └── Analyze E2E workflows
│   │   ├── GitChangeDetector
│   │   │   └── Detect API changes
│   │   └── AI Suggestions
│   │       └── Generate additional scenarios
│   │
│   ├── 4. REPORT Phase
│   │   ├── ReportGenerator
│   │   │   ├── Generate HTML
│   │   │   ├── Generate JSON
│   │   │   ├── Generate CSV
│   │   │   └── Generate Markdown
│   │   └── Auto-open HTML report
│   │
│   └── 5. HISTORY Phase
│       └── HistoryManager
│           └── Save snapshot for trends
│
└── END: Reports generated
```

---

## 🔌 Extension Points

### Adding a New AI Provider

**Step 1: Create Provider Class**
```typescript
// lib/ai/providers/NewProvider.ts
import { AIProvider } from '../AIProvider'

export class NewProvider implements AIProvider {
  async generateTestScenarios(apiSpec: string) {
    // Implementation
  }
  
  async matchTestToScenario(test: Test, scenarios: Scenario[]) {
    // Implementation
  }
  
  // ... other methods
}
```

**Step 2: Update Factory**
```typescript
// lib/ai/AIProviderFactory.ts
case 'new-provider':
  return new NewProvider(config)
```

**Step 3: Update Config Schema**
```typescript
// config.json
{
  "ai": {
    "provider": "new-provider"
  }
}
```

### Adding a New Language Parser

**Step 1: Create Parser**
```typescript
// lib/parsers/RustTestParser.ts
import { TestParser } from './TestParser'

export class RustTestParser implements TestParser {
  parseTestFile(filePath: string): Test[] {
    // Parse Rust test files
  }
  
  extractTestName(test: Test): string {
    // Extract test name from #[test] annotation
  }
}
```

**Step 2: Register in Factory**
```typescript
// lib/core/TestParserFactory.ts
case 'rust':
  return new RustTestParser()
```

### Adding a New Report Format

**Step 1: Implement Generator**
```typescript
// lib/core/ReportGenerator.ts
async generateXML(data: AnalysisData): Promise<string> {
  // Convert data to XML format
}
```

**Step 2: Update Report Pipeline**
```typescript
if (formats.includes('xml')) {
  await this.generateXML(data)
}
```

---

## 🔄 Key Workflows

### Workflow 1: First-Time Setup

```
1. User runs: npm run generate
   │
   ├── ServiceManager loads config
   ├── For each service:
   │   ├── APIScanner finds endpoints
   │   ├── AITestCaseGenerator creates scenarios
   │   └── Save to ai_cases/
   │
   └── QA reviews and creates baseline YAML
```

### Workflow 2: Coverage Analysis

```
1. User runs: npm run continue
   │
   ├── ServiceManager loads config
   ├── For each service:
   │   ├── Load baseline scenarios
   │   ├── Scan unit tests
   │   ├── AI matches tests to scenarios
   │   ├── Detect gaps and orphans
   │   ├── Generate reports
   │   └── Save historical snapshot
   │
   └── Auto-open HTML report
```

### Workflow 3: Pre-Commit Hook

```
1. Developer runs: git commit
   │
   ├── Pre-commit hook triggers
   ├── Run npm run continue
   ├── Check P0 gaps
   │
   ├── If P0 gaps exist:
   │   └── Block commit with error
   │
   └── If no P0 gaps:
       └── Allow commit
```

---

## 💾 Data Storage

### File Structure

```
.traceability/
├── config.json                   # System configuration
│
├── test-cases/
│   ├── baseline/                 # QA-managed scenarios
│   │   └── {service}-baseline.yml
│   ├── ai_cases/                 # AI-generated scenarios
│   │   └── {service}-ai.yml
│   └── journeys/                 # E2E workflow definitions
│       └── {service}-journeys.yml
│
├── reports/                      # Generated reports
│   ├── {service}-report.html
│   ├── {service}-report.json
│   ├── {service}-report.csv
│   └── {service}-report.md
│
└── history/                      # Historical snapshots
    ├── {service}-{date}.json
    └── snapshots.json
```

### Data Persistence

**Configuration:**
- Stored in: `.traceability/config.json`
- Format: JSON
- Version controlled: Yes

**Baseline Scenarios:**
- Stored in: `.traceability/test-cases/baseline/`
- Format: YAML
- Version controlled: Yes
- Managed by: QA team

**AI-Generated Scenarios:**
- Stored in: `.traceability/test-cases/ai_cases/`
- Format: YAML
- Version controlled: No (regenerated each run)
- Managed by: System (AI)

**Reports:**
- Stored in: `.traceability/reports/`
- Format: HTML, JSON, CSV, Markdown
- Version controlled: Optional
- Managed by: System

**Historical Data:**
- Stored in: `.traceability/history/`
- Format: JSON
- Version controlled: Optional
- Managed by: System

---

## 🧪 Testing Architecture

The system itself is designed with testability in mind:

### Unit Testing

```
tests/
├── unit/
│   ├── PathResolver.test.ts
│   ├── EnvConfig.test.ts
│   └── TestParser.test.ts
```

### Integration Testing

```
tests/
├── integration/
│   ├── ServiceManager.test.ts
│   ├── CoverageAnalyzer.test.ts
│   └── ReportGenerator.test.ts
```

### End-to-End Testing

```
tests/
├── e2e/
│   ├── full-analysis.test.ts
│   └── multi-service.test.ts
```

---

## 🔐 Security Considerations

### API Key Management

- API keys stored in environment variables
- Never committed to version control
- Validated before use
- Support for multiple key types

### Data Privacy

- No sensitive data sent to AI
- Only test descriptions and API specs
- Source code not included in prompts
- User controls all data

### External Dependencies

- Minimal external dependencies
- Only trusted packages (Anthropic SDK, OpenAI SDK)
- Regular security audits
- Dependency pinning

---

## 📈 Performance Optimizations

### Caching Strategy

```
1. Configuration caching
   - Config loaded once per run
   
2. AI response caching
   - Cache scenario generation
   - Cache matching results
   
3. File system caching
   - Cache parsed test files
   - Cache API scans
```

### Parallel Processing

```typescript
// Analyze multiple services in parallel
await Promise.all(
  services.map(service => 
    this.analyzeService(service)
  )
)
```

### Incremental Analysis

```
Only re-analyze:
- Changed APIs (via Git detection)
- New tests
- Modified scenarios
```

---

## 🔮 Future Architecture Plans

### Planned Enhancements

1. **Local AI Models**
   - Support for Ollama
   - Privacy-focused deployments
   - No internet required

2. **Plugin System**
   - Custom analyzers
   - Custom report formats
   - Custom AI providers

3. **Database Backend**
   - PostgreSQL support
   - Better historical tracking
   - Advanced querying

4. **Real-time Analysis**
   - Watch mode for development
   - Instant feedback
   - IDE integration

---

## 📚 Related Documentation

- **📖 [Getting Started](GETTING_STARTED.md)** - First-time setup
- **⚙️ [Configuration Guide](CONFIGURATION.md)** - Configuration options
- **👨‍💻 [Developer Guide](DEV_GUIDE.md)** - Development details
- **📊 [Reports Guide](REPORTS_GUIDE.md)** - Understanding reports

---

**Version:** 6.3.0 | **Status:** Production Ready ✅
