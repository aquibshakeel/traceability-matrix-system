# 🎯 Understanding Service & Path Selection

## Question 1: How Does the System Pick Which Service & Baseline?

### **Answer: It Comes from 3 Places (in order of priority)**

---

## 🔍 **WHERE DOES THE SERVICE NAME COME FROM?**

### **Option 1: Manual Command Line** (HIGHEST PRIORITY)
```bash
# You explicitly tell the system which service
npm run continue identity-service
# OR
node bin/ai-continue identity-service
```

**What happens:**
```javascript
// bin/ai-continue line 45
const targetServiceName = process.argv[2];  // Gets "identity-service"

if (targetServiceName) {
  // MANUAL MODE: Only analyze the specified service
  servicesToAnalyze = services.filter(s => s.name === targetServiceName);
}
```

✅ **This is what you're using** - You run `npm run continue identity-service`, so it ONLY looks at identity-service.

---

### **Option 2: Git Changes Detection** (Pre-commit mode)
```bash
# No service specified - system auto-detects from Git
npm run continue
# OR during git commit (pre-commit hook)
```

**What happens:**
```javascript
// bin/ai-continue line 52-59
else {
  // PRE-COMMIT MODE: Analyze services with code changes
  const gitChanges = await gitDetector.detectChanges(servicePaths);
  
  if (gitChanges.affectedServices.length > 0) {
    // Only analyze services that changed
    servicesToAnalyze = services.filter(s => 
      gitChanges.affectedServices.includes(s.name)
    );
  }
}
```

✅ If you commit changes to `identity-service/src/main/java/IdentityController.java`, the system auto-detects and analyzes `identity-service`.

---

### **Option 3: Configuration File**
```json
// .traceability/config.json
{
  "services": [
    {
      "name": "identity-service",
      "enabled": true,
      "path": "services/identity-service"
    },
    {
      "name": "customer-service", 
      "enabled": true,
      "path": "services/customer-service"
    }
  ]
}
```

✅ This defines which services EXIST in the system. If `enabled: false`, the service is skipped entirely.

---

## 🗂️ **HOW DOES IT PICK THE PATH FOR THAT SERVICE?**

Once the system knows the service name (e.g., "identity-service"), PathResolver uses the **4-Tier Fallback**:

### **Tier 0: Per-Service Environment Variable (HIGHEST PRIORITY)**

**Your .env:**
```bash
IDENTITY_SERVICE_PATH=/Users/aquibshakeel/Desktop/pulse-services/identity-service
IDENTITY_SERVICE_BASELINE=/Users/aquibshakeel/Desktop/qa-test-scenario/baseline/identity-service-baseline.yml
```

**PathResolver code:**
```javascript
// lib/utils/PathResolver.ts line 49-55
resolveServicePath('identity-service') {
  // Step 1: Check for IDENTITY_SERVICE_PATH
  const perServiceEnvKey = "IDENTITY_SERVICE_PATH";
  const perServicePath = process.env.IDENTITY_SERVICE_PATH;
  
  if (perServicePath && fs.existsSync(perServicePath)) {
    return perServicePath;  // ✅ FOUND! Return immediately
  }
  
  // Steps 2-4 never execute because Tier 0 succeeded
}
```

✅ **This is what happens for YOU:**
- System sees: `process.env.IDENTITY_SERVICE_PATH` exists
- Returns: `/Users/aquibshakeel/Desktop/pulse-services/identity-service`
- **STOPS CHECKING** - Tiers 1-3 are skipped

---

### **Tier 1: Shared Environment Variable (Fallback)**

**Your .env:**
```bash
SERVICE_PATH=/Users/aquibshakeel/Desktop/pulse-services
TEST_SCENARIO_PATH=/Users/aquibshakeel/Desktop/qa-test-scenario/baseline
```

**When is this used?**
- If `IDENTITY_SERVICE_PATH` does NOT exist
- System checks: `$SERVICE_PATH/identity-service`

**Example:**
```bash
# If you DON'T have per-service vars
# .env
SERVICE_PATH=/Users/you/pulse-services
# System will check: /Users/you/pulse-services/identity-service
```

---

### **Tier 2-3: Config File & Defaults**
Only used if BOTH Tier 0 and Tier 1 fail.

---

## 📊 **COMPLETE EXAMPLE: identity-service**

### **Step-by-Step Walkthrough**

**Command:**
```bash
npm run continue identity-service
```

**Step 1: Get Service Name**
```javascript
const serviceName = process.argv[2];  // "identity-service"
```

**Step 2: Resolve Service Path**
```javascript
PathResolver.resolveServicePath('identity-service');

// Checks Tier 0
const envKey = "IDENTITY_SERVICE_PATH";
const path = process.env.IDENTITY_SERVICE_PATH;
// ✅ Found: /Users/aquibshakeel/Desktop/pulse-services/identity-service

// Returns immediately, skips Tier 1-3
return "/Users/aquibshakeel/Desktop/pulse-services/identity-service";
```

**Step 3: Scan That Service**
```javascript
// Scans: /Users/aquibshakeel/Desktop/pulse-services/identity-service/
//        src/main/java/**/*.java
//        src/test/java/**/*Test.java
```

**Step 4: Resolve Baseline Path**
```javascript
PathResolver.resolveBaselinePath('identity-service');

// Checks Tier 0
const baselineKey = "IDENTITY_SERVICE_BASELINE";
const baselinePath = process.env.IDENTITY_SERVICE_BASELINE;
// ✅ Found: /Users/aquibshakeel/Desktop/qa-test-scenario/baseline/identity-service-baseline.yml

// Returns immediately
return "/Users/aquibshakeel/Desktop/qa-test-scenario/baseline/identity-service-baseline.yml";
```

**Step 5: Load Baseline**
```javascript
// Reads: /Users/aquibshakeel/Desktop/qa-test-scenario/baseline/identity-service-baseline.yml
// Parses YAML scenarios
```

---

## 🎯 **WHEN WOULD TIER 1 (Shared Paths) BE USED?**

### **Scenario: New service added, no per-service env var**

**Your .env:**
```bash
# No PAYMENT_SERVICE_PATH variable
# Only shared paths
SERVICE_PATH=/Users/aquibshakeel/Desktop/pulse-services
TEST_SCENARIO_PATH=/Users/aquibshakeel/Desktop/qa-test-scenario/baseline
```

**Command:**
```bash
npm run continue payment-service
```

**What happens:**
```javascript
PathResolver.resolveServicePath('payment-service');

// Tier 0: Check PAYMENT_SERVICE_PATH
const path = process.env.PAYMENT_SERVICE_PATH;
// ❌ Not found (undefined)

// Tier 1: Check SERVICE_PATH + service name
const sharedPath = process.env.SERVICE_PATH;  // /Users/.../pulse-services
const servicePath = path.join(sharedPath, 'payment-service');
// = /Users/aquibshakeel/Desktop/pulse-services/payment-service
// ✅ Exists! Return this

return "/Users/aquibshakeel/Desktop/pulse-services/payment-service";
```

---

## 📝 **SUMMARY**

### **How Service Name is Determined:**
1. **Manual:** You specify in command → `npm run continue identity-service`
2. **Git Detection:** Pre-commit hook detects changed services
3. **Config:** List of enabled services in `.traceability/config.json`

### **How Paths are Resolved (Per Service):**
```
Service Name: "identity-service"

Path Resolution:
  Tier 0: $IDENTITY_SERVICE_PATH → ✅ /Users/.../pulse-services/identity-service
  Tier 1: $SERVICE_PATH/identity-service → (skipped, Tier 0 found)
  Tier 2: Config override → (skipped)
  Tier 3: Default ./services/ → (skipped)

Baseline Resolution:
  Tier 0: $IDENTITY_SERVICE_BASELINE → ✅ /Users/.../qa-test-scenario/.../identity-service-baseline.yml
  Tier 1: $TEST_SCENARIO_PATH/identity-service-baseline.yml → (skipped)
  Tier 2: Config override → (skipped)
  Tier 3: Default .traceability/test-cases/baseline/ → (skipped)
```

### **Key Point:**
- **Per-service env vars** (Tier 0) give you **complete control per service**
- **Shared env vars** (Tier 1) are **fallbacks** when per-service vars don't exist
- System **stops at first match** - doesn't check lower tiers

---

# Question 2: Why is .traceability/ai_cases Empty?

## **Answer: You Need to Run `npm run generate` First**

### **Two Separate Commands, Two Separate Purposes:**

#### **Command 1: `npm run generate`** (Generate AI Scenarios)
```bash
npm run generate
# OR
node bin/ai-generate identity-service
```

**What it does:**
1. Scans APIs from service code
2. Sends to Claude AI: "Generate test scenarios for these APIs"
3. **Saves AI suggestions to:** `.traceability/ai_cases/identity-service-ai.yml`

**This is the ONLY command that creates files in ai_cases/**

---

#### **Command 2: `npm run continue`** (Analyze Coverage)
```bash
npm run continue identity-service
```

**What it does:**
1. Loads baseline scenarios (from external QA repo)
2. Parses unit tests (from external service repo)
3. Sends to Claude AI: "Match scenarios to tests"
4. **Saves reports to:** `.traceability/reports/`

**This does NOT create ai_cases files**

---

### **Why is ai_cases Empty?**

Because you haven't run `npm run generate` yet!

**The Workflow Should Be:**

```bash
# STEP 1: Generate AI suggestions (optional, but creates ai_cases files)
npm run generate identity-service

# STEP 2: Review AI suggestions in:
ls -la .traceability/ai_cases/identity-service-ai.yml

# STEP 3: QA copies good suggestions to baseline
# Edit: /Users/you/qa-test-scenario/baseline/identity-service-baseline.yml

# STEP 4: Analyze coverage (this is what you've been doing)
npm run continue identity-service
```

---

### **Proof: Let's Generate AI Cases**

```bash
cd /Users/aquibshakeel/Desktop/traceability-matrix-system

# Generate AI scenarios
npm run generate identity-service

# Check the result
ls -la .traceability/ai_cases/
cat .traceability/ai_cases/identity-service-ai.yml
```

**Expected Output:**
```yaml
service: identity-service
generated_at: "2025-12-18T16:40:00.000Z"

POST /v1/identity/register:
  happy_case:
    - 🆕 When user registers with valid email and password, return 201
    - 🆕 When user registers with all optional fields, save all data
  error_case:
    - 🆕 When user registers with existing email, return 409
    - 🆕 When user registers with invalid email format, return 400
  # ... more AI suggestions
```

**Legend:**
- 🆕 = New suggestion (not yet in baseline)
- ✅ = Already in baseline (no action needed)

---

## 🔄 **COMPLETE WORKFLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Generate AI Scenarios (npm run generate)          │
│  ↓                                                           │
│  - Scans: /Users/.../pulse-services/identity-service/      │
│  - Finds: POST /register, POST /login, POST /verify-otp    │
│  - AI generates 30 test scenarios                          │
│  - Saves to: .traceability/ai_cases/identity-service-ai.yml│
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: QA Reviews & Adds to Baseline (Manual)            │
│  ↓                                                           │
│  - QA opens: identity-service-ai.yml                        │
│  - Reviews: 30 AI suggestions                               │
│  - Copies: 15 good ones to baseline                         │
│  - Edits: /qa-test-scenario/baseline/identity-...-baseline.yml│
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Analyze Coverage (npm run continue)               │
│  ↓                                                           │
│  - Loads: Baseline (15 scenarios from QA repo)              │
│  - Parses: Unit tests (8 tests from service repo)          │
│  - AI matches: Scenarios → Tests                            │
│  - Generates: Reports in .traceability/reports/            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ **Action Items for You**

### **To Populate ai_cases:**
```bash
# 1. Generate AI scenarios
npm run generate identity-service

# 2. Check the generated file
cat .traceability/ai_cases/identity-service-ai.yml

# 3. Review AI suggestions (look for 🆕 markers)

# 4. (Optional) Add good suggestions to baseline
```

### **Your Current State:**
- ✅ `.env` configured correctly
- ✅ `npm run continue` works and finds files
- ❌ `ai_cases/` empty because `npm run generate` not run yet

### **Expected After Running Generate:**
```
.traceability/
├── ai_cases/
│   └── identity-service-ai.yml         ← NEW FILE (AI suggestions)
├── reports/
│   └── identity-service-report.html    ← Already exists
└── history/
    └── identity-service-*.json         ← Already exists
```

---

## 🎯 **Key Takeaways**

1. **Service selection:** Comes from command line argument, Git changes, or config
2. **Path resolution:** Uses 4-tier fallback (your per-service env vars are Tier 0 - highest priority)
3. **ai_cases empty:** Because `npm run generate` hasn't been run yet
4. **Two commands:** `generate` (creates ai_cases) vs `continue` (analyzes coverage)

**Status:** All working as designed! Just need to run `npm run generate` to populate ai_cases.
