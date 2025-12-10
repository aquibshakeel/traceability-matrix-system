# Developer Guide - AI-Driven Test Coverage System

**Version:** 6.1.0
**Last Updated:** December 10, 2025
**Audience:** Developers, DevOps Engineers, Tech Leads

## 🎨 New in v6.1.0 - Premium Report Redesign
- Enterprise-grade visual design with animations
- Colored coverage badges (🟢 Green, 🟡 Yellow, 🔴 Red)
- Collapsible sections with ▼ toggle buttons
- Priority-first layout (Gaps shown first)
- Professional Inter font typography
- Animated shimmer header effect

---

## 📋 Table of Contents

1. [What is This System?](#what-is-this-system)
2. [Quick Setup](#quick-setup)
3. [Demonstration Test Cases](#demonstration-test-cases) 🆕
4. [How It Works (Claude AI)](#how-it-works-claude-ai)
5. [Architecture Overview](#architecture-overview)
6. [Running Locally](#running-locally)
7. [Pre-Commit Hook](#pre-commit-hook)
8. [Interpreting Reports](#interpreting-reports)
9. [Advanced Features Deep Dive](#advanced-features-deep-dive)
10. [Implementation Details](#implementation-details)
11. [Writing Unit Tests](#writing-unit-tests)
12. [Real-World Examples](#real-world-examples)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)
15. [Quick Reference](#quick-reference)
16. [Version History](#version-history)

---

## 🎯 What is This System?

### Purpose

An **AI-powered test coverage validation system** that uses **Claude AI** to automatically verify whether business scenarios have corresponding unit test coverage. It runs on every commit via pre-commit hooks and blocks commits when critical scenarios lack tests.

### Core Technology

**🤖 Powered by Claude AI (Anthropic)**
- Uses Claude 4.5 Sonnet (auto-detected)
- Natural language understanding
- No manual fuzzy matching or pattern matching
- 100% AI-driven analysis

### Key Capabilities

✅ **AI-Powered Analysis** - Claude AI analyzes scenarios and tests using natural language  
✅ **Auto Model Detection** - Automatically selects best available Claude model  
✅ **Language Agnostic** - Supports Java, TypeScript, Python, Go, and more  
✅ **Intelligent Categorization** - AI categorizes orphan tests as Technical vs Business  
✅ **Smart Recommendations** - AI provides context-aware suggestions  
✅ **Pre-Commit Integration** - Runs automatically, blocks P0 gaps  
✅ **Visual Analytics** - NEW! Interactive charts and dashboards  
✅ **Rich Reports** - HTML, JSON, Markdown, CSV outputs  

### What Problems Does It Solve?

**Before:**
- ❌ Manual verification of scenario coverage
- ❌ No automated way to ensure requirements are tested
- ❌ Features ship without corresponding tests
- ❌ Unclear which tests cover which scenarios

**After:**
- ✅ AI automatically maps scenarios to tests
- ✅ Real-time coverage validation on every commit
- ✅ P0 scenarios MUST have tests (enforced)
- ✅ Clear AI-powered recommendations
- ✅ Visual dashboards for stakeholders

---

## ⚡ Quick Setup

### Prerequisites

```bash
# Check Node.js (>= 18 required)
node --version

# Check npm
npm --version

# Get Claude API key from https://console.anthropic.com/
```

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Set Claude API key
export CLAUDE_API_KEY="sk-ant-your-key-here"
# OR
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# 4. Install pre-commit hook
npm run install:hooks

# 5. Verify setup
npm run generate   # Phase 1: AI generates scenarios
npm run continue   # Phase 2: AI analyzes coverage
```

---

## 🎯 Demonstration Test Cases

The system includes three comprehensive demonstration cases that showcase all coverage detection capabilities:

### Case 4: Full Coverage (GET /v1/customers)
**Purpose:** Demonstrates 100% coverage with perfect traceability

- **Implementation:**
  - 10 baseline scenarios in `customer-service-baseline.yml`
  - 10 unit tests in `CustomerControllerGetAllTest.java`
  - Perfect 1:1 scenario-to-test mapping
  
- **What It Shows:**
  - ✅ FULLY_COVERED status for all scenarios
  - HIGH confidence matches
  - Complete traceability with file/line numbers
  - No gaps or action items needed

### Case 5: Intelligent Gap Detection (DELETE /v1/customers/{id})
**Purpose:** Demonstrates two-phase analysis (baseline vs API completeness)

- **Implementation:**
  - 5 baseline scenarios in `customer-service-baseline.yml`
  - 5 unit tests in `CustomerControllerDeleteTest.java`
  - 100% baseline coverage
  
- **What It Shows:**
  - ✅ Baseline 100% covered
  - 🤖 AI suggests 22 additional scenarios from API spec
  - Demonstrates difference between "covered" and "complete"
  - Priority-based recommendations (P1/P2)

### Case 6: Partial Coverage (PUT /v1/customers/{id})
**Purpose:** Demonstrates mixed coverage states and gap detection

- **Implementation:**
  - 5 baseline scenarios in `customer-service-baseline.yml`
  - 4 unit tests in `CustomerControllerUpdateTest.java`
  - Intentionally incomplete coverage
  
- **What It Shows:**
  - ✅ FULLY_COVERED: 2 scenarios (40%)
  - ⚠️ PARTIALLY_COVERED: 2 scenarios (40%)
  - ❌ NOT_COVERED: 1 scenario (20%)
  - Detailed gap analysis with remediation steps
  - Real-world quality issues

### Running the Demonstrations

```bash
# Build the project
npm run build

# Run analysis to see all three cases
npx ts-node scripts/run-analysis.ts customer-service

# View the HTML report
open .traceability/reports/customer-service-report.html
```

### Expected Results

The analysis will show:
- Case 4: "✅ ALL SCENARIOS FULLY COVERED (10/10)"
- Case 5: "✅ BASELINE COVERED + 💡 22 AI SUGGESTIONS"
- Case 6: "⚠️ MIXED COVERAGE - 3 GAPS IDENTIFIED"

**Learn More:** See `docs/TEST-CASES-GUIDE.md` for detailed documentation of all three cases.

---

## 🏗 Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  • CLI Commands (bin/ai-generate, bin/ai-continue)          │
│  • Pre-commit Hook (scripts/pre-commit.sh)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Orchestration Layer                        │
│  • ServiceManager - Service lifecycle management            │
│  • Main workflow coordination                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Core Engine Layer                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AITestCaseGenerator                                │    │
│  │  • Discovers APIs (Swagger + Code)                  │    │
│  │  • Generates scenarios with Claude AI               │    │
│  │  • Marks baseline vs new suggestions                │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  EnhancedCoverageAnalyzer                           │    │
│  │  • AI-powered scenario-to-test matching             │    │
│  │  • Orphan unit test detection (NEW)                 │    │
│  │  • Orphan API detection (NEW)                       │    │
│  │  • Visual analytics generation (NEW)                │    │
│  │  • Orphan test categorization                       │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GitChangeDetector                                   │    │
│  │  • Git diff analysis                                 │    │
│  │  • API change detection                              │    │
│  │  • Affected test identification                      │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Utility Layer                              │
│  • SwaggerParser - API spec parsing                         │
│  • APIScanner - Code-based API discovery                    │
│  • TestParserFactory - Multi-language test parsing          │
│  • ModelDetector - Auto Claude model selection              │
│  • ReportGenerator - Multi-format report generation         │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  • Claude AI API (Anthropic)                                │
│  • Git (version control)                                    │
│  • File System (reports, baselines)                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
1. Developer commits code
   ↓
2. Pre-commit hook triggers
   ↓
3. Phase 1: AITestCaseGenerator
   - Discovers APIs via Swagger/Code scan
   - Sends API specs to Claude AI
   - Generates comprehensive scenarios
   - Marks ✅ (in baseline) vs 🆕 (new)
   ↓
4. Phase 2: EnhancedCoverageAnalyzer
   - Loads baseline scenarios
   - Parses unit tests (multi-language)
   - Sends to Claude AI for analysis
   - AI determines coverage status
   - AI categorizes orphan tests
   - Detects orphan unit tests (NEW)
   - Detects orphan APIs (NEW)
   - Calculates visual analytics (NEW)
   ↓
5. GitChangeDetector
   - Analyzes git diffs
   - Extracts API changes
   - Identifies affected tests
   ↓
6. ReportGenerator
   - Generates HTML (with visual analytics)
   - Generates JSON (CI/CD)
   - Generates CSV (spreadsheet)
   - Generates Markdown (docs)
   ↓
7. Decision
   - P0 gaps → BLOCK commit
   - No P0 gaps → ALLOW commit
```

---

## 🚀 Advanced Features Deep Dive

### Feature 1: Git Change Detection

**Implementation:** `lib/core/GitChangeDetector.ts`

**How It Works:**
1. Executes `git diff` to get changed files
2. Filters service-related files
3. Analyzes each file's diff for API patterns
4. Extracts HTTP methods, endpoints, line numbers
5. Correlates with unit tests in test directories

**Code Flow:**
```typescript
async detectChanges(servicePaths: string[]): Promise<GitChangeAnalysis> {
  1. getChangedFiles() → Execute git diff
  2. Filter by servicePaths
  3. For each file:
     - analyzeFileChanges() → Extract API changes
     - findAffectedTests() → Find related tests
  4. Return comprehensive change analysis
}
```

**Detection Patterns:**
- **Java Spring:** `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`
- **TypeScript/Express:** `router.get()`, `app.post()`, etc.
- **Python/Flask:** `@app.route()`
- **Python/FastAPI:** `@router.get()`, etc.

**Output:**
```typescript
{
  changedFiles: string[]
  apiChanges: APIChange[]  // added, modified, removed
  affectedTests: { [file: string]: string[] }
  totalAPIsChanged: number
}
```

### Feature 2: 3-Layer Completeness Detection

**Implementation:** `lib/core/EnhancedCoverageAnalyzer.ts`

**Layer 1: Forward Check (API Spec → Baseline)**
```typescript
// Find scenarios suggested by API spec but missing from baseline
const missingScenarios = findMissingScenarios(
  baselineScenarios,
  aiScenarios
);

// For each missing scenario, check if unit test exists
const hasTest = checkIfUnitTestExists(scenario, unitTests);
```

**Layer 1b: Reverse Check (Unit Tests → Baseline) - ENHANCED**
```typescript
// NEW in v6.0: Find unit tests without baseline scenarios
const unscenarioedTests = findUnscenarioedTests(
  baselineScenarios,
  unitTests,
  api
);

// NEW: For each orphan unit test, find AI-suggested scenario
for (const test of unscenarioedTests) {
  const aiSuggestion = findMatchingAIScenario(test, aiScenarios);
  // Create P2 gap with AI suggestion
}
```

**Layer 2: AI Coverage Analysis**
```typescript
// Send to Claude AI for semantic matching
const prompt = `Analyze test coverage for ${api}
Expected Scenarios: ${baselineScenarios}
Available Tests: ${unitTests}
Determine coverage status for each scenario.`;

const response = await anthropic.messages.create({
  model: detectedModel,
  messages: [{ role: 'user', content: prompt }]
});
```

**Layer 3: Status Adjustment**
```typescript
// Adjust status based on API completeness
if (missingScenarios.length > 0) {
  // Baseline is incomplete
  if (status === 'FULLY_COVERED') {
    status = 'PARTIALLY_COVERED';
    reason = 'API suggests additional untested scenarios';
  }
}
```

### Feature 3: Orphan Test Categorization

**Implementation:** `lib/core/EnhancedCoverageAnalyzer.ts`

**AI Categorization Process:**
```typescript
private async categorizeOrphanTests(
  orphanTests: UnitTest[],
  aiModel: string
): Promise<OrphanTestAnalysis> {
  
  // Build prompt with test details
  const prompt = `Categorize these unit tests as:
  - TECHNICAL: Infrastructure tests (Entity, DTO, Mapper) - no scenario needed
  - BUSINESS: Business logic tests (Controller, Service) - needs scenario
  
  Tests: ${JSON.stringify(orphanTests)}`;
  
  // Send to Claude AI
  const response = await this.anthropic.messages.create({
    model: aiModel,
    max_tokens: 3000,
    temperature: 0.2,
    messages: [{ role: 'user', content: prompt }]
  });
  
  // Parse AI response
  const categorizations = parseAIResponse(response.content);
  
  // Group by category and priority
  return {
    technical: [...],  // P3 - No action needed
    business: [...]    // P0-P2 - QA must add scenarios
  };
}
```

**AI Response Format:**
```json
{
  "categorizations": [
    {
      "testNumber": 1,
      "category": "TECHNICAL",
      "subtype": "Entity Test",
      "priority": "P3",
      "action": "none",
      "reason": "Entity validation is infrastructure concern"
    },
    {
      "testNumber": 2,
      "category": "BUSINESS",
      "subtype": "Controller Test",
      "priority": "P1",
      "action": "qa_add_scenario",
      "reason": "API endpoint requires business scenario"
    }
  ]
}
```

### Feature 4: Auto Model Selection

**Implementation:** `lib/core/ModelDetector.ts`

**Detection Algorithm:**
```typescript
async detectBestModel(): Promise<string> {
  // Priority order
  const preferredModels = [
    'claude-sonnet-4-5-20250929',    // Claude 4.5 Sonnet
    'claude-3-5-sonnet-20241022',    // Claude 3.5 Sonnet (latest)
    'claude-3-5-sonnet-20240620'     // Claude 3.5 Sonnet (fallback)
  ];
  
  try {
    // Query Anthropic Models API
    const response = await this.anthropic.models.list();
    
    // Find first available preferred model
    for (const preferred of preferredModels) {
      if (response.data.some(m => m.id === preferred)) {
        this.cachedModel = preferred;
        return preferred;
      }
    }
  } catch (error) {
    // Fallback if Models API unavailable
    console.log('⚠️  Models API failed, using fallback...');
  }
  
  // Default fallback
  return 'claude-3-5-sonnet-20240620';
}
```

**Caching:**
- Model detected once per session
- Cached in memory to avoid repeated API calls
- Can be cleared with `clearCache()` if needed

### Feature 5: Multi-Language Support

**Implementation:** `lib/parsers/` + `lib/core/TestParserFactory.ts`

**Architecture:**
```typescript
interface TestParser {
  canParse(filePath: string): boolean;
  parseTests(filePath: string): UnitTest[];
  getSupportedLanguage(): SupportedLanguage;
  getSupportedFramework(): SupportedFramework;
}

class TestParserFactory {
  private parsers: Map<string, TestParser> = new Map();
  
  registerParser(parser: TestParser): void {
    const key = `${parser.getSupportedLanguage()}-${parser.getSupportedFramework()}`;
    this.parsers.set(key, parser);
  }
  
  getParser(language: SupportedLanguage, framework: SupportedFramework): TestParser {
    const key = `${language}-${framework}`;
    return this.parsers.get(key);
  }
}
```

**Supported Parsers:**

1. **JavaTestParser** (`lib/parsers/JavaTestParser.ts`)
   - Frameworks: JUnit 4/5, TestNG
   - Extracts: `@Test`, `@DisplayName`, method names
   - Pattern: `*Test.java`, `*Tests.java`

2. **TypeScriptTestParser** (`lib/parsers/TypeScriptTestParser.ts`)
   - Frameworks: Jest, Mocha, Jasmine
   - Extracts: `test()`, `it()`, `describe()`
   - Pattern: `*.test.ts`, `*.spec.ts`

3. **PythonTestParser** (`lib/parsers/PythonTestParser.ts`)
   - Frameworks: Pytest, Unittest
   - Extracts: `def test_*`, `@pytest.mark`
   - Pattern: `test_*.py`, `*_test.py`

4. **GoTestParser** (`lib/parsers/GoTestParser.ts`)
   - Framework: Go Test
   - Extracts: `func Test*`
   - Pattern: `*_test.go`

---

## 💻 Implementation Details

### Core Classes Deep Dive

#### 1. AITestCaseGenerator

**File:** `lib/core/AITestCaseGenerator.ts`

**Purpose:** Generate comprehensive test scenarios from API specifications using Claude AI.

**Key Methods:**

```typescript
async generate(service: ServiceConfig): Promise<void>
```
- Main entry point for scenario generation
- Discovers APIs via Swagger + code scan
- Generates scenarios for each API
- Compares with baseline
- Saves to ai_cases folder

```typescript
private async discoverAPIs(service: ServiceConfig): Promise<any[]>
```
- Uses SwaggerParser to read OpenAPI specs
- Falls back to APIScanner for code-based discovery
- Returns list of discovered APIs with metadata

```typescript
private async generateForAPI(api: any): Promise<any>
```
- Constructs prompt with API details
- Sends to Claude AI
- Parses AI response into structured scenarios
- Categories: happy_case, edge_case, error_case, security

```typescript
private markBaseline(aiScenarios: SimpleScenarios, baseline: any): any
```
- Compares AI scenarios with baseline
- Marks ✅ for scenarios already in baseline
- Marks 🆕 for new suggestions

#### 2. EnhancedCoverageAnalyzer

**File:** `lib/core/EnhancedCoverageAnalyzer.ts`

**Purpose:** AI-powered coverage analysis with orphan detection and visual analytics.

**Key Methods:**

```typescript
async analyze(service: ServiceConfig): Promise<CoverageAnalysis>
```
- Main analysis orchestrator
- Loads baseline and parses unit tests
- Analyzes each API endpoint
- Categorizes orphan tests
- Detects orphan unit tests (NEW)
- Detects orphan APIs (NEW)
- Calculates visual analytics (NEW)
- Returns comprehensive analysis

```typescript
private async analyzeAPI(
  api: string,
  categories: any,
  unitTests: UnitTest[],
  aiSuggestions: any = null
): Promise<APIAnalysis>
```
- Analyzes single API endpoint
- Flattens scenarios from categories
- Sends to Claude AI for matching
- Parses AI response
- Detects orphan unit tests with AI suggestions
- Checks API completeness
- Returns coverage status per scenario

```typescript
private findUnscenarioedTests(
  baselineScenarios: string[],
  allUnitTests: UnitTest[],
  api: string
): UnitTest[]
```
- NEW in v6.0
- Finds unit tests without baseline scenarios
- Filters tests related to specific API
- Returns orphan unit tests

```typescript
private findMatchingAIScenario(
  test: UnitTest,
  aiScenarios: string[]
): string | null
```
- NEW in v6.0
- Semantic matching between test name and AI scenarios
- Uses word overlap similarity
- Returns best matching AI scenario or null

```typescript
private async categorizeOrphanTests(
  orphanTests: UnitTest[],
  aiModel: string
): Promise<OrphanTestAnalysis>
```
- AI categorization of orphan tests
- TECHNICAL vs BUSINESS classification
- Priority assignment (P0-P3)
- Action recommendations

```typescript
private detectOrphanAPIs(
  baseline: any,
  unitTests: UnitTest[],
  apiAnalyses: APIAnalysis[]
): OrphanAPIInfo[]
```
- NEW in v6.0
- Detects APIs with 0 scenarios AND 0 tests
- Returns list of completely untracked APIs

```typescript
private calculateVisualAnalytics(
  apiAnalyses: APIAnalysis[],
  gaps: GapAnalysis[],
  orphanAnalysis: OrphanTestAnalysis
): VisualAnalytics
```
- NEW in v6.0
- Calculates coverage distribution
- Computes gap priority breakdown
- Computes orphan test priority breakdown
- Returns metrics for visual charts

#### 3. GitChangeDetector

**File:** `lib/core/GitChangeDetector.ts`

**Purpose:** Detect code changes and API modifications via Git.

**Key Methods:**

```typescript
async detectChanges(servicePaths: string[]): Promise<GitChangeAnalysis>
```
- Gets changed files from git diff
- Filters service-related files
- Analyzes each file for API changes
- Finds affected tests
- Returns comprehensive change analysis

```typescript
private async analyzeFileChanges(file: string): Promise<APIChange[]>
```
- Reads git diff for specific file
- Extracts added APIs (lines starting with +)
- Extracts removed APIs (lines starting with -)
- Identifies modified APIs
- Returns list of API changes

```typescript
findAffectedTests(changedFile: string, servicePath: string): string[]
```
- Finds test files related to changed file
- Extracts test names from test files
- Returns list of affected test names

#### 4. ReportGenerator

**File:** `lib/core/ReportGenerator.ts`

**Purpose:** Generate multi-format reports with visual analytics.

**Key Methods:**

```typescript
async generateReports(
  analysis: CoverageAnalysis,
  gitChanges: GitChangeAnalysis,
  serviceName: string
): Promise<void>
```
- Generates HTML report (with visual analytics)
- Generates JSON report (CI/CD)
- Generates CSV report (spreadsheet)
- Generates Markdown report (docs)
- Auto-opens HTML in browser

```typescript
private generateHTML(
  analysis: CoverageAnalysis,
  gitChanges: GitChangeAnalysis,
  serviceName: string
): string
```
- NEW: Includes visual analytics section
- NEW: Includes orphan APIs section
- NEW: Enhanced orphan tests section with AI suggestions
- Creates interactive dashboard
- Uses embedded CSS and JavaScript
- Returns complete HTML string

#### 5. ModelDetector

**File:** `lib/core/ModelDetector.ts`

**Purpose:** Auto-detect best available Claude model.

**Key Methods:**

```typescript
async detectBestModel(): Promise<string>
```
- Queries Anthropic Models API
- Selects best available model from priority list
- Caches result
- Falls back to Claude 3.5 Sonnet if API unavailable

```typescript
private async isModelAvailable(model: string): Promise<boolean>
```
- Checks if specific model is available
- Used for fallback detection

#### 6. SwaggerParser

**File:** `lib/core/SwaggerParser.ts`

**Purpose:** Parse OpenAPI/Swagger specifications.

**Key Methods:**

```typescript
static parseFile(filePath: string): SwaggerSpec
```
- Reads YAML/JSON Swagger file
- Parses into structured format
- Returns SwaggerSpec object

```typescript
static extractAPIs(spec: SwaggerSpec): SwaggerAPI[]
```
- Extracts all API endpoints from spec
- Includes methods, paths, parameters, bodies, responses
- Returns list of SwaggerAPI objects

```typescript
static findSwaggerFiles(directory: string): string[]
```
- Recursively searches for Swagger files
- Patterns: swagger.yaml, openapi.json, etc.
- Returns list of file paths

#### 7. APIScanner

**File:** `lib/core/APIScanner.ts`

**Purpose:** Code-based API discovery (fallback when Swagger unavailable).

**Key Methods:**

```typescript
async scanAPIs(service: ServiceConfig): Promise<DiscoveredAPI[]>
```
- Scans controller files
- Extracts HTTP endpoints from annotations
- Returns list of discovered APIs

```typescript
getOrphanAPIs(apis: DiscoveredAPI[]): DiscoveredAPI[]
```
- Filters APIs with no scenarios AND no tests
- Returns orphan APIs

#### 8. TestParserFactory

**File:** `lib/core/TestParserFactory.ts`

**Purpose:** Multi-language test parsing factory.

**Key Methods:**

```typescript
registerParser(parser: TestParser): void
```
- Registers language-specific parser
- Stores in internal map

```typescript
getParser(language: SupportedLanguage, framework: SupportedFramework): TestParser
```
- Returns appropriate parser for language/framework
- Throws error if not supported

---

## 🤖 How It Works (Claude AI)

### AI Model Selection

**Automatic Detection:**
```
1. Query Anthropic Models API
2. Check availability of preferred models:
   - claude-sonnet-4-5-20250929 (Claude 4.5 Sonnet)
   - claude-3-5-sonnet-20241022 (Claude 3.5 Sonnet latest)
   - claude-3-5-sonnet-20240620 (Claude 3.5 Sonnet fallback)
3. Select first available
4. Cache for session
5. Fallback to Claude 3.5 Sonnet if API unavailable
```

**Console Output:**
```
🔍 Auto-detecting best available Claude model...
   ✓ Using: claude-sonnet-4-5-20250929 (Claude Sonnet 4.5)
```

### How Claude AI Analyzes Coverage

**Step 1: Prompt Construction**
```typescript
const prompt = `Analyze test coverage for API endpoint: ${api}

**Expected Scenarios (from QA baseline):**
1. When customer created with valid data, return 201
2. When created with invalid email, return 400
...

**Available Unit Tests (from codebase):**
1. testCreateCustomerWithValidData() (CustomerControllerTest.java)
2. testCreateCustomerInvalidEmail() (CustomerControllerTest.java)
...

For each scenario, determine:
1. Which unit tests cover it
2. Coverage status: FULLY_COVERED / PARTIALLY_COVERED / NOT_COVERED
3. What's missing if not fully covered

Respond in JSON format...`;
```

**Step 2: Claude AI Analysis**
```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',  // Auto-detected
  max_tokens: 2000,
  temperature: 0.2,  // Low temp for consistency
  messages: [{ role: 'user', content: prompt }]
});
```

**Step 3: AI Response**
```json
{
  "matches": [
    {
      "scenario": "When customer created with valid data, return 201",
      "testNumbers": [1],
      "status": "FULLY_COVERED",
      "explanation": "Test testCreateCustomerWithValidData covers this scenario completely"
    },
    {
      "scenario": "When created with invalid email, return 400",
      "testNumbers": [2],
      "status": "FULLY_COVERED",
      "explanation": "Test testCreateCustomerInvalidEmail validates email format"
    }
  ]
}
```

### Key Features of AI Analysis

**Natural Language Understanding:**
- Claude AI understands context and intent
- Recognizes synonyms (e.g., "delete" = "remove")
- Understands test naming conventions
- No manual pattern matching needed

**Intelligent Categorization:**
```typescript
// AI categorizes orphan tests
const prompt = `Categorize these unit tests as either:
- TECHNICAL: Infrastructure tests (Entity, DTO, Mapper) - no scenario needed
- BUSINESS: Business logic tests (Controller, Service) - needs scenario

Tests to categorize:
1. CustomerMapperTest.testMapToDto()
2. CustomerControllerTest.testCreateEndpoint()
...`;

// Claude AI responds:
{
  "categorizations": [
    {
      "testNumber": 1,
      "category": "TECHNICAL",
      "subtype": "Mapper Test",
      "priority": "P3",
      "action": "none",
      "reason": "DTO mapping is infrastructure concern"
    },
    {
      "testNumber": 2,
      "category": "BUSINESS",
      "subtype": "Controller Test",
      "priority": "P1",
      "action": "qa_add_scenario",
      "reason": "API endpoint requires business scenario"
    }
  ]
}
```

**Smart Recommendations:**
- AI provides context-specific suggestions
- Recommends actions based on gap type
- Suggests priority levels (P0-P3)
- Gives specific next steps

---

## 🚀 Running Locally

### Basic Commands

```bash
# Phase 1: Generate AI test scenarios
npm run generate

# Phase 2: Analyze coverage with AI
npm run continue

# Combined: Generate + Analyze
npm run generate && npm run continue

# Build TypeScript
npm run build

# Install pre-commit hook
npm run install:hooks
```

### Advanced Usage

```bash
# Generate for specific service
node bin/ai-generate customer-service

# Analyze specific service
node bin/ai-continue customer-service

# Generate scenarios for single API (QA tool)
npm run generate:api -- --service customer-service --endpoint "POST /api/customers"
```

### What Each Command Does

**npm run generate:**
```
🤖 Generating AI test cases: customer-service
📡 Discovering APIs...
   ✓ Found 10 APIs

🤖 AI generating scenarios...
   Processing: POST /api/customers
   Processing: GET /api/customers/{id}
   ...

📋 Comparing with baseline (25 scenarios)...
   ✓ Saved: .traceability/test-cases/ai_cases/customer-service-ai.yml

✅ Generation complete!
```

**npm run continue:**
```
📊 Analyzing: customer-service
✓ Baseline: 25 scenarios
✓ Unit tests: 42 found

🤖 AI analyzing coverage...
POST /api/customers:
  ✅ Covered: 8/10
  ⚠️  Gaps: 2 not covered

🔍 Categorizing orphan tests...
  ✅ Technical: 10, Business: 2

📈 Coverage: 82.5%
📄 Generating reports...
  ✅ HTML: .traceability/reports/customer-service-report.html
```

---

## 🔗 Pre-Commit Hook

### How It Works

When you commit, the pre-commit hook automatically:

1. Runs `npm run generate` (AI generates scenarios)
2. Runs `npm run continue` (AI analyzes coverage)
3. Checks for P0 gaps
4. **BLOCKS** commit if P0 gaps found
5. **ALLOWS** commit if no P0 gaps
6. Shows report location

### Configuration

Edit `.traceability/config.json`:

```json
{
  "preCommit": {
    "enabled": true,
    "blockOnP0Gaps": true,
    "blockOnP1Gaps": false
  }
}
```

### Bypassing (Emergency Only)

```bash
# Skip validation for this commit
git commit --no-verify -m "Emergency fix"

# Or temporarily disable
export SKIP_VALIDATION=true
git commit -m "Skip validation"
```

---

## 📊 Interpreting Reports

### HTML Report (Interactive Dashboard)

**Summary Cards:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Coverage: 85%  │  │  P0 Gaps: 0     │  │  Orphans: 12    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Visual Analytics (NEW in v6.0):**
- Coverage Distribution: Progress bars
- Gap Priority Breakdown: P0/P1/P2/P3 visual grid
- Orphan Test Priority: Technical vs Business chart

**Coverage Gaps Section:**
```
🚨 P0 GAP
API: POST /api/customers
Scenario: When created with duplicate email, return 409
Status: NOT_COVERED
Recommendation: Create unit test to cover this critical scenario
```

**Orphan Unit Tests (NEW in v6.0):**
```
⚠️ ORPHAN UNIT TEST [P2]
Test: createCustomer_ShouldValidateEmail
File: CustomerControllerTest.java
Reason: Unit test exists but NO corresponding baseline scenario

💡 AI Suggestion: "When customer created with invalid email format,
                    return 400 with validation error"

Action: QA should add this AI-suggested scenario to baseline
```

**Orphan APIs (NEW in v6.0):**
```
⚠️ ORPHAN API [Critical]
POST /api/customers/bulk
Status: No baseline scenarios, No unit tests
Action: Add scenarios and tests, or remove if deprecated
```

**Orphan Tests (Traditional):**
```
🔧 TECHNICAL ORPHAN [P3]
Test: CustomerMapperTest.testMapToDto()
Category: Mapper Test
Action: No action needed (infrastructure test)

💼 BUSINESS ORPHAN [P1]
Test: CustomerService.testBulkCreate()
Category: Service Test
Action: QA must create scenario for this business logic
```

### JSON Report (CI/CD)

```json
{
  "service": "customer-service",
  "timestamp": "2025-12-10T01:30:00.000Z",
  "summary": {
    "totalScenarios": 25,
    "fullyCovered": 20,
    "coveragePercent": 80.0,
    "p0Gaps": 1,
    "p1Gaps": 2
  },
  "gaps": [
    {
      "api": "POST /api/customers",
      "scenario": "When created with duplicate email...",
      "priority": "P0",
      "reason": "No unit test found",
      "recommendations": ["Create unit test..."]
    }
  ],
  "orphanAPIs": [
    {
      "method": "POST",
      "endpoint": "/api/customers/bulk",
      "hasScenario": false,
      "hasTest": false,
      "riskLevel": "Critical"
    }
  ]
}
```

---

## ✍️ Writing Unit Tests

### Best Practices for AI Matching

**✅ Good Test Names (AI-friendly):**
```java
@Test
public void testCreateCustomerWithValidDataReturns201() { }

@Test
public void testGetCustomerWithInvalidIdReturns404() { }

@Test
@DisplayName("When user creates customer with valid email, return 201")
public void testCreateCustomer() { }
```

**❌ Bad Test Names (Hard for AI):**
```java
@Test
public void test1() { }

@Test
public void testMethod() { }
```

### Linking Tests to Scenarios

**Method 1: Descriptive Naming**
```java
@Test
public void testCreateCustomerWithValidEmail_Returns201() {
    // Test name matches scenario:
    // "When customer created with valid email, return 201"
}
```

**Method 2: @DisplayName**
```java
@Test
@DisplayName("When customer created with valid email, system returns 201 with customer ID")
public void testCreateCustomer() {
    // AI matches DisplayName to scenario
}
```

**Method 3: Comment Reference**
```java
/**
 * Covers scenario: CUST-001
 * When customer created with valid data, return 201
 */
@Test
public void testCreateCustomerHappyPath() {
    // Comment helps QA track, AI uses test name
}
```

### Test Structure (AAA Pattern)

```java
@Test
@DisplayName("When customer created with valid data, return 201")
public void testCreateCustomer() {
    // ARRANGE - Setup
    CustomerRequest request = new CustomerRequest();
    request.setEmail("test@example.com");
    request.setName("John Doe");
    
    when(repository.save(any())).thenReturn(savedCustomer);
    
    // ACT - Execute
    CustomerResponse response = service.createCustomer(request);
    
    // ASSERT - Verify
    assertNotNull(response);
    assertEquals(201, response.getStatusCode());
    assertEquals("test@example.com", response.getEmail());
    verify(repository).save(any());
}
```

### Keywords for Better AI Matching

Include these in test names/descriptions:
- **HTTP Methods:** GET, POST, PUT, DELETE, PATCH
- **Status Codes:** 200, 201, 400, 401, 403, 404, 409, 422, 500
- **Actions:** create, get, update, delete, validate, process
- **Conditions:** valid, invalid, missing, empty, duplicate, malformed
- **Entities:** customer, order, user, product, payment

---

## 💡 Real-World Examples

### Example 1: New Feature Development

**Scenario:** Developer adds a new customer search API

**Steps:**
1. Developer implements API endpoint
2. Developer writes unit tests
3. Pre-commit hook runs on commit
4. System detects new API (Git Change Detection)
5. AI generates baseline scenarios
6. System detects orphan unit tests (tests without baseline)
7. AI suggests scenarios for QA
8. QA reviews and adds to baseline

**System Output:**
```
🔍 Git changes detected:
  + Added: GET /api/customers/search

⚠️  Orphan Unit Tests: 3
  - testSearchByEmail
    💡 AI Suggestion: "When customer searched by email, return matching results"
  - testSearchByPhone
    💡 AI Suggestion: "When customer searched by phone, return matching results"
  - testSearchNoResults
    💡 AI Suggestion: "When search has no matches, return empty list"

Action: QA should add these scenarios to baseline
```

### Example 2: Refactoring Existing Code

**Scenario:** Developer refactors customer validation logic

**Steps:**
1. Developer modifies CustomerService.java
2. Some tests may be affected
3. Pre-commit detects changes
4. Git Change Detector identifies affected tests
5. System re-analyzes coverage
6. Reports show if refactoring broke coverage

**System Output:**
```
🔍 Git changes detected:
  ~ Modified: CustomerService.java (45 lines changed)
  
📋 Affected Tests:
  - testValidateEmail
  - testValidatePhoneNumber
  - testValidateRequiredFields

📊 Coverage Analysis:
  ✅ All scenarios still covered
  No action required
```

### Example 3: API Sunset/Deprecation

**Scenario:** Team decides to remove deprecated bulk upload API

**Steps:**
1. Developer deletes API endpoint
2. Pre-commit detects removal
3. System identifies orphaned scenarios
4. Suggests baseline cleanup

**System Output:**
```
🔍 Git changes detected:
  - Removed: POST /api/customers/bulk

⚠️  Stale Scenarios: 5
  These scenarios are in baseline but API no longer exists:
  - When bulk upload with CSV, process all rows
  - When bulk upload with invalid format, return 400
  ...

Recommendation: Remove these scenarios from baseline
File: .traceability/test-cases/baseline/customer-service-baseline.yml
```

---

## 🎯 Best Practices

### For Developers

1. **Write Descriptive Test Names**
   - Include HTTP method and status code
   - Use business-friendly language
   - Match scenario language when possible

2. **Use @DisplayName Annotations**
   - Especially helpful in Java/Kotlin
   - Makes AI matching more accurate
   - Better test documentation

3. **Group Related Tests**
   - Use test classes for each API endpoint
   - Keep tests close to implementation
   - Maintain consistent naming conventions

4. **Run Analysis Before Pushing**
   - `npm run continue` before commit
   - Review HTML report
   - Fix P0/P1 gaps immediately

5. **Don't Fight the Pre-Commit Hook**
   - It's there to help quality
   - Only bypass in true emergencies
   - Fix gaps properly instead of skipping

### For QA Engineers

1. **Keep Baseline Updated**
   - Review AI suggestions regularly
   - Add scenarios for new features
   - Remove scenarios for deprecated APIs

2. **Use Proper Priority Levels**
   - P0: Critical business scenarios
   - P1: Important functionality
   - P2: Edge cases
   - P3: Nice-to-have

3. **Write Clear Scenarios**
   - Use "When...then..." format
   - Include expected responses
   - Be specific about conditions

4. **Review Orphan Unit Tests**
   - Check AI suggestions weekly
   - Add suitable scenarios to baseline
   - Work with developers on unclear tests

5. **Monitor Visual Analytics**
   - Track coverage trends over time
   - Identify patterns in gaps
   - Prioritize high-risk areas

### For Team Leads

1. **Set Coverage Standards**
   - Define acceptable coverage thresholds
   - Establish P0/P1 gap policies
   - Configure pre-commit rules

2. **Review Reports Regularly**
   - Weekly coverage dashboard reviews
   - Track orphan API trends
   - Monitor technical debt

3. **Facilitate Dev-QA Collaboration**
   - Use AI suggestions as discussion starters
   - Pair on gap resolution
   - Share HTML reports in standups

4. **Leverage CI/CD Integration**
   - Parse JSON reports in pipeline
   - Fail builds on coverage drops
   - Track metrics over time

---

## 🐛 Troubleshooting

### Error: "Claude API key not found"

```bash
# Set API key
export CLAUDE_API_KEY="sk-ant-your-key-here"
# OR
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# Verify
echo $CLAUDE_API_KEY
```

### Error: "No tests found"

**Check Configuration:**
```json
{
  "services": [{
    "testDirectory": "src/test/java",  // Check this path
    "testPattern": "*Test.java"         // Check this pattern
  }]
}
```

**Verify Tests Exist:**
```bash
# Check test directory
ls -la services/customer-service/src/test/java

# Find test files
find services/customer-service -name "*Test.java"
```

### Error: "Model detection failed"

**Solution:**
```bash
# The system will automatically fallback to Claude 3.5 Sonnet
# If you see this, it means the Models API had issues
# But the system continues with a fallback model

# Console output:
# ⚠️  Models API failed, trying fallback detection...
# ✓ Using: claude-3-5-sonnet-20240620
```

### Low Coverage Scores

**Claude AI shows low matches:**

1. **Improve Test Naming:**
   - Use descriptive names that match scenario language
   - Include HTTP methods and status codes
   - Use @DisplayName annotations

2. **Check Scenario Descriptions:**
   - Make scenarios clear and specific
   - Use "When...then..." format
   - Include expected responses

3. **Review AI Analysis:**
   - Check the JSON report for AI explanations
   - See what AI thought each test covered
   - Adjust test names based on AI feedback

### Pre-Commit Hook Not Running

```bash
# Re-install hooks
npm run install:hooks

# Check if hook exists
ls -la .git/hooks/pre-commit

# Make executable
chmod +x .git/hooks/pre-commit

# Verify content
cat .git/hooks/pre-commit
```

### Reports Not Generated

```bash
# Check reports directory exists
ls -la .traceability/reports/

# Create if missing
mkdir -p .traceability/reports

# Check permissions
chmod 755 .traceability/reports

# Run analysis again
npm run continue
```

---

## 🎯 Quick Reference

### File Locations

```
.traceability/
├── config.json                          # Configuration
├── test-cases/
│   ├── baseline/                        # QA-managed scenarios
│   │   └── customer-service-baseline.yml
│   └── ai_cases/                        # AI-generated (auto)
│       └── customer-service-ai.yml      # ✅ in baseline, 🆕 new
└── reports/                             # Generated reports
    ├── customer-service-report.html     # Interactive dashboard
    ├── customer-service-report.json     # CI/CD data
    ├── customer-service-report.md       # Documentation
    └── customer-service-report.csv      # Spreadsheet
```

### Common Commands

```bash
# Generate AI scenarios
npm run generate

# Analyze coverage with AI
npm run continue

# Combined workflow
npm run generate && npm run continue

# Build
npm run build

# Install hooks
npm run install:hooks

# Emergency bypass
git commit --no-verify -m "message"
```

### Key Technologies

- **AI Engine:** Claude AI (Anthropic)
- **Model:** Claude 4.5 Sonnet (auto-detected)
- **Languages:** Java, TypeScript, Python, Go
- **Reports:** HTML, JSON, Markdown, CSV
- **Hook:** Git pre-commit (automatic)

### Priority Levels

- **P0 (Critical):** Must have tests, blocks commits
- **P1 (High):** Important features, configurable blocking
- **P2 (Medium):** Edge cases, recommended coverage
- **P3 (Low):** Technical tests, no action needed

---

## 📚 Additional Resources

- **Main Documentation:**
  - `README.md` - Project overview and quick start
  - `docs/QA_GUIDE.md` - QA workflow and baseline management
  - `docs/TESTING-GUIDE.md` - Testing and validation guide
  
- **Test Case Documentation:**
  - `docs/TEST-CASES-GUIDE.md` - Overview of demonstration cases (4, 5, 6)
  - `docs/AI-PRIORITY-LOGIC.md` - How P0/P1/P2/P3 priorities work
  - `docs/TWO-PHASE-ANALYSIS-EXPLAINED.md` - Baseline vs completeness
  - `docs/DETAILED-CASE-MAPPINGS.md` - All 3 cases with exact mappings and details

- **Technical Documentation:**
  - `docs/SCENARIO-COMPLETENESS-DETECTION.md` - Completeness detection
  - `IMPLEMENTATION_SUMMARY.md` - Implementation overview
  - `FEATURES.md` - Complete feature list

---

## 📜 Version History

### v6.0.0 (December 10, 2025) - Current Release

**Major Features:**
- Orphan Unit Test Detection with AI-suggested scenarios
- Orphan API Detection for completely untracked endpoints
- Visual Analytics Dashboard with interactive charts
- Enhanced 3-Layer Completeness Detection with reverse check
- Improved Git Change Detection with impact analysis

### v5.0.0
- 3-Layer Scenario Completeness Detection
- Bidirectional gap analysis
- Change Impact Analysis with affected tests tracking

### v4.0.0
- Multi-format reporting (HTML, JSON, CSV, Markdown)
- Git integration for change detection
- Orphan test categorization (Technical vs Business)

### v3.0.0
- Claude AI integration for coverage analysis
- Pre-commit hook validation
- Automated scenario-to-test mapping

---

**Version:** 6.0.0  
**Powered By:** Claude AI (Anthropic)  
**Status:** Production Ready  
**Build:** ✅ Passing

---

**Key Takeaway:** This system is 100% powered by Claude AI using natural language understanding. No manual fuzzy matching, pattern matching, or similarity algorithms. The AI analyzes scenarios and tests intelligently, providing context-aware recommendations and categorizations.
