# 🚀 How to Run the Ecommerce DevOps Project

---

## 📋 Table of Contents
- [Run Locally](#run-locally)
- [Stop Locally](#stop-locally)
- [Run on AWS](#run-on-aws)
- [Stop on AWS](#stop-on-aws)
- [Update App on AWS](#update-app-on-aws)
- [Quick Reference](#quick-reference)

---

## 💻 Run Locally

### Step 1 — Start Docker Desktop
- Open **Docker Desktop** from the Start menu
- Wait until the bottom left shows **"Engine running"**

### Step 2 — Open PowerShell and navigate to project
```cmd
cd C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj
```

### Step 3 — Start Jenkins and SonarQube
```cmd
docker start jenkins sonarqube
docker exec -u root jenkins chmod 666 /var/run/docker.sock
```

### Step 4 — Start the App
```cmd
docker-compose up -d
```

### Step 5 — Verify everything is running
```cmd
docker ps
```
You should see 4 containers:
- ✅ ecommerce-frontend
- ✅ ecommerce-backend
- ✅ jenkins
- ✅ sonarqube

### Step 6 — Open in Browser

| Service | URL |
|---|---|
| 🛒 Frontend App | http://localhost:3000 |
| ⚙️ Backend API Docs | http://localhost:8000/docs |
| 🔧 Jenkins CI/CD | http://localhost:8080 |
| 📊 SonarQube | http://localhost:9000 |

---

## 🛑 Stop Locally

### Stop the app only (keep Jenkins and SonarQube running)
```cmd
cd C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj
docker-compose down
```

### Stop everything (app + Jenkins + SonarQube)
```cmd
docker stop ecommerce-frontend ecommerce-backend jenkins sonarqube
```

### Stop and remove containers completely
```cmd
docker rm -f ecommerce-frontend ecommerce-backend jenkins sonarqube
```

---

## ☁️ Run on AWS

### Step 1 — Start the EC2 Instance
1. Go to **https://console.aws.amazon.com**
2. Search for **EC2** and click it
3. Click **"Instances"** on the left
4. Select your instance `ecommerce-server`
5. Click **"Instance State" → "Start instance"**
6. Wait 1-2 minutes for status to show **"Running"**
7. Note the new **Public IPv4 address** (changes every time you start)

### Step 2 — Connect to the Instance
1. Click on your instance
2. Click **"Connect"** (top right)
3. Click **"EC2 Instance Connect"** tab
4. Click **"Connect"**
5. A browser terminal will open

### Step 3 — Start the App on AWS
In the browser terminal run:
```bash
cd Devops-project
docker-compose up -d
```

### Step 4 — Verify it's running
```bash
docker ps
```

### Step 5 — Open in Browser
Replace `YOUR_IP` with your instance's Public IPv4 address:

| Service | URL |
|---|---|
| 🛒 Frontend App | http://YOUR_IP:3000 |
| ⚙️ Backend API Docs | http://YOUR_IP:8000/docs |

---

## 🛑 Stop on AWS

### Step 1 — Stop the app (in EC2 browser terminal)
```bash
cd Devops-project
docker-compose down
```

### Step 2 — Stop the EC2 Instance (IMPORTANT — avoid charges!)
1. Go to **AWS Console → EC2 → Instances**
2. Select your instance
3. Click **"Instance State" → "Stop instance"**
4. Confirm — instance will stop in 1-2 minutes

> ⚠️ Always stop your EC2 instance when not in use to avoid charges!

---

## 🔄 Update App on AWS

When you make code changes locally and want to deploy to AWS:

### Step 1 — Push changes to GitHub (locally)
```cmd
git add .
git commit -m "your change description"
git push
```

### Step 2 — Pull and redeploy on AWS (in EC2 terminal)
```bash
cd Devops-project
git pull origin main
docker-compose down
docker-compose up --build -d
```

---

## ⚡ Quick Reference

### Start everything locally
```cmd
docker start jenkins sonarqube
docker exec -u root jenkins chmod 666 /var/run/docker.sock
cd C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj
docker-compose up -d
```

### Stop everything locally
```cmd
docker-compose down
docker stop jenkins sonarqube
```

### Fix container conflict error
```cmd
docker rm -f ecommerce-backend ecommerce-frontend
docker-compose up -d
```

### Check what's running
```cmd
docker ps
```

### View container logs
```cmd
docker logs ecommerce-backend
docker logs ecommerce-frontend
```

### Rebuild after code changes
```cmd
docker-compose down
docker rm -f ecommerce-backend ecommerce-frontend
docker-compose up --build -d
```

---

## 🌐 All URLs

### Local
| Service | URL | Login |
|---|---|---|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8000/docs | - |
| Jenkins | http://localhost:8080 | admin / your password |
| SonarQube | http://localhost:9000 | admin / your password |

### AWS
| Service | URL |
|---|---|
| Frontend | http://3.26.11.105:3000 |
| Backend API | http://3.26.11.105:8000/docs |

> ⚠️ AWS IP may change after stopping/starting the instance. Always check the current Public IPv4 in EC2 console.

---

## ❗ Common Issues & Fixes

| Problem | Fix |
|---|---|
| Container name conflict | `docker rm -f ecommerce-backend ecommerce-frontend` |
| Docker not running | Open Docker Desktop and wait for "Engine running" |
| Jenkins not opening | `docker start jenkins` then wait 1 minute |
| Permission denied (Docker socket) | `docker exec -u root jenkins chmod 666 /var/run/docker.sock` |
| AWS app not loading | Check security group has ports 3000 and 8000 open |
| AWS IP changed | Go to EC2 console and copy new Public IPv4 |