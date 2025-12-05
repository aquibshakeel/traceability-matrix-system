/**
 * [TS005] Identity Service - Profile Read Operations
 * Tests profile retrieval functionality (GET only)
 * Note: Identity service is read-only. Profile creation/updates happen elsewhere.
 */

import { expect } from 'chai';
import { apiClient } from '../../utils/apiClient';
import { setTestMetadata } from '../../utils/allureHelper';

describe('[TS005] Profile Read Operations', () => {
  const testUserId = `test-user-${Date.now()}`;
  let mockProfileId: string;

  // Note: In a real scenario, profiles would be created by another service
  // For testing purposes, we need to mock or seed data
  before(() => {
    mockProfileId = '507f1f77bcf86cd799439011'; // Mock MongoDB ObjectId
    console.log('⚠️  Note: Identity service is READ-ONLY. Profiles must be created by other services.');
  });

  describe('Get Profile by ID (GET /api/profile/:id)', () => {
    it('should return 404 for non-existent profile', async function() {
      setTestMetadata({
        testId: 'TS005-01',
        scenarioId: 'PROF-GET-001',
        epic: 'Identity Management',
        feature: 'Profile Retrieval',
        story: 'Get Profile by ID',
        severity: 'critical',
        tags: ['read-only', 'profile', 'identity-service'],
        owner: 'QA Team'
      });

      try {
        await apiClient.get(`/api/profile/${mockProfileId}`);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
        console.log('✅ Correctly returned 404 for non-existent profile');
      }
    });

    it('should return 400 for invalid profile ID format', async function() {
      setTestMetadata({
        testId: 'TS005-02',
        scenarioId: 'PROF-GET-002',
        epic: 'Identity Management',
        feature: 'Profile Retrieval',
        story: 'Invalid ID Handling',
        severity: 'normal',
        tags: ['validation', 'profile', 'identity-service'],
        owner: 'QA Team'
      });

      try {
        await apiClient.get('/api/profile/invalid-id');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.be.oneOf([400, 404]);
        console.log(`✅ Correctly returned ${error.response.status} for invalid ID format`);
      }
    });
  });

  describe('Get Profile by User ID (GET /api/profile/user/:userId)', () => {
    it('should return 404 when user has no profile', async function() {
      setTestMetadata({
        testId: 'TS005-03',
        scenarioId: 'PROF-GET-003',
        epic: 'Identity Management',
        feature: 'Profile Retrieval',
        story: 'Get Profile by User ID',
        severity: 'critical',
        tags: ['read-only', 'profile', 'identity-service'],
        owner: 'QA Team'
      });

      try {
        await apiClient.get(`/api/profile/user/${testUserId}`);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
        console.log('✅ Correctly returned 404 when user has no profile');
      }
    });

    it('should return 404 for non-existent user', async function() {
      setTestMetadata({
        testId: 'TS005-04',
        scenarioId: 'PROF-GET-004',
        epic: 'Identity Management',
        feature: 'Profile Retrieval',
        story: 'Non-existent User Handling',
        severity: 'normal',
        tags: ['validation', 'profile', 'identity-service'],
        owner: 'QA Team'
      });

      try {
        await apiClient.get('/api/profile/user/nonexistent-user-id');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).to.equal(404);
        console.log('✅ Correctly returned 404 for non-existent user');
      }
    });
  });

  describe('Verify Service is Read-Only', () => {
    it('should reject POST requests (method not allowed)', async function() {
      setTestMetadata({
        testId: 'TS005-05',
        scenarioId: 'PROF-READONLY-001',
        epic: 'Identity Management',
        feature: 'Service Constraints',
        story: 'Read-Only Service Validation',
        severity: 'critical',
        tags: ['security', 'read-only', 'validation'],
        owner: 'QA Team',
        description: 'Identity service should only support GET operations'
      });

      try {
        await apiClient.post('/api/profile', {
          userId: testUserId,
          age: 28
        });
        expect.fail('POST should not be allowed');
      } catch (error: any) {
        // Should return 404 (route not found) or 405 (method not allowed)
        expect(error.response.status).to.be.oneOf([404, 405]);
        console.log(`✅ POST request rejected with status ${error.response.status}`);
      }
    });

    it('should reject PUT requests (method not allowed)', async function() {
      setTestMetadata({
        testId: 'TS005-06',
        scenarioId: 'PROF-READONLY-002',
        epic: 'Identity Management',
        feature: 'Service Constraints',
        story: 'Read-Only Service Validation',
        severity: 'critical',
        tags: ['security', 'read-only', 'validation'],
        owner: 'QA Team'
      });

      try {
        await apiClient.put(`/api/profile/${mockProfileId}`, {
          age: 29
        });
        expect.fail('PUT should not be allowed');
      } catch (error: any) {
        expect(error.response.status).to.be.oneOf([404, 405]);
        console.log(`✅ PUT request rejected with status ${error.response.status}`);
      }
    });

    it('should reject DELETE requests (method not allowed)', async function() {
      setTestMetadata({
        testId: 'TS005-07',
        scenarioId: 'PROF-READONLY-003',
        epic: 'Identity Management',
        feature: 'Service Constraints',
        story: 'Read-Only Service Validation',
        severity: 'critical',
        tags: ['security', 'read-only', 'validation'],
        owner: 'QA Team'
      });

      try {
        await apiClient.delete(`/api/profile/${mockProfileId}`);
        expect.fail('DELETE should not be allowed');
      } catch (error: any) {
        expect(error.response.status).to.be.oneOf([404, 405]);
        console.log(`✅ DELETE request rejected with status ${error.response.status}`);
      }
    });
  });
});
