pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh "${tool 'sonar-scanner'}/bin/sonar-scanner"
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                sh 'docker-compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying...'
                sh 'docker rm -f ecommerce-backend ecommerce-frontend || true'
                sh 'docker-compose down'
                sh 'docker rm -f ecommerce-backend ecommerce-frontend || true'
                sh 'docker-compose up -d'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}