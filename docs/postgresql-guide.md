# PostgreSQL Setup & Service Databases Guide

This guide details how to configure PostgreSQL for the TaskFlow microservices.

---

## 1. Database per Service Pattern

A fundamental microservice principle is **Decoupled Data Ownership**:
- `auth-service` owns `auth_db`
- `task-service` owns `task_db`

### Why Separate Databases?
1. **Independent Scaling**: One service cannot lock or exhaust connections of another service's database.
2. **Schema Autonomy**: Changes to `users` do not require locking `tasks` tables or coordinated deployment windows.
3. **Security Boundary**: The database user for `task-service` does not have access to passwords or user tables.

---

## 2. Setting Up Databases Locally

Connect to your PostgreSQL server via `psql` or **pgAdmin**:

```sql
-- Create database for Authentication Service
CREATE DATABASE auth_db;

-- Create database for Task Service
CREATE DATABASE task_db;
```

If you prefer dedicated users:
```sql
CREATE USER taskflow_user WITH PASSWORD 'taskflow_pass';
GRANT ALL PRIVILEGES ON DATABASE auth_db TO taskflow_user;
GRANT ALL PRIVILEGES ON DATABASE task_db TO taskflow_user;
```

---

## 3. Host vs Container Networking Gotcha

When running services:
- **Host Spring Boot -> Host PostgreSQL**: Connection URL is `jdbc:postgresql://localhost:5432/auth_db`.
- **Containerized Spring Boot -> Host PostgreSQL**: `localhost` inside a Docker container refers to the container itself, NOT your Windows host! On Windows/Mac with Docker Desktop, connect via `jdbc:postgresql://host.docker.internal:5432/auth_db`.
- **Docker Compose (Both in Compose)**: Connect via service name: `jdbc:postgresql://postgres:5432/auth_db`.
