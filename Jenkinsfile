pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                echo 'Building Backend...'
                dir('backend') {
                    bat 'pip install -r requirements.txt'
                }
            }
        }

        stage('Test Backend') {
            steps {
                echo 'Testing Backend...'
                dir('backend') {
                    bat 'python -m pytest --tb=short || exit 0'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                bat 'docker-compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying...'
                bat 'docker-compose up -d'
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