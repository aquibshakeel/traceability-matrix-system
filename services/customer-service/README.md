# Customer Service Microservice

A production-ready RESTful microservice for managing customer data, built with **Spring Boot 3.x**, **Java 21**, **Gradle 8.x**, and **MongoDB**.

## 🎯 Features

- ✅ Create new customers
- ✅ List all customers
- ✅ Get customer by ID
- ✅ Filter customers by age (query parameter)
- ✅ Update customer information
- ✅ Delete customers
- ✅ **Swagger/OpenAPI 3.0** documentation
- ✅ Input validation with detailed error messages
- ✅ Global exception handling
- ✅ MongoDB integration
- ✅ Docker support
- ✅ Clean Architecture with SOLID principles

## 🏗️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 | Programming language |
| Spring Boot | 3.2.1 | Application framework |
| Gradle | 8.5 | Build tool |
| MongoDB | 7.0 | Database |
| Lombok | Latest | Reduce boilerplate code |
| MapStruct | 1.5.5 | Object mapping |
| Springdoc OpenAPI | 2.3.0 | API documentation |

## 📐 Architecture

The application follows **Clean Architecture** and **SOLID principles**:

```
┌─────────────────────────────────────────┐
│  Presentation Layer (Controller)        │  ← HTTP Requests
├─────────────────────────────────────────┤
│  Application Layer (Service)            │  ← Business Logic
├─────────────────────────────────────────┤
│  Infrastructure Layer (Repository)      │  ← Data Access
├─────────────────────────────────────────┤
│  Data Storage (MongoDB)                 │  ← Persistence
└─────────────────────────────────────────┘
```

### Design Patterns

1. **Repository Pattern** - Abstraction for data access
2. **Service Layer Pattern** - Business logic separation
3. **DTO Pattern** - API/domain model decoupling
4. **Mapper Pattern** - Object transformation
5. **Dependency Injection** - Loose coupling via constructor injection

## 📁 Project Structure

```
customer-service/
├── src/
│   ├── main/
│   │   ├── java/com/pulse/customerservice/
│   │   │   ├── controller/              # REST endpoints
│   │   │   │   └── CustomerController.java
│   │   │   ├── service/                 # Business logic
│   │   │   │   ├── CustomerService.java
│   │   │   │   └── impl/
│   │   │   │       └── CustomerServiceImpl.java
│   │   │   ├── repository/              # Data access
│   │   │   │   └── CustomerRepository.java
│   │   │   ├── model/                   # Domain entities
│   │   │   │   └── Customer.java
│   │   │   ├── dto/                     # Data Transfer Objects
│   │   │   │   ├── CustomerRequest.java
│   │   │   │   └── CustomerResponse.java
│   │   │   ├── mapper/                  # Entity-DTO mapping
│   │   │   │   └── CustomerMapper.java
│   │   │   ├── exception/               # Exception handling
│   │   │   │   ├── CustomerNotFoundException.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   ├── config/                  # Configuration
│   │   │   │   ├── SwaggerConfig.java
│   │   │   │   └── MongoConfig.java
│   │   │   └── CustomerServiceApplication.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/
│           └── com/pulse/customerservice/
│               └── CustomerServiceApplicationTests.java
├── build.gradle
├── settings.gradle
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Gradle 8.x+
- MongoDB (or Docker)

### Option 1: Run with Docker (Recommended)

```bash
cd ~/pulse/customer-service

# Start MongoDB and application
docker-compose up -d

# View logs
docker-compose logs -f customer-service

# Stop
docker-compose down
```

### Option 2: Run Locally

**1. Start MongoDB:**

```bash
# With Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or with Homebrew (macOS)
brew services start mongodb-community
```

**2. Build and run:**

```bash
cd ~/pulse/customer-service

# Build
./gradlew build

# Run
./gradlew bootRun
```

The application starts at: `http://localhost:8080/api`

### Access Swagger UI

Open your browser:
```
http://localhost:8080/api/swagger-ui.html
```

## 📡 API Endpoints

### Base URL
```
http://localhost:8080/api/v1/customers
```

### 1. Create Customer

**Request:**
```http
POST /v1/customers
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "age": 30,
  "address": "123 Main St, New York, NY 10001"
}
```

**Response: 201 Created**
```json
{
  "id": "6576a1b2c3d4e5f678901234",
  "firstName": "John",
  "lastName": "Doe",
  "age": 30,
  "address": "123 Main St, New York, NY 10001",
  "createdAt": "2025-12-08T12:00:00",
  "updatedAt": "2025-12-08T12:00:00"
}
```

### 2. Get All Customers

**Request:**
```http
GET /v1/customers
```

**Response: 200 OK**
```json
[
  {
    "id": "6576a1b2c3d4e5f678901234",
    "firstName": "John",
    "lastName": "Doe",
    "age": 30,
    "address": "123 Main St, New York, NY 10001",
    "createdAt": "2025-12-08T12:00:00",
    "updatedAt": "2025-12-08T12:00:00"
  }
]
```

### 3. Get Customers by Age

**Request:**
```http
GET /v1/customers?age=30
```

### 4. Get Customer by ID

**Request:**
```http
GET /v1/customers/{id}
```

### 5. Update Customer

**Request:**
```http
PUT /v1/customers/{id}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "age": 31,
  "address": "456 Oak Ave, Boston, MA 02101"
}
```

### 6. Delete Customer

**Request:**
```http
DELETE /v1/customers/{id}
```

**Response: 204 No Content**

## 🧪 Testing with cURL

```bash
# Create customer
curl -X POST http://localhost:8080/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "age": 28,
    "address": "789 Pine St, Los Angeles, CA 90001"
  }'

# Get all customers
curl http://localhost:8080/api/v1/customers

# Get customers by age
curl "http://localhost:8080/api/v1/customers?age=28"

# Get customer by ID
curl http://localhost:8080/api/v1/customers/{id}

# Update customer
curl -X PUT http://localhost:8080/api/v1/customers/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "age": 29,
    "address": "123 Updated St, LA, CA 90002"
  }'

# Delete customer
curl -X DELETE http://localhost:8080/api/v1/customers/{id}
```

## 🎨 SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)
- **Controller**: HTTP handling only
- **Service**: Business logic only
- **Repository**: Data access only
- **Mapper**: Object transformation only

### 2. Open/Closed Principle (OCP)
- Service interface allows extension without modification
- New features added by implementing existing interfaces

### 3. Liskov Substitution Principle (LSP)
- `CustomerService` interface substitutable with any implementation
- Polymorphism through interfaces

### 4. Interface Segregation Principle (ISP)
- Focused interfaces: `CustomerService`, `CustomerRepository`
- Clients depend only on methods they use

### 5. Dependency Inversion Principle (DIP)
- High-level modules depend on abstractions (interfaces)
- Constructor injection with `@RequiredArgsConstructor`

## ✨ Clean Code Practices

- ✅ **Meaningful names**: `CustomerService` not `CS`
- ✅ **Small functions**: Each method does one thing
- ✅ **DRY**: No code duplication
- ✅ **Exception handling**: Proper error responses
- ✅ **Logging**: Structured logging with SLF4J
- ✅ **Validation**: Input validation with Bean Validation
- ✅ **Documentation**: Comprehensive Javadoc and Swagger

## ⚙️ Configuration

Edit `src/main/resources/application.yml`:

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/customerdb  # Change MongoDB URL
      database: customerdb

server:
  port: 8080  # Change application port

logging:
  level:
    com.pulse.customerservice: DEBUG  # Change log level
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
docker ps | grep mongo

# Or test connection
mongosh mongodb://localhost:27017
```

### Build Issues

```bash
# Clean and rebuild
./gradlew clean build

# Run with debug
./gradlew bootRun --debug

# Check Java version
java -version  # Should be 21+
```

### Port Already in Use

```bash
# Change port in application.yml or use:
SERVER_PORT=8081 ./gradlew bootRun
```

## 📊 API Documentation

Swagger UI is available at:
```
http://localhost:8080/api/swagger-ui.html
```

OpenAPI JSON at:
```
http://localhost:8080/api/api-docs
```

## 🔜 Future Enhancements

1. **Security**
   - Add Spring Security
   - Implement JWT authentication
   - Role-based access control

2. **Testing**
   - Unit tests for services
   - Integration tests for controllers
   - End-to-end tests

3. **Features**
   - Pagination for list endpoints
   - Search functionality
   - Caching with Redis
   - Event-driven updates (Kafka)

4. **DevOps**
   - CI/CD pipeline (GitHub Actions)
   - Kubernetes deployment
   - Monitoring (Actuator, Prometheus, Grafana)
   - Distributed tracing (Zipkin, Jaeger)

## 📝 License

This project is licensed under the MIT License.

---

**Built with ❤️ following industry best practices**
// test comment
