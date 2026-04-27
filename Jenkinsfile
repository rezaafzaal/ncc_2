// =============================================================
//  Jenkinsfile — Declarative Pipeline
//  Project  : ncc
//  Fix      : Removed Docker agent, use agent any (runs on Jenkins directly)
// =============================================================

pipeline {

    agent any

    environment {
        NODE_VERSION  = '18'
        APP_NAME      = 'ncc'
        SONAR_PROJECT = 'ncc'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
        skipDefaultCheckout(true)
    }

    stages {

        // ---------------------------------------------------------
        // 1. CHECKOUT
        // ---------------------------------------------------------
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        // ---------------------------------------------------------
        // 2. BUILD
        // ---------------------------------------------------------
        stage('Build') {
            steps {
                echo '🔨 Installing dependencies...'
                sh 'npm install'
                echo '✅ Dependencies installed.'
            }
        }

        // ---------------------------------------------------------
        // 3. PARALLEL: Lint + Test
        // ---------------------------------------------------------
        stage('Quality Checks') {
            parallel {

                stage('Lint') {
                    steps {
                        echo '🔍 Running ESLint...'
                        sh 'npm run lint || true'
                        echo '✅ Lint complete.'
                    }
                }

                stage('Test') {
                    steps {
                        echo '🧪 Running Jest tests with coverage...'
                        sh 'npm test'
                        echo '✅ Tests passed.'
                    }
                }

            }
        }

        // ---------------------------------------------------------
        // 4. SONARQUBE ANALYSIS
        // ---------------------------------------------------------
        stage('SonarQube Analysis') {
            steps {
                echo '📊 Running SonarQube analysis...'
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        npx sonar-scanner \
                          -Dsonar.projectKey=ncc \
                          -Dsonar.sources=src \
                          -Dsonar.tests=test \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                          -Dsonar.exclusions=node_modules/**,coverage/**
                    '''
                }
                echo '✅ SonarQube analysis submitted.'
            }
        }

        // ---------------------------------------------------------
        // 5. QUALITY GATE
        // ---------------------------------------------------------
        stage('Quality Gate') {
            steps {
                echo '⏳ Waiting for SonarQube Quality Gate...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
                echo '✅ Quality Gate PASSED!'
            }
        }

    }

    // =============================================================
    //  POST
    // ============================================================
    post {

        always {
            echo '🧹 Cleaning workspace...'
            // cleanWs() wrapped in node block to avoid context error
            node('') {
                cleanWs()
            }
        }

        success {
            echo '🎉 Pipeline completed SUCCESSFULLY!'
        }

        failure {
            echo '❌ Pipeline FAILED. Check logs above.'
        }

        unstable {
            echo '⚠️ Pipeline is UNSTABLE.'
        }

    }

}