# Architecture Documentation

## Overview

This project implements a microservices architecture following Clean Architecture principles, with a comprehensive QA framework for automated testing and traceability.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Future)                     │
└────────────┬────────────────────────────────┬────────────────┘
             │                                │
      ┌──────▼──────┐                 ┌──────▼──────┐
      │ Onboarding  │                 │  Identity   │
      │   Service   │                 │   Service   │
      │  (Port 3000)│                 │  (Port 4000)│
      └──────┬──────┘                 └──────┬──────┘
             │                                │
        ┌────▼────┐                     ┌────▼────┐
        │ MongoDB │                     │ MongoDB │
        └─────────┘                     └─────────┘
             │
        ┌────▼────┐
        │  Kafka  │
        └─────────┘
```

## Clean Architecture Layers

### 1. Domain Layer (Innermost)
**Location:** `src/domain/`

**Responsibilities:**
- Business entities (User, Profile)
- Repository interfaces (ports)
- Event publisher interfaces
- Pure business logic with no dependencies

**Example:**
```typescript
// domain/entities/User.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// domain/repositories/IUserRepository.ts
export interface IUserRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
```

**Key Principle:** Domain layer has ZERO dependencies on other layers.

### 2. Application Layer
**Location:** `src/application/`

**Responsibilities:**
- Use cases and business orchestration
- Service classes that implement business flows
- Depends only on domain interfaces

**Example:**
```typescript
// application/services/UserService.ts
export class UserService {
  constructor(
    private userRepository: IUserRepository,  // Interface, not implementation
    private eventPublisher: IEventPublisher   // Interface, not implementation
  ) {}

  async createUser(dto: CreateUserDTO): Promise<User> {
    // Business logic
    // Validation
    // Orchestration
  }
}
```

**Key Principle:** Application layer orchestrates domain entities using interfaces.

### 3. Infrastructure Layer
**Location:** `src/infrastructure/`

**Responsibilities:**
- Adapters for external systems
- Database implementations (MongoDB)
- Messaging implementations (Kafka)
- Implements domain interfaces

**Example:**
```typescript
// infrastructure/database/MongoUserRepository.ts
export class MongoUserRepository implements IUserRepository {
  // Implements the domain interface
  async create(user: Omit<User, 'id'>): Promise<User> {
    // MongoDB-specific implementation
  }
}

// infrastructure/messaging/KafkaEventPublisher.ts
export class KafkaEventPublisher implements IEventPublisher {
  // Kafka-specific implementation
}
```

**Key Principle:** Infrastructure layer depends on domain interfaces but domain doesn't depend on infrastructure.

### 4. API Layer (Outermost)
**Location:** `src/api/`

**Responsibilities:**
- HTTP controllers
- Route definitions
- Request/response handling
- Depends on application services

**Example:**
```typescript
// api/controllers/UserController.ts
export class UserController {
  constructor(private userService: UserService) {}

  async createUser(req: Request, res: Response) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      // Error handling
    }
  }
}
```

**Key Principle:** API layer is a thin adapter that translates HTTP to business operations.

## Dependency Injection

All dependencies are injected through constructors:

```typescript
// app.ts - Dependency wiring
const userRepository = new MongoUserRepository(mongoClient);
const eventPublisher = new KafkaEventPublisher(kafkaProducer);
const userService = new UserService(userRepository, eventPublisher);
const userController = new UserController(userService);
```

**Benefits:**
- Easy to test (mock dependencies)
- Easy to swap implementations
- Clear dependency graph
- No hidden dependencies

## Service Communication

### 1. Onboarding Service → Kafka
When a user is created:
```
POST /api/user
  ↓
UserController
  ↓
UserService.createUser()
  ↓
├─→ MongoUserRepository.create()  (save to DB)
└─→ KafkaEventPublisher.publish() (publish event)
```

### 2. Event Structure
```json
{
  "eventType": "user.onboarded",
  "userId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-12-05T06:00:00.000Z",
  "status": "onboarded"
}
```

### 3. Identity Service (Future)
Will consume Kafka events to create/update profiles.

## Data Flow

### Create User Flow
```
1. Client → POST /api/user
2. Express → UserController.createUser()
3. UserController → UserService.createUser()
4. UserService:
   a. Validate input
   b. Check for duplicate email (via repository)
   c. Create user (via repository)
   d. Publish event (via event publisher)
5. Return user to client
```

### Error Flow
```
1. Validation Error → 400 Bad Request
2. Duplicate Email → 409 Conflict
3. DB Error → 500 Internal Server Error
4. Kafka Error → Log & continue (user still created)
```

## Database Design

### MongoDB Collections

#### Users Collection (Onboarding Service)
```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  name: "John Doe",
  createdAt: ISODate("2025-12-05T06:00:00.000Z"),
  updatedAt: ISODate("2025-12-05T06:00:00.000Z")
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
```

#### Profiles Collection (Identity Service)
**Read-Only Access** - Identity service queries profiles but doesn't create/modify them

```javascript
{
  _id: ObjectId("..."),
  userId: "507f1f77bcf86cd799439011",
  age: 25,
  location: "NYC",
  attributes: {},
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}

// Indexes
db.profiles.createIndex({ userId: 1 }, { unique: true })
```

**Note:** Profile creation/updates happen in other services. Identity service provides read-only query access.

## Testing Strategy

### 1. Unit Tests
**Location:** `<service>/test/unit/`

**Coverage:**
- All business logic in application layer
- Repository implementations
- Controllers
- Event publishers

**Example:**
```typescript
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const mockRepo = createMockRepository();
    const mockPublisher = createMockPublisher();
    const service = new UserService(mockRepo, mockPublisher);
    
    const result = await service.createUser({
      email: 'test@example.com',
      name: 'Test User'
    });
    
    expect(result).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockPublisher.publish).toHaveBeenCalled();
  });
});
```

### 2. E2E Tests
**Location:** `qa/tests/e2e/`

**Coverage:**
- Full request/response cycles
- Integration between layers
- Database persistence
- Event publishing
- Error scenarios

**Test Structure:**
```
TS001 - Happy Path Tests
TS002 - Negative Flow Tests
TS003 - Get User Tests
TS004 - Edge Case Tests
TS005 - Identity Service Tests
```

### 3. Traceability Matrix
**Location:** `qa/matrix/`

Automatically maps:
- Business scenarios → E2E tests
- Business scenarios → Unit tests
- Identifies gaps in coverage
- Generates priority-based recommendations

## Configuration Management

### Environment Variables

**Onboarding Service:**
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=onboarding-service
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=onboarding-service
KAFKA_TOPIC=user-onboarding
```

**Identity Service:**
```bash
PORT=4000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=identity-service
```

### Configuration Loading
```typescript
// config/config.ts
export const config = {
  port: parseInt(process.env.PORT || '3000'),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    database: process.env.MONGODB_DATABASE || 'onboarding-service'
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'onboarding-service',
    topic: process.env.KAFKA_TOPIC || 'user-onboarding'
  }
};
```

## Docker Architecture

### Multi-Stage Build
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
CMD ["node", "dist/server.js"]
```

### Service Dependencies
```yaml
services:
  mongodb:
    healthcheck: mongosh ping
  
  kafka:
    depends_on: [zookeeper]
    healthcheck: kafka-broker-api-versions
  
  onboarding-service:
    depends_on:
      mongodb: { condition: service_healthy }
      kafka: { condition: service_healthy }
```

## Scalability Considerations

### Horizontal Scaling
```
┌─────────┐
│ Load    │
│ Balancer│
└────┬────┘
     │
     ├─→ Service Instance 1
     ├─→ Service Instance 2
     └─→ Service Instance 3
```

Each service can be scaled independently.

### Database Scaling
- MongoDB replica sets for read scalability
- Sharding for write scalability
- Indexes for query performance

### Kafka Scaling
- Multiple partitions for parallel processing
- Consumer groups for load distribution
- Message durability with replication

## Security Considerations

### Current Implementation
- Input validation in application layer
- Email format validation
- Duplicate email prevention
- Health check endpoints (no auth required)

### Future Enhancements
- JWT authentication
- Rate limiting
- API key management
- Request signing
- HTTPS enforcement

## Error Handling

### Error Hierarchy
```
ApplicationError (base)
├── ValidationError (400)
├── NotFoundError (404)
├── ConflictError (409)
└── InternalError (500)
```

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email"
    }
  }
}
```

## Monitoring & Observability

### Health Checks
```
GET /health
Response: { "status": "healthy" }
```

### Logging Strategy
- Structured logging (JSON format)
- Log levels: DEBUG, INFO, WARN, ERROR
- Request/response logging
- Error stack traces
- Performance metrics

### Future Additions
- OpenTelemetry integration
- Distributed tracing
- Metrics collection (Prometheus)
- Alerting (PagerDuty)

## CI/CD Pipeline (Future)

```
Code Push
  ↓
Lint & Format Check
  ↓
Unit Tests
  ↓
Build Docker Images
  ↓
E2E Tests
  ↓
Traceability Matrix Validation
  ↓
Deploy to Staging
  ↓
Smoke Tests
  ↓
Deploy to Production
```

## Design Patterns Used

1. **Dependency Injection**: Constructor injection throughout
2. **Repository Pattern**: Data access abstraction
3. **Adapter Pattern**: Infrastructure implementations
4. **Factory Pattern**: Entity creation
5. **Strategy Pattern**: Different event publishers
6. **Observer Pattern**: Event publishing/consuming

## Best Practices

1. **SOLID Principles**
   - Single Responsibility: Each class has one reason to change
   - Open/Closed: Open for extension, closed for modification
   - Liskov Substitution: Interfaces are substitutable
   - Interface Segregation: Small, focused interfaces
   - Dependency Inversion: Depend on abstractions, not concretions

2. **DRY (Don't Repeat Yourself)**
   - Shared configuration
   - Reusable interfaces
   - Common error handling

3. **KISS (Keep It Simple, Stupid)**
   - Simple, focused classes
   - Clear naming
   - Minimal complexity

4. **Testing**
   - Unit tests for business logic
   - E2E tests for user scenarios
   - Mocking for isolation
   - Coverage tracking

## Future Enhancements

1. **API Gateway**
   - Centralized authentication
   - Rate limiting
   - Request routing

2. **Event Sourcing**
   - Complete event history
   - Event replay capability
   - Audit trail

3. **CQRS**
   - Separate read/write models
   - Optimized queries
   - Event-driven updates

4. **Service Mesh**
   - Istio/Linkerd integration
   - Service-to-service auth
   - Traffic management

## Conclusion

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Testable codebase
- ✅ Scalable design
- ✅ Maintainable structure
- ✅ Production-ready setup
