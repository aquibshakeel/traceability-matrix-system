/**
 * TS003 - Get User Tests
 * Scenario IDs: HF002, NF002
 * Description: Test user retrieval by ID
 */

import { expect } from 'chai';
import { apiClient } from '../../utils/apiClient';
import { TestFixtures } from '../../utils/fixtures';
import { setTestMetadata } from '../../utils/allureHelper';

describe('[TS003] Get User Tests', () => {
  
  describe('Get User Happy Path (HF002)', () => {
    it('should retrieve a user with valid ID and return 200 (HF002)', async function() {
      setTestMetadata({
        testId: 'TS003-01',
        scenarioId: 'HF002',
        epic: 'User Management',
        feature: 'User Retrieval',
        story: 'HF002 - Get User by Valid ID',
        severity: 'critical',
        tags: ['smoke', 'happy-path', 'retrieval'],
        owner: 'QA Team'
      });
      
      // Create a test user first
      const userPayload = TestFixtures.createValidUser();
      const createResponse = await apiClient.createUser(userPayload);
      expect(createResponse.status).to.equal(201);
      const userId = createResponse.data!.id;
      
      // Retrieve the user
      const response = await apiClient.getUserById(userId);
      
      // Assertions
      expect(response.status).to.equal(200, 'Expected 200 OK');
      expect(response.data).to.exist;
      expect(response.data!.id).to.equal(userId);
      expect(response.data!.email).to.equal(userPayload.email);
      expect(response.data!.name).to.equal(userPayload.name);
      expect(response.data!.createdAt).to.be.a('string');
      expect(response.data!.updatedAt).to.be.a('string');
      
      console.log(`✅ HF002: User retrieved successfully with ID: ${userId}`);
    });
  });

  describe('Get User with Invalid ID (NF002)', () => {
    it('should return 404 for non-existent user ID (NF002)', async function() {
      setTestMetadata({
        testId: 'TS003-02',
        scenarioId: 'NF002',
        epic: 'User Management',
        feature: 'Error Handling',
        story: 'NF002 - Invalid User ID Handling',
        severity: 'normal',
        tags: ['negative', 'error-handling', 'not-found'],
        owner: 'QA Team'
      });
      
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await apiClient.getUserById(fakeId);
      
      expect(response.status).to.equal(404, 'Expected 404 Not Found');
      expect(response.error).to.exist;
      expect(response.error!.message).to.include('not found');
      
      console.log('✅ NF002: Non-existent ID properly returned 404');
    });

    it('should return 400 for invalid ID format (NF002)', async function() {
      setTestMetadata({
        testId: 'TS003-03',
        scenarioId: 'NF002',
        epic: 'User Management',
        feature: 'Input Validation',
        story: 'NF002 - Invalid ID Format Handling',
        severity: 'normal',
        tags: ['negative', 'validation', 'id-format'],
        owner: 'QA Team'
      });
      
      const invalidId = 'not-a-valid-id';
      const response = await apiClient.getUserById(invalidId);
      
      expect(response.status).to.be.oneOf([400, 404]);
      
      console.log(`✅ NF002: Invalid ID format handled with status ${response.status}`);
    });

    it('should return 400 for empty ID (NF002)', async function() {
      setTestMetadata({
        testId: 'TS003-04',
        scenarioId: 'NF002',
        epic: 'User Management',
        feature: 'Input Validation',
        story: 'NF002 - Empty ID Handling',
        severity: 'normal',
        tags: ['negative', 'validation', 'empty-input'],
        owner: 'QA Team'
      });
      
      const emptyId = '';
      const response = await apiClient.getUserById(emptyId);
      
      expect(response.status).to.be.oneOf([400, 404]);
      
      console.log('✅ NF002: Empty ID handled properly');
    });
  });
});
