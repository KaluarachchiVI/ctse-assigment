# Project Brief: User Microservice (Spring Boot)
[cite_start]**Module:** Current Trends in Software Engineering (SE4010) [cite: 3]
[cite_start]**Role:** Identity Provider and User Management for Movie Ticketing System [cite: 70, 72]

---

## 1. System Overview & Architecture
[cite_start]This microservice is one of four independent services in a cohesive cloud application[cite: 7, 8]. [cite_start]It serves as the primary entry point for user interactions and identity verification for other services[cite: 69].

* [cite_start]**Technology Stack:** Spring Boot (Backend), React (Frontend), SQL-based Database (`userdb`)[cite: 72].
* [cite_start]**Deployment:** Containerized using Docker and deployed to a managed cloud container service (e.g., AWS ECS or Azure Container Apps)[cite: 24, 29, 31].
* [cite_start]**Communication:** Synchronous REST integration with the **Booking Service**[cite: 70].

---

## 2. Database Schema (`userdb`)
[cite_start]The service manages the following entity structure[cite: 72]:

| Field | Description | Type/Constraint |
| :--- | :--- | :--- |
| `_id` | Unique user ID | [cite_start]Primary Key [cite: 72] |
| `name` | User full name | [cite_start]String [cite: 72] |
| `email` | User email address | [cite_start]Unique [cite: 72] |
| `passwordHash` | Encrypted password | [cite_start]BCrypt Hashed [cite: 72] |
| `phone` | Contact number | [cite_start]String [cite: 72] |
| `createdAt` | Account creation time | [cite_start]Timestamp [cite: 72] |

---

## 3. API Specifications
[cite_start]The service must implement the following endpoints to support the frontend and inter-service communication[cite: 70]:

### User Management (Frontend Facing)
* `POST /users/register`: Create a new user account.
* `POST /users/login`: Authenticate user and issue a JWT token.
* `PUT /users/{userId}`: Update profile details.
* `GET /users/history`: View booking history (via integration with Booking Service).

### Inter-Service Integration (Internal)
* [cite_start]**Consumer:** Booking Service[cite: 70].
* [cite_start]**Endpoint:** `GET /users/{userId}`[cite: 70].
* [cite_start]**Requirement:** Return user details (name, email) but **exclude** `passwordHash` to maintain security[cite: 38].

---

## 4. DevOps & DevSecOps Requirements
[cite_start]The project must adhere to strict DevOps practices to meet assessment criteria[cite: 56]:

* [cite_start]**CI/CD Pipeline:** Automated build and deployment using GitHub Actions[cite: 23].
* [cite_start]**Containerization:** Optimized multi-stage Dockerfile using a JRE-slim base image[cite: 50].
* [cite_start]**Security Scanning:** Integrate **Snyk** or **SonarCloud** (SAST) to scan code during the CI/CD process[cite: 39].
* [cite_start]**Cloud Infrastructure:** Use IAM roles and Security Groups to follow the principle of least privilege[cite: 37, 38].

---

## 5. Antigravity Agent Instructions
When processing this project, the Antigravity Agent Manager should:
1.  **Initialize Project:** Setup a Spring Boot Maven project with dependencies for Spring Web, Spring Security, Spring Data JPA, and SpringDoc OpenAPI.
2.  **Security Implementation:** Use `BCryptPasswordEncoder` for all password operations and implement a JWT-based Filter for authentication.
3.  [cite_start]**Documentation:** Automatically generate an OpenAPI/Swagger UI at `/swagger-ui.html`[cite: 49].
4.  [cite_start]**Verification:** Use browser artifacts to record a successful "Login -> JWT Received" flow for the demonstration report[cite: 55].