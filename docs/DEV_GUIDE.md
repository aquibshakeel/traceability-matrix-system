# 👨‍💻 Developer Guide

**Version:** 6.3.0  
**Last Updated:** December 20, 2025  
**Difficulty:** Advanced  
**Prerequisites:** [Getting Started](GETTING_STARTED.md), [Architecture](ARCHITECTURE.md)

---

## 📖 Overview

This guide is for developers who want to:
- Contribute to the system
- Extend functionality
- Debug issues
- Understand implementation details
- Add new features

**Note:** This guide assumes you've read:
- [Getting Started](GETTING_STARTED.md) - Basic setup and usage
- [Architecture](ARCHITECTURE.md) - System design and components
- [Configuration](CONFIGURATION.md) - Configuration options

---

## 🚀 Development Setup

### Prerequisites

```bash
# Required
node >= 16.0.0
npm >= 7.0.0
git >= 2.0.0

# Recommended
TypeScript >= 4.5.0
VS Code or IntelliJ IDEA
```

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd traceability-matrix-system

# 2. Install dependencies
npm install

# 3. Build TypeScript
npm run build

# 4. Set up API keys
cp .env.example .env
# Edit .env and add your CLAUDE_API_KEY

# 5. Run tests (if available)
npm test

# 6. Verify build
node dist/index.js --version
```

### Project Structure

```
traceability-matrix-system/
├── bin/                        # CLI entry points
│   ├── ai-generate            # Generate scenarios
│   ├── ai-continue            # Analyze coverage
│   └── ai-generate-api        # Single API generation
├── lib/                        # Core source code
│   ├── ai/                    # AI provider abstraction
│   │   ├── AIProvider.ts      # Interface
│   │   ├── AIProviderFactory.ts
│   │   └── providers/         # Concrete implementations
│   │       ├── AnthropicProvider.ts
│   │       └── OpenAIProvider.ts
│   ├── core/                  # Core analysis engine
│   │   ├── ServiceManager.ts  # Orchestration
│   │   ├── AITestCaseGenerator.ts
│   │   ├── EnhancedCoverageAnalyzer.ts
│   │   ├── JourneyCoverageAnalyzer.ts
│   │   ├── GitChangeDetector.ts
│   │   ├── HistoryManager.ts
│   │   └── ReportGenerator.ts
│   ├── parsers/               # Language-specific parsers
│   │   ├── JavaTestParser.ts
│   │   ├── TypeScriptTestParser.ts
│   │   ├── PythonTestParser.ts
│   │   └── GoTestParser.ts
│   ├── utils/                 # Utilities
│   │   ├── PathResolver.ts    # Path resolution
│   │   ├── EnvConfig.ts       # Environment config
│   │   └── ProgressBar.ts     # CLI progress
│   ├── templates/             # Report templates
│   │   └── enhanced-report-v2.html
│   └── types.ts               # TypeScript types
├── docs/                      # Documentation
├── scripts/                   # Build and hook scripts
└── .traceability/            # Runtime data
    ├── config.json           # Configuration
    ├── test-cases/           # Scenarios
    ├── reports/              # Generated reports
    └── history/              # Historical snapshots
```

---

## 🔧 Development Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes
# Edit files in lib/

# 3. Build TypeScript
npm run build

# 4. Test locally
npm run continue

# 5. Verify changes
# Check reports, console output

# 6. Commit
git add .
git commit -m "feat: your feature description"

# 7. Push
git push origin feature/your-feature
```

### Building

```bash
# Full build
npm run build

# Watch mode (during development)
npx tsc --watch

# Clean build
rm -rf dist/
npm run build
```

### Testing Changes

```bash
# Test scenario generation
npm run generate

# Test coverage analysis
npm run continue

# Test specific service
node bin/ai-continue customer-service

# Test with verbose output
export VERBOSE=true
npm run continue
```

---

## 🎯 Common Development Tasks

### Task 1: Adding a New AI Provider

**Example: Adding Google Gemini support**

**Step 1: Create Provider Class**

```typescript
// lib/ai/providers/GeminiProvider.ts
import { AIProvider, AIConfig } from '../AIProvider';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements AIProvider {
  private gemini: GoogleGenerativeAI;
  private model: string;

  constructor(config: AIConfig) {
    this.gemini = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-pro';
  }

  async generateTestScenarios(apiSpec: string): Promise<any> {
    const model = this.gemini.getGenerativeModel({ 
      model: this.model 
    });

    const prompt = this.buildScenarioPrompt(apiSpec);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return this.parseScenarioResponse(response.text());
  }

  async matchTestToScenario(
    test: any, 
    scenarios: any[]
  ): Promise<any> {
    const model = this.gemini.getGenerativeModel({ 
      model: this.model 
    });

    const prompt = this.buildMatchingPrompt(test, scenarios);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return this.parseMatchResponse(response.text());
  }

  // Implement other interface methods...
}
```

**Step 2: Update Factory**

```typescript
// lib/ai/AIProviderFactory.ts
import { GeminiProvider } from './providers/GeminiProvider';

export class AIProviderFactory {
  static create(config: AIConfig): AIProvider {
    switch (config.provider) {
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'gemini':  // Add this
        return new GeminiProvider(config);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }
}
```

**Step 3: Update Types**

```typescript
// lib/types.ts
export type AIProviderType = 'anthropic' | 'openai' | 'gemini';
```

**Step 4: Test**

```bash
# Install Gemini SDK
npm install @google/generative-ai

# Update config
{
  "ai": {
    "provider": "gemini",
    "model": "gemini-pro"
  }
}

# Set API key
export GEMINI_API_KEY="your-key"

# Test
npm run continue
```

---

### Task 2: Adding a New Language Parser

**Example: Adding Rust test parser**

**Step 1: Create Parser**

```typescript
// lib/parsers/RustTestParser.ts
import * as fs from 'fs';
import * as path from 'path';

export class RustTestParser {
  canParse(filePath: string): boolean {
    return filePath.endsWith('_test.rs') || 
           filePath.endsWith('tests.rs');
  }

  parseTests(filePath: string): any[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tests: any[] = [];

    // Match Rust test functions: #[test]
    const testRegex = /#\[test\]\s*(?:#\[.*?\]\s*)*fn\s+(\w+)/g;
    let match;

    while ((match = testRegex.exec(content)) !== null) {
      const testName = match[1];
      const lineNumber = this.getLineNumber(content, match.index);

      tests.push({
        name: testName,
        displayName: this.formatTestName(testName),
        file: filePath,
        line: lineNumber,
        language: 'rust',
        framework: 'cargo test'
      });
    }

    return tests;
  }

  private formatTestName(name: string): string {
    // Convert snake_case to readable format
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }
}
```

**Step 2: Register Parser**

```typescript
// lib/core/TestParserFactory.ts
import { RustTestParser } from '../parsers/RustTestParser';

export class TestParserFactory {
  private parsers: Map<string, any> = new Map();

  constructor() {
    this.registerDefaultParsers();
  }

  private registerDefaultParsers() {
    this.parsers.set('java-junit', new JavaTestParser());
    this.parsers.set('typescript-jest', new TypeScriptTestParser());
    this.parsers.set('python-pytest', new PythonTestParser());
    this.parsers.set('go-testing', new GoTestParser());
    this.parsers.set('rust-cargo', new RustTestParser()); // Add this
  }

  getParser(language: string, framework: string): any {
    const key = `${language}-${framework}`;
    return this.parsers.get(key);
  }
}
```

**Step 3: Update Config Schema**

```typescript
// Service configuration now supports rust
{
  "services": [{
    "name": "rust-service",
    "language": "rust",
    "testFramework": "cargo",
    "testDirectory": "tests",
    "testPattern": "*_test.rs"
  }]
}
```

---

### Task 3: Adding a New Report Format

**Example: Adding XML report format**

**Step 1: Implement Generator Method**

```typescript
// lib/core/ReportGenerator.ts
export class ReportGenerator {
  async generateXML(data: AnalysisData): Promise<void> {
    const xml = this.buildXML(data);
    const filePath = path.join(
      this.outputDir, 
      `${data.serviceName}-report.xml`
    );
    
    fs.writeFileSync(filePath, xml, 'utf-8');
    console.log(`✅ XML: ${filePath}`);
  }

  private buildXML(data: AnalysisData): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<coverage-report>
  <service>${data.serviceName}</service>
  <timestamp>${data.timestamp}</timestamp>
  <summary>
    <coverage>${data.summary.coveragePercent}</coverage>
    <total-scenarios>${data.summary.totalScenarios}</total-scenarios>
    <fully-covered>${data.summary.fullyCovered}</fully-covered>
    <gaps>
      <p0>${data.summary.p0Gaps}</p0>
      <p1>${data.summary.p1Gaps}</p1>
    </gaps>
  </summary>
  <apis>
    ${data.apis.map(api => this.buildAPIXML(api)).join('\n')}
  </apis>
</coverage-report>`;
  }

  private buildAPIXML(api: any): string {
    return `<api>
  <endpoint>${api.endpoint}</endpoint>
  <method>${api.method}</method>
  <coverage>${api.coverage}</coverage>
</api>`;
  }
}
```

**Step 2: Update Report Generation Pipeline**

```typescript
// lib/core/ReportGenerator.ts
async generateReports(data: AnalysisData): Promise<void> {
  const formats = this.config.formats || ['html', 'json', 'csv', 'markdown'];
  
  if (formats.includes('html')) {
    await this.generateHTML(data);
  }
  if (formats.includes('json')) {
    await this.generateJSON(data);
  }
  if (formats.includes('xml')) {  // Add this
    await this.generateXML(data);
  }
  // ... other formats
}
```

**Step 3: Update Configuration**

```json
{
  "reporting": {
    "formats": ["html", "json", "xml"]
  }
}
```

---

### Task 4: Customizing AI Prompts

**Location:** `lib/ai/providers/AnthropicProvider.ts`

**Example: Customizing scenario generation prompt**

```typescript
// lib/ai/providers/AnthropicProvider.ts
private buildScenarioPrompt(api: any): string {
  return `You are a QA engineer analyzing an API endpoint.

API Details:
- Method: ${api.method}
- Path: ${api.path}
- Parameters: ${JSON.stringify(api.parameters)}
- Request Body: ${JSON.stringify(api.requestBody)}
- Responses: ${JSON.stringify(api.responses)}

Generate comprehensive test scenarios covering:
1. Happy Cases - Normal successful flows
2. Error Cases - Expected failures and validation
3. Edge Cases - Boundary conditions
4. Security Cases - Auth, injection, etc.

Format your response as YAML:
happy_case:
  - When [condition], [expected result]
error_case:
  - When [condition], [expected result]
...

Generate at least 8-12 scenarios total.
Focus on realistic business scenarios.`;
}
```

**Testing Custom Prompts:**

```bash
# Enable verbose mode to see prompts
export VERBOSE=true
npm run generate

# Check AI responses in console
# Adjust prompt based on AI output quality
```

---

## 🐛 Debugging

### Enable Debug Mode

```bash
# Maximum verbosity
export VERBOSE=true
export DEBUG="*"

# Run analysis
npm run continue 2>&1 | tee debug.log
```

### Common Debugging Scenarios

**Scenario 1: AI Not Matching Tests**

```bash
# Check what AI is seeing
export VERBOSE=true
npm run continue

# Look for:
# - Prompt sent to AI
# - AI response
# - Parsed matches

# Common issues:
# - Test names too generic
# - Scenario descriptions unclear
# - API key issues
```

**Scenario 2: Tests Not Being Found**

```typescript
// Add logging to TestParserFactory
console.log('Parsing tests from:', testDirectory);
console.log('Pattern:', testPattern);
console.log('Found files:', foundFiles);

// Check:
// 1. testDirectory path correct?
// 2. testPattern matches files?
// 3. Parser supports language?
```

**Scenario 3: Reports Not Generated**

```typescript
// Add logging to ReportGenerator
console.log('Generating report for:', serviceName);
console.log('Output directory:', outputDir);
console.log('Data:', JSON.stringify(data, null, 2));

// Check:
// 1. Output directory writable?
// 2. Data structure correct?
// 3. Template file exists?
```

### Using TypeScript Debugger

**VS Code launch.json:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Continue",
      "program": "${workspaceFolder}/bin/ai-continue",
      "args": ["customer-service"],
      "env": {
        "CLAUDE_API_KEY": "your-key",
        "VERBOSE": "true"
      },
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Logging Best Practices

```typescript
// Use console.log with prefixes
console.log('📊 [Analyzer]', 'Processing API:', api);
console.log('🤖 [AI]', 'Sending prompt...');
console.log('✅ [Report]', 'Generated:', filePath);
console.log('⚠️  [Warning]', 'Low confidence match');
console.log('❌ [Error]', error.message);

// Conditional logging
if (process.env.VERBOSE === 'true') {
  console.log('🔍 [Debug]', detailedInfo);
}
```

---

## 🧪 Testing

### Manual Testing

```bash
# Test generation
npm run generate

# Test analysis
npm run continue

# Test specific service
node bin/ai-continue customer-service

# Test with sample data
# Edit .traceability/test-cases/baseline/*.yml
# Add test scenarios
npm run continue
```

### Integration Testing

```typescript
// Create test service configuration
const testConfig = {
  name: 'test-service',
  path: './test-fixtures/service',
  language: 'java',
  testFramework: 'junit',
  testDirectory: 'src/test/java',
  testPattern: '*Test.java'
};

// Run analysis
const analyzer = new EnhancedCoverageAnalyzer();
const result = await analyzer.analyze(testConfig);

// Assert results
assert(result.coveragePercent > 0);
assert(result.apis.length > 0);
```

### End-to-End Testing

```bash
# Create complete test scenario
mkdir -p test-e2e/services/test-service
mkdir -p test-e2e/.traceability/test-cases/baseline

# Add test files
cp -r fixtures/* test-e2e/

# Run full analysis
cd test-e2e
npm run generate
npm run continue

# Verify reports
ls .traceability/reports/
```

---

## 📝 Contributing Guidelines

### Code Style

```typescript
// Use TypeScript strict mode
"strict": true

// Prefer const over let
const data = loadData();

// Use async/await over promises
async function analyze() {
  const result = await fetchData();
}

// Type everything
function process(data: AnalysisData): Report {
  // ...
}

// Use descriptive names
const coveragePercentage = calculateCoverage();
```

### Commit Messages

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat: New feature
fix: Bug fix
docs: Documentation
style: Formatting
refactor: Code restructuring
test: Tests
chore: Maintenance

# Examples:
feat(ai): add Gemini provider support
fix(parser): handle edge case in Java parser
docs(dev): update contributor guide
refactor(core): simplify analyzer logic
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test Thoroughly**
   ```bash
   npm run build
   npm run continue
   # Verify all works
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: your feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature
   # Create PR on GitHub
   ```

6. **PR Checklist**
   - [ ] Code builds successfully
   - [ ] All existing functionality works
   - [ ] New feature tested manually
   - [ ] Documentation updated
   - [ ] No console errors
   - [ ] Commit messages follow convention

---

## 🔐 Security Considerations

### API Key Management

```typescript
// ✅ Good: Environment variables
const apiKey = process.env.CLAUDE_API_KEY;

// ❌ Bad: Hardcoded keys
const apiKey = 'sk-ant-...';  // Never do this!

// ✅ Good: Validation
if (!apiKey) {
  throw new Error('API key not set');
}

// ✅ Good: Never log keys
console.log('API key:', apiKey.substring(0, 10) + '...');
```

### Data Privacy

```typescript
// Only send necessary data to AI
const prompt = buildPrompt({
  apiSpec: api.spec,         // ✅ OK
  testNames: tests.map(t => t.name),  // ✅ OK
  sourceCode: fullCode       // ❌ Avoid if possible
});

// Sanitize sensitive data
function sanitize(data: any): any {
  return {
    ...data,
    apiKey: undefined,
    secrets: undefined,
    credentials: undefined
  };
}
```

---

## 📚 Additional Resources

### TypeScript References

- **Official Docs:** https://www.typescriptlang.org/docs/
- **tsconfig.json:** Project TypeScript configuration
- **Type Definitions:** `lib/types.ts`

### AI Provider Documentation

- **Anthropic (Claude):** https://docs.anthropic.com/
- **OpenAI (GPT):** https://platform.openai.com/docs

### Related Guides

- **[Architecture](ARCHITECTURE.md)** - System design details
- **[Configuration](CONFIGURATION.md)** - All configuration options
- **[Getting Started](GETTING_STARTED.md)** - Basic setup
- **[QA Guide](QA_GUIDE.md)** - For QA team members

---

## 🤝 Getting Help

### Documentation

1. Check this guide first
2. Review [Architecture](ARCHITECTURE.md) for design
3. Check [Troubleshooting](TROUBLESHOOTING.md) for common issues

### Code Examples

```bash
# Look at existing implementations
lib/parsers/JavaTestParser.ts      # Parser example
lib/ai/providers/AnthropicProvider.ts  # AI provider example
lib/core/ReportGenerator.ts        # Report generation
```

### Community

- Create GitHub issue for bugs
- Discussion forum for questions
- Pull requests for contributions

---

**Version:** 6.3.0 | **Status:** Production Ready ✅
