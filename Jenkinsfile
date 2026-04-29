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
                    sh '''
                        # Install Node.js if not available
                        which node || apt-get update && apt-get install -y nodejs npm
                    '''
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
                sh 'docker-compose down -v || true'
                sh 'docker system prune -f'
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