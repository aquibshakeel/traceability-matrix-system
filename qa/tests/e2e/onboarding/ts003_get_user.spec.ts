/**
 * TS003 - Get User Tests
 * Scenario IDs: HF002, NF002
 * Description: Test user retrieval by ID
 */

import { expect } from 'chai';
import { allure } from 'allure-mocha/runtime';
import { apiClient } from '../../utils/apiClient';
import { TestFixtures } from '../../utils/fixtures';

describe('[TS003] Get User Tests', () => {
  
  describe('Get User Happy Path (HF002)', () => {
    it('should retrieve a user with valid ID and return 200 (HF002)', async function() {
      allure.epic('User Management');
      allure.feature('User Retrieval');
      allure.story('HF002 - Get User by Valid ID');
      allure.severity('critical');
      allure.tag('smoke');
      allure.tag('happy-path');
      allure.tag('retrieval');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS003-01
        **Scenario:** HF002 - Retrieve user with valid ID
        
        **Objective:** Verify that an existing user can be successfully retrieved by their ID
        
        **Prerequisites:**
        - Onboarding service is running
        - MongoDB is accessible
        - User exists in the database
        
        **Expected Result:**
        - HTTP 200 OK status
        - User object returned with all fields
        - Data matches created user
      `);
      
      const userPayload = TestFixtures.createValidUser();
      let createResponse: any;
      let userId: string = '';
      
      await allure.step('Arrange: Create a test user first', async () => {
        createResponse = await apiClient.createUser(userPayload);
        expect(createResponse.status).to.equal(201);
        userId = createResponse.data!.id;
        allure.parameter('User ID', userId);
        allure.parameter('Email', userPayload.email);
        allure.attachment('Created User', JSON.stringify(createResponse.data, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Retrieve user by ID', async () => {
        response = await apiClient.getUserById(userId);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify HTTP 200 OK status', () => {
        expect(response.status).to.equal(200, 'Expected 200 OK');
      });
      
      await allure.step('Assert: Verify user data is returned', () => {
        expect(response.data).to.exist;
        expect(response.data!.id).to.equal(userId);
      });
      
      await allure.step('Assert: Verify user data matches created user', () => {
        expect(response.data!.email).to.equal(userPayload.email);
        expect(response.data!.name).to.equal(userPayload.name);
        expect(response.data!.createdAt).to.be.a('string');
        expect(response.data!.updatedAt).to.be.a('string');
      });
      
      console.log(`✅ HF002: User retrieved successfully with ID: ${userId}`);
    });
  });

  describe('Get User with Invalid ID (NF002)', () => {
    it('should return 404 for non-existent user ID (NF002)', async function() {
      allure.epic('User Management');
      allure.feature('Error Handling');
      allure.story('NF002 - Invalid User ID Handling');
      allure.severity('normal');
      allure.tag('negative');
      allure.tag('error-handling');
      allure.tag('not-found');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS003-02
        **Scenario:** NF002 - Handle non-existent user ID
        
        **Objective:** Verify that API returns 404 when user ID doesn't exist
        
        **Expected Result:**
        - HTTP 404 Not Found
        - Error message indicating user not found
      `);
      
      const fakeId = '507f1f77bcf86cd799439011';
      allure.parameter('Fake User ID', fakeId);
      
      await allure.step('Arrange: Prepare non-existent but valid format user ID', async () => {
        allure.attachment('Request Parameters', JSON.stringify({ userId: fakeId }, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Attempt to retrieve non-existent user', async () => {
        response = await apiClient.getUserById(fakeId);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify 404 Not Found status', () => {
        expect(response.status).to.equal(404, 'Expected 404 Not Found');
      });
      
      await allure.step('Assert: Verify error message', () => {
        expect(response.error).to.exist;
        expect(response.error!.message).to.include('not found');
      });
      
      console.log('✅ NF002: Non-existent ID properly returned 404');
    });

    it('should return 400 for invalid ID format (NF002)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF002 - Invalid ID Format Handling');
      allure.severity('normal');
      allure.tag('negative');
      allure.tag('validation');
      allure.tag('id-format');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS003-03
        **Scenario:** NF002 - Handle invalid ID format
        
        **Objective:** Verify API handles malformed user IDs gracefully
        
        **Expected Result:**
        - HTTP 400 Bad Request or 404 Not Found
        - Graceful error handling
      `);
      
      const invalidId = 'not-a-valid-id';
      allure.parameter('Invalid ID', invalidId);
      
      await allure.step('Arrange: Prepare invalid ID format', async () => {
        allure.attachment('Request Parameters', JSON.stringify({ userId: invalidId }, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Attempt to retrieve with invalid ID', async () => {
        response = await apiClient.getUserById(invalidId);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify error response (400 or 404)', () => {
        expect(response.status).to.be.oneOf([400, 404]);
      });
      
      console.log(`✅ NF002: Invalid ID format handled with status ${response.status}`);
    });

    it('should return 400 for empty ID (NF002)', async function() {
      allure.epic('User Management');
      allure.feature('Input Validation');
      allure.story('NF002 - Empty ID Handling');
      allure.severity('normal');
      allure.tag('negative');
      allure.tag('validation');
      allure.tag('empty-input');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS003-04
        **Scenario:** NF002 - Handle empty user ID
        
        **Objective:** Verify API handles empty ID parameter gracefully
        
        **Expected Result:**
        - HTTP 400 Bad Request or 404 Not Found
        - Appropriate error handling
      `);
      
      const emptyId = '';
      
      await allure.step('Arrange: Prepare empty ID parameter', async () => {
        allure.attachment('Request Parameters', JSON.stringify({ userId: emptyId }, null, 2), 'application/json');
      });
      
      let response: any;
      await allure.step('Act: Attempt to retrieve with empty ID', async () => {
        response = await apiClient.getUserById(emptyId);
        allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
      });
      
      await allure.step('Assert: Verify error response', () => {
        expect(response.status).to.be.oneOf([400, 404]);
      });
      
      console.log('✅ NF002: Empty ID handled properly');
    });
  });
});
