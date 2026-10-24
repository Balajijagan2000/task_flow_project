# TaskFlow Local Kubernetes Deployment Guide

This guide explains how to deploy, manage, scale, and troubleshoot TaskFlow in a local Kubernetes environment using **kind** (Kubernetes in Docker) or **Minikube** without requiring any paid cloud infrastructure.

---

## 1. Core Kubernetes Concepts Explained

| Concept | What It Is | Role in TaskFlow |
| :--- | :--- | :--- |
| **Namespace** | Logical partition within a cluster | Isolate all TaskFlow resources inside `namespace: taskflow`. |
| **Pod** | Smallest deployable unit (1+ containers) | Runs our Spring Boot JAR or Nginx container. |
| **Deployment** | Declarative controller managing Pods | Manages replicas (2 pods), rolling updates, and self-healing. |
| **Service (ClusterIP)** | Internal stable virtual IP + DNS name | Allows `stats-service` to discover `task-service:8082` reliably. |
| **Service (NodePort)** | Exposes service on a static port of each Node | Exposes `frontend` on port `30080` for easy local browser access. |
| **ConfigMap** | Key-value store for non-secret configuration | Injects `SPRING_PROFILES_ACTIVE`, database host, and URLs. |
| **Secret** | Stores sensitive configuration (encoded) | Injects database credentials and JWT secret. |
| **PVC** | Persistent Volume Claim | Requests durable disk storage for the PostgreSQL database. |
| **Ingress** | HTTP/HTTPS routing controller | Routes host `taskflow.local` to frontend & backend services. |

---

## 2. Cluster Setup: Choosing kind or Minikube

TaskFlow works equally well on both. Choose whichever you prefer:

### Option A: Using `kind` (Recommended for lightweight local testing)
1. **Create cluster with port mapping:**
   Save this as `kind-config.yaml`:
   ```yaml
   kind: Cluster
   apiVersion: kind.x-k8s.io/v1alpha4
   nodes:
     - role: control-plane
       extraPortMappings:
         - containerPort: 30080
           hostPort: 30080
           protocol: TCP
   ```
2. **Create the cluster:**
   ```powershell
   kind create cluster --name taskflow --config kind-config.yaml
   ```
3. **Load locally built Docker images into kind (Zero registry needed!):**
   ```powershell
   kind load docker-image taskflow-auth-service:latest --name taskflow
   kind load docker-image taskflow-task-service:latest --name taskflow
   kind load docker-image taskflow-stats-service:latest --name taskflow
   kind load docker-image taskflow-frontend:latest --name taskflow
   ```

### Option B: Using `Minikube`
1. **Start Minikube:**
   ```powershell
   minikube start --cpus 4 --memory 6144
   ```
2. **Point your Docker CLI to Minikube's Docker daemon:**
   ```powershell
   & minikube -p minikube docker-env --shell powershell | Invoke-Expression
   ```
   *(When built inside this daemon, images are immediately visible to Minikube without pushing).*

---

## 3. Deploying TaskFlow to Kubernetes

Deploy the entire stack with a single declarative command:

```powershell
cd TaskFlow/deploy/kubernetes
kubectl apply -k .
```

### Checking Rollout Status
```powershell
kubectl get pods -n taskflow
kubectl get svc -n taskflow
kubectl get pvc -n taskflow
```

**Expected Pod Output:**
```text
NAME                             READY   STATUS    RESTARTS   AGE
auth-service-75b89c744f-d9k2x    1/1     Running   0          45s
auth-service-75b89c744f-s2w81    1/1     Running   0          45s
frontend-6bc86c8db5-7nmpt        1/1     Running   0          45s
frontend-6bc86c8db5-x9z2q        1/1     Running   0          45s
postgres-5c47895cb-m8ptw         1/1     Running   0          45s
stats-service-85669b9f7f-k9x12   1/1     Running   0          45s
stats-service-85669b9f7f-w4lq0   1/1     Running   0          45s
task-service-58dc44f56f-8pql4    1/1     Running   0          45s
task-service-58dc44f56f-j5v6z    1/1     Running   0          45s
```

---

## 4. Accessing the Application

### Via NodePort (Port 30080):
- If using `kind` with port mapping: Open `http://localhost:30080` in your browser.
- If using `minikube`: Run `minikube service frontend -n taskflow` or `minikube ip`.

### Via `kubectl port-forward` (Instant direct access):
```powershell
# Forward frontend to localhost:4200
kubectl port-forward svc/frontend -n taskflow 4200:80
```

---

## 5. Probes, Rolling Updates, and Resource Limits

### Probes
- **Readiness Probe (`/actuator/health`)**: If a pod is initializing or running Flyway migrations, Kubernetes holds traffic and does not send requests until this probe returns HTTP 200.
- **Liveness Probe (`/actuator/health`)**: If a thread locks up or the JVM encounters a deadlock, Kubernetes automatically terminates and replaces the unhealthy pod.

### Resource Requests vs Limits
- **Requests** (`cpu: 100m, memory: 256Mi`): Guaranteed minimum capacity required by the Kubernetes scheduler to place the Pod onto a node.
- **Limits** (`cpu: 500m, memory: 512Mi`): Hard ceiling. If the JVM exceeds 512Mi, the Linux kernel terminates the process with status `OOMKilled` (Exit code 137).

---

## 6. Hands-on Learning Exercises

### Exercise 1: Scaling a Service Dynamically
1. Check existing replicas:
   ```powershell
   kubectl get deployment task-service -n taskflow
   ```
2. Scale `task-service` to 4 pods:
   ```powershell
   kubectl scale deployment task-service --replicas=4 -n taskflow
   ```
3. Watch the new pods boot up in real time:
   ```powershell
   kubectl get pods -n taskflow -l app=task-service -w
   ```
4. Scale back down to 2 replicas:
   ```powershell
   kubectl scale deployment task-service --replicas=2 -n taskflow
   ```

---

### Exercise 2: Simulated Configuration Failure & Troubleshooting Drill
1. Intentionally break the database password in the Secret:
   ```powershell
   kubectl set env deployment/auth-service DB_PASSWORD="wrong-password-drill" -n taskflow
   ```
2. Observe the Pod status:
   ```powershell
   kubectl get pods -n taskflow -l app=auth-service
   ```
   *Notice the pods entering `CrashLoopBackOff` or failing readiness probes!*
3. Investigate the failure using senior-engineer diagnostic commands:
   ```powershell
   # Step A: View recent Kubernetes cluster events
   kubectl describe pod -n taskflow -l app=auth-service

   # Step B: View container startup logs
   kubectl logs -n taskflow -l app=auth-service --tail=50
   ```
   *Notice the exact exception: `org.postgresql.util.PSQLException: password authentication failed for user "postgres"`*.
4. Fix the issue by rolling back the Deployment:
   ```powershell
   kubectl rollout undo deployment/auth-service -n taskflow
   kubectl rollout status deployment/auth-service -n taskflow
   ```
   *Observe the Deployment immediately heal and return to `1/1 Running`.*

---

### Exercise 3: Inspecting Internal Kubernetes DNS
Verify how services discover each other using CoreDNS:
```powershell
# Run a temporary debugging container inside the taskflow namespace
kubectl run -it --rm dns-test --image=busybox:1.36 --restart=Never -n taskflow -- nslookup task-service
```
*Expected Output*:
Resolves `task-service.taskflow.svc.cluster.local` to the exact ClusterIP of the task-service Service.
