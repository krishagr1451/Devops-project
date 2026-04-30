# 🛒 Ecommerce Inventory — Full Stack DevOps Project

![CI/CD](https://img.shields.io/badge/CI%2FCD-Jenkins-blue)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED)
![SonarQube](https://img.shields.io/badge/Code%20Quality-SonarQube-4E9BCD)
![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC)
![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5)
![Python](https://img.shields.io/badge/Backend-Python%20FastAPI-009688)
![React](https://img.shields.io/badge/Frontend-React%20TypeScript-61DAFB)

A production-grade full-stack e-commerce inventory management application built with a complete DevOps pipeline — from code to deployment.

---

## 📋 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [CI/CD Pipeline](#cicd-pipeline)
- [Infrastructure](#infrastructure)
- [Kubernetes](#kubernetes)

---

## 🌟 Overview

This project demonstrates a complete DevOps workflow for a full-stack e-commerce inventory app. It covers every stage of the software delivery lifecycle — from local development to containerization, automated testing, code quality analysis, infrastructure provisioning, and container orchestration.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript |
| **Backend** | Python, FastAPI, SQLAlchemy |
| **Database** | SQLite |
| **Containerization** | Docker, Docker Compose |
| **CI/CD** | Jenkins |
| **Code Quality** | SonarQube |
| **Infrastructure as Code** | Terraform (AWS) |
| **Configuration Management** | Ansible |
| **Container Orchestration** | Kubernetes |
| **Version Control** | Git, GitHub |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   GitHub Repository                  │
└──────────────────────┬──────────────────────────────┘
                       │ Push / Webhook
                       ▼
┌─────────────────────────────────────────────────────┐
│                  Jenkins Pipeline                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Checkout │→ │SonarQube │→ │  Docker Build    │  │
│  └──────────┘  └──────────┘  └────────┬─────────┘  │
│                                        │             │
│                               ┌────────▼─────────┐  │
│                               │  Docker Deploy   │  │
│                               └──────────────────┘  │
└─────────────────────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│  Backend API     │    │   Frontend App       │
│  FastAPI :8000   │◄───│   React :3000        │
└──────────────────┘    └──────────────────────┘
```

---

## ✨ Features

- ✅ Full CRUD for product inventory (Create, Read, Update, Delete)
- ✅ RESTful API with FastAPI and auto-generated Swagger docs
- ✅ React TypeScript frontend with product cards
- ✅ Dockerized backend and frontend
- ✅ Automated Jenkins CI/CD pipeline
- ✅ SonarQube code quality analysis
- ✅ Terraform scripts for AWS EC2 provisioning
- ✅ Ansible playbooks for server configuration
- ✅ Kubernetes manifests for container orchestration

---

## 📁 Project Structure

```
ecommerce-devops/
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── main.py           # App entry point
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── routes.py         # API routes
│   │   └── database.py       # DB connection
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # Navbar
│   │   ├── pages/            # ProductList, Add, Edit
│   │   └── services/         # API calls
│   └── Dockerfile
├── k8s/                      # Kubernetes manifests
│   ├── namespace.yml
│   ├── backend-deployment.yml
│   ├── frontend-deployment.yml
│   └── configmap.yml
├── terraform/                # AWS infrastructure
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── ansible/                  # Server configuration
│   ├── playbook.yml
│   ├── inventory.ini
│   └── ansible.cfg
├── Jenkinsfile               # CI/CD pipeline
├── docker-compose.yml        # Local development
├── docker-compose.prod.yml   # Production
└── sonar-project.properties  # SonarQube config
```

---

## 🚀 Getting Started

### Prerequisites
- Git
- Docker Desktop
- Node.js v22+
- Python 3.13+

### Run Locally

**1. Clone the repo:**
```bash
git clone https://github.com/krishagr1451/Devops-project.git
cd Devops-project
```

**2. Start with Docker Compose:**
```bash
docker-compose up --build
```

**3. Access the app:**
- Frontend → http://localhost:3000
- Backend API → http://localhost:8000/docs

### Run Without Docker

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

---

## ⚙️ CI/CD Pipeline

The Jenkins pipeline runs automatically on every push to `main`:

```
Checkout → SonarQube Analysis → Docker Build → Deploy
```

| Stage | Description |
|---|---|
| **Checkout** | Pulls latest code from GitHub |
| **SonarQube Analysis** | Scans code for bugs and vulnerabilities |
| **Build Docker Images** | Builds backend and frontend images |
| **Deploy** | Spins up containers via Docker Compose |

### Setup Jenkins
```bash
docker run -d --name jenkins -p 8080:8080 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins-docker
```

---

## 🌍 Infrastructure (Terraform)

Terraform provisions the following AWS resources:
- **VPC** with public subnet
- **Internet Gateway** and Route Table
- **Security Group** (ports 22, 80, 3000, 8000)
- **EC2 Instance** (Ubuntu 22.04, t2.micro)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## 📦 Kubernetes

Deploy to a Kubernetes cluster:

```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/backend-deployment.yml
kubectl apply -f k8s/frontend-deployment.yml
```

| Resource | Replicas | Port |
|---|---|---|
| Backend Deployment | 2 | 8000 |
| Frontend Deployment | 2 | 3000 |

---

## 👨‍💻 Author

**Krish Agrawal**
- GitHub: [@krishagr1451](https://github.com/krishagr1451)

---

## 📄 License

This project is licensed under the GPL-3.0 License.demo 
