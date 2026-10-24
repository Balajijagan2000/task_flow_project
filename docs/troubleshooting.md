# TaskFlow Troubleshooting Guide

This guide covers common issues, root causes, and verification commands encountered when running the TaskFlow microservices and Angular frontend.

---

## 1. Port Conflicts

### Symptom:
`Web server failed to start. Port 8081 (or 8082, 8083, 4200) was already in use.`

### Diagnosis & Fix on Windows:
Find which process is holding the port and kill it:
```powershell
# Check what process is listening on port 8081
netstat -ano | findstr :8081

# Terminate process by PID (e.g., if PID is 14220)
taskkill /F /PID 14220
```

---

## 2. Database Connection Refused

### Symptom:
`org.postgresql.util.PSQLException: Connection to localhost:5432 refused.`

### Root Cause:
PostgreSQL is either not running or the required database (`auth_db` or `task_db`) does not exist.

### Fix:
1. Verify PostgreSQL service status in Windows Services (`services.msc`) or start the service:
   ```powershell
   Get-Service -Name postgresql*
   ```
2. Verify both databases exist in PostgreSQL:
   ```sql
   CREATE DATABASE auth_db;
   CREATE DATABASE task_db;
   ```

---

## 3. Flyway Checksum Mismatch

### Symptom:
`FlywayValidateException: Migration checksum mismatch for migration version 1`

### Root Cause:
The SQL file `V1__...` was modified after it had already been applied to the database.

### Fix:
- **During development (disposable database)**: Drop the database, recreate it, and restart the service:
  ```sql
  DROP DATABASE auth_db;
  CREATE DATABASE auth_db;
  ```
- **In persistent environments**: Never edit applied migrations. Add a new versioned migration (e.g. `V2__...`).

---

## 4. CORS (Cross-Origin Resource Sharing) Errors

### Symptom:
`Access to fetch at 'http://localhost:8081/api/auth/login' from origin 'http://localhost:4200' has been blocked by CORS policy`

### Fix:
All TaskFlow Spring Boot services have a configured `CorsConfigurationSource` in `SecurityConfig.java` allowing `http://localhost:4200` with headers `*` and methods `GET, POST, PUT, DELETE, OPTIONS`. Ensure `SecurityConfig` is loaded and not overridden.

---

## 5. Downstream Inter-Service Communication Failure

### Symptom:
Calling `GET http://localhost:8083/api/stats/summary` returns HTTP 503 `Downstream Service Error: Unable to reach Task Service`.

### Root Cause:
`stats-service` relies on `task-service` to retrieve tasks. If `task-service` is not running on port 8082, `stats-service` catches the `RestClientException` and returns a 503 response.

### Fix:
Ensure `task-service` is started before querying `stats-service`.
