# TaskFlow

> **TaskFlow** is a local-first, microservices, DevOps, Kubernetes, and cloud learning lab designed to teach end-to-end modern software engineering without requiring paid cloud infrastructure.

---

## Architecture Overview

TaskFlow consists of three decoupled Spring Boot 3 microservices and an Angular Single Page Application:

1. **`auth-service` (Port 8081)**: User registration, login, BCrypt password hashing, and JWT issuance. Owns `auth_db`.
2. **`task-service` (Port 8082)**: Task CRUD operations, user-level scoping, and status updates. Owns `task_db`.
3. **`stats-service` (Port 8083)**: Aggregated dashboard analytics via REST communication with `task-service`.
4. **`frontend` (Port 4200)**: Angular web client with authentication guards and reactive dashboard.

---

## Technology Stack

- **Language & Runtime**: Java 21 LTS
- **Backend Framework**: Spring Boot 3.3.4
- **Build Tool**: Apache Maven 3.9+ (Multi-module)
- **Database**: PostgreSQL 16
- **Database Migrations**: Flyway 10
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes (kind / Minikube)
- **Monitoring**: Prometheus & Grafana (via Spring Boot Actuator & Micrometer)
- **GitOps**: Argo CD
- **Optional Cloud Target**: AWS ECR, EKS, and Aurora PostgreSQL

---

## Directory Structure

```text
TaskFlow/
├── backend/
│   ├── pom.xml                     # Maven Multi-Module Root
│   ├── auth-service/               # Authentication & JWT Service
│   ├── task-service/               # Task Management Service
│   └── stats-service/              # Statistics & Aggregation Service
├── frontend/                       # Angular Single Page Application
├── deploy/
│   ├── compose/                    # Docker Compose files
│   ├── kubernetes/                 # Kubernetes manifests (Base & Overlays)
│   ├── monitoring/                 # Prometheus and Grafana configurations
│   └── argocd/                     # Argo CD Application manifests
├── ci/
│   └── jenkins/                    # Jenkinsfile pipelines
├── .github/
│   └── workflows/                  # GitHub Actions CI workflows
├── docs/                           # Detailed guides & learning labs
├── .gitignore
└── README.md
```

---

## Quick Start (Phase 1)

### 1. Prerequisites Check
Ensure Java 21 and Maven 3.9+ are installed:
```powershell
java -version
mvn -version
```

### 2. Compile Backend Modules
From the `TaskFlow/backend` directory:
```powershell
mvn clean compile
```

### 3. Setup PostgreSQL Databases
Create the required service databases:
```sql
CREATE DATABASE auth_db;
CREATE DATABASE task_db;
```

For comprehensive step-by-step instructions and hands-on lab exercises, see:

### Core Architecture & Environment
- [Architecture & Sequence Flows](file:///e:/Projects/task_flow_app/TaskFlow/docs/architecture.md)
- [Prerequisites & IDE Setup](file:///e:/Projects/task_flow_app/TaskFlow/docs/prerequisites.md)
- [Configuration Profiles](file:///e:/Projects/task_flow_app/TaskFlow/docs/configuration-profiles.md)
- [Learning Roadmap & Labs](file:///e:/Projects/task_flow_app/TaskFlow/docs/learning-roadmap.md)
- [Technology-to-Objective Map](file:///e:/Projects/task_flow_app/TaskFlow/docs/technology-map.md)
- [Commands Cheatsheet](file:///e:/Projects/task_flow_app/TaskFlow/docs/commands-cheatsheet.md)

### Database & Containers
- [PostgreSQL Service Setup](file:///e:/Projects/task_flow_app/TaskFlow/docs/postgresql-guide.md)
- [Flyway Migrations & History](file:///e:/Projects/task_flow_app/TaskFlow/docs/flyway-guide.md)
- [Docker & Docker Compose](file:///e:/Projects/task_flow_app/TaskFlow/docs/docker-guide.md)

### Orchestration, CI/CD & Observability
- [Local Kubernetes Deployment](file:///e:/Projects/task_flow_app/TaskFlow/docs/kubernetes-guide.md)
- [CI/CD Pipelines (Jenkins & GitHub Actions)](file:///e:/Projects/task_flow_app/TaskFlow/docs/cicd-guide.md)
- [Prometheus & Grafana Monitoring](file:///e:/Projects/task_flow_app/TaskFlow/docs/monitoring-guide.md)
- [Argo CD & GitOps](file:///e:/Projects/task_flow_app/TaskFlow/docs/argocd-gitops-guide.md)
- [General Troubleshooting Guide](file:///e:/Projects/task_flow_app/TaskFlow/docs/troubleshooting.md)

### Cloud (Optional Future Target)
- [AWS Prerequisites & Cost Breakdown](file:///e:/Projects/task_flow_app/TaskFlow/docs/aws-prerequisites-and-costs.md)
- [AWS VPC Networking & Security (IRSA)](file:///e:/Projects/task_flow_app/TaskFlow/docs/aws-networking-and-security.md)
- [AWS Deployment & GitLab CI/CD Guide](file:///e:/Projects/task_flow_app/TaskFlow/docs/aws-deployment-guide.md)
- [AWS Cloud Troubleshooting](file:///e:/Projects/task_flow_app/TaskFlow/docs/aws-troubleshooting.md)
- [AWS Teardown & Resource Cleanup](file:///e:/Projects/task_flow_app/TaskFlow/docs/aws-cleanup.md)
