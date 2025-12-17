# AI Provider Abstraction Layer

**Version:** 1.0.0  
**Status:** Production Ready (Anthropic Claude only)  
**Coming Soon:** OpenAI GPT, Google Gemini

---

## 🎯 Purpose

This abstraction layer allows the traceability matrix system to support multiple AI providers (Claude, GPT, Gemini, etc.) without changing core logic. It provides a clean interface that any AI provider can implement.

---

## 📁 Structure

```
lib/ai/
├── AIProvider.ts              # Interface all providers must implement
├── AIProviderFactory.ts       # Creates appropriate provider
├── types.ts                   # Shared type definitions
├── index.ts                   # Module exports
└── providers/                 # Provider implementations
    ├── AnthropicProvider.ts   # Claude AI (ACTIVE)
    ├── OpenAIProvider.ts      # GPT (Coming soon)
    └── GeminiProvider.ts      # Gemini (Coming soon)
```

---

## 🚀 Quick Start

### Basic Usage (Backwards Compatible)

```typescript
import { AIProviderFactory } from './ai';

// Simple API key (defaults to Anthropic)
const provider = await AIProviderFactory.create(process.env.CLAUDE_API_KEY);

// Generate scenarios
const scenarios = await provider.generateScenarios({
  method: 'POST',
  endpoint: '/api/customers',
  description: 'Create a new customer'
});

// Analyze coverage
const coverage = await provider.analyzeCoverage(api, scenarios, tests);
```

### Advanced Configuration

```typescript
import { AIProviderFactory, AIConfig } from './ai';

const config: AIConfig = {
  provider: 'anthropic',
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'claude-sonnet-4-5-20250929',  // Or 'auto'
  options: {
    temperature: 0.0,
    maxTokens: 2000
  }
};

const provider = await AIProviderFactory.create(config);
```

---

## 🏗️ Architecture

### AIProvider Interface

All AI providers must implement this interface:

```typescript
interface AIProvider {
  readonly name: string;
  readonly modelId: string;
  
  initialize(config: ProviderConfig): Promise<void>;
  generateScenarios(api: APIDefinition): Promise<Scenarios>;
  analyzeCoverage(api: APIDefinition, scenarios: BaselineScenario[], tests: UnitTest[]): Promise<CoverageAnalysis>;
  categorizeOrphans(tests: UnitTest[]): Promise<TestCategories>;
  isAvailable(): Promise<boolean>;
  getMetadata(): { name: string; model: string; version?: string };
}
```

---

## 🔌 Current Providers

### Anthropic (Claude) ✅

**Status:** Active  
**Models:** Claude 4.5, Claude 3.7, Claude 3.5  
**Auto-detection:** Yes  

```typescript
const provider = await AIProviderFactory.create({
  provider: 'anthropic',
  apiKey: process.env.CLAUDE_API_KEY,
  model: 'auto'  // Auto-detects best available model
});
```

**Supported Models:**
- `claude-sonnet-4-5-20250929` (Recommended)
- `claude-3-7-sonnet-20250219`
- `claude-3-5-sonnet-20241022`
- `claude-3-5-sonnet-20240620`
- `auto` (default - auto-detects)

---

## 🔮 Coming Soon

### OpenAI (GPT) ⏳

**Status:** Coming Soon  
**Models:** GPT-4, GPT-4 Turbo, GPT-3.5  

```typescript
// Future usage
const provider = await AIProviderFactory.create({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview'
});
```

### Google (Gemini) ⏳

**Status:** Coming Soon  
**Models:** Gemini Pro, Gemini Ultra  

```typescript
// Future usage
const provider = await AIProviderFactory.create({
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-pro'
});
```

---

## 🎨 How to Add a New Provider

### Step 1: Implement AIProvider Interface

```typescript
// lib/ai/providers/MyProvider.ts
import { AIProvider } from '../AIProvider';

export class MyProvider implements AIProvider {
  readonly name = 'MyAI';
  private _modelId: string = '';
  
  get modelId(): string {
    return this._modelId;
  }

  async initialize(config: ProviderConfig): Promise<void> {
    // Initialize your provider SDK
  }

  async generateScenarios(api: APIDefinition): Promise<Scenarios> {
    // Call your AI API
  }

  async analyzeCoverage(...): Promise<CoverageAnalysis> {
    // Call your AI API
  }

  async categorizeOrphans(...): Promise<TestCategories> {
    // Call your AI API
  }

  async isAvailable(): Promise<boolean> {
    // Health check
  }

  getMetadata() {
    return { name: this.name, model: this._modelId };
  }
}
```

### Step 2: Register in Factory

```typescript
// lib/ai/AIProviderFactory.ts
import { MyProvider } from './providers/MyProvider';

// Add to switch statement
case 'myai':
  provider = new MyProvider();
  break;
```

### Step 3: Export from Index

```typescript
// lib/ai/index.ts
export { MyProvider } from './providers/MyProvider';
```

### Step 4: Test

```typescript
const provider = await AIProviderFactory.create({
  provider: 'myai',
  apiKey: 'your-api-key'
});
```

---

## 📊 Type Definitions

### APIDefinition
```typescript
interface APIDefinition {
  method: string;              // HTTP method
  endpoint: string;            // API endpoint
  description?: string;        // OpenAPI description
  parameters?: any[];          // OpenAPI parameters
  requestBody?: any;           // OpenAPI request body
  responses?: any;             // OpenAPI responses
}
```

### Scenarios
```typescript
interface Scenarios {
  happy_case?: string[];       // Success scenarios
  edge_case?: string[];        // Edge case scenarios
  error_case?: string[];       // Error scenarios
  security?: string[];         // Security test scenarios
}
```

### CoverageAnalysis
```typescript
interface CoverageAnalysis {
  matches: CoverageMatch[];    // Scenario coverage matches
  orphanTests?: number[];      // Tests without scenarios
  recommendations?: string[];  // AI recommendations
}
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Anthropic (Claude)
export CLAUDE_API_KEY="sk-ant-..."
# or
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI (Future)
export OPENAI_API_KEY="sk-..."

# Google (Future)
export GEMINI_API_KEY="..."
```

### Config File

```json
{
  "ai": {
    "provider": "anthropic",
    "model": "auto",
    "options": {
      "temperature": 0.0,
      "maxTokens": 2000
    }
  }
}
```

---

## 🧪 Testing

```typescript
import { AIProviderFactory } from './ai';

// Test provider availability
const provider = await AIProviderFactory.create(apiKey);
const available = await provider.isAvailable();

// Test scenario generation
const scenarios = await provider.generateScenarios(testApi);
console.assert(scenarios.happy_case.length > 0);

// Test coverage analysis
const coverage = await provider.analyzeCoverage(api, scenarios, tests);
console.assert(coverage.matches.length > 0);
```

---

## 📝 Notes

### Backwards Compatibility

The factory accepts both old and new formats:

```typescript
// Old format (still works)
const provider = await AIProviderFactory.create(apiKey);

// New format
const provider = await AIProviderFactory.create({
  provider: 'anthropic',
  apiKey: apiKey
});
```

### No Breaking Changes

- Existing code continues to work unchanged
- New abstraction is opt-in
- Can be adopted gradually

---

## 🎯 Future Enhancements

- [ ] OpenAI GPT provider implementation
- [ ] Google Gemini provider implementation
- [ ] Cohere provider
- [ ] Local model support (Llama, Mistral)
- [ ] Provider fallback/retry logic
- [ ] Response caching
- [ ] Cost tracking per provider
- [ ] A/B testing between providers

---

## 📚 Related Documentation

- **Main README:** `../../README.md`
- **Developer Guide:** `../../docs/DEV_GUIDE.md`
- **Types Documentation:** `./types.ts`

---

**Questions?** Check the main project documentation or review the AnthropicProvider implementation as a reference.
