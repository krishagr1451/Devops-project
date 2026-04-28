# 🎤 Presentation Guide — Ecommerce DevOps Project

---

## 📋 Table of Contents
- [Before Presentation Checklist](#before-presentation-checklist)
- [Startup Commands](#startup-commands)
- [Browser Tabs to Open](#browser-tabs-to-open)
- [Demo Order](#demo-order)
- [How to Show Each Technology](#how-to-show-each-technology)
- [One Line Explanation for Each Tech](#one-line-explanation-for-each-tech)
- [Common Questions & Answers](#common-questions--answers)

---

## ✅ Before Presentation Checklist

Run this **15 minutes before** your presentation:

- [ ] Docker Desktop is open and showing "Engine running"
- [ ] All 4 containers running (`docker ps`)
- [ ] http://localhost:3000 opens
- [ ] http://localhost:8080 opens (Jenkins)
- [ ] http://localhost:9000 opens (SonarQube)
- [ ] Minikube is running (`kubectl get pods -n ecommerce`)
- [ ] AWS instance is started and app is running
- [ ] GitHub repo is open in browser
- [ ] Internet connection is stable

---

## 🚀 Startup Commands

Run these commands in order before presentation:

### Step 1 — Start Jenkins and SonarQube
```cmd
docker rm -f jenkins sonarqube
docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home -v //var/run/docker.sock:/var/run/docker.sock jenkins-docker
docker run -d --name sonarqube -p 9000:9000 -v sonarqube_data:/opt/sonarqube/data sonarqube:lts-community
```

### Step 2 — Start the App
```cmd
cd C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj
docker rm -f ecommerce-backend ecommerce-frontend
docker-compose up -d
```

### Step 3 — Connect Networks
```cmd
docker network connect proj_default sonarqube
docker network connect proj_default jenkins
```

### Step 4 — Fix Docker Socket
```cmd
docker exec -u root jenkins chmod 666 /var/run/docker.sock
```

### Step 5 — Start Kubernetes
```cmd
minikube start --driver=docker
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/backend-deployment.yml
kubectl apply -f k8s/frontend-deployment.yml
```

### Step 6 — Start AWS
1. Go to https://console.aws.amazon.com
2. EC2 → Instances → Start instance
3. Copy new Public IPv4 address
4. Connect via EC2 Instance Connect
5. Run in AWS terminal:
```bash
cd Devops-project
docker-compose up -d
```

### Step 7 — Verify Everything
```cmd
docker ps
kubectl get pods -n ecommerce
```

---

## 🌐 Browser Tabs to Open

Open these tabs before presentation:

| Tab | URL | Login |
|---|---|---|
| 🛒 Local App | http://localhost:3000 | - |
| ⚙️ Backend API | http://localhost:8000/docs | - |
| 🔧 Jenkins | http://localhost:8080 | admin / your password |
| 📊 SonarQube | http://localhost:9000 | admin / your password |
| 🐙 GitHub | https://github.com/krishagr1451/Devops-project | - |
| ☁️ AWS App | http://YOUR_IP:3000 | - |

---

## 🎯 Demo Order

Follow this order for maximum impact:

```
1. GitHub Repo       → Show project structure and code
2. Local App         → Demo add/edit/delete product
3. Backend API       → Show Swagger docs
4. Docker            → Show running containers
5. Jenkins           → Trigger live build
6. SonarQube         → Show code quality results
7. Kubernetes        → Show running pods
8. Ansible           → Run playbook live
9. Terraform         → Show infrastructure plan
10. AWS              → Show live deployment
```

---

## 🛠️ How to Show Each Technology

---

### 1. 🐙 GitHub
**Open:** https://github.com/krishagr1451/Devops-project

**Show:**
- README file
- backend/ folder → Python FastAPI code
- frontend/ folder → React TypeScript code
- Jenkinsfile → CI/CD pipeline
- docker-compose.yml → container setup
- terraform/ → AWS infrastructure code
- ansible/ → server configuration
- k8s/ → Kubernetes manifests

**Say:**
> "This is my GitHub repository. Every file here is code — not just the app but also the entire infrastructure, CI/CD pipeline, and deployment configuration."

---

### 2. 🛒 Local App
**Open:** http://localhost:3000

**Demo:**
1. Show the product list with stats
2. Click "+ Add Product" → add a product live
3. Show search and filter working
4. Edit a product
5. Delete a product

**Say:**
> "This is my full stack ecommerce inventory app. The frontend is built with React TypeScript and the backend is Python FastAPI. It's running inside Docker containers."

---

### 3. ⚙️ Backend API
**Open:** http://localhost:8000/docs

**Show:**
1. All the API endpoints
2. Click GET /products/ → Execute → show response
3. Click POST /products/ → Try it out → add a product

**Say:**
> "This is the FastAPI backend with auto-generated Swagger documentation. It exposes REST API endpoints for all CRUD operations."

---

### 4. 🐳 Docker
**Run in terminal:**
```cmd
docker ps
docker images
```

**Show:**
- 4 containers running
- Docker images list

**Say:**
> "Docker packages my app into containers. You can see both frontend and backend running as separate containers. This ensures the app runs the same on any machine — my laptop, AWS, anywhere."

---

### 5. 🔧 Jenkins CI/CD
**Open:** http://localhost:8080

**Show:**
1. ecommerce-pipeline job
2. Last successful build → show pipeline stages visually
3. Click Console Output → show all stages passing

**Trigger a live build:**
```cmd
cd C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj
echo. >> README.md
git add .
git commit -m "demo: trigger pipeline"
git push
```
Then click "Build Now" and show it running live!

**Say:**
> "Every time I push code to GitHub, Jenkins automatically pulls it, runs SonarQube analysis, builds Docker images and deploys the app — completely automated, zero manual work."

---

### 6. 📊 SonarQube
**Open:** http://localhost:9000

**Show:**
1. ecommerce-devops project
2. Code quality dashboard
3. Bugs, vulnerabilities, code smells count
4. Quality rating

**Say:**
> "SonarQube automatically scans my code on every Jenkins build. It checks for bugs, security vulnerabilities and code smells. In real companies like Google and Amazon, code cannot be merged if SonarQube fails."

---

### 7. ☸️ Kubernetes
**Run in terminal:**
```cmd
kubectl get pods -n ecommerce
kubectl get services -n ecommerce
kubectl get deployments -n ecommerce
```

**Show the app via Kubernetes:**
```cmd
minikube service ecommerce-frontend-service -n ecommerce
```

**Say:**
> "Kubernetes is running 2 replicas of my backend and 2 replicas of my frontend. If one pod crashes, Kubernetes automatically restarts it. This is exactly how Netflix, Google and Amazon run their applications at scale."

---

### 8. 📋 Ansible
**Open WSL terminal and run:**
```cmd
wsl
cd /mnt/c/Users/KRISH\ AGRAWAL/OneDrive/Desktop/SemVI/Dev/proj/ansible
ansible-playbook -i inventory.ini playbook.yml --ask-become-pass
```

**Show the output:**
```
ok=7   changed=4   unreachable=0   failed=0
```

**Say:**
> "Ansible is Configuration Management as Code. Instead of manually SSHing into a server and running commands, I write a playbook that automatically installs Docker, clones the repository and starts the application on any server."

---

### 9. 🌍 Terraform
**Run in terminal:**
```cmd
cd C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\terraform
terraform plan
```

**Show the output** — it will list all AWS resources to be created.

**Say:**
> "Terraform is Infrastructure as Code. Instead of clicking around the AWS console, I write code that defines my entire infrastructure — VPC, subnet, security group, EC2 instance. Run terraform apply and everything is created automatically."

---

### 10. ☁️ AWS
**Open:** http://YOUR_IP:3000

**Also show:**
1. AWS Console → EC2 → running instance
2. Show Public IP, instance type, status

**Say:**
> "This is my app deployed live on AWS EC2. Anyone in the world can access it right now. The server was provisioned using Terraform and configured using Ansible — everything automated."

---

## 💬 One Line Explanation for Each Tech

| Technology | Say This |
|---|---|
| **React TypeScript** | "Frontend UI built with React and TypeScript" |
| **Python FastAPI** | "Backend REST API built with Python FastAPI" |
| **SQLite** | "Lightweight database to store product data" |
| **Docker** | "Packages app into containers that run anywhere" |
| **Docker Compose** | "Runs multiple containers together with one command" |
| **Jenkins** | "Automates build, test and deploy on every code push" |
| **SonarQube** | "Automatically checks code quality on every build" |
| **Terraform** | "Creates AWS infrastructure using code" |
| **Ansible** | "Configures servers automatically using playbooks" |
| **Kubernetes** | "Manages and scales containers in production" |
| **AWS EC2** | "Cloud server where the app is deployed live" |
| **GitHub** | "Version control and source of truth for all code" |

---

## ❓ Common Questions & Answers

**Q: What is the difference between Docker and Kubernetes?**
> "Docker creates and runs containers. Kubernetes manages multiple containers across multiple servers — it handles scaling, load balancing and automatic restarts."

**Q: Why use Jenkins when you can deploy manually?**
> "Manual deployment is slow and error-prone. Jenkins automates everything — every push triggers a build, test and deploy automatically. This is called CI/CD."

**Q: What is Infrastructure as Code?**
> "Instead of clicking in AWS console to create servers, you write code that describes your infrastructure. Terraform reads that code and creates everything automatically. It's repeatable, version-controlled and consistent."

**Q: Why use Ansible if Docker already handles the app?**
> "Docker handles the app containers. Ansible handles the server setup before Docker — installing Docker itself, setting up users, configuring security. They work at different levels."

**Q: What happens if a Kubernetes pod crashes?**
> "Kubernetes automatically detects the crash and starts a new pod immediately. The app never goes down because there are always 2 replicas running."

**Q: Why SonarQube?**
> "In real companies, bad code can cause security breaches or system failures. SonarQube catches these issues automatically before code goes to production."

---

## ⚠️ Common Issues & Quick Fixes

| Problem | Fix |
|---|---|
| Container name conflict | `docker rm -f ecommerce-backend ecommerce-frontend` |
| Jenkins can't reach SonarQube | `docker network connect proj_default sonarqube jenkins` |
| Permission denied Docker socket | `docker exec -u root jenkins chmod 666 /var/run/docker.sock` |
| Minikube not starting | Make sure Docker Desktop is running first |
| AWS app not loading | Check instance is running and copy new IP |
| SonarQube project missing | Run Jenkins build again to recreate it |

---

## 🏆 Key Points to Emphasize

1. **Everything is automated** — push code → Jenkins does the rest
2. **Everything is code** — infrastructure, config, pipeline all in GitHub
3. **Production grade** — same tools used by Google, Netflix, Amazon
4. **Live deployment** — app is running on real AWS cloud
5. **Code quality** — SonarQube ensures clean code automatically
6. **Scalable** — Kubernetes can scale to millions of users

---

Good luck Krish! You've built something amazing! 🎉🚀