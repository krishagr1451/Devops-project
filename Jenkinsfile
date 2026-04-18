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

        stage('Build & Push Docker Images') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        // Dynamically build image names using your actual Docker Hub username
                        def backendImage = "${DOCKER_USER}/stayngo-backend:latest"
                        def frontendImage = "${DOCKER_USER}/stayngo-frontend:latest"
                        
                        echo "Building Images..."
                        sh "docker build -t ${backendImage} ./backend"
                        sh "docker build -t ${frontendImage} ./frontend"
                        
                        echo "Pushing Images to Docker Hub..."
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                        sh "docker push ${backendImage}"
                        sh "docker push ${frontendImage}"
                    }
                }
            }
        }

        stage('Deploy to EC2 (Docker Compose)') {
            steps {
                script {
                    // Extract SSH key and safely execute the compose pull and up commands natively on the host
                    withCredentials([
                        sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                        usernamePassword(credentialsId: env.DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
                    ]) {
                        def hostIP = "65.0.117.219" // EC2 instance IP
                        
                        // Disable strict host checking to pass via Jenkins headless node
                        sh """
                            ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@${hostIP} '
                                cd ~/stayngo && 
                                export DOCKER_USERNAME=${env.DOCKER_USER} &&
                                /usr/local/bin/docker-compose pull && 
                                /usr/local/bin/docker-compose up -d
                            '
                        """
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
