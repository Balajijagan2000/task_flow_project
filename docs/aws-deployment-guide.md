# TaskFlow AWS Deployment & GitLab CI/CD Guide

This guide provides end-to-end instructions for deploying TaskFlow to AWS (**Amazon ECR**, **Amazon EKS**, and **Amazon Aurora PostgreSQL**) and details the **GitLab CI/CD GitOps workflow** commonly used in enterprise environments.

---

## 1. Amazon ECR: Container Registry Setup

Amazon Elastic Container Registry (ECR) stores our production container images.

### Step 1: Create ECR Repositories
```bash
AWS_REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws ecr create-repository --repository-name taskflow-auth-service --image-tag-mutability IMMUTABLE --region $AWS_REGION
aws ecr create-repository --repository-name taskflow-task-service --image-tag-mutability IMMUTABLE --region $AWS_REGION
aws ecr create-repository --repository-name taskflow-stats-service --image-tag-mutability IMMUTABLE --region $AWS_REGION
aws ecr create-repository --repository-name taskflow-frontend --image-tag-mutability IMMUTABLE --region $AWS_REGION
```
*(Setting `--image-tag-mutability IMMUTABLE` guarantees that an image tag like `v1.0.0` cannot be overwritten, ensuring tamper-proof auditability).*

### Step 2: Authenticate Docker to ECR
```bash
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

### Step 3: Tag and Push Local Images
```bash
ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
VERSION="v1.0.0"

# Tag
docker tag taskflow-auth-service:latest $ECR_REGISTRY/taskflow-auth-service:$VERSION
docker tag taskflow-task-service:latest $ECR_REGISTRY/taskflow-task-service:$VERSION
docker tag taskflow-stats-service:latest $ECR_REGISTRY/taskflow-stats-service:$VERSION
docker tag taskflow-frontend:latest $ECR_REGISTRY/taskflow-frontend:$VERSION

# Push
docker push $ECR_REGISTRY/taskflow-auth-service:$VERSION
docker push $ECR_REGISTRY/taskflow-task-service:$VERSION
docker push $ECR_REGISTRY/taskflow-stats-service:$VERSION
docker push $ECR_REGISTRY/taskflow-frontend:$VERSION
```

---

## 2. Amazon EKS: Cluster Provisioning

We use `eksctl` to provision an EKS cluster with managed node groups.

Save this configuration as `eks-cluster.yaml`:
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: taskflow-eks
  region: us-east-1
  version: "1.30"

managedNodeGroups:
  - name: taskflow-workers
    instanceType: t3.medium
    desiredCapacity: 2
    minSize: 2
    maxSize: 4
    volumeSize: 30
    iam:
      withAddonPolicies:
        albIngress: true
        cloudWatch: true
```

### Provision the Cluster:
```bash
eksctl create cluster -f eks-cluster.yaml
```
*(Takes approximately 12–15 minutes. It configures the VPC, subnets, control plane, and joins the worker nodes).*

### Configure `kubectl` Context:
```bash
aws eks update-kubeconfig --region us-east-1 --name taskflow-eks
kubectl get nodes
```

---

## 3. Amazon Aurora PostgreSQL Provisioning

### Step 1: Create DB Subnet Group
```bash
aws rds create-db-subnet-group \
    --db-subnet-group-name taskflow-db-subnet-group \
    --db-subnet-group-description "Subnets for TaskFlow Aurora cluster" \
    --subnet-ids "subnet-xxxxx1" "subnet-xxxxx2"
```

### Step 2: Create Aurora PostgreSQL Cluster
```bash
aws rds create-db-cluster \
    --db-cluster-identifier taskflow-aurora-cluster \
    --engine aurora-postgresql \
    --engine-version 16.1 \
    --master-username postgres \
    --master-user-password "ReplaceWithStrongPassword123!" \
    --db-subnet-group-name taskflow-db-subnet-group \
    --vpc-security-group-ids "sg-db-id"
```

### Step 3: Database Endpoint Integration
Once created, Aurora provides a cluster writer endpoint:
`taskflow-aurora-cluster.cluster-xxxxxx.us-east-1.rds.amazonaws.com`

Update the Kubernetes `taskflow-config` ConfigMap on EKS:
```yaml
DB_HOST: "taskflow-aurora-cluster.cluster-xxxxxx.us-east-1.rds.amazonaws.com"
DB_PORT: "5432"
SPRING_PROFILES_ACTIVE: "prod"
```
When `auth-service` and `task-service` pods boot up in EKS, **Flyway** automatically executes against Aurora PostgreSQL, creating the exact same schemas without manual intervention!

---

## 4. Workplace Pipeline: GitLab CI/CD and GitOps

In many enterprises (including your workplace), **GitLab CI/CD** handles continuous integration and image publishing, while **Argo CD** reconciles workloads on Amazon EKS.

Here is the production-pattern `.gitlab-ci.yml` pipeline:

```yaml
stages:
  - test
  - package
  - gitops-release

variables:
  AWS_DEFAULT_REGION: us-east-1
  DOCKER_DRIVER: overlay2

# ----------------------------------------------------
# 1. Test Stage (Java 21)
# ----------------------------------------------------
backend-test:
  stage: test
  image: maven:3.9.9-eclipse-temurin-21-alpine
  script:
    - cd backend
    - mvn clean test
  artifacts:
    reports:
      junit: backend/**/target/surefire-reports/*.xml

# ----------------------------------------------------
# 2. Package Stage (Build & Push to Amazon ECR)
# ----------------------------------------------------
build-ecr-images:
  stage: package
  image: docker:24-dind
  services:
    - docker:24-dind
  before_script:
    - apk add --no-cache aws-cli
    - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  script:
    - ECR_REG="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
    - TAG="$CI_COMMIT_SHORT_SHA"
    # Build & Push auth-service
    - docker build -t $ECR_REG/taskflow-auth-service:$TAG -f backend/auth-service/Dockerfile backend
    - docker push $ECR_REG/taskflow-auth-service:$TAG
    # Build & Push task-service
    - docker build -t $ECR_REG/taskflow-task-service:$TAG -f backend/task-service/Dockerfile backend
    - docker push $ECR_REG/taskflow-task-service:$TAG
  only:
    - main

# ----------------------------------------------------
# 3. GitOps Release Stage (Update GitOps Repo)
# ----------------------------------------------------
update-gitops-manifest:
  stage: gitops-release
  image: alpine/git:latest
  script:
    # Clone deployment repository
    - git clone https://oauth2:$GITOPS_REPO_TOKEN@gitlab.com/your-org/taskflow-gitops.git
    - cd taskflow-gitops
    # Update image tags in Kustomization or Deployment YAML
    - sed -i "s|image: .*/taskflow-auth-service:.*|image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/taskflow-auth-service:$CI_COMMIT_SHORT_SHA|g" deploy/overlays/prod/auth-deployment.yaml
    - git config user.email "ci-bot@taskflow.com"
    - git config user.name "GitLab CI Bot"
    - git commit -am "chore(release): update images to commit $CI_COMMIT_SHORT_SHA [skip ci]"
    - git push origin main
  only:
    - main
```

### The Argo CD Reconciliation in EKS:
1. Argo CD is installed in the EKS cluster.
2. It polls the `taskflow-gitops` repository.
3. As soon as the `update-gitops-release` job pushes the new commit, Argo CD detects the updated image tag and initiates a zero-downtime rolling update on EKS!
