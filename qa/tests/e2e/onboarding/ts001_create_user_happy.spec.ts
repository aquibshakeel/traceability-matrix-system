/**
 * TS001 - Create User Happy Path
 * Scenario ID: HF001
 * Description: Create user with valid payload
 * Expected: 201 Created with user object
 */

import { expect } from 'chai';
import { allure } from 'allure-mocha/runtime';
import { apiClient } from '../../utils/apiClient';
import { TestFixtures } from '../../utils/fixtures';

describe('[TS001] Create User - Happy Path (HF001)', () => {
  it('should create a user with valid payload and return 201', async function() {
    allure.epic('User Management');
    allure.feature('User Onboarding');
    allure.story('HF001 - Create User Happy Path');
    allure.severity('critical');
    allure.tag('smoke');
    allure.tag('happy-path');
    allure.tag('onboarding');
    allure.owner('QA Team');
    allure.description(`
      **Test Case ID:** TS001-01
      **Scenario:** HF001 - Create user with valid payload
      
      **Objective:** Verify that a new user can be successfully created with valid email and name
      
      **Prerequisites:**
      - Onboarding service is running
      - MongoDB is accessible
      - Kafka is available for event publishing
      
      **Expected Result:**
      - HTTP 201 Created status
      - User object with generated ID returned
      - Valid timestamps (createdAt, updatedAt)
      - User data matches input payload
    `);
    
    const userPayload = TestFixtures.createValidUser();
    allure.parameter('email', userPayload.email);
    allure.parameter('name', userPayload.name);
    
    await allure.step('Arrange: Prepare valid user payload', async () => {
      allure.attachment('User Payload', JSON.stringify(userPayload, null, 2), 'application/json');
    });
    
    let response: any;
    await allure.step('Act: Send POST request to create user', async () => {
      response = await apiClient.createUser(userPayload);
      allure.attachment('API Response', JSON.stringify(response, null, 2), 'application/json');
    });
    
    await allure.step('Assert: Verify HTTP 201 status code', () => {
      expect(response.status).to.equal(201, 'Expected 201 Created status');
    });
    
    await allure.step('Assert: Verify response contains user data', () => {
      expect(response.data).to.exist;
      expect(response.data!.id).to.be.a('string');
    });
    
    await allure.step('Assert: Verify user data matches input', () => {
      expect(response.data!.email).to.equal(userPayload.email);
      expect(response.data!.name).to.equal(userPayload.name);
    });
    
    await allure.step('Assert: Verify timestamps are present and valid', () => {
      expect(response.data!.createdAt).to.be.a('string');
      expect(response.data!.updatedAt).to.be.a('string');
      
      const createdAt = new Date(response.data!.createdAt);
      const updatedAt = new Date(response.data!.updatedAt);
      expect(createdAt.getTime()).to.not.be.NaN;
      expect(updatedAt.getTime()).to.not.be.NaN;
    });
    
    console.log(`✅ User created successfully with ID: ${response.data!.id}`);
  });

  it('should create multiple users with unique emails', async function() {
    allure.epic('User Management');
    allure.feature('User Onboarding');
    allure.story('HF001 - Create User Happy Path');
    allure.severity('critical');
    allure.tag('smoke');
    allure.tag('happy-path');
    allure.tag('uniqueness');
    allure.owner('QA Team');
    allure.description(`
      **Test Case ID:** TS001-02
      **Scenario:** Verify unique user creation
      
      **Objective:** Ensure multiple users can be created with different emails and receive unique IDs
      
      **Expected Result:**
      - Both users created successfully (HTTP 201)
      - Each user receives unique ID
      - Email addresses are different
    `);
    
    const user1 = TestFixtures.createValidUser();
    const user2 = TestFixtures.createValidUser();
    
    await allure.step('Arrange: Prepare two unique user payloads', async () => {
      allure.attachment('User 1 Payload', JSON.stringify(user1, null, 2), 'application/json');
      allure.attachment('User 2 Payload', JSON.stringify(user2, null, 2), 'application/json');
    });
    
    let response1: any;
    let response2: any;
    
    await allure.step('Act: Create first user', async () => {
      response1 = await apiClient.createUser(user1);
      allure.attachment('User 1 Response', JSON.stringify(response1, null, 2), 'application/json');
    });
    
    await allure.step('Act: Create second user', async () => {
      response2 = await apiClient.createUser(user2);
      allure.attachment('User 2 Response', JSON.stringify(response2, null, 2), 'application/json');
    });
    
    await allure.step('Assert: Both users created successfully', () => {
      expect(response1.status).to.equal(201);
      expect(response2.status).to.equal(201);
    });
    
    await allure.step('Assert: Users have unique IDs', () => {
      expect(response1.data!.id).to.not.equal(response2.data!.id);
      allure.parameter('User 1 ID', response1.data!.id);
      allure.parameter('User 2 ID', response2.data!.id);
    });
    
    await allure.step('Assert: Users have different emails', () => {
      expect(response1.data!.email).to.not.equal(response2.data!.email);
    });
    
    console.log(`✅ Created two users with unique IDs`);
  });
});
