# TaskFlow Technology Map

This document maps every technology used in TaskFlow to its purpose, where it is implemented in the repository, and the primary exercises used to master it.

| Technology | Purpose | Codebase Location | Hands-On Exercises |
| :--- | :--- | :--- | :--- |
| **Java 21 LTS** | Core backend language | `backend/**/src/main/java/` | Records, Pattern matching, Virtual thread readiness. |
| **Spring Boot 3.3.4** | Microservices framework | `backend/pom.xml` | Actuator endpoints, JPA validation, profile management. |
| **PostgreSQL 16** | Relational persistence | `deploy/compose/init-db/`, `deploy/kubernetes/postgres/` | Table constraints, separate databases per service. |
| **Flyway 10** | Schema migration versioning | `backend/**/src/main/resources/db/migration/` | Versioned migrations (`V1__...`), checksum validation, repair drills. |
| **Angular 18+** | Frontend SPA | `frontend/src/app/` | Standalone components, reactive signals, HTTP interceptors. |
| **Docker** | Containerization | `backend/**/Dockerfile`, `frontend/Dockerfile` | Multi-stage builds, non-root users, container layer caching. |
| **Docker Compose** | Multi-container local orchestration | `deploy/compose/docker-compose.yml` | Service discovery via DNS, health checks, named persistent volumes. |
| **Kubernetes (kind / Minikube)** | Production-grade container orchestration | `deploy/kubernetes/` | Deployments, Services, ConfigMaps, Secrets, PVCs, Ingress, rolling updates. |
| **Jenkins** | Continuous Integration | `ci/jenkins/Jenkinsfile` | Declarative pipelines, automated unit test gates, container builds. |
| **GitHub Actions** | Alternative CI engine | `.github/workflows/ci.yml` | Multi-job matrix testing, artifact collection. |
| **Prometheus** | Time-series metrics collection | `deploy/monitoring/prometheus/` | Scrape configs, PromQL rate/latency metrics, Actuator scraping. |
| **Grafana** | Operational dashboard visualization | `deploy/monitoring/grafana/` | Visual graphs, JVM heap monitors, p95 latencies, dark mode panels. |
| **Argo CD** | GitOps Continuous Delivery | `deploy/argocd/` | Automated sync, drift detection, self-healing, declarative Git commits. |
| **Amazon ECR** | Cloud container registry | `docs/aws-deployment-guide.md` | Immutable image tags, Docker authentication. |
| **Amazon EKS** | Managed cloud Kubernetes | `docs/aws-deployment-guide.md` | `eksctl` cluster configs, IAM Roles for Service Accounts (IRSA). |
| **Amazon Aurora** | Managed PostgreSQL cluster | `docs/aws-deployment-guide.md` | DB subnet groups, private subnet security groups, cloud Flyway execution. |
| **GitLab CI/CD** | Enterprise CI/CD pipeline | `docs/aws-deployment-guide.md` | GitLab runner stages, OIDC authentication to ECR, GitOps repo updates. |
