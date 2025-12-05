# 🤖 Automated Traceability Matrix (TM) System

## Overview

This directory contains the **Automated Traceability Matrix Generation System** that dynamically creates TM reports by parsing unit tests and mapping them to business scenarios.

## Key Philosophy

❌ **NO Manual TM Creation**  
✅ **Automatic Generation** triggered by QA test execution  
✅ **Real-time Gap Detection** without human intervention  
✅ **Audit-ready Reports** with statistics and priorities

---

## Files in This Directory

### Core Components

1. **`parse-unit-tests.ts`**
   - Scans `test/unit/**/*.test.ts` files
   - Extracts test descriptions and metadata
   - Returns structured test information

2. **`scenario-definitions.ts`**
   - Defines all business scenarios (Happy, Negative, Edge, DB, Kafka)
   - Includes regex patterns for matching unit tests
   - Sets expected coverage, risk, and priority levels

3. **`scenario-mapper.ts`**
   - Maps scenarios to unit tests using pattern matching
   - Determines coverage status (Fully/Partially/Not Covered)
   - Calculates statistics and identifies gaps

4. **`generate-matrix.ts`** ⭐ Main Script
   - Orchestrates the entire TM generation process
   - Generates `TRACEABILITY_MATRIX.md`
   - Outputs coverage statistics and gap analysis

### Generated Files

- **`TRACEABILITY_MATRIX.md`** - Auto-generated TM report (recreated each run)
- **`TRACEABILITY_MATRIX_MANUAL_BACKUP.md`** - Backup of old manual version (for reference)

---

## How It Works

### Workflow

```
1. QA writes E2E test scenarios
         ↓
2. Run: npm run test:with-matrix
         ↓
3. E2E tests execute
         ↓
4. TM generator automatically:
   - Parses unit tests from test/unit/
   - Matches scenarios to unit tests
   - Detects coverage gaps
   - Calculates statistics
   - Generates TRACEABILITY_MATRIX.md
         ↓
5. Review generated TM report
```

### Generation Process

```typescript
// Step 1: Parse Unit Tests
const unitTests = await parser.parseAllTests();
// Extracts: 36 unit tests from 4 files

// Step 2: Map Scenarios
const mappings = mapper.mapScenarios(SCENARIOS, unitTests);
// Maps: 18 scenarios → unit tests

// Step 3: Calculate Coverage
const stats = mapper.calculateStatistics(mappings);
// Output: 33% fully covered, 17% partial, 50% gaps

// Step 4: Identify Gaps
const criticalGaps = mapper.getCriticalGaps(mappings);
// Finds: 4 P0, 2 P1, 3 P2 gaps

// Step 5: Generate Report
generateMarkdown(...) → TRACEABILITY_MATRIX.md
```

---

## Usage

### Manual Generation

```bash
# From qa/ directory
npm run generate:matrix

# Or directly
cd qa/matrix
ts-node generate-matrix.ts
```

### Integrated with Tests

```bash
# From qa/ directory
npm run test:with-matrix

# Or use the full test script
./scripts/run-tests.sh
```

### Output

```
🎯 Traceability Matrix Generator
=================================

📖 Step 1: Parsing unit tests...
   Found 36 unit tests

🔍 Step 2: Mapping scenarios to unit tests...
   Mapped 18 scenarios

📊 Step 3: Calculating coverage statistics...
   Coverage: 33% (6/18)

   P0 Critical Gaps: 4
   P1 High Priority Gaps: 2
   Total Gaps: 9

📝 Step 4: Generating Traceability Matrix (Markdown)...
   ✅ Saved to: qa/matrix/TRACEABILITY_MATRIX.md

✅ Traceability Matrix generated successfully!
```

---

## Adding New Scenarios

To add new business scenarios:

1. **Edit `scenario-definitions.ts`**:

```typescript
{
  id: 'NF008',
  description: 'Your new scenario description',
  category: 'Negative',
  apiEndpoint: 'POST /api/user',
  unitTestPatterns: [
    'pattern.*to.*match',
    'another.*pattern'
  ],
  expectedCoverage: 'full', // or 'partial' or 'none'
  riskLevel: 'Medium',
  priority: 'P2',
  businessImpact: 'What happens if this fails'
}
```

2. **Re-run TM generation**:

```bash
npm run generate:matrix
```

The new scenario will automatically be:
- Mapped to existing unit tests
- Marked as gap if no coverage
- Included in statistics
- Shown in the generated TM

---

## Pattern Matching

Unit tests are matched using regex patterns:

### Example Patterns

```typescript
// Match create user tests
'should create.*user.*success'
'create.*user.*valid'

// Match error handling tests  
'should throw.*error'
'should return.*404'

// Match Kafka tests
'kafka.*fail'
'publish.*error'
```

### Pattern Matching Tips

- Use `.*` for flexible matching
- Case insensitive by default
- Match key words from test description
- Multiple patterns increase match chances
- Test patterns against actual test descriptions

---

## Coverage Status Logic

### Fully Covered ✅
- Expected coverage = 'full' AND matched tests ≥ 1
- Expected coverage = 'partial' AND matched tests ≥ 2

### Partially Covered ⚠️
- Expected coverage = 'partial' AND matched tests = 1

### Not Covered ❌
- Expected coverage = any AND matched tests = 0
- Expected coverage = 'none' AND matched tests = 0

---

## Gap Detection

### Automatic Gap Identification

The system automatically identifies:

1. **Coverage Gaps** - Scenarios without unit tests
2. **Priority Levels** - P0/P1/P2 classification
3. **Risk Assessment** - High/Medium/Low impact
4. **Gap Explanations** - Specific reason for each gap

### Gap Categories

**P0 - Critical (Must Fix Immediately)**
- DB timeout handling
- DB connection failure
- Kafka publish failure
- Kafka unavailability

**P1 - High Priority (Fix in Next Sprint)**
- Malformed JSON handling
- Kafka timeout

**P2 - Medium Priority (Fix When Possible)**
- Missing field validations
- Boundary conditions
- Special character handling

---

## Statistics Generated

The TM includes:

### Overall Metrics
- Total scenarios
- Fully covered count & percentage
- Partially covered count & percentage
- Not covered count & percentage

### By Category
- Happy flows
- Negative flows
- Edge cases
- DB failures
- Kafka failures

### By Priority
- P0 (Critical)
- P1 (High)
- P2 (Medium)

### By Risk Level
- High risk gaps
- Medium risk gaps
- Low risk gaps

---

## Integration with CI/CD

### Future Integration

```yaml
# .github/workflows/qa.yml
- name: Run QA Tests
  run: cd qa && npm run test:with-matrix

- name: Check Critical Gaps
  run: |
    CRITICAL_GAPS=$(grep -c "P0" qa/matrix/TRACEABILITY_MATRIX.md)
    if [ $CRITICAL_GAPS -gt 0 ]; then
      echo "❌ Found $CRITICAL_GAPS critical gaps!"
      exit 1
    fi

- name: Upload TM Artifact
  uses: actions/upload-artifact@v3
  with:
    name: traceability-matrix
    path: qa/matrix/TRACEABILITY_MATRIX.md
```

---

## Troubleshooting

### "Cannot find module" error

```bash
# Install dependencies
cd qa
npm install
```

### "Permission denied" error

```bash
# Make script executable
chmod +x matrix/generate-matrix.ts
```

### No unit tests found

```bash
# Check if test files exist
ls -la ../../test/unit/**/*.test.ts

# Verify path in parse-unit-tests.ts
# Default: '../..' relative to qa/matrix/
```

### Scenarios not matching

1. Check regex patterns in `scenario-definitions.ts`
2. Compare with actual test descriptions
3. Use simpler patterns (e.g., 'create.*user')
4. Test pattern with: `grep -r "pattern" ../../test/unit/`

---

## Benefits

### For QA Team
✅ No manual TM maintenance  
✅ Real-time gap visibility  
✅ Automated coverage tracking  
✅ Audit-ready documentation

### For Developers
✅ Clear list of missing tests  
✅ Prioritized backlog (P0/P1/P2)  
✅ Pattern-based test writing guidance  
✅ Instant feedback on coverage

### For Management
✅ Sprint planning with gap metrics  
✅ Risk-based release decisions  
✅ Coverage trend tracking  
✅ Stakeholder reporting

---

## Maintenance

### When to Update

1. **New API endpoints** - Add scenarios to `scenario-definitions.ts`
2. **New test patterns** - Update regex patterns for better matching
3. **Priority changes** - Adjust P0/P1/P2 classifications
4. **Risk reassessment** - Update risk levels based on production data

### Maintenance Tasks

- Review unmatched scenarios monthly
- Refine patterns based on false negatives
- Update gap explanations for clarity
- Add new categories as system grows

---

## Version History

**v1.0.0** - December 4, 2025
- Initial automated TM system
- 18 scenario definitions
- 4 core components
- Integrated with test execution

---

## Support

**Questions?** Review:
- This README
- `qa/docs/README.md`
- Generated `TRACEABILITY_MATRIX.md`

**Issues?** Check:
- npm dependencies installed
- TypeScript compilation working
- File paths correct
- Regex patterns accurate

---

**Status:** ✅ Production Ready - Automated TM Generation Active
