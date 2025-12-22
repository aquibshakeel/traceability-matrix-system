# 👨‍💻 Developer Guide

**Version:** 6.3.0  
**Last Updated:** December 22, 2025  
**Difficulty:** Advanced

---

## 📖 Overview

Guide for developers contributing to or extending the system.

**Prerequisites:** Read [Architecture](ARCHITECTURE.md) first.

---

## 🚀 Setup

### Install

```bash
git clone <repo>
cd traceability-matrix-system
npm install
npm run build
```

### Configure

```bash
# Set API key
export CLAUDE_API_KEY="sk-ant-your-key"

# Test
npm run continue
```

### Project Structure

```
lib/
├── ai/                # AI providers
│   ├── providers/     # Anthropic, OpenAI
│   └── AIProviderFactory.ts
├── core/              # Core logic
│   ├── ServiceManager.ts
│   ├── EnhancedCoverageAnalyzer.ts
│   └── ReportGenerator.ts
├── parsers/           # Language parsers
│   ├── JavaTestParser.ts
│   └── TypeScriptTestParser.ts
├── utils/             # Utilities
└── templates/         # Report templates
```

---

## 🔧 Development Workflow

```bash
# Create branch
git checkout -b feature/your-feature

# Make changes
# Edit files in lib/

# Build
npm run build

# Test
npm run continue

# Commit
git add .
git commit -m "feat: description"
git push
```

---

## 🎯 Common Tasks

### Add AI Provider

**1. Create provider:**
```typescript
// lib/ai/providers/GeminiProvider.ts
export class GeminiProvider implements AIProvider {
  async generateTestScenarios(api: API) {
    // Implementation
  }
  async matchTestToScenario(test, scenarios) {
    // Implementation
  }
}
```

**2. Register:**
```typescript
// lib/ai/AIProviderFactory.ts
case 'gemini':
  return new GeminiProvider(config)
```

**3. Configure:**
```json
{
  "ai": { "provider": "gemini" }
}
```

### Add Language Parser

**1. Create parser:**
```typescript
// lib/parsers/RustTestParser.ts
export class RustTestParser implements TestParser {
  parseTestFile(path: string): Test[] {
    // Parse #[test] annotations
  }
}
```

**2. Register:**
```typescript
// lib/core/TestParserFactory.ts
case 'rust':
  return new RustTestParser()
```

### Add Report Format

**1. Implement:**
```typescript
// lib/core/ReportGenerator.ts
async generateXML(data: AnalysisData) {
  // Convert to XML
}
```

**2. Add to pipeline:**
```typescript
if (formats.includes('xml')) {
  await this.generateXML(data)
}
```

### Customize AI Prompts

**Location:** `lib/ai/providers/AnthropicProvider.ts`

```typescript
private buildScenarioPrompt(api: API): string {
  return `Analyze this API:
Method: ${api.method}
Path: ${api.path}

Generate scenarios for:
- Happy cases
- Error cases
- Edge cases
- Security
...`;
}
```

---

## 🐛 Debugging

### Enable Verbose

```bash
export VERBOSE=true
npm run continue 2>&1 | tee debug.log
```

### Common Issues

**AI not matching:**
- Check prompts in verbose mode
- Verify test descriptions
- Check API key

**Tests not found:**
- Verify test directory
- Check test pattern
- Confirm parser supports language

**Reports not generated:**
- Check output directory permissions
- Verify data structure
- Confirm template exists

### VS Code Debugger

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug",
  "program": "${workspaceFolder}/bin/ai-continue",
  "env": {
    "CLAUDE_API_KEY": "your-key",
    "VERBOSE": "true"
  }
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
```

### Integration Testing

```typescript
const testConfig = {
  name: 'test-service',
  path: './test-fixtures/service',
  language: 'java',
  testFramework: 'junit'
};

const analyzer = new EnhancedCoverageAnalyzer();
const result = await analyzer.analyze(testConfig);

assert(result.coveragePercent > 0);
```

---

## 📝 Contributing

### Code Style

```typescript
// TypeScript strict mode
"strict": true

// Prefer const
const data = loadData();

// Async/await
async function analyze() {
  const result = await fetchData();
}

// Type everything
function process(data: AnalysisData): Report {
  // ...
}
```

### Commit Messages

```bash
feat: New feature
fix: Bug fix
docs: Documentation
refactor: Refactoring
test: Tests

# Examples:
feat(ai): add Gemini provider
fix(parser): handle edge case
docs(dev): update guide
```

### PR Checklist

- [ ] Code builds
- [ ] Tests pass
- [ ] Docs updated
- [ ] No console errors
- [ ] Commit messages clear

---

## 🔐 Security

### API Keys

```typescript
// ✅ Good: Environment variables
const key = process.env.CLAUDE_API_KEY;

// ❌ Bad: Hardcoded
const key = 'sk-ant-...';  // Never!

// ✅ Good: Validate
if (!key) throw new Error('API key not set');

// ✅ Good: Never log full key
console.log('Key:', key.substring(0, 10) + '...');
```

### Data Privacy

```typescript
// Only send necessary data to AI
const prompt = buildPrompt({
  apiSpec: api.spec,         // ✅ OK
  testNames: tests.map(t => t.name),  // ✅ OK
  sourceCode: fullCode       // ❌ Avoid
});
```

---

## 📚 Resources

### Documentation

- [Architecture](ARCHITECTURE.md) - System design
- [Configuration](CONFIGURATION.md) - Config options
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues

### External

- TypeScript: https://www.typescriptlang.org/docs/
- Anthropic: https://docs.anthropic.com/
- OpenAI: https://platform.openai.com/docs

---

**Version:** 6.3.0 | **Status:** Production Ready ✅
