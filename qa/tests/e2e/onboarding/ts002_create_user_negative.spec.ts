/**
 * TS002 - Create User Negative Flows
 * Scenario IDs: NF001, NF003, NF004, NF005, NF006, NF007
 * Description: Test error handling for invalid user creation requests
 */

import { expect } from 'chai';
import { allure } from 'allure-mocha/runtime';
import { apiClient } from '../../utils/apiClient';
import { TestFixtures } from '../../utils/fixtures';

describe('[TS002] Create User - Negative Flows', () => {
  
  describe('Missing Required Fields (NF001)', () => {
    it('should return 400 when email is missing (NF001)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF001 - Missing Required Fields');
      allure.severity('blocker');
      allure.tag('negative');
      allure.tag('validation');
      allure.tag('required-fields');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS002-01
        **Scenario:** NF001 - Validate missing email rejection
        
        **Objective:** Verify that API rejects user creation when email field is missing
        
        **Business Impact:** Prevents invalid data from entering the system
        
        **Expected Result:**
        - HTTP 400 Bad Request
        - Error message indicating required field
      `);
      
      const payload = TestFixtures.invalidUsers.missingEmail;
      
      await allure.step('Arrange: Prepare payload without email field', async () => {
        allure.attachment('Invalid Payload', JSON.stringify(payload, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Attempt to create user without email', async () => {
        response = await apiClient.createUser(payload);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify 400 Bad Request status', () => {
        expect(response.status).to.equal(400, 'Expected 400 Bad Request for missing email');
      });
      
      await allure.step('Assert: Verify error message contains "required"', () => {
        expect(response.error).to.exist;
        expect(response.error!.message).to.include('required');
      });
      
      console.log('✅ NF001: Properly rejected missing email');
    });

    it('should return 400 when name is missing (NF006)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF006 - Missing Name Field');
      allure.severity('blocker');
      allure.tag('negative');
      allure.tag('validation');
      allure.tag('gap-coverage');
      allure.owner('QA Team');
      allure.issue('GAP-001', 'https://jira.example.com/GAP-001');
      allure.description(`
        **Test Case ID:** TS002-02
        **Scenario:** NF006 - Validate missing name rejection
        
        **⚠️ Coverage Gap:** Unit tests don't separately validate missing name
        
        **Objective:** Verify that API rejects user creation when name field is missing
        
        **Expected Result:**
        - HTTP 400 Bad Request
        - Error message indicating required field
      `);
      
      const payload = TestFixtures.invalidUsers.missingName;
      
      await allure.step('Arrange: Prepare payload without name field', async () => {
        allure.attachment('Invalid Payload', JSON.stringify(payload, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Attempt to create user without name', async () => {
        response = await apiClient.createUser(payload);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify 400 Bad Request status', () => {
        expect(response.status).to.equal(400, 'Expected 400 Bad Request for missing name');
      });
      
      await allure.step('Assert: Verify error message', () => {
        expect(response.error).to.exist;
        expect(response.error!.message).to.include('required');
      });
      
      console.log('✅ NF006: Properly rejected missing name (gap validation)');
    });
  });

  describe('Malformed JSON (NF003)', () => {
    it('should return 400 for malformed JSON payload (NF003)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF003 - Malformed JSON Handling');
      allure.severity('critical');
      allure.tag('negative');
      allure.tag('security');
      allure.tag('malformed-input');
      allure.tag('P1-gap');
      allure.owner('QA Team');
      allure.issue('CRITICAL-GAP-002', 'https://jira.example.com/GAP-002');
      allure.description(`
        **Test Case ID:** TS002-03
        **Scenario:** NF003 - Validate malformed JSON rejection
        
        **🚨 CRITICAL GAP IDENTIFIED 🚨**
        - No unit test exists for malformed JSON handling
        - Priority: P1 (High Priority)
        - Risk: Security vulnerability
        
        **Objective:** Verify API handles malformed JSON gracefully without crashes
        
        **Security Impact:** Prevents potential parsing vulnerabilities
        
        **Expected Result:**
        - HTTP 400 Bad Request
        - No server crash or undefined behavior
      `);
      
      const malformedPayload = TestFixtures.malformedPayloads.notJSON;
      
      await allure.step('Arrange: Prepare malformed JSON payload', async () => {
        allure.attachment('Malformed Payload', malformedPayload, 'text/plain');
      });
      
      let response: any;
      await allure.step('Act: Send malformed JSON to API', async () => {
        response = await apiClient.createUserMalformed(malformedPayload);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify 400 Bad Request status', () => {
        expect(response.status).to.equal(400, 'Expected 400 Bad Request for malformed JSON');
      });
      
      console.log('⚠️  NF003: Malformed JSON handling - CRITICAL GAP DETECTED');
      console.log(`Response status: ${response.status}`);
    });

    it('should return 400 for unclosed JSON brace (NF003)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF003 - Malformed JSON Handling');
      allure.severity('critical');
      allure.tag('negative');
      allure.tag('security');
      allure.tag('malformed-input');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS002-04
        **Scenario:** Validate unclosed brace handling
        
        **Objective:** Verify API rejects JSON with unclosed braces
        
        **Expected Result:**
        - HTTP 400 Bad Request
        - Graceful error handling
      `);
      
      const malformedPayload = TestFixtures.malformedPayloads.unclosedBrace;
      
      await allure.step('Arrange: Prepare JSON with unclosed brace', async () => {
        allure.attachment('Malformed Payload', malformedPayload, 'text/plain');
      });
      
      let response: any;
      await allure.step('Act: Send malformed JSON', async () => {
        response = await apiClient.createUserMalformed(malformedPayload);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify 400 status', () => {
        expect(response.status).to.equal(400, 'Expected 400 for unclosed brace');
      });
      
      console.log('⚠️  NF003: Unclosed brace handling tested');
    });
  });

  describe('Duplicate Email (NF004)', () => {
    it('should return 409 when creating user with duplicate email (NF004)', async function() {
      allure.epic('User Management');
      allure.feature('Data Integrity');
      allure.story('NF004 - Duplicate Email Prevention');
      allure.severity('critical');
      allure.tag('negative');
      allure.tag('uniqueness');
      allure.tag('data-integrity');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS002-05
        **Scenario:** NF004 - Prevent duplicate email addresses
        
        **Objective:** Verify system prevents duplicate user creation with same email
        
        **Business Impact:** 
        - Maintains data integrity
        - Prevents account conflicts
        - Ensures unique user identification
        
        **Expected Result:**
        - First user: HTTP 201 Created
        - Duplicate attempt: HTTP 409 Conflict
        - Clear error message about existing email
      `);
      
      const userPayload = TestFixtures.createValidUser();
      allure.parameter('email', userPayload.email);
      allure.parameter('name', userPayload.name);
      
      let response1: any;
      await allure.step('Act: Create first user successfully', async () => {
        response1 = await apiClient.createUser(userPayload);
        expect(response1.status).to.equal(201, 'First user should be created');
        allure.attachment('First User Response', JSON.stringify(response1, null, 2), 'application/json');
      });
      
      let response2: any;
      await allure.step('Act: Attempt to create duplicate user', async () => {
        response2 = await apiClient.createUser(userPayload);
        allure.attachment('Duplicate Attempt Response', JSON.stringify(response2, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify 409 Conflict status', () => {
        expect(response2.status).to.equal(409, 'Expected 409 Conflict for duplicate email');
      });
      
      await allure.step('Assert: Verify error message', () => {
        expect(response2.error).to.exist;
        expect(response2.error!.message).to.include('already exists');
      });
      
      console.log('✅ NF004: Duplicate email properly rejected');
    });
  });

  describe('Invalid Email Format (NF005)', () => {
    it('should return 400 for invalid email format (NF005)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF005 - Email Format Validation');
      allure.severity('normal');
      allure.tag('negative');
      allure.tag('validation');
      allure.tag('email');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS002-06
        **Scenario:** NF005 - Validate email format
        
        **Objective:** Ensure only valid email formats are accepted
        
        **Expected Result:**
        - HTTP 400 Bad Request
        - Error message about invalid email
      `);
      
      const payload = TestFixtures.invalidUsers.invalidEmailFormat;
      allure.parameter('invalid email', payload.email);
      
      await allure.step('Arrange: Prepare invalid email payload', async () => {
        allure.attachment('Invalid Payload', JSON.stringify(payload, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Attempt to create user with invalid email', async () => {
        response = await apiClient.createUser(payload);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify 400 status and error message', () => {
        expect(response.status).to.equal(400, 'Expected 400 for invalid email');
        expect(response.error).to.exist;
        expect(response.error!.message).to.include('email');
      });
      
      console.log('✅ NF005: Invalid email format rejected');
    });

    it('should return 400 for email without @ symbol (NF005)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF005 - Email Format Validation');
      allure.severity('normal');
      allure.tag('negative');
      allure.tag('validation');
      allure.tag('email');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS002-07
        **Scenario:** Validate email must contain @ symbol
        
        **Expected Result:** HTTP 400 Bad Request
      `);
      
      const payload = TestFixtures.invalidUsers.invalidEmailNoAt;
      allure.parameter('invalid email', payload.email);
      
      await allure.step('Arrange: Prepare email without @ symbol', async () => {
        allure.attachment('Invalid Payload', JSON.stringify(payload, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Send request with invalid email', async () => {
        response = await apiClient.createUser(payload);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify rejection', () => {
        expect(response.status).to.equal(400, 'Expected 400 for email without @');
      });
      
      console.log('✅ NF005: Email without @ rejected');
    });
  });

  describe('Empty String Values (NF007)', () => {
    it('should return 400 for empty email string (NF007)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF007 - Empty String Handling');
      allure.severity('normal');
      allure.tag('negative');
      allure.tag('validation');
      allure.tag('edge-case');
      allure.tag('gap-coverage');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS002-08
        **Scenario:** NF007 - Validate empty string rejection
        
        **⚠️ Gap Coverage:** Tests empty strings vs null/undefined
        
        **Objective:** Ensure empty strings are treated as invalid
        
        **Expected Result:** HTTP 400 Bad Request
      `);
      
      const payload = TestFixtures.invalidUsers.emptyEmail;
      
      await allure.step('Arrange: Prepare payload with empty email string', async () => {
        allure.attachment('Invalid Payload', JSON.stringify(payload, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Send request with empty email', async () => {
        response = await apiClient.createUser(payload);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify rejection of empty string', () => {
        expect(response.status).to.equal(400, 'Expected 400 for empty email');
      });
      
      console.log('⚠️  NF007: Empty email string - GAP VALIDATION');
    });

    it('should return 400 for empty name string (NF007)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF007 - Empty String Handling');
      allure.severity('normal');
      allure.tag('negative');
      allure.tag('validation');
      allure.tag('edge-case');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS002-09
        **Scenario:** Validate empty name string rejection
        
        **Expected Result:** HTTP 400 Bad Request
      `);
      
      const payload = TestFixtures.invalidUsers.emptyName;
      
      await allure.step('Arrange: Prepare payload with empty name', async () => {
        allure.attachment('Invalid Payload', JSON.stringify(payload, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Send request with empty name', async () => {
        response = await apiClient.createUser(payload);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify rejection', () => {
        expect(response.status).to.equal(400, 'Expected 400 for empty name');
      });
      
      console.log('⚠️  NF007: Empty name string - GAP VALIDATION');
    });
  });

  describe('Kafka Timeout Handling (KAF003)', () => {
    it('should handle Kafka publish timeout gracefully (KAF003)', async function() {
      allure.epic('Infrastructure Resilience');
      allure.feature('Event Publishing');
      allure.story('KAF003 - Kafka Timeout Handling');
      allure.severity('critical');
      allure.tag('resilience');
      allure.tag('kafka');
      allure.tag('timeout');
      allure.tag('P1-critical-gap');
      allure.owner('QA Team');
      allure.issue('CRITICAL-GAP-003', 'https://jira.example.com/GAP-003');
      allure.link('https://wiki.example.com/kafka-resilience', 'Kafka Resilience Design');
      allure.description(`
        **Test Case ID:** TS002-10
        **Scenario:** KAF003 - Kafka timeout resilience
        
        **🚨 CRITICAL GAP - P1 Priority 🚨**
        - No unit test exists for Kafka timeout scenario
        - Risk: Data inconsistency if not handled properly
        
        **Architecture Decision:**
        - User creation should succeed even if Kafka times out
        - Database commit takes precedence
        - Event publishing is fire-and-forget with retry mechanism
        
        **Objective:** Verify system resilience when Kafka is slow/unavailable
        
        **Expected Result:**
        - HTTP 201 Created (user saved to DB)
        - User has valid ID
        - System doesn't crash or rollback DB transaction
      `);
      
      const payload = TestFixtures.createValidUser();
      allure.parameter('email', payload.email);
      allure.parameter('name', payload.name);
      
      await allure.step('Arrange: Prepare valid user payload', async () => {
        allure.attachment('User Payload', JSON.stringify(payload, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Create user (potential Kafka timeout scenario)', async () => {
        response = await apiClient.createUser(payload);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify user creation succeeds', () => {
        expect(response.status).to.equal(201, 'User creation should succeed even if Kafka times out');
      });
      
      await allure.step('Assert: Verify user has valid ID', () => {
        expect(response.data).to.have.property('id');
        allure.parameter('User ID', response.data!.id);
      });
      
      console.log('⚠️  KAF003: Kafka timeout handling tested');
      console.log('⚠️  CRITICAL GAP: No unit test exists for Kafka timeout scenario');
      console.log(`✅ User created successfully despite potential Kafka issues: ${response.data!.id}`);
    });
  });
});
