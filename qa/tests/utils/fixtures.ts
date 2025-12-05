import { CreateUserRequest } from './apiClient';

/**
 * Test data fixtures for QA automation
 */

export class TestFixtures {
  /**
   * Generate a unique email for testing
   */
  static generateEmail(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}.${timestamp}.${random}@qa-test.com`;
  }

  /**
   * Valid user payloads for happy path testing
   */
  static validUsers = {
    john: {
      email: 'john.doe@example.com',
      name: 'John Doe',
    },
    jane: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
    },
    bob: {
      email: 'bob.wilson@example.com',
      name: 'Bob Wilson',
    },
  };

  /**
   * Generate a valid user with unique email
   */
  static createValidUser(): CreateUserRequest {
    return {
      email: this.generateEmail(),
      name: 'Test User',
    };
  }

  /**
   * Invalid user payloads for negative testing
   */
  static invalidUsers = {
    missingEmail: {
      name: 'No Email User',
    } as any,
    missingName: {
      email: 'noemail@example.com',
    } as any,
    emptyEmail: {
      email: '',
      name: 'Empty Email',
    },
    emptyName: {
      email: 'test@example.com',
      name: '',
    },
    invalidEmailFormat: {
      email: 'not-an-email',
      name: 'Invalid Email',
    },
    invalidEmailNoAt: {
      email: 'nodomain.com',
      name: 'No At Sign',
    },
    invalidEmailNoDomain: {
      email: 'user@',
      name: 'No Domain',
    },
    spacesInEmail: {
      email: 'user name@domain.com',
      name: 'Spaces In Email',
    },
  };

  /**
   * Malformed JSON payloads for testing
   */
  static malformedPayloads = {
    notJSON: 'this is not json',
    unclosedBrace: '{"email":"test@example.com","name":"Test"',
    extraComma: '{"email":"test@example.com",,"name":"Test"}',
    singleQuotes: "{'email':'test@example.com','name':'Test'}",
    trailingComma: '{"email":"test@example.com","name":"Test",}',
  };

  /**
   * Edge case payloads (use getters to generate unique emails each time)
   */
  static get edgeCases() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString();
    const uniquePart = `${timestamp}.${random}`;
    
    return {
      veryLongName: {
        email: this.generateEmail(),
        name: 'A'.repeat(1000), // 1000 characters
      },
      veryLongEmail: {
        // Generate a long email (263 chars) that's still unique
        // Format: aaaa...aaaa.timestamp.random@example.com
        email: 'a'.repeat(250 - uniquePart.length) + uniquePart + '@example.com',
        name: 'Long Email Test',
      },
      specialCharactersName: {
        email: this.generateEmail(),
        name: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/',
      },
      unicodeName: {
        email: this.generateEmail(),
        name: '测试用户 тест юзер 🎉🎊',
      },
      emojiName: {
        email: this.generateEmail(),
        name: '😀😁😂🤣😃😄😅😆',
      },
      nullCharacterName: {
        email: this.generateEmail(),
        name: 'Test\0User',
      },
    };
  }

  /**
   * Boundary test cases (use getters to generate unique emails each time)
   */
  static get boundaries() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString();
    const uniquePart = `${timestamp}.${random}`;
    
    return {
      maxValidNameLength: {
        email: this.generateEmail(),
        name: 'A'.repeat(255), // Typical max varchar
      },
      minValidName: {
        email: this.generateEmail(),
        name: 'A', // Single character
      },
      maxValidEmailLength: {
        // Generate email at RFC 5321 limit (254 chars) that's still unique
        // Format: aaaa...aaaa.timestamp.random@example.com
        // Total: prefix + uniquePart + '@example.com' = 254
        // @example.com = 12 chars, so prefix + uniquePart = 242
        email: 'a'.repeat(242 - uniquePart.length) + uniquePart + '@example.com',
        name: 'Max Email Length',
      },
    };
  }

  /**
   * Get a random valid user
   */
  static getRandomValidUser(): CreateUserRequest {
    const users = Object.values(this.validUsers);
    const random = users[Math.floor(Math.random() * users.length)];
    return {
      ...random,
      email: this.generateEmail(), // Make it unique
    };
  }

  /**
   * Test IDs (matching traceability matrix)
   */
  static scenarioIds = {
    // Happy flows
    HF001: 'Create user with valid payload',
    HF002: 'Get user with valid ID',
    
    // Negative flows
    NF001: 'Create user missing email field',
    NF002: 'Get user with invalid ID (404)',
    NF003: 'Malformed JSON payload (400)',
    NF004: 'Duplicate email (409)',
    NF005: 'Invalid email format (400)',
    NF006: 'Missing name field (400)',
    NF007: 'Empty string values (400)',
    
    // Edge cases
    EC001: 'Boundary-condition input (Max name length)',
    EC002: 'Very long email (>254 chars)',
    EC003: 'Special characters in name',
    
    // DB failures (can't test in E2E without mocking)
    DB001: 'DB timeout during user creation',
    DB002: 'DB connection failure',
    DB003: 'DB duplicate key error',
    
    // Kafka failures (can't test in E2E without mocking)
    KAF001: 'Kafka publish failure post-DB commit',
    KAF002: 'Kafka connection failure',
    KAF003: 'Kafka timeout',
  };
}
