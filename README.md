# AI-Driven Test Coverage System v6.3.0

🤖 **100% AI-powered test coverage analysis** with intelligent scenario generation, coverage matching, and premium enterprise reports. Zero static rules - everything powered by AI.

[![Version](https://img.shields.io/badge/version-6.3.0-blue.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-production%20ready-green.svg)]()
[![AI Powered](https://img.shields.io/badge/AI-100%25-purple.svg)]()

---

## 🎯 What It Does

Analyzes your codebase to answer critical questions:
- **Are our unit tests complete?** AI matches tests to QA scenarios
- **What's missing?** Identifies gaps with P0/P1/P2/P3 priorities  
- **Is there traceability?** Maps tests to requirements with confidence levels
- **What changed?** Detects API changes and impact automatically

**Result:** Premium HTML dashboard showing exactly what needs testing.

---

## ✨ Key Features

- 🤖 **AI-Powered Everything** - Claude/OpenAI for generation, matching, and categorization
- 📊 **V2 Premium Reports** - Enterprise dashboard with 3 focused cards
- 🎯 **Smart Gap Detection** - P0/P1/P2/P3 priority-based analysis
- 🔍 **Orphan Detection** - Finds tests without scenarios (categorized as Technical vs Business)
- 📈 **Historical Trends** - 30-day coverage tracking with charts
- 🔄 **Git Integration** - Automatic API change detection
- 🏢 **External Repos** - Services and scenarios in separate repositories
- 🎨 **Multi-Format** - HTML, JSON, CSV, Markdown reports

---

## 🚀 Quick Start

### 1. Install

```bash
npm install
npm run build
```

### 2. Set AI Provider

```bash
# Claude (recommended)
export CLAUDE_API_KEY="sk-ant-your-key"

# Or OpenAI
export OPENAI_API_KEY="sk-your-key"
export AI_PROVIDER="openai"
```

### 3. Generate AI Scenarios

```bash
npm run generate
```

Creates baseline scenarios in `.traceability/test-cases/ai_cases/`

### 4. Analyze Coverage

```bash
# Using config file
npm run continue

# Or external repos (CLI)
npm run continue -- customer-service \
  --service-path=/path/to/service \
  --baseline-path=/path/to/baseline.yml
```

**Output:** Premium HTML report at `.traceability/reports/{service}-report.html`

---

## 📊 V2 Report Features (Latest)

The V2 report provides a focused, action-oriented dashboard:

### **Card 1: Total Scenarios Panel**
- Summary metrics (Total, Coverage %, Gaps)
- **API Coverage Breakdown** - Single table showing:
  - One row per scenario
  - Status badges (✅ Covered / ⚠️ Partial / ❌ Not Covered)
  - Unit test mappings with file locations
  - Match confidence levels

### **Card 2: Orphan Unit Tests**
- Tests without baseline scenarios
- **AI Categorization:**
  - 💼 Business Tests (QA must add scenarios)
  - 🔧 Technical Tests (no action needed)
- Copy-ready YAML for QA team
- Priority assignments (P0/P1/P2/P3)

### **Card 3: AI Suggested Scenarios (P0/P1)**
- High-priority AI recommendations
- API-specific suggestions
- Ready to add to baseline

**What Changed in V2:**
- ✅ Simplified table structure (one row = one scenario)
- ✅ Removed redundant progress bars
- ✅ Focused on actionable insights
- ✅ Removed Business Journeys (moved to separate feature)

---

## 📋 Commands Reference

| Command | Description |
|---------|-------------|
| `npm run generate` | Generate AI test scenarios from APIs |
| `npm run continue` | Analyze coverage and generate reports |
| `npm run build` | Compile TypeScript |
| `npm run install:hooks` | Install pre-commit validation hook |
| `npm run generate:api` | Generate scenarios for single API (QA tool) |

---

## 📁 Project Structure

```
.traceability/
├── config.json                    # Configuration
├── reports/                       # Generated reports
│   ├── {service}-report.html      # Premium V2 dashboard
│   ├── {service}-report.json      # CI/CD integration
│   ├── {service}-report.csv       # Spreadsheet export
│   └── {service}-report.md        # Documentation
└── test-cases/
    ├── baseline/                  # QA-approved scenarios
    │   └── {service}-baseline.yml
    └── ai_cases/                  # AI-generated (auto-updated)
        └── {service}-ai.yml
```

---

## 🏢 External Repository Setup

**NEW in v6.3.0:** Analyze services and scenarios in separate repos!

```bash
# Set environment variables
export SERVICE_PATH=/path/to/services-repo
export TEST_SCENARIO_PATH=/path/to/scenarios-repo/baseline

# Or use per-service paths
export IDENTITY_SERVICE_PATH=/path/to/identity-service
export IDENTITY_SERVICE_BASELINE=/path/to/identity-baseline.yml

# Run analysis
npm run continue
```

**Benefits:**
- ✅ Services and QA scenarios in different repos
- ✅ Team independence (Dev vs QA)
- ✅ Flexible versioning
- ✅ CI/CD friendly

See [External Repos Guide](docs/EXTERNAL_REPOS.md) for details.

---

## 🤖 AI Provider Configuration

### Supported Providers

| Provider | Models | Best For |
|----------|--------|----------|
| **Anthropic** (Default) | Claude 3.5 Sonnet, 3.7 | Accuracy, context understanding |
| **OpenAI** | GPT-4, GPT-4 Turbo | Speed, cost optimization |

### Configuration Priority

1. **Environment Variables** (highest)
2. **Config File** (`.traceability/config.json`)
3. **Defaults** (Claude/Anthropic)

```json
{
  "ai": {
    "provider": "anthropic",  // or "openai"
    "model": "auto",          // or specific model
    "temperature": 0.3,
    "maxTokens": 2000
  }
}
```

---

## 📚 Documentation

### 🚀 Getting Started
- **[Getting Started Guide](docs/GETTING_STARTED.md)** - 15-minute beginner tutorial
- **[Configuration Guide](docs/CONFIGURATION.md)** - All configuration options
- **[External Repos Setup](docs/EXTERNAL_REPOS.md)** - Multi-repo architecture

### 📊 Understanding Reports
- **[Reports Guide](docs/REPORTS_GUIDE.md)** - V2 report deep dive
- **[QA Guide](docs/QA_GUIDE.md)** - For QA team members
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues & solutions

### 🛠 For Developers
- **[Developer Guide](docs/DEV_GUIDE.md)** - Contributing & extending
- **[Architecture](docs/ARCHITECTURE.md)** - System design & concepts
- **[Features](FEATURES.md)** - Complete feature list

### 📜 Reference
- **[Changelog](CHANGELOG.md)** - Version history
- **[License](LICENSE)** - MIT License

---

## 🎯 Common Workflows

### Daily Development
```bash
# 1. Make changes, add/update tests
# 2. Run analysis
npm run continue
# 3. Review V2 report
# 4. Fix P0 gaps if any
```

### QA Workflow
```bash
# 1. Review AI-generated scenarios
cat .traceability/test-cases/ai_cases/service-ai.yml
# 2. Create baseline from approved scenarios
# 3. Run analysis
npm run continue
# 4. Report gaps to dev team
```

### CI/CD Integration
```bash
npm run continue
# Check P0 gaps
P0_GAPS=$(jq '.summary.p0Gaps' .traceability/reports/service-report.json)
if [ "$P0_GAPS" -gt 0 ]; then
  echo "❌ P0 gaps detected"
  exit 1
fi
```

---

## ⚡ Performance Tips

- **First run:** 2-5 minutes (AI generation)
- **Subsequent runs:** 1-2 minutes (matching only)
- **Parallel analysis:** Run services independently
- **Cache:** AI responses cached for 24 hours

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key not set" | `export CLAUDE_API_KEY="sk-ant-..."` |
| "No scenarios found" | Run `npm run generate` first |
| "Build failed" | `rm -rf node_modules && npm install && npm run build` |
| "Report doesn't open" | Open manually: `.traceability/reports/*.html` |

See [Troubleshooting Guide](docs/TROUBLESHOOTING.md) for more.

---

## 🔄 Version Info

**Current:** v6.3.0 (December 18, 2025)

**Major Features:**
- External repository architecture
- Multi-provider AI support (Claude & OpenAI)
- V2 simplified report design
- Historical trend tracking (30 days)
- Orphan test AI categorization

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 🤝 Contributing

We welcome contributions! See [Developer Guide](docs/DEV_GUIDE.md) for:
- Code structure and organization
- Development workflow
- Testing and debugging
- Extension points

---

## 📞 Support

- 📖 **Documentation:** Check `docs/` directory
- 🐛 **Issues:** Review [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- 💡 **Features:** See [FEATURES.md](FEATURES.md) for detailed feature docs
- 🔍 **Reports:** Check generated reports for specific issues

---

**Built with ❤️ using 100% AI Intelligence**

[![AI Powered](https://img.shields.io/badge/Powered%20by-Claude%20%26%20OpenAI-purple.svg)]()
[![Version](https://img.shields.io/badge/version-6.3.0-blue.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-production%20ready-green.svg)]()
