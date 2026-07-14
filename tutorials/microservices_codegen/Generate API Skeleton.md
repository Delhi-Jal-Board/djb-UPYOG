# Generate API Skeleton Using OpenAPI Specification

## Overview

This guide explains how to generate a Spring Boot microservice skeleton using the **DIGIT Code Generator** and an **OpenAPI (Swagger)** specification.

The development approach follows a **contract-first** methodology, where the OpenAPI specification acts as the API contract for the microservice. The DIGIT Code Generator reads the specification and generates the initial project structure, including controllers, API interfaces, models, configuration files, and other boilerplate code.

> **Note**
> The generated project is a starting point for development. Project-specific business logic and custom components must be implemented manually.

---

## Prerequisites

Ensure the following software is installed before generating a microservice.

| Software | Version |
|----------|---------|
| Java | 17 or later |
| Maven | 3.8 or later |
| Git | Latest |
| OpenAPI Specification | YAML (.yaml) |

Verify the installation.

```bash
java -version
mvn -version
git --version
```

---

## Project Directory Structure

Organize the files as shown below.

```text
microservices_codegen/
│
├── codegen/
│   └── codegen-1.0-SNAPSHOT-jar-with-dependencies.jar
│
└── swagger/
    └── water-tanker-api.yaml
```

---

## Download the DIGIT Code Generator

Download the customized DIGIT Code Generator JAR from the DIGIT GitHub repository.

**Download Link**

https://github.com/egovernments/DIGIT-OSS/blob/DIGIT_DEVELOPER_GUIDE/utilities/codegen-1.0-SNAPSHOT-jar-with-dependencies.jar

Place the downloaded JAR inside the `codegen` directory.

---

## Create the OpenAPI Specification

Create an OpenAPI (Swagger) YAML file that defines your REST APIs.

Example:

```text
microservices_codegen/
└── swagger/
    └── water-tanker-api.yaml
```

The specification should include:

- API endpoints
- HTTP methods
- Request models
- Response models
- Validations
- Error responses

---

## Generate the Microservice Skeleton

### Linux / macOS

```bash
java -jar codegen-1.0-SNAPSHOT-jar-with-dependencies.jar \
-l \
-t \
-u {CONTRACT_PATH} \
-a {PROJECT_NAME} \
-b digit
```

### Windows (Command Prompt)

```cmd
java -jar codegen-1.0-SNAPSHOT-jar-with-dependencies.jar ^
-l ^
-t ^
-u {CONTRACT_PATH} ^
-a {PROJECT_NAME} ^
-b digit
```

> **Note**
>
> - Linux/macOS uses `\` for line continuation.
> - Windows Command Prompt uses `^` for line continuation.

---

## Command Parameters

| Parameter | Description |
|-----------|-------------|
| `java -jar` | Executes the DIGIT Code Generator |
| `codegen-1.0-SNAPSHOT-jar-with-dependencies.jar` | Customized DIGIT code generation tool |
| `-l` | Enables generator-specific options |
| `-t` | Generates the project template |
| `-u` | Path or URL of the OpenAPI specification |
| `-a` | Name of the microservice to generate |
| `-b digit` | Uses the DIGIT project template |

---

## Example

### Linux

```bash
java -jar codegen-1.0-SNAPSHOT-jar-with-dependencies.jar \
-l \
-t \
-u file:///home/hp/IdeaProjects/microservices_codegen/swagger/water-tanker-api.yaml \
-a water-tanker-service \
-b digit
```

### Windows

```cmd
java -jar codegen-1.0-SNAPSHOT-jar-with-dependencies.jar ^
-l ^
-t ^
-u file:///D:/microservices_codegen/swagger/water-tanker-api.yaml ^
-a water-tanker-service ^
-b digit
```

---

## Generated Project Structure

After successful execution, the generated project structure will look similar to the following.

```text
water-tanker-service/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── model/
│   │   │   ├── repository/
│   │   │   ├── util/
│   │   │   └── web/
│   │   ├── resources/
│   │   └── web/
│   └── test/
│
├── pom.xml
├── README.md
└── .gitignore
```

The generated project typically contains:

- REST Controllers
- API Interfaces
- Model Classes
- Repository Package
- Configuration Classes
- Utility Classes
- Maven Configuration
- Standard Spring Boot Structure

---

## Current Generator Limitations

The customized DIGIT Code Generator currently generates only the basic Spring Boot microservice skeleton.

> The generator **does not automatically create** some project-specific packages and classes because the corresponding generation logic is **not implemented in the customized `SpringbootCodegen` class** inside the generator JAR.

The following components are **not generated automatically** and must be implemented manually:

- Service classes
- QueryBuilder classes
- RowMapper classes
- SQL Queries
- Search classes
- Business logic
- Persistence layer customization
- Custom utility classes

These features can be added only by extending the customized `SpringbootCodegen` implementation and corresponding templates.

---

## Next Steps

After generating the project:

1. Import the project into your preferred IDE.
2. Reload the Maven project.
3. Configure the application properties.
4. Create the missing packages.
5. Implement the business logic.
6. Add SQL queries and RowMappers.
7. Build and test the application.
8. Deploy the microservice.

---

## Development Workflow

```text
Create OpenAPI Specification
            │
            ▼
Download DIGIT Code Generator
            │
            ▼
Generate Microservice Skeleton
            │
            ▼
Import Project into IDE
            │
            ▼
Configure Project
            │
            ▼
Create Missing Packages
(Service, QueryBuilder, RowMapper)
            │
            ▼
Implement Business Logic
            │
            ▼
Build & Test
            │
            ▼
Deploy
```

---

## Benefits

- Contract-first development
- Rapid project bootstrapping
- Standardized project structure
- Reduced boilerplate code
- Consistent API implementation
- Faster onboarding for developers
- Improved maintainability
- Easy integration with the DIGIT platform

---

## References

- **DIGIT Code Generator (GitHub)**  
  https://github.com/egovernments/DIGIT-OSS/blob/DIGIT_DEVELOPER_GUIDE/utilities/codegen-1.0-SNAPSHOT-jar-with-dependencies.jar

- **OpenAPI Specification**  
  https://swagger.io/specification/
