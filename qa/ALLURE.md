# Allure Reporting Guide

This document explains how to use Allure reporting in the QA automation framework.

## Overview

Allure is now integrated into the test framework alongside the existing Mochawesome HTML reports. Both reporters run simultaneously without breaking any existing functionality.

## What's Included

- **Allure Mocha Reporter**: Automatically generates Allure-compatible test results
- **Allure Command Line**: Tool to generate and serve HTML reports from results
- **Multi-Reporter Support**: Both Mochawesome and Allure reports are generated together

## Generated Reports

When you run tests, three types of reports are generated:

1. **Mochawesome HTML Report**: `reports/html/test-report-{timestamp}.html`
2. **Traceability Matrix**: `reports/html/traceability-matrix-{timestamp}.html`
3. **Allure Report**: `reports/allure-report/index.html`

## Running Tests with Allure

### Standard Test Execution

All existing test commands now automatically generate Allure results:

```bash
# Run all tests (generates all reports including Allure)
npm test

# Run specific test case
npm run test:case TS001

# Run multiple test cases
npm run test:cases TS001,TS002

# Run specific test file
npm run test:file onboarding/ts001_create_user_happy.spec.ts

# Run tests in a folder
npm run test:folder onboarding

# Run all tests
npm run test:all
```

### Allure-Specific Commands

```bash
# Generate Allure HTML report from results
npm run allure:generate

# Open the generated Allure report in browser
npm run allure:open

# Generate and open report in one command
npm run allure:serve

# Clean Allure results and reports
npm run allure:clean
```

## Viewing Allure Reports

### Method 1: After Test Execution

After running any test command, the Allure report is automatically generated:

```bash
npm test
# Then open the report
npm run allure:open
```

### Method 2: Quick Serve

Use the serve command to generate and open the report in one step:

```bash
npm run allure:serve
```

This command will:
1. Generate the report from existing results
2. Start a local web server
3. Automatically open the report in your browser

## Report Structure

### Allure Results Directory
- **Location**: `reports/allure-results/`
- **Content**: Raw JSON files with test execution data
- **Files**: 
  - Test case results (`.json`)
  - Attachments (screenshots, logs)
  - Environment info

### Allure Report Directory
- **Location**: `reports/allure-report/`
- **Content**: Generated HTML report
- **Entry Point**: `index.html`

## Features Available

### Test Organization
- Tests are organized by feature/module
- Test suites from `describe()` blocks
- Individual test cases from `it()` blocks

### Test Details
- Test status (Passed, Failed, Skipped)
- Execution time
- Error messages and stack traces
- Test history and trends

### Additional Features
- **Timeline**: Chronological view of test execution
- **Behaviors**: BDD-style organization
- **Categories**: Failure categorization
- **Graphs**: Visual test statistics
- **History**: Track test results over time

## Adding Allure Annotations (Optional)

You can enhance your tests with Allure-specific metadata:

### Example with Allure Decorators

```typescript
import { allure } from 'allure-mocha/runtime';

describe('User Management', () => {
  it('should create a user', async function() {
    allure.epic('User Management');
    allure.feature('User Creation');
    allure.story('Create user with valid data');
    allure.severity('critical');
    
    // Your test code
    const response = await apiClient.createUser(userData);
    
    // Add step
    allure.step('Verify user was created', () => {
      expect(response.status).to.equal(201);
    });
  });
});
```

### Available Annotations

```typescript
// Categorization
allure.epic('Epic Name');
allure.feature('Feature Name');
allure.story('Story Name');
allure.severity('critical' | 'blocker' | 'normal' | 'minor' | 'trivial');

// Metadata
allure.tag('smoke', 'regression');
allure.owner('Team/Person');
allure.description('Test description');
allure.link('URL', 'Link Name');
allure.issue('JIRA-123');
allure.tms('TC-456');

// Steps
allure.step('Step description', () => {
  // Step code
});

// Attachments
allure.attachment('Screenshot', screenshotBuffer, 'image/png');
allure.attachment('Log', logContent, 'text/plain');
```

## Cleaning Up

### Clean All Artifacts

```bash
# Clean all reports including Allure
npm run clean
```

### Clean Only Allure

```bash
# Clean only Allure results and reports
npm run allure:clean
```

## Integration with Existing Workflow

### No Changes Required
- All existing test commands work as before
- Mochawesome reports continue to generate
- Traceability Matrix still generates
- Allure is added on top without breaking anything

### Unified Test Runner
The `scripts/unified-test-runner.sh` now automatically:
1. Runs tests with both reporters
2. Generates Mochawesome HTML report
3. Generates Traceability Matrix
4. Generates Allure HTML report
5. Displays paths to all reports

## Docker Support

Allure reporting works in Docker environments as well:

```bash
# Run tests in Docker (includes Allure)
npm run docker:all
```

The Allure results will be available in the mounted volume.

## Troubleshooting

### Allure Report Not Generating

If the Allure report doesn't generate:

1. Check if results exist:
   ```bash
   ls -la reports/allure-results/
   ```

2. Manually generate report:
   ```bash
   npm run allure:generate
   ```

3. Check for errors:
   ```bash
   allure generate reports/allure-results --clean -o reports/allure-report
   ```

### Command Not Found

If you get "allure: command not found":

1. Ensure dependencies are installed:
   ```bash
   npm install
   ```

2. Use npx to run:
   ```bash
   npx allure generate reports/allure-results --clean -o reports/allure-report
   ```

### Empty Report

If the report is empty:

1. Ensure tests ran successfully
2. Check if allure-results directory has JSON files
3. Re-run tests to generate fresh results

## Best Practices

1. **Keep Results Clean**: Run `npm run clean` before major test runs
2. **Use Annotations Wisely**: Add epic/feature/story for better organization
3. **Add Screenshots**: Attach screenshots for failed tests
4. **Regular Cleanup**: Allure results accumulate, clean periodically
5. **Version Control**: Add `reports/allure-*` to `.gitignore`

## Report Access

### Local Access
```bash
# Open in default browser
npm run allure:open

# Or manually open
open reports/allure-report/index.html
```

### CI/CD Integration
- Archive `reports/allure-results/` as artifacts
- Publish `reports/allure-report/` for viewing
- Use Allure Jenkins plugin for integration

## Additional Resources

- [Allure Documentation](https://docs.qameta.io/allure/)
- [Allure Mocha Integration](https://github.com/allure-framework/allure-js/tree/master/packages/allure-mocha)
- [Best Practices Guide](https://docs.qameta.io/allure/#_best_practices)

## Summary

Allure reporting is now fully integrated into the framework:

✅ Automatic result generation  
✅ Multiple report formats (Mochawesome + Allure)  
✅ No breaking changes  
✅ Enhanced test visualization  
✅ Historical trends and analytics  
✅ Easy to use commands  

All your existing workflows remain unchanged while gaining powerful Allure reporting capabilities!
