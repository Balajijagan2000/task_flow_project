# TaskFlow Commands Cheatsheet

A quick reference cheatsheet of essential commands across all tools in the TaskFlow project.

---

## 1. Maven & Backend Commands

```powershell
# Compile all modules
cd TaskFlow/backend
mvn clean compile

# Run all unit tests
mvn clean test

# Package JARs skipping tests
mvn clean package -DskipTests

# Run a specific service directly
cd auth-service
mvn spring-boot:run -Dspring-boot.run.profiles=localdev
```

---

## 2. Docker & Docker Compose Commands

```powershell
cd TaskFlow/deploy/compose

# Start the entire stack in the background with rebuild
docker compose up -d --build

# Check status and health of all containers
docker compose ps

# View real-time logs of a specific service
docker compose logs -f auth-service
docker compose logs -f task-service

# Rebuild and restart only one service with zero downtime
docker compose build task-service
docker compose up -d --no-deps task-service

# Stop all containers (preserving persistent volumes)
docker compose down

# Stop all containers AND wipe database volumes (clean reset)
docker compose down -v
```

---

## 3. Kubernetes (`kubectl`) Commands

```powershell
cd TaskFlow/deploy/kubernetes

# Deploy the entire stack using Kustomize
kubectl apply -k .

# View pods, services, PVCs in taskflow namespace
kubectl get pods -n taskflow
kubectl get svc -n taskflow
kubectl get pvc -n taskflow

# Stream logs of a deployment
kubectl logs -n taskflow -l app=auth-service -f

# Investigate a failing pod (CrashLoopBackOff / OOMKilled)
kubectl describe pod <pod-name> -n taskflow

# Scale a deployment dynamically
kubectl scale deployment task-service --replicas=4 -n taskflow

# Port-forward frontend to local port 4200
kubectl port-forward svc/frontend -n taskflow 4200:80

# Roll back a bad deployment
kubectl rollout undo deployment/auth-service -n taskflow
kubectl rollout status deployment/auth-service -n taskflow
```

---

## 4. Monitoring (Prometheus & Grafana) Commands

```powershell
cd TaskFlow/deploy/monitoring

# Start Prometheus and Grafana stack
docker compose -f docker-compose-monitoring.yml up -d

# Generate traffic loop
.\generate-traffic.ps1

# Stop monitoring stack
docker compose -f docker-compose-monitoring.yml down
```

---

## 5. Argo CD Commands

```powershell
# Create namespace and install Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Port-forward Argo CD UI to port 8085
kubectl port-forward svc/argocd-server -n argocd 8085:443

# Retrieve initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}"
```

---

## 6. AWS Cleanup Commands (When applicable)

```bash
# 1. Delete Kubernetes resources first
kubectl delete namespace taskflow

# 2. Delete EKS cluster
eksctl delete cluster --name taskflow-eks --region us-east-1

# 3. Delete Aurora DB instance and cluster
aws rds delete-db-instance --db-instance-identifier taskflow-aurora-instance-1 --skip-final-snapshot --region us-east-1
aws rds delete-db-cluster --db-cluster-identifier taskflow-aurora-cluster --skip-final-snapshot --region us-east-1

# 4. Delete ECR repositories
aws ecr delete-repository --repository-name taskflow-auth-service --force --region us-east-1
aws ecr delete-repository --repository-name taskflow-task-service --force --region us-east-1
aws ecr delete-repository --repository-name taskflow-stats-service --force --region us-east-1
aws ecr delete-repository --repository-name taskflow-frontend --force --region us-east-1
```
