# DevOps Integration Plan for StayNGo

This plan outlines the approach to transform the StayNGo application into a fully cloud-deployable, CI/CD-enabled system using industry-standard DevOps tools.

## Proposed Sequence of Integration

To build a robust DevOps pipeline, it is best to start from the application out to the infrastructure, and finally automate the flow.

### Phase 0: Project Standardization & Preparation
- **`.env.example` Creation**: Synthesize existing environment variables into `.env.example` files for both the frontend and backend to establish a clear configuration contract.
- **Documentation Update**: Add basic setup instructions reflecting the Docker commands that will be created.

### Phase 1: Containerization (Docker)
Containerizing the applications is the foundational step because both Kubernetes and Jenkins will rely on these images.
- **Backend Dockerfile**: Build a Python image running the Flask app via Gunicorn.
- **Frontend Dockerfile**: Build a Node.js image leveraging Next.js standalone build for a smaller, optimized production footprint.
- **Validation**: Build and run both images locally to verify they can communicate.

### Phase 2: Infrastructure as Code (Terraform)
Before deploying orchestration, we need the underlying servers.
- **Terraform Configuration**: Create scripts in a new `/terraform` directory.
- **Provisioning**: We will write standard modules to provision a VM (like AWS EC2 or GCP Compute Engine) or a managed cluster that will host our Kubernetes installation.

### Phase 3: Orchestration (Kubernetes)
With containers built and infrastructure ready, we define how they run and scale.
- **Manifest Creation**: Create `/k8s/` directory.
- **Backend Deployment & Service**: Configure backend to run internally inside the cluster.
- **Frontend Deployment & Service**: Expose the Next.js frontend to the public via a LoadBalancer.
- **ConfigMaps/Secrets**: Securely inject Supabase credentials and Flask keys.

### Phase 4: Continuous Integration & Code Quality (Jenkins & SonarQube)
The final step is automating the entire process from code commit to deployment.
- **SonarQube Setup**: Add `sonar-project.properties` to the repository root for code quality rules.
- **Jenkinsfile Construction**: Define the declarative pipeline with stages: Clone → Build/Test → SonarQube Scan → Docker Build & Push → Kubernetes Apply.

## User Review Required

> [!IMPORTANT]
> **Cloud Provider Choice**: For Phase 2 (Terraform), please confirm which cloud provider you intend to use (e.g., AWS, GCP, Azure, or just generic local/Minikube for now) so I can tailor the `.tf` scripts accurately.

## Verification Plan

### Phase 1 Verification
- Execute `docker build` commands successfully.
- Prove APIs and UI load via `localhost` mapped exposed ports.

### Phase 2-4 Verification
- Execute `terraform apply` to confirm syntactical correctness and resource creation.
- Check Kubernetes resources via `kubectl get pods,svc`.
- Verify the `Jenkinsfile` stages align with standard CI/CD linting.
