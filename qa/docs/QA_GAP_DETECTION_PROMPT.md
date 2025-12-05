# 🤖 AI-Powered QA Gap Detection Prompt

**Purpose:** This prompt enables AI to analyze developer unit tests against QA business scenarios to automatically detect coverage gaps, missing tests, and orphan tests.

---

## How to Use This Prompt

1. Copy the prompt below
2. Paste into Claude/ChatGPT
3. Provide your project's unit test files
4. Provide your traceability matrix
5. AI will generate comprehensive gap analysis

---

## The Powerful Gap Detection Prompt

```
You are a Senior QA Automation Architect with expertise in test coverage analysis and gap detection.

Your task is to analyze developer unit tests against defined business scenarios to identify coverage gaps that could lead to production defects.

# Context

I will provide you with:
1. A list of business scenarios (from QA traceability matrix)
2. Developer unit test files
3. API specifications/contracts

# Your Analysis Should Include

## 1. Coverage Mapping
For each business scenario, identify:
- Which unit tests cover it (if any)
- Coverage status: Fully Covered / Partially Covered / Not Covered
- Specific gap explanation

## 2. Gap Categories

### Critical Gaps (P0 - Must Fix Immediately)
- **Database Failures**: Timeout, connection failure, transaction rollback
- **Message Queue Failures**: Kafka/RabbitMQ publish failure, connection loss
- **External Service Failures**: API timeout, circuit breaker, fallback logic
- **Data Consistency**: Race conditions, concurrent updates, distributed transactions
- **Security**: Authentication/authorization failures, injection attacks

### High Priority Gaps (P1 - Fix This Sprint)
- **Input Validation**: Malformed data, boundary conditions, special characters
- **Error Handling**: Exception handling, error codes, user-friendly messages
- **Contract Validation**: API request/response format, required fields
- **Business Logic**: Edge cases in business rules

### Medium Priority Gaps (P2 - Fix When Possible)
- **Boundary Conditions**: Min/max values, empty collections, null handling
- **Data Formats**: Date formats, currency, localization
- **Performance**: Large datasets, slow queries, memory usage
- **Logging**: Audit trails, error logging, monitoring events

## 3. Orphan Test Detection
Identify unit tests that:
- Don't map to any business scenario
- Test implementation details rather than behavior
- Are duplicates or redundant
- Should be deleted or mapped to scenarios

## 4. Risk Assessment
For each gap, assess:
- **Risk Level**: High / Medium / Low
- **Business Impact**: Production outage / Data loss / User experience / Minor
- **Likelihood**: How likely is this scenario in production
- **Priority**: P0 / P1 / P2

## 5. AI Test Generation Recommendations
For each critical gap, provide:
- Recommended test description
- Mock setup needed
- Assertion expectations
- Sample test structure (pseudo-code)

# Output Format

Please structure your analysis as follows:

## Executive Summary
- Total scenarios analyzed: X
- Scenarios with full coverage: X (X%)
- Scenarios with partial coverage: X (X%)
- Scenarios with no coverage: X (X%)
- Critical gaps (P0): X
- High priority gaps (P1): X
- Orphan tests found: X

## Detailed Gap Analysis

### Critical Gaps (P0)

#### Gap ID: [Scenario_ID] - [Scenario Name]
- **Description**: [What's missing]
- **Current Coverage**: [None / Partial - explain]
- **Risk Level**: High
- **Business Impact**: [Specific impact]
- **Recommended Action**: [What unit test to add]
- **AI Test Generation**: [Pseudo-code or structure]

### High Priority Gaps (P1)
[Same structure as P0]

### Medium Priority Gaps (P2)
[Same structure as P0]

## Orphan Tests

### Test: [test_name]
- **Location**: [file:line]
- **Reason**: [Why it's orphan]
- **Recommendation**: [Delete / Map to scenario / Refactor]

## Recommendations for Developers

1. [Priority 1 action]
2. [Priority 2 action]
3. [etc]

## Traceability Matrix Update

Provide an updated traceability matrix showing:
- New test IDs for gaps
- Updated coverage status
- Risk levels

# Example Analysis

Here's an example of the kind of analysis I expect:

## Critical Gap Example

#### Gap ID: KAF001 - Kafka Publish Failure Post-DB Commit

**Description**: No unit test verifies service behavior when Kafka publish fails after user is successfully saved to database.

**Current Coverage**: Not Covered

**Risk Level**: High

**Business Impact**: 
- User created in DB but event not published
- Downstream services miss critical onboarding event
- Data inconsistency across microservices
- Potential revenue loss if billing systems don't receive event

**Recommended Action**: 
Add unit test that:
1. Mocks successful DB save
2. Mocks Kafka producer throwing exception
3. Verifies user creation still returns 201
4. Verifies error is logged
5. Verifies retry mechanism or dead-letter queue is used

**AI Test Generation**:
```typescript
describe('UserService - Kafka Failure Handling', () => {
  it('should handle Kafka publish failure gracefully', async () => {
    // Arrange
    const mockRepo = {
      create: jest.fn().resolveValue(mockUser)
    };
    const mockKafka = {
      publish: jest.fn().rejectValue(new Error('Kafka unavailable'))
    };
    
    // Act
    const result = await userService.createUser(payload);
    
    // Assert
    expect(result.id).toBeDefined(); // User still created
    expect(mockKafka.publish).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Kafka publish failed')
    );
  });
});
```

# Now Provide Your Analysis

Please analyze the following:

## Business Scenarios
[PASTE YOUR TRACEABILITY MATRIX HERE]

## Developer Unit Tests
[PASTE YOUR UNIT TEST FILES HERE]

## API Contracts
[PASTE YOUR API SPECIFICATIONS HERE]

Begin your comprehensive gap analysis now.
```

---

## Example Usage

### Step 1: Gather Inputs

**Business Scenarios** (from `qa/matrix/TRACEABILITY_MATRIX.md`):
```
HF001 - Create user with valid payload
NF003 - Malformed JSON payload (400)
DB001 - DB timeout during user creation
KAF001 - Kafka publish failure post-DB commit
```

**Unit Test Files**:
```typescript
// Paste test/unit/**/*.test.ts files
```

**API Contract**:
```
POST /api/user
Body: { email: string, name: string }
Response: 201 Created | 400 Bad Request | 409 Conflict | 500 Server Error
```

### Step 2: Run AI Analysis

Paste the prompt + inputs into Claude/ChatGPT

### Step 3: Review Output

AI will generate:
- ✅ Coverage mapping
- 🚨 Critical gaps with P0 priority
- ⚠️ High/medium priority gaps
- ❓ Orphan tests to remove
- 🤖 AI-generated test code for gaps
- 📊 Updated traceability matrix

### Step 4: Take Action

1. Create JIRA tickets for P0/P1 gaps
2. Use AI-generated code as starting point
3. Update traceability matrix
4. Track gap reduction over sprints

---

## Advanced Usage

### For Continuous Gap Detection

Add this to your CI/CD pipeline:

```yaml
# .github/workflows/gap-detection.yml
name: QA Gap Detection

on: [pull_request]

jobs:
  detect-gaps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run Gap Detection
        run: |
          # Export unit tests and scenarios
          # Run AI gap detection
          # Post results as PR comment
          
      - name: Block PR if Critical Gaps
        if: critical_gaps > 0
        run: exit 1
```

### For Sprint Planning

```bash
# Generate gap report for sprint planning
./qa/scripts/generate-gap-report.sh

# Output:
# - gaps-report-2025-12-04.md
# - Includes all P0/P1 gaps
# - Estimated effort for each
# - Dependencies and blockers
```

---

## Benefits of AI Gap Detection

### For QA Team
✅ Automated gap identification  
✅ Reduced manual matrix maintenance  
✅ Consistent gap categorization  
✅ AI-suggested test generation  

### For Developers
✅ Clear guidance on what tests to write  
✅ Ready-to-use test templates  
✅ Prioritized backlog of test debt  
✅ Reduced back-and-forth with QA  

### For Management
✅ Quantifiable test coverage metrics  
✅ Risk-based prioritization  
✅ Sprint planning visibility  
✅ Trend tracking over time  

### For Product
✅ Production risk assessment  
✅ Release confidence scoring  
✅ Data-driven go/no-go decisions  
✅ Customer impact analysis  

---

## Real-World Examples

### Example 1: Critical Gap Detected

**Scenario**: Payment processing service  
**Gap Found**: No unit test for payment gateway timeout  
**AI Recommended**: Mock gateway timeout, verify retry logic  
**Result**: Bug found in production simulation - retry was missing!  
**Impact**: Prevented production payment failures  

### Example 2: Orphan Test Cleaned

**Test Found**: `test_date_formatter_utility`  
**Analysis**: No business scenario uses this utility  
**Action**: Utility removed, simplified codebase  
**Savings**: Reduced test execution time by 2%  

### Example 3: Partial Coverage Improved

**Scenario**: User email validation  
**Gap**: Only tested invalid format, not empty strings  
**AI Generated**: Test for empty, whitespace, null  
**Result**: Found bug - empty email accepted!  
**Fix**: Added validation before service call  

---

## Tips for Best Results

### 1. Keep Matrix Updated
- Update after every sprint
- Document new scenarios immediately
- Archive obsolete scenarios

### 2. Provide Context
- Include API docs with prompt
- Add business rules documentation
- Share recent production incidents

### 3. Review AI Output
- Don't blindly trust AI
- Validate recommendations with team
- Adapt generated code to your style

### 4. Track Metrics
- Coverage % over time
- Gap reduction velocity
- Time saved vs manual analysis

### 5. Iterate Process
- Refine prompt based on results
- Add project-specific examples
- Build prompt library

---

## Integration with Tools

### JIRA
```python
# Auto-create JIRA tickets for gaps
for gap in critical_gaps:
    jira.create_issue(
        project="TEST",
        summary=f"[P0 GAP] {gap.scenario_id}",
        description=gap.ai_recommendation,
        priority="Critical"
    )
```

### Slack
```python
# Post gap summary to Slack
slack.post_message(
    channel="#qa-alerts",
    text=f"⚠️ {len(critical_gaps)} P0 gaps detected in PR #123"
)
```

### GitHub
```python
# Comment on PR with gap analysis
github.create_comment(
    pr=123,
    body=format_gap_report(gaps)
)
```

---

## Success Metrics

Track these KPIs to measure ROI:

📊 **Coverage Metrics**
- Overall coverage %
- Critical gap count
- Time to fix gaps

⚡ **Efficiency Metrics**
- Time saved vs manual analysis
- Gaps detected per sprint
- False positive rate

🎯 **Quality Metrics**
- Production defects prevented
- Test-detected vs prod-detected bugs
- Customer-impacting incidents

💰 **Business Metrics**
- Cost of gaps (if reached prod)
- Developer time saved
- QA team productivity

---

## Conclusion

This AI-powered gap detection approach transforms QA from a reactive bottleneck into a proactive quality enabler. By automatically identifying gaps, generating tests, and prioritizing fixes, teams can:

✅ Ship with confidence  
✅ Reduce production incidents  
✅ Accelerate development  
✅ Improve test ROI  

**Start using this prompt today to revolutionize your QA process!**

---

**Version:** 1.0.0  
**Last Updated:** December 4, 2025  
**Maintained By:** QA Automation Team
