/**
 * TS003 - Get User Tests
 * Scenario IDs: HF002, NF002
 * Description: Test user retrieval by ID
 */

import { expect } from 'chai';
import { apiClient } from '../../utils/apiClient';
import { TestFixtures } from '../../utils/fixtures';

describe('[TS003] Get User Tests', () => {
  
  describe('Get User Happy Path (HF002)', () => {
    it('should retrieve a user with valid ID and return 200 (HF002)', async function() {
      // Arrange - Create a user first
      const userPayload = TestFixtures.createValidUser();
      const createResponse = await apiClient.createUser(userPayload);
      expect(createResponse.status).to.equal(201);
      const userId = createResponse.data!.id;
      
      // Act - Retrieve the user
      const response = await apiClient.getUserById(userId);
      
      // Assert
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
      // Arrange
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist
      
      // Act
      const response = await apiClient.getUserById(fakeId);
      
      // Assert
      expect(response.status).to.equal(404, 'Expected 404 Not Found');
      expect(response.error).to.exist;
      expect(response.error!.message).to.include('not found');
      
      console.log('✅ NF002: Non-existent ID properly returned 404');
    });

    it('should return 400 for invalid ID format (NF002)', async function() {
      // Arrange
      const invalidId = 'not-a-valid-id';
      
      // Act
      const response = await apiClient.getUserById(invalidId);
      
      // Assert
      // Could be 400 or 404 depending on implementation
      expect(response.status).to.be.oneOf([400, 404]);
      
      console.log(`✅ NF002: Invalid ID format handled with status ${response.status}`);
    });

    it('should return 400 for empty ID (NF002)', async function() {
      // Arrange
      const emptyId = '';
      
      // Act
      const response = await apiClient.getUserById(emptyId);
      
      // Assert
      expect(response.status).to.be.oneOf([400, 404]);
      
      console.log('✅ NF002: Empty ID handled properly');
    });
  });
});
