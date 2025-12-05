# Onboarding Service Architecture

## Overview

This is a clean, minimal API-only onboarding service built with TypeScript, following Clean Architecture principles. The service provides two endpoints for user onboarding with MongoDB persistence and Kafka event publishing.

## Design Principles

### SOLID Principles

1. **Single Responsibility Principle (SRP)**
   - Each class has one reason to change
   - UserService handles business logic only
   - Controllers handle HTTP concerns only
   - Repositories handle data persistence only

2. **Open/Closed Principle (OCP)**
   - System is open for extension via interfaces
   - Closed for modification via dependency injection

3. **Liskov Substitution Principle (LSP)**
   - Implementations are interchangeable via interfaces
   - MongoDB/Kafka can be swapped with other implementations

4. **Interface Segregation Principle (ISP)**
   - Interfaces are minimal and focused
   - IUserRepository, IEventPublisher are lean contracts

5. **Dependency Inversion Principle (DIP)**
   - High-level modules depend on abstractions
   - Low-level modules implement abstractions

### DRY (Don't Repeat Yourself)

- Centralized configuration in `config.ts`
- Reusable interfaces in domain layer
- Single source of truth for entities

### Clean Code

- Descriptive naming conventions
- Small, focused functions
- Clear separation of concerns
- Comprehensive documentation

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│  (Controllers, Routes, HTTP Concerns)                        │
│  - UserController                                            │
│  - userRoutes                                                │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  (Use Cases, Business Logic)                                 │
│  - UserService                                               │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                             │
│  (Entities, Interfaces, Business Rules)                      │
│  - User, CreateUserRequest, OnboardingEvent                  │
│  - IUserRepository, IEventPublisher                          │
└─────────────────────────────────────────────────────────────┘
                            ▲
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                         │
│  (External Concerns, Adapters)                               │
│  - MongoUserRepository                                       │
│  - KafkaEventPublisher                                       │
└─────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
src/
├── domain/                      # Core business logic (no dependencies)
│   ├── entities/               # Business entities and DTOs
│   │   └── User.ts            # User entity and contracts
│   ├── repositories/          # Repository interfaces (ports)
│   │   └── IUserRepository.ts
│   └── events/                # Event publisher interfaces (ports)
│       └── IEventPublisher.ts
│
├── application/                # Use cases and business orchestration
│   └── services/
│       └── UserService.ts     # User onboarding business logic
│
├── infrastructure/             # External systems (adapters)
│   ├── database/
│   │   └── MongoUserRepository.ts  # MongoDB implementation
│   └── messaging/
│       └── KafkaEventPublisher.ts  # Kafka implementation
│
├── api/                        # HTTP interface
│   ├── controllers/
│   │   └── UserController.ts  # HTTP request handlers
│   └── routes/
│       └── userRoutes.ts      # Route definitions
│
├── config/                     # Configuration
│   └── config.ts              # Environment-based config
│
├── app.ts                      # Application bootstrap
└── server.ts                   # Entry point

test/
├── unit/                       # Unit tests (run inside container)
│   ├── application/
│   ├── domain/
│   └── infrastructure/
└── integration/                # Integration tests (run outside container)
    ├── api/
    └── events/
```

## API Endpoints

### POST /api/user

Creates and onboards a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-12-04T12:00:00.000Z",
  "updatedAt": "2025-12-04T12:00:00.000Z"
}
```

**Error Responses:**
- 400: Invalid email format or missing fields
- 409: User with email already exists
- 500: Internal server error

### GET /api/user/:id

Retrieves user onboarding data.

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-12-04T12:00:00.000Z",
  "updatedAt": "2025-12-04T12:00:00.000Z"
}
```

**Error Responses:**
- 400: Invalid user ID
- 404: User not found
- 500: Internal server error

## Kafka Event

When a user is created, an onboarding event is published to Kafka:

**Topic:** `user-onboarding`

**Event Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "status": "onboarded",
  "timestamp": "2025-12-04T12:00:00.000Z"
}
```

## Dependency Injection

The application uses constructor-based dependency injection for loose coupling:

```typescript
// Domain Layer defines interfaces
interface IUserRepository { ... }
interface IEventPublisher { ... }

// Infrastructure Layer implements interfaces
class MongoUserRepository implements IUserRepository { ... }
class KafkaEventPublisher implements IEventPublisher { ... }

// Application Layer depends on interfaces
class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}
}

// API Layer depends on application layer
class UserController {
  constructor(private readonly userService: UserService) {}
}

// Bootstrap wires everything together
const userRepository = new MongoUserRepository(db);
const eventPublisher = new KafkaEventPublisher(kafka);
const userService = new UserService(userRepository, eventPublisher);
const userController = new UserController(userService);
```

## Testing Strategy

### Unit Tests (Inside Container)

- **Location:** `test/unit/`
- **Run:** `npm test` inside container
- **Purpose:** Test individual components in isolation
- **Characteristics:**
  - Use mocks/stubs for dependencies
  - Fast execution (< 1s per test)
  - No external services required
  - High code coverage target (>80%)

**Example:**
```typescript
// test/unit/application/services/UserService.test.ts
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockPublisher: jest.Mocked<IEventPublisher>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockPublisher = createMockPublisher();
    userService = new UserService(mockRepository, mockPublisher);
  });

  it('should create user and publish event', async () => {
    // Test implementation
  });
});
```

### Integration Tests (Outside Container)

- **Location:** `test/integration/`
- **Run:** External test runner or CI/CD pipeline
- **Purpose:** Test component interactions with real services
- **Characteristics:**
  - Use real MongoDB and Kafka
  - Slower execution (seconds per test)
  - Verify API contracts
  - Test complete user flows

**Example:**
```typescript
// test/integration/api/user-creation.test.ts
describe('POST /api/user', () => {
  beforeAll(async () => {
    await connectToTestDatabase();
    await connectToTestKafka();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('should create user and publish to Kafka', async () => {
    const response = await request(app)
      .post('/api/user')
      .send({ email: 'test@example.com', name: 'Test User' });
    
    expect(response.status).toBe(201);
    // Verify in database
    // Verify Kafka message
  });
});
```

## Why This Architecture?

### 1. Testability

- **Interfaces allow mocking:** Business logic can be tested without MongoDB/Kafka
- **Dependency injection:** Easy to swap implementations for testing
- **Clear boundaries:** Each layer can be tested independently

### 2. Maintainability

- **Separation of concerns:** Changes in one layer don't affect others
- **Single Responsibility:** Each class has one job
- **Clear structure:** New developers can navigate easily

### 3. Extensibility

- **Open/Closed:** Add new features without modifying existing code
- **Interface-based:** Swap MongoDB for PostgreSQL without changing business logic
- **Kafka independence:** Can add other event publishers (RabbitMQ, SNS) easily

### 4. Production Readiness

- **Health checks:** `/health` endpoint for monitoring
- **Graceful shutdown:** Properly closes DB and Kafka connections
- **Error handling:** Comprehensive error responses
- **Type safety:** TypeScript ensures correctness

## Docker Architecture

### Single Container Design

The service runs in one container with:
- Compiled TypeScript (Node.js)
- MongoDB client connection
- Kafka producer connection
- Express HTTP server

**Benefits:**
- Simple deployment
- Easy scaling (horizontal)
- Clear resource boundaries
- Independent test execution

### Multi-Stage Build

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
# Compile TypeScript to JavaScript

# Stage 2: Production
FROM node:18-alpine
# Copy only compiled code and production dependencies
# Smaller final image
# Security: runs as non-root user
```

### Docker Compose Services

1. **MongoDB:** User data persistence
2. **Zookeeper:** Kafka coordination
3. **Kafka:** Event streaming
4. **Service:** Onboarding API

All services connected via `onboarding-network` with health checks.

## Configuration

Environment-based configuration for different deployment scenarios:

```typescript
// Development
MONGODB_URI=mongodb://localhost:27017
KAFKA_BROKERS=localhost:9092

// Docker Compose
MONGODB_URI=mongodb://mongodb:27017
KAFKA_BROKERS=kafka:29092

// Production (K8s/Cloud)
MONGODB_URI=mongodb://prod-cluster:27017
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
```

## Design Decisions

### 1. Why Clean Architecture?

**Decision:** Implement Clean Architecture (Hexagonal/Ports & Adapters)

**Rationale:**
- Business logic isolated from frameworks
- Easy to test without external dependencies
- Can swap infrastructure without changing business logic
- Clear separation of concerns

### 2. Why MongoDB?

**Decision:** Use MongoDB for persistence

**Rationale:**
- Document model fits user entity naturally
- Easy to scale horizontally
- No schema migrations needed for simple model
- Fast development iteration

**Trade-off:** If complex queries or transactions are needed later, might need to reconsider

### 3. Why Kafka?

**Decision:** Use Kafka for event publishing

**Rationale:**
- Reliable message delivery
- Event sourcing capability
- Scalable consumer groups
- Industry standard for event streaming

**Trade-off:** Heavier infrastructure than simple queues, but worth it for reliability

### 4. Why TypeScript?

**Decision:** Use TypeScript instead of JavaScript

**Rationale:**
- Type safety catches errors at compile time
- Better IDE support and refactoring
- Self-documenting code through types
- Industry best practice for backend services

### 5. Why Express?

**Decision:** Use Express for HTTP layer

**Rationale:**
- Minimal and unopinionated
- Large ecosystem
- Well-understood by most developers
- Easy to test

**Alternative considered:** Fastify (faster but less familiar)

### 6. Why Constructor Injection?

**Decision:** Use constructor-based dependency injection

**Rationale:**
- Dependencies are explicit and required
- Easier to test (pass mocks in constructor)
- No need for DI framework
- TypeScript enforces at compile time

## Running the Service

### Development

```bash
# Install dependencies
npm install

# Start dependencies (MongoDB, Kafka)
docker-compose up -d mongodb kafka

# Run in dev mode
npm run dev
```

### Production (Docker)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f service

# Health check
curl http://localhost:3000/health
```

### Testing

```bash
# Unit tests (inside container)
docker-compose run --rm service npm test

# Integration tests (requires services running)
docker-compose up -d
npm run test:integration
```

## Future Enhancements

While keeping the service minimal, here are potential enhancements:

1. **Authentication/Authorization:** Add JWT or API key validation
2. **Rate Limiting:** Prevent abuse
3. **Metrics:** Add Prometheus metrics
4. **Logging:** Structured logging with correlation IDs
5. **Caching:** Redis for frequent reads
6. **Validation:** More comprehensive input validation
7. **API Versioning:** Support v1, v2 endpoints
8. **Documentation:** OpenAPI/Swagger spec

These should only be added when requirements demand them (YAGNI principle).

## Conclusion

This architecture provides:
- ✅ Minimal scope (only 2 endpoints as requested)
- ✅ Clean code following SOLID principles
- ✅ Testable design with clear boundaries
- ✅ Production-ready Docker setup
- ✅ Easy to extend without modification
- ✅ No unnecessary features or complexity

The service is ready for unit tests to be added in the `test/unit/` directory and integration tests in `test/integration/`.
