/**
 * TS001 - Create User Happy Path
 * Scenario ID: HF001
 * Description: Create user with valid payload
 * Expected: 201 Created with user object
 */

import { expect } from 'chai';
import { apiClient } from '../../utils/apiClient';
import { TestFixtures } from '../../utils/fixtures';

describe('[TS001] Create User - Happy Path (HF001)', () => {
  it('should create a user with valid payload and return 201', async function() {
    // Arrange
    const userPayload = TestFixtures.createValidUser();
    
    // Act
    const response = await apiClient.createUser(userPayload);
    
    // Assert
    expect(response.status).to.equal(201, 'Expected 201 Created status');
    expect(response.data).to.exist;
    expect(response.data!.id).to.be.a('string');
    expect(response.data!.email).to.equal(userPayload.email);
    expect(response.data!.name).to.equal(userPayload.name);
    expect(response.data!.createdAt).to.be.a('string');
    expect(response.data!.updatedAt).to.be.a('string');
    
    // Verify timestamps are valid dates
    const createdAt = new Date(response.data!.createdAt);
    const updatedAt = new Date(response.data!.updatedAt);
    expect(createdAt.getTime()).to.not.be.NaN;
    expect(updatedAt.getTime()).to.not.be.NaN;
    
    console.log(`✅ User created successfully with ID: ${response.data!.id}`);
  });

  it('should create multiple users with unique emails', async function() {
    // Arrange
    const user1 = TestFixtures.createValidUser();
    const user2 = TestFixtures.createValidUser();
    
    // Act
    const response1 = await apiClient.createUser(user1);
    const response2 = await apiClient.createUser(user2);
    
    // Assert
    expect(response1.status).to.equal(201);
    expect(response2.status).to.equal(201);
    expect(response1.data!.id).to.not.equal(response2.data!.id);
    expect(response1.data!.email).to.not.equal(response2.data!.email);
    
    console.log(`✅ Created two users with unique IDs`);
  });
});
