# TaskFlow Docker & Docker Compose Guide

This guide explains the containerization architecture of TaskFlow, multi-stage builds, container networking, persistent storage, and operations with Docker Compose.

---

## 1. Core Concepts: Images vs Containers

- **Docker Image**: An immutable, read-only template consisting of stacked layers (e.g., base Alpine OS + JRE 21 + compiled JAR + startup instructions).
- **Docker Container**: A running, stateful instance of an image with an isolated file system, memory, CPU allocations, and network namespace.

---

## 2. Multi-Stage Builds: Why & How

In traditional Dockerfiles, developers often install build tools (like Maven or Node) in the same image that runs the app. This creates huge, bloated images (often 800MB - 1.2GB) containing compilers, build caches, and sensitive tooling.

**The TaskFlow Pattern (Multi-Stage Build)**:
1. **Stage 1 (Builder)**: Uses `maven:3.9.9-eclipse-temurin-21-alpine` (or `node:20-alpine`) to compile source code.
2. **Stage 2 (Runtime)**: Uses a minimal runtime image (`eclipse-temurin:21-jre-alpine` or `nginx:alpine`), copying *only* the compiled `.jar` or static JS/CSS bundles.

### Benefits:
- **Massive Size Reduction**: Backend images drop from ~900MB to ~180MB.
- **Enhanced Security**: Compilers and package managers are absent from the production image, minimizing the attack surface.
- **Non-Root Execution**: Runs under a custom `taskflow` system user instead of `root`.

---

## 3. Container Networking & The `localhost` Pitfall

> [!IMPORTANT]
> **Why `localhost` fails inside a container:**
> Each container has its own private loopback network (`127.0.0.1`). If `auth-service` tries to connect to `jdbc:postgresql://localhost:5432/auth_db`, it is looking for PostgreSQL *inside its own container*, which fails immediately with `Connection refused`.

### How Docker Compose Solves This:
Docker Compose sets up an isolated bridge network (`taskflow-network`). It provides an embedded DNS server that resolves **service names** to container IP addresses:
- `auth-service` connects to: `jdbc:postgresql://postgres:5432/auth_db`
- `stats-service` connects to: `http://task-service:8082`
- `frontend` Nginx reverse-proxies to: `http://auth-service:8081`

---

## 4. Volume Persistence vs Container Restarts

Containers are ephemeral: if a container is deleted or upgraded, any changes made to its writable layer are discarded.
To persist PostgreSQL data across container restarts and rebuilds, TaskFlow attaches a named Docker volume:
```yaml
volumes:
  postgres_data:
    driver: local
```
Mounted at `/var/lib/postgresql/data`. You can safely destroy, rebuild, or update the PostgreSQL container without losing user accounts or tasks.

---

## 5. Startup Commands & Operations

### Step 1: Prepare Environment File
Navigate to `deploy/compose/`:
```powershell
cd deploy/compose
copy .env.example .env
```

### Step 2: Build and Start All Services
```powershell
docker compose up -d --build
```

### Step 3: Check Container Status & Health
```powershell
docker compose ps
```
*Expected Output*:
All containers (`postgres`, `auth-service`, `task-service`, `stats-service`, `frontend`) show `Up` and `healthy`.

### Step 4: Inspecting Logs
To inspect real-time logs for a specific service:
```powershell
docker compose logs -f auth-service
docker compose logs -f task-service
```

### Step 5: Graceful Shutdown
```powershell
# Stop containers while preserving volume data
docker compose down

# Stop containers AND wipe database volumes (clean slate)
docker compose down -v
```

---

## 6. Hands-on Learning Exercises

### Exercise 1: Rebuilding a Single Service After Code Changes
When you modify code in `task-service`:
1. You do not need to restart the entire Compose stack!
2. Rebuild only `task-service`:
   ```powershell
   docker compose build task-service
   ```
3. Re-create only the `task-service` container with zero downtime for PostgreSQL:
   ```powershell
   docker compose up -d --no-deps task-service
   ```
4. Verify using `docker compose logs -f task-service`.

---

### Exercise 2: Simulated PostgreSQL Outage & Health Check Dependency
1. Observe `docker-compose.yml`: `auth-service` specifies:
   ```yaml
   depends_on:
     postgres:
       condition: service_healthy
   ```
2. Stop the PostgreSQL container:
   ```powershell
   docker compose stop postgres
   ```
3. Restart `auth-service`:
   ```powershell
   docker compose restart auth-service
   ```
4. Notice how Docker waits or flags the unhealthy dependency until PostgreSQL is restarted.
5. Restart PostgreSQL:
   ```powershell
   docker compose start postgres
   ```
   *Result*: `pg_isready` reports healthy within seconds, and `auth-service` establishes its JDBC connection and Flyway migrations automatically.
