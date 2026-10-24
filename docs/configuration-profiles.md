# Spring Boot Configuration Profiles Guide

This guide explains how configuration profiles are designed, structured, and activated across TaskFlow microservices.

---

## 1. Why Configuration Profiles Matter

In modern microservices development, the **exact same compiled application artifact (`.jar` or Docker image)** must be able to run across different environments:
- Your local machine for debugging.
- A local home lab server or Minikube/kind cluster.
- A cloud environment (AWS EKS with Aurora PostgreSQL).

We achieve this without modifying or recompiling source code by decoupling environment-specific values into **Spring Profiles** and **Environment Variables**.

---

## 2. Configuration Cascade

Spring Boot evaluates configuration in a strict hierarchy:
1. `application.yml`: Shared defaults common to all environments (e.g. server ports, Actuator endpoints, Flyway settings).
2. `application-{profile}.yml`: Environment overrides (e.g. local JDBC URLs, log levels).
3. **Environment Variables**: Operating system / container variables (e.g. `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`). Environment variables take highest precedence over YAML files.

---

## 3. The Three TaskFlow Profiles

### A. `localdev` (Active by default)
- **Target**: Everyday development inside IntelliJ, Eclipse, VS Code, or Maven command line.
- **Database URL**: `jdbc:postgresql://localhost:5432/auth_db`
- **Logging**: `DEBUG` for `com.taskflow.*` to easily observe SQL queries and controller requests.
- **Secrets**: Safe fallback defaults for local execution.

### B. `localserver`
- **Target**: Local Docker Compose or local Kubernetes (kind/Minikube).
- **Database URL**: `jdbc:postgresql://${DB_HOST:postgres}:${DB_PORT:5432}/${DB_NAME:auth_db}`
- **Logging**: Clean, structured `INFO` logging suitable for container log aggregation.

### C. `prod`
- **Target**: Production / AWS EKS with Amazon Aurora PostgreSQL.
- **Security**: **Zero default passwords or keys**. The application will fail fast at startup if `DB_USERNAME`, `DB_PASSWORD`, or `JWT_SECRET` are missing.
- **Connection Pooling**: Tuned HikariCP connection pool settings with SSL enforcement (`sslmode=require`).

---

## 4. How to Activate Profiles

### Via Maven Command Line:
```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=localdev
```

### Via Environment Variable (Shell, Docker, or Kubernetes):
```powershell
$env:SPRING_PROFILES_ACTIVE="localdev"
```
Or in Linux / Docker:
```bash
export SPRING_PROFILES_ACTIVE=localdev
```

### Via JVM System Property:
```powershell
java -Dspring.profiles.active=localserver -jar target/auth-service-1.0.0-SNAPSHOT.jar
```
