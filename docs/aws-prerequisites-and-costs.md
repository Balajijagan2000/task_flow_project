# AWS Prerequisites & Cost Breakdown

> [!WARNING]
> **AWS deployment is 100% optional in TaskFlow.**
> All learning objectives (microservices, Docker, Kubernetes, CI/CD, monitoring, GitOps) can be fully mastered locally on your own machine without paying a single dollar to AWS.

If you eventually choose to deploy TaskFlow to AWS to gain cloud experience, read this guide thoroughly before creating any cloud resources.

---

## 1. Prerequisites Checklist

Before running any AWS commands, ensure you have:
1. An active **AWS Account** with administrative or appropriate IAM permissions.
2. **AWS CLI v2** installed and configured (`aws configure`).
3. **`eksctl`** CLI installed (the official CLI for creating Amazon EKS clusters).
4. **`kubectl`** CLI configured.
5. **Docker** installed locally to build and push container images.

---

## 2. Realistic Cost Breakdown for TaskFlow on AWS

AWS does not offer an all-inclusive free tier for production Kubernetes and managed databases. Below is an itemized breakdown of what running TaskFlow costs in the `us-east-1` region (as of 2024/2026):

| AWS Resource | Purpose in TaskFlow | Billing Model | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Amazon EKS Cluster** | Kubernetes Control Plane | Flat $0.10 per hour | **~$73.00 / month** |
| **EKS Worker Nodes** | EC2 instances (2x `t3.medium`) | ~$0.0416/hr per node | **~$60.00 / month** |
| **Amazon Aurora PostgreSQL** | Serverless v2 or `db.t4g.medium` | ~$0.08/hr minimum | **~$60.00 - $90.00 / month** |
| **NAT Gateways (x2)** | Outbound internet for private subnets | $0.045/hr + $0.045/GB | **~$65.00 / month** |
| **Application Load Balancer** | Ingress controller | $0.0225/hr + LCU charges | **~$20.00 / month** |
| **Amazon EBS Storage** | Persistent volumes for pods | $0.08 per GB-month | **~$5.00 / month** |
| **Amazon ECR** | Container image storage | $0.10 per GB-month | **< $1.00 / month** |
| **Total Estimated Spend** | Full 24/7 cloud deployment | | **~$280 - $310 / month** |

---

## 3. Cost-Optimization Tips for Learning Labs

If you run TaskFlow on AWS for hands-on practice, **never leave the cluster running 24/7**:

1. **Short Lab Sessions**: Deploy the cluster in the morning, conduct your verification tests, and execute the cleanup script in the afternoon. A 4-hour lab session costs **less than $2.00**.
2. **Use a Single NAT Gateway**: In development, use a single NAT Gateway across AZs instead of one per AZ (saves ~$32/month).
3. **Use Spot Instances for Worker Nodes**: Save up to 70% on EC2 compute costs by using Spot instances for the EKS node group:
   ```yaml
   spot: true
   instanceTypes: ["t3.medium", "t3a.medium"]
   ```
4. **Use Standard RDS PostgreSQL instead of Aurora Multi-AZ**: A small `db.t4g.micro` instance can fall within the AWS Free Tier (750 hours/month for 12 months).

---

## 4. Setting Up Cost Alerts (Mandatory First Step)

Before provisioning any resource, create a Zero-Spend / Budget Alert in the AWS Billing Console:
1. Go to **AWS Budgets** in the AWS Console.
2. Create a **Monthly Cost Budget** with a threshold of **$10.00**.
3. Configure email alerts to notify you immediately if your forecasted spend exceeds the limit.
