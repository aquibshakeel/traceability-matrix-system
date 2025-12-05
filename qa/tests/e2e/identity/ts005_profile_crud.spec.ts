/**
 * [TS005] Identity Service - Profile CRUD Operations
 * Tests complete lifecycle of profile management
 */

import { expect } from 'chai';
import { allure } from 'allure-mocha/runtime';
import { apiClient } from '../../utils/apiClient';

describe('[TS005] Profile CRUD Operations', () => {
  let createdProfileId: string;
  let testUserId: string;

  before(() => {
    // Generate unique user ID for testing
    testUserId = `test-user-${Date.now()}`;
  });

  describe('Create Profile (POST /api/profile)', () => {
    it('should create profile with valid data and return 201', async function() {
      allure.epic('Identity Management');
      allure.feature('Profile Management');
      allure.story('Profile Creation');
      allure.severity('critical');
      allure.tag('smoke');
      allure.tag('crud');
      allure.tag('profile');
      allure.tag('identity-service');
      allure.owner('QA Team');
      allure.description(`
        **Test Case ID:** TS005-01
        **Scenario:** Create profile with valid data
        
        **Objective:** Verify profile can be created successfully
        
        **Expected Result:**
        - HTTP 201 Created
        - Profile with unique ID returned
        - All fields preserved correctly
      `);
      
      const payload = {
        userId: testUserId,
        age: 28,
        location: 'New York'
      };
      
      allure.parameter('User ID', testUserId);
      allure.parameter('Age', 28);
      allure.parameter('Location', 'New York');
      
      let response: any;
      await allure.step('Act: Create profile', async () => {
        response = await apiClient.post('/api/profile', payload);
        allure.attachment('API Response', JSON.stringify(response.data, null, 2), 'application/json');
      });

      await allure.step('Assert: Verify profile created', () => {
        expect(response.status).to.equal(201);
        expect(response.data).to.have.property('id');
        expect(response.data.userId).to.equal(testUserId);
        expect(response.data.age).to.equal(28);
        expect(response.data.location).to.equal('New York');
      });
      
      createdProfileId = response.data.id;
      allure.parameter('Created Profile ID', createdProfileId);
      console.log(`✅ Profile created: ${createdProfileId}`);
    });

    it('should return 400 when userId is missing', async () => {
      try {
        await apiClient.post('/api/profile', {
          age: 25
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.error).to.include('User ID');
      }
    });

    it('should return 409 when profile already exists for user', async () => {
      try {
        await apiClient.post('/api/profile', {
          userId: testUserId,
          age: 30
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(409);
        expect(error.response.data.error).to.include('already exists');
      }
    });

    it('should return 400 when age is negative', async () => {
      try {
        await apiClient.post('/api/profile', {
          userId: `temp-${Date.now()}`,
          age: -5
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.error).to.include('Age must be between');
      }
    });

    it('should return 400 when age exceeds 150', async () => {
      try {
        await apiClient.post('/api/profile', {
          userId: `temp-${Date.now()}`,
          age: 200
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('Get Profile by ID (GET /api/profile/:id)', () => {
    it('should return 200 with profile data', async () => {
      const response = await apiClient.get(`/api/profile/${createdProfileId}`);

      expect(response.status).to.equal(200);
      expect(response.data.id).to.equal(createdProfileId);
      expect(response.data.userId).to.equal(testUserId);
    });

    it('should return 404 for non-existent profile', async () => {
      try {
        await apiClient.get('/api/profile/507f1f77bcf86cd799439011');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
      }
    });

    it('should return 400 for invalid profile ID format', async () => {
      try {
        await apiClient.get('/api/profile/invalid-id');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.be.oneOf([400, 404]);
      }
    });
  });

  describe('Get Profile by User ID (GET /api/profile/user/:userId)', () => {
    it('should return 200 with profile data', async () => {
      const response = await apiClient.get(`/api/profile/user/${testUserId}`);

      expect(response.status).to.equal(200);
      expect(response.data.userId).to.equal(testUserId);
      expect(response.data.id).to.equal(createdProfileId);
    });

    it('should return 404 when user has no profile', async () => {
      try {
        await apiClient.get('/api/profile/user/nonexistent-user');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('Update Profile (PUT /api/profile/:id)', () => {
    it('should update profile and return 200', async () => {
      const response = await apiClient.put(`/api/profile/${createdProfileId}`, {
        age: 29,
        location: 'San Francisco'
      });

      expect(response.status).to.equal(200);
      expect(response.data.age).to.equal(29);
      expect(response.data.location).to.equal('San Francisco');
      console.log(`✅ Profile updated: age 28→29, location changed`);
    });

    it('should return 404 for non-existent profile', async () => {
      try {
        await apiClient.put('/api/profile/507f1f77bcf86cd799439011', {
          age: 30
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
      }
    });

    it('should return 400 for invalid age', async () => {
      try {
        await apiClient.put(`/api/profile/${createdProfileId}`, {
          age: 200
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('Delete Profile (DELETE /api/profile/:id)', () => {
    it('should delete profile and return 204', async () => {
      const response = await apiClient.delete(`/api/profile/${createdProfileId}`);

      expect(response.status).to.equal(204);
      console.log(`✅ Profile deleted: ${createdProfileId}`);
    });

    it('should return 404 when trying to get deleted profile', async () => {
      try {
        await apiClient.get(`/api/profile/${createdProfileId}`);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
      }
    });

    it('should return 404 when deleting non-existent profile', async () => {
      try {
        await apiClient.delete('/api/profile/507f1f77bcf86cd799439011');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
      }
    });
  });
});
