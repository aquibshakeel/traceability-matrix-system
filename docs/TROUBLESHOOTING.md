# 🔧 Troubleshooting Guide

**Version:** 6.3.0  
**Last Updated:** December 20, 2025  
**Difficulty:** All Levels  
**Prerequisites:** [Getting Started Guide](GETTING_STARTED.md)

---

## 📖 Overview

This guide helps you diagnose and resolve common issues with the AI-Driven Test Coverage System. Issues are organized by category for quick reference.

**Quick Navigation:**
- [Installation Issues](#-installation-issues)
- [Configuration Issues](#-configuration-issues)
- [API Key Issues](#-api-key-issues)
- [Analysis Issues](#-analysis-issues)
- [Report Generation Issues](#-report-generation-issues)
- [Performance Issues](#-performance-issues)
- [Integration Issues](#-integration-issues)
- [FAQ](#-frequently-asked-questions)

---

## 🛠 Installation Issues

### "npm install" fails

**Symptoms:**
```bash
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**

1. **Clear npm cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **Use legacy peer deps:**
```bash
npm install --legacy-peer-deps
```

3. **Update Node.js:**
```bash
node --version  # Should be v16+
# If not, update Node.js from nodejs.org
```

### "npm run build" fails

**Symptoms:**
```bash
error TS2304: Cannot find name 'Promise'
```

**Solutions:**

1. **Check TypeScript version:**
```bash
npm list typescript
# Should be 4.x or higher
```

2. **Reinstall dependencies:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

3. **Check tsconfig.json:**
```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM"],
    "target": "ES2020"
  }
}
```

### Module not found errors

**Symptoms:**
```bash
Error: Cannot find module '@anthropic-ai/sdk'
```

**Solution:**
```bash
# Install missing dependencies
npm install

# If still failing, install explicitly
npm install @anthropic-ai/sdk openai
```

---

## ⚙️ Configuration Issues

### "Configuration file not found"

**Symptoms:**
```bash
Error: ENOENT: no such file or directory
.traceability/config.json
```

**Solution:**
```bash
# Create directory
mkdir -p .traceability

# Create config file
cat > .traceability/config.json << 'EOF'
{
  "services": [
    {
      "name": "my-service",
      "enabled": true,
      "path": "./path/to/service",
      "language": "java",
      "testFramework": "junit",
      "testDirectory": "src/test/java",
      "testPattern": "*Test.java"
    }
  ]
}
EOF
```

### "Invalid JSON in config file"

**Symptoms:**
```bash
SyntaxError: Unexpected token } in JSON
```

**Solution:**

1. **Validate JSON syntax:**
```bash
# Use Node.js to check
node -e "JSON.parse(require('fs').readFileSync('.traceability/config.json'))"

# Or use online validator: jsonlint.com
```

2. **Common JSON mistakes:**
```json
{
  "services": [
    {
      "name": "test",
      "enabled": true,  // ❌ No trailing comma!
    }
  ]
}

// ✅ Correct:
{
  "services": [
    {
      "name": "test",
      "enabled": true
    }
  ]
}
```

### "Service path not found"

**Symptoms:**
```bash
Error: Service path does not exist: ./services/customer-service
```

**Solutions:**

1. **Verify path exists:**
```bash
ls -la ./services/customer-service
```

2. **Use absolute paths:**
```bash
export CUSTOMER_SERVICE_PATH=$(pwd)/services/customer-service
```

3. **Check working directory:**
```bash
pwd  # Should be in traceability-matrix-system root
cd /path/to/traceability-matrix-system
```

---

## 🔑 API Key Issues

### "Claude API key not set"

**Symptoms:**
```bash
Error: CLAUDE_API_KEY environment variable is not set
```

**Solutions:**

1. **Set environment variable:**
```bash
export CLAUDE_API_KEY="sk-ant-your-api-key-here"
```

2. **Verify it's set:**
```bash
echo $CLAUDE_API_KEY
# Should show your key
```

3. **Make it permanent:**
```bash
echo 'export CLAUDE_API_KEY="sk-ant-your-key"' >> ~/.bashrc
source ~/.bashrc
```

4. **Check shell:**
```bash
# For bash
~/.bashrc

# For zsh  
~/.zshrc

# Add the export line to the appropriate file
```

### "API key format invalid"

**Symptoms:**
```bash
Error: Invalid API key format
```

**Solutions:**

1. **Check key format:**
```bash
# Anthropic keys start with: sk-ant-
# OpenAI keys start with: sk-

echo $CLAUDE_API_KEY | head -c 10
# Should show: sk-ant-
```

2. **No spaces or quotes in key:**
```bash
# ❌ Wrong
export CLAUDE_API_KEY=" sk-ant-key "

# ✅ Correct
export CLAUDE_API_KEY="sk-ant-key"
```

### "API rate limit exceeded"

**Symptoms:**
```bash
Error: 429 Too Many Requests
Rate limit exceeded
```

**Solutions:**

1. **Wait and retry:**
```bash
# Wait 60 seconds
sleep 60
npm run continue
```

2. **Reduce temperature (faster, fewer tokens):**
```json
{
  "ai": {
    "temperature": 0.0,
    "maxTokens": 1000
  }
}
```

3. **Analyze one service at a time:**
```json
{
  "services": [
    {
      "name": "service1",
      "enabled": true  // Enable only one
    },
    {
      "name": "service2",
      "enabled": false  // Disable others
    }
  ]
}
```

### "Insufficient API credits"

**Symptoms:**
```bash
Error: 402 Payment Required
Insufficient credits
```

**Solution:**
- Add credits to your Anthropic/OpenAI account
- Check balance at console.anthropic.com or platform.openai.com

---

## 📊 Analysis Issues

### "No scenarios found"

**Symptoms:**
```bash
Warning: No baseline scenarios found
Skipping coverage analysis
```

**Solutions:**

1. **Generate scenarios first:**
```bash
npm run generate
```

2. **Check baseline file exists:**
```bash
ls -la .traceability/test-cases/baseline/
```

3. **Verify YAML format:**
```bash
cat .traceability/test-cases/baseline/my-service-baseline.yml
```

### "No unit tests found"

**Symptoms:**
```bash
Warning: No unit tests found
0 tests scanned
```

**Solutions:**

1. **Verify test directory:**
```bash
ls -la ./services/my-service/src/test/java
```

2. **Check test pattern in config:**
```json
{
  "testPattern": "*Test.java"  // Should match your files
}
```

3. **Common test patterns:**
```json
// Java
"testPattern": "*Test.java"

// TypeScript
"testPattern": "*.test.ts"

// Python
"testPattern": "test_*.py"
```

### "AI matching returns empty results"

**Symptoms:**
```bash
✅ Found 25 unit tests
🤖 Matching tests to scenarios...
⚠️  0 matches found
```

**Solutions:**

1. **Check scenario format:**
```yaml
# ✅ Correct format
POST /api/customers:
  happy_case:
    - When customer is created with valid data, return 201

# ❌ Wrong format (missing colon)
POST /api/customers
  happy_case:
    - When customer is created with valid data, return 201
```

2. **Verify test descriptions are descriptive:**
```java
// ❌ Too generic
@Test
public void test1() { }

// ✅ Descriptive
@Test
@DisplayName("When customer is created with valid data, return 201")
public void testCreateCustomer_WithValidData_Returns201() { }
```

3. **Increase AI temperature slightly:**
```json
{
  "ai": {
    "temperature": 0.5  // More flexible matching
  }
}
```

### "Coverage calculation seems wrong"

**Symptoms:**
```bash
Coverage: 150% (15/10 scenarios)
```

**Solutions:**

1. **Check for duplicate scenarios:**
```yaml
POST /api/customers:
  happy_case:
    - When customer is created with valid data, return 201
    - When customer is created with valid data, return 201  # ❌ Duplicate
```

2. **Verify baseline vs AI file:**
```bash
# System uses baseline file for analysis
cat .traceability/test-cases/baseline/my-service-baseline.yml

# Not the AI-generated file
cat .traceability/test-cases/ai_cases/my-service-ai.yml
```

---

## 📝 Report Generation Issues

### "Report doesn't open automatically"

**Symptoms:**
```bash
✅ Report generated
# But browser doesn't open
```

**Solutions:**

1. **Open manually:**
```bash
open .traceability/reports/my-service-report.html

# On Linux
xdg-open .traceability/reports/my-service-report.html

# On Windows
start .traceability/reports/my-service-report.html
```

2. **Disable auto-open:**
```bash
export AUTO_OPEN_REPORTS=false
```

3. **Check console output for exact path:**
```bash
📝 Generating reports...
✅ HTML: /full/path/to/report.html  # Copy this path
```

### "Report shows 'No data available'"

**Symptoms:**
- Report opens but all sections are empty

**Solutions:**

1. **Check if analysis completed:**
```bash
# Look for error messages in terminal
npm run continue 2>&1 | tee analysis.log
```

2. **Verify JSON report has data:**
```bash
cat .traceability/reports/my-service-report.json
# Should contain scenarios, tests, etc.
```

3. **Check template file:**
```bash
ls -la lib/templates/enhanced-report-v2.html
# Should exist
```

### "Charts not rendering"

**Symptoms:**
- Report opens but charts are missing

**Solutions:**

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for JavaScript errors

2. **Try different browser:**
```bash
# Chrome recommended
open -a "Google Chrome" .traceability/reports/report.html
```

3. **Check if Chart.js loaded:**
   - View page source
   - Search for "chart.js"
   - Should be included in the HTML

---

## ⚡ Performance Issues

### "AI analysis is very slow"

**Symptoms:**
```bash
🤖 Analyzing... (taking 5+ minutes)
```

**Solutions:**

1. **This is normal for first run!**
   - First analysis: 2-5 minutes (generating scenarios)
   - Subsequent runs: 1-2 minutes (matching only)

2. **Reduce complexity:**
```json
{
  "ai": {
    "maxTokens": 1000,  // Lower = faster
    "temperature": 0.0   // Deterministic = faster
  }
}
```

3. **Analyze fewer APIs:**
```yaml
# Comment out APIs in baseline for testing
POST /api/customers:
  happy_case:
    - Test scenario

# GET /api/other:  # Commented out temporarily
#   happy_case:
#     - Other test
```

4. **Use caching (if available):**
```bash
# Results are cached between runs
# Only new/changed APIs are re-analyzed
```

### "High memory usage"

**Symptoms:**
```bash
# System slowing down during analysis
```

**Solutions:**

1. **Increase Node.js memory:**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run continue
```

2. **Analyze services one at a time:**
```json
{
  "services": [
    { "name": "service1", "enabled": true },
    { "name": "service2", "enabled": false }
  ]
}
```

3. **Close other applications:**
   - AI analysis is resource-intensive
   - Close unused programs

---

## 🔄 Integration Issues

### "Pre-commit hook not working"

**Symptoms:**
```bash
git commit -m "test"
# Hook doesn't run
```

**Solutions:**

1. **Check hook is installed:**
```bash
ls -la .git/hooks/pre-commit
# Should exist and be executable
```

2. **Install hook:**
```bash
npm run install:hooks
```

3. **Make executable:**
```bash
chmod +x .git/hooks/pre-commit
chmod +x scripts/pre-commit.sh
```

4. **Test hook manually:**
```bash
.git/hooks/pre-commit
# Should run analysis
```

### "CI/CD pipeline fails"

**Symptoms:**
```bash
npm run continue
exit code: 1
```

**Solutions:**

1. **Check API key in CI:**
```yaml
# GitHub Actions
env:
  CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}

# Jenkins
withEnv(['CLAUDE_API_KEY=...']) {
  sh 'npm run continue'
}
```

2. **Disable auto-open in CI:**
```bash
export AUTO_OPEN_REPORTS=false
```

3. **Use JSON output for parsing:**
```bash
npm run continue
jq '.summary.coveragePercent' .traceability/reports/service-report.json
```

4. **Handle exit codes:**
```bash
# Don't fail build on warnings
npm run continue || echo "Coverage check completed with warnings"
```

### "Git change detection not working"

**Symptoms:**
```bash
⚠️ Warning: Not a git repository
```

**Solutions:**

1. **Initialize git:**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Skip git detection:**
```bash
export SKIP_GIT_DETECTION=true
npm run continue
```

3. **Check git is installed:**
```bash
git --version
# Should show version
```

---

## ❓ Frequently Asked Questions

### Q: How long should AI analysis take?

**A:** 
- **First run:** 2-5 minutes (generates scenarios)
- **Subsequent runs:** 1-2 minutes (just matching)
- **Large projects:** May take longer

This is normal! AI analysis requires API calls.

### Q: Can I use both Claude and OpenAI?

**A:** 
Yes! Switch between them:
```bash
# Use Claude
export AI_PROVIDER="anthropic"
export CLAUDE_API_KEY="sk-ant-..."

# Use OpenAI
export AI_PROVIDER="openai"
export OPENAI_API_KEY="sk-..."
```

### Q: Do I need an API key for every developer?

**A:**
Yes, each developer needs their own API key:
- Get key from console.anthropic.com or platform.openai.com
- Set as environment variable
- Never commit keys to git!

### Q: What if I don't have an API key?

**A:**
The system requires an AI provider to function. You must:
1. Sign up for Anthropic (Claude) or OpenAI
2. Get an API key
3. Add credits to your account

Free tiers are available for testing.

### Q: Can I run without internet?

**A:**
No, the system requires internet for:
- AI API calls (Claude/OpenAI)
- Downloading npm packages

Consider local AI models for offline use (coming soon).

### Q: How much does it cost?

**A:**
Costs depend on usage:
- **Claude:** ~$0.015 per API call
- **OpenAI:** ~$0.02 per API call

Typical project analysis: $0.10-$0.50 per run

### Q: Can I see what's sent to AI?

**A:**
Yes, enable verbose mode:
```bash
export VERBOSE=true
npm run continue
```

This shows all AI prompts and responses.

### Q: What languages are supported?

**A:**
Currently supported:
- ✅ Java (JUnit)
- ✅ TypeScript/JavaScript (Jest)
- ✅ Python (PyTest)
- ✅ Go (go test)

More coming soon!

### Q: Can I customize the reports?

**A:**
Yes, edit the template:
```bash
lib/templates/enhanced-report-v2.html
```

Then rebuild:
```bash
npm run build
npm run continue
```

### Q: How do I update to the latest version?

**A:**
```bash
git pull origin main
npm install
npm run build
```

Check release notes for breaking changes.

### Q: Where are logs stored?

**A:**
Logs are output to:
- **Console:** stdout/stderr
- **Reports:** `.traceability/reports/`
- **History:** `.traceability/history/`

Redirect to file:
```bash
npm run continue 2>&1 | tee analysis.log
```

---

## 🐛 Reporting Bugs

If you've tried everything and still have issues:

### 1. Gather Information

```bash
# System info
node --version
npm --version
git --version

# Package versions
npm list --depth=0

# Configuration
cat .traceability/config.json

# Environment
env | grep -E "(CLAUDE|OPENAI|AI_)"
```

### 2. Create Minimal Reproduction

- Simplify config to one service
- Use minimal baseline YAML
- Document exact steps to reproduce

### 3. Check Documentation

- [Getting Started](GETTING_STARTED.md)
- [Configuration Guide](CONFIGURATION.md)
- [Developer Guide](DEV_GUIDE.md)

### 4. Report Issue

Include:
- Error message (full stack trace)
- System information
- Steps to reproduce
- Expected vs actual behavior

---

## 🔍 Debug Mode

Enable detailed logging:

```bash
# Maximum verbosity
export VERBOSE=true
export DEBUG="*"

# Run analysis
npm run continue

# Save logs
npm run continue 2>&1 | tee debug.log
```

---

## 📚 Related Documentation

- **📖 [Getting Started](GETTING_STARTED.md)** - First-time setup
- **⚙️ [Configuration Guide](CONFIGURATION.md)** - All config options
- **📊 [Reports Guide](REPORTS_GUIDE.md)** - Understanding reports
- **👨‍💻 [Developer Guide](DEV_GUIDE.md)** - For developers

---

**Still stuck?** Check the documentation or report an issue with detailed information.

**Version:** 6.3.0 | **Status:** Production Ready ✅
