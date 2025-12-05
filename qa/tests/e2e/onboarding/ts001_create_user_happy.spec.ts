/**
 * TS001 - Create User Happy Path
 * Scenario ID: HF001
 * Description: Create user with valid payload
 * Expected: 201 Created with user object
 */

import { expect } from 'chai';
import { apiClient } from '../../utils/apiClient';
import { TestFixtures } from '../../utils/fixtures';
import { setTestMetadata, step } from '../../utils/allureHelper';

describe('[TS001] Create User - Happy Path (HF001)', () => {
  it('should create a user with valid payload and return 201', async function() {
    // Test metadata for reporting
    setTestMetadata({
      testId: 'TS001-01',
      scenarioId: 'HF001',
      epic: 'User Management',
      feature: 'User Onboarding',
      story: 'HF001 - Create User Happy Path',
      severity: 'critical',
      tags: ['smoke', 'happy-path', 'onboarding'],
      owner: 'QA Team'
    });
    
    // Test execution
    const userPayload = TestFixtures.createValidUser();
    const response = await apiClient.createUser(userPayload);
    
    // Assertions
    expect(response.status).to.equal(201, 'Expected 201 Created status');
    expect(response.data).to.exist;
    expect(response.data!.id).to.be.a('string');
    expect(response.data!.email).to.equal(userPayload.email);
    expect(response.data!.name).to.equal(userPayload.name);
    expect(response.data!.createdAt).to.be.a('string');
    expect(response.data!.updatedAt).to.be.a('string');
    
    const createdAt = new Date(response.data!.createdAt);
    const updatedAt = new Date(response.data!.updatedAt);
    expect(createdAt.getTime()).to.not.be.NaN;
    expect(updatedAt.getTime()).to.not.be.NaN;
    
    console.log(`✅ User created successfully with ID: ${response.data!.id}`);
  });

  it('should create multiple users with unique emails', async function() {
    // Test metadata for reporting
    setTestMetadata({
      testId: 'TS001-02',
      scenarioId: 'HF001',
      epic: 'User Management',
      feature: 'User Onboarding',
      story: 'HF001 - Create User Happy Path',
      severity: 'critical',
      tags: ['smoke', 'happy-path', 'uniqueness'],
      owner: 'QA Team'
    });
    
    // Test execution
    const user1 = TestFixtures.createValidUser();
    const user2 = TestFixtures.createValidUser();
    
    const response1 = await apiClient.createUser(user1);
    const response2 = await apiClient.createUser(user2);
    
    // Assertions
    expect(response1.status).to.equal(201);
    expect(response2.status).to.equal(201);
    expect(response1.data!.id).to.not.equal(response2.data!.id);
    expect(response1.data!.email).to.not.equal(response2.data!.email);
    
    console.log(`✅ Created two users with unique IDs`);
  });
});
