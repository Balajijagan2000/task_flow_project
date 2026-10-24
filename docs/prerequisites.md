# Prerequisites & Environment Setup

This document outlines the tools, runtime versions, and IDE configurations required for the TaskFlow project.

---

## 1. Required Versions Matrix

| Tool | Required Version | Purpose |
| :--- | :--- | :--- |
| **Java Development Kit (JDK)** | **Java 21 LTS** | Core backend language runtime. |
| **Apache Maven** | **3.9.0+** | Multi-module build management. |
| **PostgreSQL** | **16.x** | Relational persistence for microservices. |
| **Node.js & npm** | **Node 20+ / npm 10+** | Angular frontend build & dev server. |
| **Docker & Docker Compose** | **v24+ / Compose v2+** | Local containerization (Phases 3+). |
| **Kubernetes CLI (`kubectl`)** | **v1.28+** | Cluster interaction (Phases 4+). |
| **Local Cluster Engine** | **kind or Minikube** | Local Kubernetes environment (Phase 4). |

---

## 2. Java 21 Verification

Verify your active Java installation in your terminal:

```powershell
java -version
javac -version
mvn -version
```

### Checking Which Java Version Maven Actually Uses
Maven looks at the `JAVA_HOME` environment variable rather than whichever `java.exe` happens to appear first in PATH. Check the output of `mvn -version`:
```text
Apache Maven 3.9.9 (...)
Java version: 21.0.4, vendor: Oracle Corporation, runtime: C:\Program Files\Java\jdk-21
```
Ensure that `Java version` indicates `21.x`.

---

## 3. IDE Configuration (Project SDK & Language Level)

### IntelliJ IDEA
1. Open `File` -> `Project Structure` (`Ctrl + Alt + Shift + S`).
2. Under **Project Settings** -> **Project**:
   - **SDK**: Select `21` (e.g. `jdk-21.0.4`).
   - **Language level**: Select `21 - Records, pattern matching for switch, etc.`.
3. Under **Build, Execution, Deployment** -> **Build Tools** -> **Maven** -> **Runner**:
   - **JRE**: Select `Project SDK (21)`.
4. Under **Maven** -> **Importing**:
   - **JDK for importer**: Select `Project SDK (21)`.

### VS Code
1. Install the **Extension Pack for Java** (Microsoft) and **Spring Boot Extension Pack**.
2. Open Settings (`Ctrl + ,`) and search for `java.configuration.runtimes`.
3. Ensure JDK 21 is configured as default:
   ```json
   "java.configuration.runtimes": [
     {
       "name": "JavaSE-21",
       "path": "C:\\Program Files\\Java\\jdk-21",
       "default": true
     }
   ]
   ```

---

## 4. Host Java vs Docker Container Java

- **Host Java**: The JDK installed on your Windows machine runs Maven builds, runs services in your IDE debugger, and compiles code.
- **Docker Java**: When we build container images in Phase 3, we use a container base image (`eclipse-temurin:21-jre-alpine`). The application executes inside an isolated Linux container filesystem with its own JRE, regardless of what is installed on the host OS.
