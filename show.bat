@echo off
:start
cls
echo ========================================
echo   Ecommerce DevOps - DEMO COMMANDS
echo ========================================
echo.
echo Select what you want to demo:
echo.
echo [1] Kubernetes - Show pods and services
echo [2] Kubernetes - Open app in browser
echo [3] Kubernetes - Show dashboard
echo [4] Docker - Show running containers
echo [5] Docker - Show images
echo [6] Jenkins - Trigger live build
echo [7] Ansible - Run playbook
echo [8] Show all URLs
echo [0] Exit
echo.
set /p choice="Enter your choice: "

if "%choice%"=="1" goto kubernetes
if "%choice%"=="2" goto kubernetes_app
if "%choice%"=="3" goto kubernetes_dashboard
if "%choice%"=="4" goto docker_ps
if "%choice%"=="5" goto docker_images
if "%choice%"=="6" goto jenkins_build
if "%choice%"=="7" goto ansible
if "%choice%"=="8" goto urls
if "%choice%"=="0" goto end
goto start

:kubernetes
cls
echo.
echo ========================================
echo   KUBERNETES - Pods and Services
echo ========================================
echo.
echo --- PODS ---
kubectl get pods -n ecommerce
echo.
echo --- SERVICES ---
kubectl get services -n ecommerce
echo.
echo --- DEPLOYMENTS ---
kubectl get deployments -n ecommerce
echo.
pause
goto start

:kubernetes_app
cls
echo.
echo ========================================
echo   KUBERNETES - Opening App
echo ========================================
echo.
echo Opening app through Kubernetes LoadBalancer...
minikube service ecommerce-frontend-service -n ecommerce
echo.
pause
goto start

:kubernetes_dashboard
cls
echo.
echo ========================================
echo   KUBERNETES - Dashboard
echo ========================================
echo.
echo Opening Kubernetes Dashboard...
start cmd /k "minikube dashboard"
echo.
pause
goto start

:docker_ps
cls
echo.
echo ========================================
echo   DOCKER - Running Containers
echo ========================================
echo.
docker ps
echo.
pause
goto start

:docker_images
cls
echo.
echo ========================================
echo   DOCKER - Images and Networks
echo ========================================
echo.
echo --- IMAGES ---
docker images
echo.
echo --- NETWORKS ---
docker network ls
echo.
pause
goto start

:jenkins_build
cls
echo.
echo ========================================
echo   JENKINS - Trigger Live Build
echo ========================================
echo.
echo Making a small change to trigger Jenkins...
cd /d "C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj"
echo demo >> README.md
git add .
git commit -m "demo: trigger live pipeline"
git push
echo.
echo Done! Now go to http://localhost:8080 and click Build Now!
echo.
pause
goto start

:ansible
cls
echo.
echo ========================================
echo   ANSIBLE - Run Playbook
echo ========================================
echo.
echo Running Ansible playbook...
echo NOTE: Enter your WSL password when asked
echo.
wsl bash -c "cd /mnt/c/Users/KRISH\ AGRAWAL/OneDrive/Desktop/SemVI/Dev/proj/ansible && ansible-playbook -i inventory.ini playbook.yml --ask-become-pass"
echo.
pause
goto start

:urls
cls
echo.
echo ========================================
echo   ALL URLS
echo ========================================
echo.
echo   Frontend App  : http://localhost:3000
echo   Backend API   : http://localhost:8000/docs
echo   Jenkins       : http://localhost:8080
echo   SonarQube     : http://localhost:9000
echo   GitHub        : https://github.com/krishagr1451/Devops-project
echo   AWS App       : http://YOUR_AWS_IP:3000
echo.
echo Opening all local URLs in browser...
start http://localhost:3000
start http://localhost:8080
start http://localhost:9000
start https://github.com/krishagr1451/Devops-project
echo.
pause
goto start

:end
echo.
echo Goodbye!
pause