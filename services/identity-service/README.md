# Identity Service

A Spring Boot-based microservice for managing user authentication and authorization.

## Features

- **User Registration**: Register new users with email and password
- **OTP Verification**: Verify user accounts using One-Time Password (OTP)
- **User Login**: Authenticate users and generate JWT tokens
- **JWT Authentication**: Secure API endpoints using JSON Web Tokens
- **MongoDB Integration**: Store user data in MongoDB
- **Swagger Documentation**: Auto-generated API documentation

## Tech Stack

- Java 19
- Spring Boot 3.2.1
- Spring Security
- Spring Data MongoDB
- JWT (JSON Web Tokens)
- Gradle
- Docker & Docker Compose
- OpenAPI/Swagger

## Prerequisites

- Java 19 or higher
- Gradle 8.5 or higher
- MongoDB
- Docker (optional)

## Getting Started

### Running Locally

1. Start MongoDB:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

2. Build the project:
```bash
./gradlew clean build
```

3. Run the application:
```bash
./gradlew bootRun
```

The service will be available at `http://localhost:8081/api`

### Running with Docker Compose

```bash
docker-compose up --build
```

This will start both MongoDB and the Identity Service.

## API Endpoints

### 1. Register User
**POST** `/api/identity/register`

Request Body:
```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "password123",
  "phoneNumber": "+1234567890"
}
```

Response:
```json
{
  "message": "User registered successfully. Please verify OTP sent to your email.",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "isVerified": false
}
```

### 2. Verify OTP
**POST** `/api/identity/verify-otp`

Request Body:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response:
```json
{
  "message": "OTP verified successfully",
  "token": "<JWT_TOKEN>",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "isVerified": true
}
```

### 3. Login
**POST** `/api/identity/login`

Request Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "<JWT_TOKEN>",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "isVerified": true
}
```

## API Documentation

Access Swagger UI at: `http://localhost:8081/api/swagger-ui.html`

OpenAPI JSON: `http://localhost:8081/api/api-docs`

## Configuration

Key configuration properties in `application.yml`:

- `server.port`: Service port (default: 8081)
- `spring.data.mongodb.uri`: MongoDB connection URI
- `jwt.secret`: Secret key for JWT token generation
- `jwt.expiration`: JWT token expiration time in milliseconds (default: 24 hours)

## Security

- Passwords are encrypted using BCrypt
- JWT tokens are used for authentication
- OTP expires after 5 minutes
- All endpoints except authentication endpoints require JWT token

## Project Structure

```
identity-service/
├── src/
│   ├── main/
│   │   ├── java/com/pulse/identityservice/
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── dto/             # Data Transfer Objects
│   │   │   ├── exception/       # Custom exceptions
│   │   │   ├── model/           # Entity classes
│   │   │   ├── repository/      # MongoDB repositories
│   │   │   ├── service/         # Business logic
│   │   │   └── util/            # Utility classes
│   │   └── resources/
│   │       └── application.yml  # Application configuration
│   └── test/                    # Test files (to be added)
├── build.gradle                 # Gradle build configuration
├── Dockerfile                   # Docker image configuration
├── docker-compose.yml          # Docker Compose configuration
└── README.md                   # This file
```

## Building for Production

```bash
./gradlew clean build -x test
```

The JAR file will be created in `build/libs/`

## License

This project is part of the Pulse microservices ecosystem.
