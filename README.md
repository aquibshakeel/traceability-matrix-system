# Microservices QA Framework

A production-ready microservices architecture with comprehensive E2E testing, automated traceability matrix, and clean architecture principles.

## 🏗️ Architecture Overview

```
microservices-qa-framework/
├── onboarding-service/      # User onboarding microservice
├── identity-service/        # User identity/profile microservice
├── qa/                      # E2E test framework with traceability matrix
├── docker-compose.yml       # Service orchestration
└── package.json            # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm 9+

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Services
```bash
npm run start:services
```

This starts:
- MongoDB (port 27017)
- Kafka + Zookeeper (port 9092)
- Onboarding Service (port 3000)

### 3. Verify Services
```bash
# Check health
curl http://localhost:3000/health

# Create test user
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### 4. Run Tests
```bash
# E2E tests with traceability matrix
npm run test:e2e

# All unit + E2E tests
npm run test:all

# Individual service tests
npm run test:onboarding
npm run test:identity
```

---

## 📦 Services

### Onboarding Service
**Port:** 3000  
**Endpoints:**
- `POST /api/user` - Create user
- `GET /api/user/:id` - Get user
- `GET /health` - Health check

**Features:**
- MongoDB persistence
- Kafka event publishing
- Clean architecture (Domain → Application → Infrastructure → API)
- Comprehensive unit tests

### Identity Service
**Port:** 4000 (when standalone)  
**Endpoints:**
- `POST /api/profile` - Create profile
- `GET /api/profile/:id` - Get profile
- `PUT /api/profile/:id` - Update profile
- `DELETE /api/profile/:id` - Delete profile

**Features:**
- Profile management
- MongoDB persistence
- Clean architecture
- Full CRUD operations

---

## 🧪 QA Framework

The QA framework provides:
- ✅ **E2E Test Suite** (5 test files, 20+ scenarios)
- ✅ **Automated Traceability Matrix** with gap analysis
- ✅ **HTML Reports** with interactive UI
- ✅ **Selective Test Execution** (case, file, folder modes)
- ✅ **Docker Support** for isolated testing
- ✅ **Unit Test Mapping** to business scenarios

### Test Execution

**From QA directory:**
```bash
cd qa

# Run all tests
npm test

# Run single test case
npm run test:case TS001

# Run specific file
npm run test:file e2e/onboarding/ts002_create_user_negative.spec.ts

# Run test folder
npm run test:folder onboarding

# Run in Docker
npm run test:docker
```

### Reports Generated

Every test run automatically generates:
1. **Test Report** - `qa/reports/html/test-report-*.html`
2. **Traceability Matrix** - `qa/reports/html/traceability-matrix-*.html`

Reports include:
- Pass/fail statistics
- Coverage metrics (57% currently)
- Gap analysis (P0/P1/P2 priorities)
- Unit test mappings
- Scenario-to-test traceability

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Services | 2 (onboarding, identity) |
| E2E Tests | 5 files, 20+ scenarios |
| Unit Tests | 10 tests |
| Test Coverage | 57% (4/7 scenarios) |
| Priority Gaps | 2 P1, 0 P0 |
| Documentation | 100% |

---

## 🛠️ Development

### Build Services
```bash
# Build all
npm run build:all

# Build individual
npm run build:onboarding
npm run build:identity
```

### Run in Development Mode
```bash
# Onboarding service
npm run dev:onboarding

# Identity service
npm run dev:identity
```

### Stop Services
```bash
npm run stop:services
```

### Clean Reports
```bash
npm run clean
```

---

## 📁 Repository Structure

```
.
├── onboarding-service/
│   ├── src/
│   │   ├── domain/           # Business entities & interfaces
│   │   ├── application/      # Use cases & business logic
│   │   ├── infrastructure/   # DB, Kafka, external systems
│   │   ├── api/             # Controllers & routes
│   │   └── config/          # Configuration
│   ├── test/unit/           # Unit tests
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── identity-service/
│   ├── src/                 # Same structure as onboarding
│   ├── test/unit/
│   ├── package.json
│   └── tsconfig.json
│
├── qa/
│   ├── tests/
│   │   └── e2e/
│   │       ├── onboarding/  # Onboarding E2E tests
│   │       └── identity/    # Identity E2E tests
│   ├── matrix/              # Traceability matrix automation
│   ├── reports/             # Generated HTML reports
│   ├── scripts/             # Test execution scripts
│   └── package.json
│
├── docker-compose.yml       # Service orchestration
├── package.json            # Root workspace config
└── README.md               # This file
```

---

## 🎯 Key Features

### 1. Clean Architecture
- **Domain Layer**: Pure business logic, no dependencies
- **Application Layer**: Use cases, orchestration
- **Infrastructure Layer**: DB, messaging, external systems
- **API Layer**: HTTP controllers, routes

### 2. Automated Testing
- Unit tests for all layers
- E2E tests for all critical paths
- Automated test-to-scenario mapping
- Gap detection and reporting

### 3. Traceability Matrix
- Real-time coverage analysis
- Priority-based gap detection (P0/P1/P2)
- Unit test to scenario mapping
- HTML reports with interactive UI

### 4. Docker Support
- Multi-container setup with orchestration
- Health checks for all services
- Isolated test execution
- Production-ready configuration

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture deep dive
- **[qa/README.md](./qa/README.md)** - QA framework documentation
- **[onboarding-service/](./onboarding-service/)** - Service-specific docs
- **[identity-service/](./identity-service/)** - Service-specific docs

---

## 🧩 Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18 |
| Language | TypeScript |
| API Framework | Express.js |
| Database | MongoDB 7 |
| Messaging | Kafka |
| Testing | Jest (unit), Mocha/Chai (E2E) |
| Reports | Mochawesome |
| Container | Docker & Docker Compose |

---

## 🔍 Test Coverage Details

### Covered Scenarios (57%)
- ✅ HF001: Create user happy path
- ✅ NF001: Missing email validation
- ✅ NF004: Duplicate email handling
- ✅ NF005: Invalid email format

### High Priority Gaps (P1)
- 🟡 NF003: Malformed JSON handling
- 🟡 KAF003: Kafka timeout scenarios

---

## 🤝 Contributing

1. Follow clean architecture principles
2. Write unit tests for all business logic
3. Add E2E tests for user-facing features
4. Update traceability matrix mappings
5. Run full test suite before committing

---

## 📜 License

MIT

---

## 🚦 Status

✅ **Production Ready**
- All services containerized
- Health checks configured
- E2E tests passing
- Traceability matrix automated
- Documentation complete

**Last Updated:** December 5, 2025
