@echo off
echo ========================================
echo   Ecommerce DevOps Project - Startup
echo ========================================
echo.

echo [1/6] Removing old Jenkins and SonarQube containers...
docker rm -f jenkins sonarqube
echo Done!
echo.

echo [2/6] Starting Jenkins...
docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home -v //var/run/docker.sock:/var/run/docker.sock jenkins-docker
echo Done!
echo.

echo [3/6] Starting SonarQube...
docker run -d --name sonarqube -p 9000:9000 -v sonarqube_data:/opt/sonarqube/data sonarqube:lts-community
echo Done!
echo.

echo [4/6] Starting App containers...
docker rm -f ecommerce-backend ecommerce-frontend
docker-compose -f C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\docker-compose.yml up -d
echo Done!
echo.

echo [5/6] Connecting networks and fixing permissions...
timeout /t 10 /nobreak > nul
docker network connect proj_default sonarqube
docker network connect proj_default jenkins
docker exec -u root jenkins chmod 666 /var/run/docker.sock
echo Done!
echo.

echo [6/6] Starting Minikube and Kubernetes...
minikube start --driver=docker
kubectl apply -f C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\k8s\namespace.yml
kubectl apply -f C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\k8s\configmap.yml
kubectl apply -f C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\k8s\backend-deployment.yml
kubectl apply -f C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\k8s\frontend-deployment.yml
echo Done!
echo.

echo ========================================
echo   All services started successfully!
echo ========================================
echo.
echo Open these URLs in your browser:
echo   Frontend App  : http://localhost:3000
echo   Backend API   : http://localhost:8000/docs
echo   Jenkins       : http://localhost:8080
echo   SonarQube     : http://localhost:9000
echo.
echo Run this to check Kubernetes:
echo   kubectl get pods -n ecommerce
echo.
pause