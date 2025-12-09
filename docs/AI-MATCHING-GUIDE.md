# AI-Based Matching Guide

## Overview

The Traceability Matrix System now supports **AI-based matching** using Claude API for intelligent scenario-to-unit-test correlation. This replaces static rule-based matching with dynamic, context-aware analysis.

## Features

### 🤖 What AI Matching Does

1. **Semantic Understanding**: Analyzes the meaning and intent behind scenarios and tests, not just keywords
2. **Contextual Analysis**: Considers API endpoints, test descriptions, acceptance criteria, and business logic
3. **Gap Detection**: Identifies missing tests, redundant tests, and coverage gaps
4. **Intelligent Scoring**: Provides confidence scores based on relevance and coverage completeness
5. **Actionable Recommendations**: Suggests specific actions to improve test coverage

### 📊 Matching Capabilities

The AI matcher analyzes:
- Business scenario descriptions
- API endpoints and HTTP methods
- Acceptance criteria
- Unit test descriptions and code structure
- Test file locations and naming conventions
- Priority and risk levels

And determines:
- **Exact Match**: Perfect coverage (90%+ confidence)
- **Partial Match**: Some coverage but incomplete (60-90% confidence)
- **No Match**: No relevant tests found (< 60% confidence)

## Setup

### 1. Get Claude API Key

Sign up at [Anthropic Console](https://console.anthropic.com/) and create an API key.

### 2. Configure Environment Variable

Set your Claude API key as an environment variable:

```bash
# Option 1: Export in shell
export CLAUDE_API_KEY="sk-ant-..."

# Option 2: Or use ANTHROPIC_API_KEY
export ANTHROPIC_API_KEY="sk-ant-..."

# Option 3: Add to .env file (create in project root)
echo "CLAUDE_API_KEY=sk-ant-..." > .env
```

### 3. Build the Project

```bash
npm run build
```

### 4. Run Validation

```bash
# The system will automatically use AI matching if API key is detected
npm run validate

# You'll see this message if AI is enabled:
# 🤖 AI-Based Matching enabled (Claude API)
```

## Usage

### Automatic Detection

The system automatically enables AI matching when:
- `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY` environment variable is set
- The API key is valid (not empty or placeholder)

### Required API Key

🚨 **IMPORTANT:** Claude API key is now **MANDATORY**

If no API key is configured:
- ❌ System will **FAIL** with error
- Error message: `🚨 Claude API key is required for AI-based matching`
- No fallback to semantic matching (removed in v2.0)

### Example Output

```
📋 Processing service: customer-service
  Loading scenarios from: .traceability/scenarios/customer-service.scenarios.yaml
  ✓ Loaded 14 scenarios
  Parsing unit tests...
  ✓ Found 63 unit tests
  Mapping scenarios to tests...

🤖 AI-Based Matching (Claude API):
   Processing 14 scenarios against 63 tests...
   Progress: 3/14 scenarios analyzed
   Progress: 6/14 scenarios analyzed
   Progress: 9/14 scenarios analyzed
   Progress: 12/14 scenarios analyzed
   Progress: 14/14 scenarios analyzed
   ✓ AI matching completed

  ✓ Completed mapping analysis
```

## AI Analysis Process

### 1. Scenario Analysis

For each scenario, the AI analyzes:

```yaml
SCENARIO: CUST-001
Description: When user requests customer with valid ID, return customer data
API: GET /api/customer/:id
Priority: P1
Risk: High
Acceptance Criteria:
  - Response status 200
  - Includes customer name
  - Includes email and phone
```

### 2. Test Correlation

The AI examines all unit tests:

```java
Test: CustomerControllerTest.getCustomerById_ShouldReturnCustomer_WhenCustomerExists
Description: Get Customer By Id Should Return Customer When Customer Exists
File: CustomerControllerTest.java
```

### 3. Match Scoring

```json
{
  "matchType": "exact",
  "confidence": 0.95,
  "reasoning": "Test directly validates the scenario's acceptance criteria...",
  "matchedTests": [
    {
      "testId": "CustomerControllerTest.getCustomerById...",
      "relevance": 0.95,
      "explanation": "Tests happy path with valid customer ID"
    }
  ],
  "gaps": [],
  "recommendations": ["Consider adding performance test"]
}
```

## Configuration

### Batch Processing

The AI matcher processes scenarios in batches of 3 to respect rate limits:

```typescript
// In AIBasedMatcher.ts
const batchSize = 3; // Configurable
```

### Model Selection

Uses Claude 3.5 Sonnet by default (best balance of speed and accuracy):

```typescript
private model: string = 'claude-3-5-sonnet-20241022';
```

### Token Limits

- Max tokens per request: 2000
- Temperature: 0.3 (for consistent analysis)
- Analyzes up to 50 tests per scenario (for efficiency)

## Cost Considerations

### Pricing (as of Dec 2024)

Claude 3.5 Sonnet:
- Input: $3 per million tokens
- Output: $15 per million tokens

### Estimated Costs

For a typical validation run:
- ~14 scenarios
- ~63 tests
- ~5 batches
- **Estimated cost: $0.02 - $0.05 per run**

### Cost Optimization

1. **Batch Processing**: Groups scenarios to minimize API calls
2. **Test Sampling**: Analyzes top 50 most relevant tests
3. **Caching**: Results cached in reports (no re-analysis needed)

## Advantages Over Rule-Based Matching

| Feature | Rule-Based | AI-Based |
|---------|-----------|----------|
| **Semantic Understanding** | ❌ Keyword only | ✅ Full context |
| **Intent Detection** | ❌ No | ✅ Yes |
| **Gap Analysis** | ⚠️ Basic | ✅ Detailed |
| **Recommendations** | ❌ Generic | ✅ Specific |
| **False Positives** | ⚠️ Common | ✅ Rare |
| **Adaptation** | ❌ Static rules | ✅ Dynamic reasoning |
| **New Patterns** | ❌ Manual updates | ✅ Automatic |

## Troubleshooting

### API Key Not Detected

```bash
# Check if variable is set
echo $CLAUDE_API_KEY

# Set it temporarily
export CLAUDE_API_KEY="sk-ant-..."

# Or add to shell profile
echo 'export CLAUDE_API_KEY="sk-ant-..."' >> ~/.zshrc
source ~/.zshrc
```

### Rate Limit Errors

If you hit rate limits:
1. Reduce batch size in `AIBasedMatcher.ts`
2. Add delays between batches
3. Upgrade Anthropic API tier

### Unexpected Results

1. **Check API key validity**: Ensure key is not expired
2. **Review scenario descriptions**: More detailed scenarios = better matching
3. **Verify test naming**: Clear test names improve matching accuracy

## Best Practices

### 1. Write Clear Scenarios

✅ **Good:**
```yaml
description: When user creates customer with valid data, system returns 201 
  with customer ID and saves to database
```

❌ **Bad:**
```yaml
description: Create customer
```

### 2. Include Acceptance Criteria

```yaml
acceptanceCriteria:
  - Response status 201
  - Response includes customer ID
  - Customer saved in database
  - All required fields persisted
```

### 3. Use Descriptive Test Names

✅ **Good:**
```java
createCustomer_ShouldReturnCreated_WhenValidRequest()
```

❌ **Bad:**
```java
test1()
```

### 4. Monitor AI Insights

Review AI reasoning in reports to:
- Understand matching decisions
- Identify coverage gaps
- Improve scenario/test quality

## Security

### API Key Storage

**DO NOT:**
- ❌ Commit API keys to git
- ❌ Share keys in documentation
- ❌ Use personal keys in CI/CD

**DO:**
- ✅ Use environment variables
- ✅ Use secret managers in CI/CD
- ✅ Rotate keys regularly
- ✅ Use separate keys per environment

### .gitignore

Already configured to ignore:
```gitignore
.env
.env.local
.env.*.local
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Test Coverage Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run AI-based validation
        env:
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
        run: npm run validate
```

### GitLab CI

```yaml
validate:
  stage: test
  variables:
    CLAUDE_API_KEY: $CLAUDE_API_KEY
  script:
    - npm install
    - npm run validate
```

## Future Enhancements

- [ ] Support for other AI models (GPT-4, Gemini)
- [ ] Caching of AI responses
- [ ] Batch optimization for large projects
- [ ] Custom prompts per service
- [ ] AI-powered test generation suggestions
- [ ] Learning from manual corrections

## Support

For issues or questions:
1. Check logs in `.traceability/reports/`
2. Review AI reasoning in HTML reports
3. Verify API key configuration
4. Check Anthropic status page

## Learn More

- [Anthropic Claude API Docs](https://docs.anthropic.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Traceability Matrix System Docs](./DEV_GUIDE.md)
