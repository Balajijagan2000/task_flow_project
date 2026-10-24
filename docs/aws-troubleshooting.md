# AWS Cloud Troubleshooting Guide for TaskFlow

This guide covers real-world debugging workflows, root causes, and fixes for common failures when deploying TaskFlow to AWS EKS, ECR, and Aurora.

---

## 1. ECR `ImagePullBackOff` / `ErrImagePull`

### Symptom:
Kubernetes pods fail to start with `Failed to pull image "123456789012.dkr.ecr.us-east-1.amazonaws.com/taskflow-auth-service:v1.0.0": rpc error: code = Unknown desc = Error response from daemon: pull access denied`.

### Root Causes & Fix:
1. **ECR Node IAM Policy Missing**: The EKS worker node instance role lacks `AmazonEC2ContainerRegistryReadOnly`.
   - **Fix**: Attach the managed policy to the node role:
     ```bash
     aws iam attach-role-policy --role-name <EKS-Node-Role-Name> --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
     ```
2. **Typo in Image URI or Tag**: Check if the tag matches what was actually pushed:
   ```bash
   aws ecr list-images --repository-name taskflow-auth-service --region us-east-1
   ```

---

## 2. Aurora PostgreSQL Connectivity Timeout

### Symptom:
Spring Boot pod startup hangs for 30–60 seconds, then crashes with:
`org.postgresql.util.PSQLException: The connection attempt timed out.`

### Root Cause:
The **Security Group** attached to Aurora does not permit inbound TCP 5432 from the EKS worker nodes Security Group.

### Verification & Fix:
1. Identify the worker node Security Group ID:
   ```bash
   NODE_SG=$(aws eks describe-cluster --name taskflow-eks --query "cluster.resourcesVpcConfig.clusterSecurityGroupId" --output text)
   ```
2. Add inbound rule to Aurora's Security Group:
   ```bash
   aws ec2 authorize-security-group-ingress \
       --group-id <AURORA-SECURITY-GROUP-ID> \
       --protocol tcp \
       --port 5432 \
       --source-group $NODE_SG
   ```

---

## 3. ALB Ingress 502 Bad Gateway / Unhealthy Target Group

### Symptom:
Navigating to the Application Load Balancer DNS name in your browser returns `502 Bad Gateway`.

### Root Cause:
AWS ALB target group health check is failing. ALB probes the path `/` by default, but Spring Boot backend services listen on `/actuator/health`.

### Fix:
In the Kubernetes Ingress manifest, add explicit AWS Load Balancer Controller health check annotations:
```yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/healthcheck-path: /actuator/health
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
```

---

## 4. Flyway Schema Lock Hangs During Multi-Pod Startup

### Symptom:
When 2 replicas of `auth-service` start simultaneously against a new Aurora database, one or both pods hang or exit with:
`org.flywaydb.core.internal.exception.FlywaySqlException: Waiting for lock on schema...`

### Root Cause:
PostgreSQL advisory locks prevent concurrent schema migrations. If an initial pod dies while holding the lock, subsequent pods wait indefinitely.

### Fix:
Inspect active locks in Aurora PostgreSQL:
```sql
SELECT pid, locktype, mode, granted FROM pg_locks WHERE locktype = 'advisory';
```
If needed, release the lock or set Flyway lock retry timeout in `application-prod.yml`:
```yaml
spring:
  flyway:
    lock-retry-count: 20
```
