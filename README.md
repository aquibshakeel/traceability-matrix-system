# Onboarding Service

A clean, minimal API-only user onboarding service built with TypeScript, following Clean Architecture principles with MongoDB persistence and Kafka event publishing.

## Features

- ✅ **Two Simple Endpoints:** POST /api/user (create) and GET /api/user/:id (retrieve)
- ✅ **MongoDB Integration:** Persistent storage with proper indexing
- ✅ **Kafka Event Publishing:** Publishes "onboarded" status events
- ✅ **Clean Architecture:** SOLID principles, testable design, clear boundaries
- ✅ **Type-Safe:** Full TypeScript implementation
- ✅ **Docker Ready:** Single container with multi-stage build
- ✅ **Production Ready:** Health checks, graceful shutdown, error handling
- ✅ **Test Structure:** Organized for unit and integration tests

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start all services (MongoDB, Kafka, API)
docker-compose up -d

# 3. Check health
curl http://localhost:3000/health

# 4. Create a user
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","name":"John Doe"}'

# 5. Get user by ID (use the ID from step 4 response)
curl http://localhost:3000/api/user/YOUR_USER_ID
```

## API Endpoints

### POST /api/user
Create and onboard a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-12-04T12:00:00.000Z",
  "updatedAt": "2025-12-04T12:00:00.000Z"
}
```

### GET /api/user/:id
Retrieve user onboarding data.

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-12-04T12:00:00.000Z",
  "updatedAt": "2025-12-04T12:00:00.000Z"
}
```

## Architecture

```
src/
├── domain/                 # Business entities and interfaces (ports)
├── application/            # Business logic and use cases
├── infrastructure/         # External systems (MongoDB, Kafka adapters)
├── api/                    # HTTP controllers and routes
├── config/                 # Configuration
├── app.ts                  # Application bootstrap
└── server.ts               # Entry point

test/
├── unit/                   # Unit tests (run inside container)
└── integration/            # Integration tests (run outside container)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed design decisions and explanations.

## Development

```bash
# Install dependencies
npm install

# Start dependencies only
docker-compose up -d mongodb kafka

# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run compiled code
npm start

# Lint
npm run lint
```

## Testing

### Unit Tests
```bash
# Run unit tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Inside container
docker-compose run --rm service npm test
```

### Integration Tests
```bash
# Start services first
docker-compose up -d

# Run integration tests
npm run test:integration
```

## Docker

### Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f service

# Stop all services
docker-compose down

# Rebuild service
docker-compose build service
```

### Services

- **service:** Onboarding API (port 3000)
- **mongodb:** MongoDB database (port 27017)
- **kafka:** Kafka broker (port 9092)
- **zookeeper:** Kafka coordinator (port 2181)

## Environment Variables

```bash
# Server
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=onboarding-service

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=onboarding-service
KAFKA_TOPIC=user-onboarding
```

## Project Structure

```
onboarding-service/
├── src/
│   ├── domain/
│   │   ├── entities/User.ts
│   │   ├── repositories/IUserRepository.ts
│   │   └── events/IEventPublisher.ts
│   ├── application/
│   │   └── services/UserService.ts
│   ├── infrastructure/
│   │   ├── database/MongoUserRepository.ts
│   │   └── messaging/KafkaEventPublisher.ts
│   ├── api/
│   │   ├── controllers/UserController.ts
│   │   └── routes/userRoutes.ts
│   ├── config/config.ts
│   ├── app.ts
│   └── server.ts
├── test/
│   ├── setup.ts
│   ├── unit/
│   └── integration/
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
├── package.json
├── jest.config.js
├── ARCHITECTURE.md
└── README.md
```

## Design Principles

- **SOLID:** Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY:** Don't Repeat Yourself - centralized configuration, reusable interfaces
- **Clean Code:** Descriptive names, small functions, clear separation
- **Dependency Injection:** Constructor-based injection for loose coupling
- **Interface-Driven:** Adapters implement domain interfaces (ports)

## Technology Stack

- **Runtime:** Node.js 18
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB 7
- **Messaging:** Kafka (via KafkaJS)
- **Testing:** Jest
- **Containerization:** Docker & Docker Compose

## Why This Architecture?

1. **Testability:** Interfaces enable mocking, clean boundaries for isolated testing
2. **Maintainability:** Clear structure, single responsibility, easy navigation
3. **Extensibility:** Open for extension via interfaces without modifying existing code
4. **Production Ready:** Health checks, graceful shutdown, comprehensive error handling

## Contributing

When adding features:

1. Define interfaces in `domain/` layer
2. Implement business logic in `application/` layer
3. Add adapters in `infrastructure/` layer
4. Expose via `api/` layer
5. Wire dependencies in `app.ts`
6. Add unit tests in `test/unit/`
7. Add integration tests in `test/integration/`

## License

MIT

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture and design decisions
- [API Documentation](#api-endpoints) - API contracts and examples
- [Test Structure](#testing) - Testing strategy and examples
