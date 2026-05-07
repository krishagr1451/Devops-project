@echo off
echo ========================================
echo   Ecommerce DevOps Project - START
echo ========================================
echo.

echo [1/7] Removing old Jenkins and SonarQube containers...
docker rm -f jenkins sonarqube 2>nul
echo Done!
echo.

echo [2/7] Starting Jenkins...
docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home -v //var/run/docker.sock:/var/run/docker.sock jenkins-docker
echo Done!
echo.

echo [3/7] Starting SonarQube...
docker run -d --name sonarqube -p 9000:9000 -v sonarqube_data:/opt/sonarqube/data sonarqube:lts-community
echo Done!
echo.

echo [4/7] Starting App containers...
docker rm -f ecommerce-backend ecommerce-frontend 2>nul
cd /d "C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj"
docker-compose up -d
echo Done!
echo.

echo [5/7] Connecting networks and fixing permissions...
echo Waiting 15 seconds for containers to start...
timeout /t 15 /nobreak
docker network connect proj_default sonarqube 2>nul
docker network connect proj_default jenkins 2>nul
docker exec -u root jenkins chmod 666 /var/run/docker.sock
echo Done!
echo.

echo [6/7] Starting Minikube and Kubernetes...
minikube start --driver=docker
kubectl apply -f "C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\k8s\namespace.yml"
kubectl apply -f "C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\k8s\configmap.yml"
kubectl apply -f "C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\k8s\backend-deployment.yml"
kubectl apply -f "C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj\k8s\frontend-deployment.yml"
echo Done!
echo.

echo [7/7] Starting ngrok tunnel for Jenkins...
echo NOTE: ngrok will open in a new window - copy the URL and update GitHub webhook if IP changed
start cmd /k "cd /d C:\Users\KRISH AGRAWAL\OneDrive\Desktop\SemVI\Dev\proj && ngrok http 8080"
echo Waiting 5 seconds for ngrok to start...
timeout /t 5 /nobreak
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
echo IMPORTANT: Check ngrok window for tunnel URL
echo Update GitHub webhook if URL has changed!
echo.
pause