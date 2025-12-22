# 🏗 Architecture Guide

**Version:** 6.3.0  
**Last Updated:** December 22, 2025  
**Difficulty:** Advanced

---

## 📖 Overview

System architecture for developers and technical users.

**Topics:**
- High-level design
- Core components
- Data flow
- Extension points

---

## 🎯 High-Level Architecture

```
USER INPUT (config, baseline, code)
         ↓
ORCHESTRATION (ServiceManager, PathResolver)
         ↓
    ┌────┴─────┐
SCANNERS    AI PROVIDERS
    └────┬─────┘
         ↓
ANALYSIS (Coverage, Gaps, Orphans)
         ↓
REPORTS (HTML, JSON, CSV, MD)
         ↓
OUTPUT (Reports, History)
```

---

## 🧩 Core Components

### 1. ServiceManager

**Purpose:** Orchestrates entire analysis

**Flow:**
```
1. Load config
2. For each service:
   - Scan APIs/tests
   - Run AI analysis
   - Generate reports
3. Save history
```

### 2. PathResolver

**Purpose:** 4-tier path resolution

**Priority:**
```
1. Per-service env vars (highest)
2. Shared env vars
3. Config file
4. Defaults (lowest)
```

**Example:**
```typescript
// Resolving customer-service path
1. Check: $CUSTOMER_SERVICE_PATH
2. Check: $SERVICE_PATH/customer-service
3. Check: config.services[].path
4. Default: ./services/customer-service
```

### 3. AI Provider Layer

**Architecture:**
```
AIProvider (interface)
    ├── AnthropicProvider
    └── OpenAIProvider
```

**Interface:**
```typescript
interface AIProvider {
  generateTestScenarios(api: API): Promise<Scenarios>
  matchTestToScenario(test: Test, scenarios: Scenario[]): Promise<Match>
  categorizeOrphanTest(test: Test): Promise<Category>
  suggestAdditionalScenarios(api: API): Promise<Scenarios>
}
```

**Factory Pattern:**
```typescript
AIProviderFactory.create(config) → 
  Returns appropriate provider (Anthropic/OpenAI)
```

### 4. Scanner Layer

**APIScanner:**
- Scans code for endpoints
- Extracts HTTP methods, paths

**TestParsers:**
- `JavaTestParser` - JUnit annotations
- `TypeScriptTestParser` - Jest/describe blocks
- `PythonTestParser` - pytest decorators
- `GoTestParser` - Test functions

**E2ETestScanner:**
- Finds E2E test files
- Links to journey definitions

### 5. Analysis Layer

**AITestCaseGenerator:**
```
1. Scan APIs
2. For each endpoint:
   - Build AI prompt
   - Generate scenarios
   - Parse response
3. Save to ai_cases/
```

**EnhancedCoverageAnalyzer:**
```
1. Load baseline
2. Scan tests
3. AI matches tests to scenarios
4. Detect gaps/orphans
5. Calculate metrics
```

**Matching Algorithm:**
```
For each scenario:
  1. Extract description
  2. Send to AI with tests
  3. AI returns:
     - Best match (if any)
     - Confidence (HIGH/MEDIUM/LOW)
     - Status (COVERED/PARTIAL/NOT_COVERED)
  4. Record with file/line
```

**JourneyCoverageAnalyzer:**
```
1. Load journey definitions
2. For each journey:
   - Check step coverage
   - Check E2E test exists
   - Calculate status
3. Identify weak points
```

**GitChangeDetector:**
```
1. Check if git repo
2. Get recent commits
3. Extract API changes:
   - Added
   - Modified
   - Removed
4. Return change summary
```

**HistoryManager:**
```
Storage: .traceability/history/
Format: JSON snapshots

{
  "date": "2025-12-22",
  "coverage": 66.7,
  "gaps": { "p0": 2, "p1": 3 }
}
```

### 6. Report Layer

**ReportGenerator:**
```
Formats:
- HTML: Interactive dashboard
- JSON: CI/CD integration
- CSV: Spreadsheet analysis
- Markdown: Documentation
```

**HTML Generation:**
```
1. Load template (lib/templates/enhanced-report-v2.html)
2. Inject data (metrics, coverage, gaps)
3. Add visualizations (Chart.js)
4. Save to .traceability/reports/
5. Auto-open (if enabled)
```

---

## 📊 Complete Data Flow

```
npm run continue
    ↓
Load config.json
    ↓
For each service:
    ↓
[SCAN]
  - APIScanner
  - TestParsers
  - E2ETestScanner
    ↓
[LOAD]
  - Baseline scenarios
  - Journey definitions
    ↓
[ANALYSIS]
  - AI Provider
  - Match tests → scenarios
  - Detect gaps/orphans
  - Generate suggestions
    ↓
[REPORT]
  - Generate HTML/JSON/CSV/MD
  - Auto-open
    ↓
[HISTORY]
  - Save snapshot
    ↓
Done
```

---

## 🔌 Extension Points

### Add New AI Provider

**Step 1:** Create provider class
```typescript
// lib/ai/providers/GeminiProvider.ts
export class GeminiProvider implements AIProvider {
  async generateTestScenarios(api: API) {
    // Implementation
  }
  // ... other methods
}
```

**Step 2:** Register in factory
```typescript
// lib/ai/AIProviderFactory.ts
case 'gemini':
  return new GeminiProvider(config)
```

**Step 3:** Use in config
```json
{
  "ai": {
    "provider": "gemini"
  }
}
```

### Add New Language Parser

**Step 1:** Create parser
```typescript
// lib/parsers/RustTestParser.ts
export class RustTestParser implements TestParser {
  parseTestFile(path: string): Test[] {
    // Parse #[test] annotations
  }
}
```

**Step 2:** Register
```typescript
// lib/core/TestParserFactory.ts
case 'rust':
  return new RustTestParser()
```

### Add New Report Format

**Step 1:** Implement generator
```typescript
// lib/core/ReportGenerator.ts
async generateXML(data: AnalysisData): Promise<string> {
  // Convert to XML
}
```

**Step 2:** Add to pipeline
```typescript
if (formats.includes('xml')) {
  await this.generateXML(data)
}
```

---

## 🔄 Key Workflows

### Workflow 1: First-Time Setup
```
npm run generate
  → Scan APIs
  → AI generates scenarios
  → Save to ai_cases/
  → QA reviews & creates baseline
```

### Workflow 2: Coverage Analysis
```
npm run continue
  → Load baseline
  → Scan tests
  → AI matching
  → Detect gaps
  → Generate reports
  → Save history
```

### Workflow 3: Pre-Commit
```
git commit
  → Hook triggers
  → Run analysis
  → Check P0 gaps
  → Block if P0 exists
  → Allow if clean
```

---

## 💾 Data Storage

```
.traceability/
├── config.json              # Config (version controlled)
├── test-cases/
│   ├── baseline/            # QA scenarios (versioned)
│   ├── ai_cases/            # AI generated (not versioned)
│   └── journeys/            # E2E workflows (versioned)
├── reports/                 # Generated reports (optional versioning)
└── history/                 # Snapshots (optional versioning)
```

**Version Control Strategy:**
- ✅ Config, baseline, journeys → Version controlled
- ❌ AI cases, reports, history → Regenerated

---

## 🔐 Security

**API Keys:**
- Environment variables only
- Never in code
- Validated before use

**Data Privacy:**
- No source code sent to AI
- Only descriptions & specs
- User controls data

**Dependencies:**
- Minimal external deps
- Trusted packages only
- Dependency pinning

---

## 📈 Performance

**Caching:**
- Config cached per run
- AI responses cached
- File system caching

**Parallel Processing:**
```typescript
await Promise.all(
  services.map(s => analyzeService(s))
)
```

**Incremental Analysis:**
- Only re-analyze changes
- Git-based detection
- Skip unchanged parts

---

## 🔮 Future Plans

1. **Local AI Models** - Ollama support
2. **Plugin System** - Custom extensions
3. **Database Backend** - PostgreSQL
4. **Real-time Analysis** - Watch mode

---

## 📚 Related Guides

- **[Getting Started](GETTING_STARTED.md)** - Setup
- **[Configuration](CONFIGURATION.md)** - Config options
- **[Developer Guide](DEV_GUIDE.md)** - Development
- **[Reports Guide](REPORTS_GUIDE.md)** - Understanding reports

---

**Version:** 6.3.0 | **Status:** Production Ready ✅
