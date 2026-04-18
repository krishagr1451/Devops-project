pipeline {
    agent any

    environment {
        // These credentials must be configured in Jenkins dashboard
        DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
        DOCKER_HUB_REPO = 'yourdockerhubusername/stayngo'
        KUBECONFIG_CREDNTIALS_ID = 'k8s-config'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Code Quality Check') {
            environment {
                // Ensure SonarQube Scanner is configured in 'Global Tool Configuration'
                scannerHome = tool 'SonarQubeScanner'
            }
            steps {
                // 'SonarQubeServer' must match the name in Jenkins 'Configure System'
                withSonarQubeEnv('SonarQubeServer') {
                    sh "${scannerHome}/bin/sonar-scanner"
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    echo "Building Backend Image..."
                    sh "docker build -t ${DOCKER_HUB_REPO}-backend:latest ./backend"
                    
                    echo "Building Frontend Image..."
                    sh "docker build -t ${DOCKER_HUB_REPO}-frontend:latest ./frontend"
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    // Logs into DockerHub to push the images
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                        sh "docker push ${DOCKER_HUB_REPO}-backend:latest"
                        sh "docker push ${DOCKER_HUB_REPO}-frontend:latest"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Assumes a Secret text/file in Jenkins containing the Kubeconfig YAML
                    withCredentials([file(credentialsId: env.KUBECONFIG_CREDNTIALS_ID, variable: 'KUBECONFIG_FILE')]) {
                        sh "export KUBECONFIG=\$KUBECONFIG_FILE"
                        sh "kubectl apply -f k8s/configmap.yaml"
                        // Secrets should typically be managed externally, this is for demonstration
                        sh "kubectl apply -f k8s/backend.yaml"
                        sh "kubectl apply -f k8s/frontend.yaml"
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution finished.'
            // Clean up credentials and workspace if necessary
        }
        success {
            echo 'Deployment successful! Application successfully rolled out to Kubernetes cluster.'
        }
        failure {
            echo 'Deployment failed! Please check the Jenkins and SonarQube logs.'
        }
    }
}
