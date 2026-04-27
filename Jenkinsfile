// =============================================================
//  Jenkinsfile — Declarative Pipeline
//  Project  : CI/CD Demo (Node.js)
//  Features : Build · Lint+Test (parallel) · SonarQube · Quality Gate
// =============================================================

pipeline {

    // ----- Agent -----------------------------------------------
    agent any

    // ----- Environment Variables --------------------------------
    // Credentials are stored in Jenkins Credentials Manager.
    // SONAR_TOKEN  → Secret Text credential ID: "sonarqube-token"
    // The SonarQube server name "SonarQube" must match exactly
    // what you set in: Manage Jenkins → Configure System → SonarQube servers
    environment {
        NODE_VERSION   = '18'
        APP_NAME       = 'ncc'
        SONAR_PROJECT  = 'ncc'
        // sonarqube() wrapper injects SONAR_HOST_URL + SONAR_AUTH_TOKEN
    }

    // ----- Global Options ---------------------------------------
    options {
        // Keep only the last 10 builds to save disk space
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Timeout the entire pipeline after 15 minutes
        timeout(time: 15, unit: 'MINUTES')
        // Prepend each log line with a timestamp
        timestamps()
        // Do NOT checkout SCM automatically (we do it explicitly)
        skipDefaultCheckout(true)
    }

    // =============================================================
    //  STAGES
    // =============================================================
    stages {

        // ---------------------------------------------------------
        // 1. CHECKOUT
        // ---------------------------------------------------------
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
                // Print the commit SHA for traceability
                sh 'git log -1 --oneline'
            }
        }

        // ---------------------------------------------------------
        // 2. BUILD  (install dependencies)
        // ---------------------------------------------------------
        stage('Build') {
            steps {
                echo '🔨 Installing dependencies...'
                // --ci is stricter than --install:
                //   • uses package-lock.json exactly
                //   • fails if lock file is out of sync
                sh 'npm ci'
                echo '✅ Dependencies installed successfully.'
            }
        }

        // ---------------------------------------------------------
        // 3. PARALLEL: Lint + Test
        //    Both jobs run simultaneously to save time.
        // ---------------------------------------------------------
        stage('Quality Checks') {
            parallel {

                // --- 3a. Lint ----------------------------------------
                stage('Lint') {
                    steps {
                        echo '🔍 Running ESLint...'
                        // "|| true" prevents lint warnings from failing
                        // the build immediately (SonarQube will catch issues too)
                        sh 'npm run lint || true'
                        echo '✅ Lint complete.'
                    }
                }

                // --- 3b. Test + Coverage -----------------------------
                stage('Test') {
                    steps {
                        echo '🧪 Running Jest tests with coverage...'
                        sh 'npm test'
                        echo '✅ Tests passed.'
                    }
                    post {
                        always {
                            // Publish JUnit-style test results (requires
                            // jest-junit reporter — see note in README)
                            // junit 'coverage/junit.xml'

                            // Publish HTML coverage report in Jenkins UI
                            publishHTML(target: [
                                allowMissing         : false,
                                alwaysLinkToLastBuild: true,
                                keepAll              : true,
                                reportDir            : 'coverage/lcov-report',
                                reportFiles          : 'index.html',
                                reportName           : 'Coverage Report'
                            ])
                        }
                    }
                }

            } // end parallel
        } // end Quality Checks

        // ---------------------------------------------------------
        // 4. SONARQUBE ANALYSIS
        //    The withSonarQubeEnv() wrapper automatically injects:
        //      • SONAR_HOST_URL
        //      • SONAR_AUTH_TOKEN
        //    using the server name configured in Jenkins.
        // ---------------------------------------------------------
        stage('SonarQube Analysis') {
            steps {
                echo '📊 Running SonarQube analysis...'
                withSonarQubeEnv('SonarQube') {
                    // sonar-scanner reads sonar-project.properties
                    // and uploads results to SonarQube server
                    sh '''
                        npx sonar-scanner \
                          -Dsonar.projectKey=${SONAR_PROJECT} \
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
        //    Wait for SonarQube to finish processing, then check
        //    if the project passed or failed the Quality Gate.
        //    Pipeline FAILS if Quality Gate status is not OK.
        // ---------------------------------------------------------
        stage('Quality Gate') {
            steps {
                echo '⏳ Waiting for SonarQube Quality Gate result...'
                // abortPipeline: true  → marks build as FAILED (not just UNSTABLE)
                // if Quality Gate fails
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
                echo '✅ Quality Gate PASSED!'
            }
        }

        // ---------------------------------------------------------
        // 6. DEPLOY  (placeholder — extend for your environment)
        // ---------------------------------------------------------
        stage('Deploy') {
            when {
                // Only deploy from the main branch
                branch 'main'
            }
            steps {
                echo '🚀 Deploying application...'
                // Replace this with your actual deploy command, e.g.:
                //   sh 'docker build -t ncc . && docker run -d -p 3000:3000 ncc'
                //   sh 'kubectl apply -f k8s/'
                //   sh 'scp -r . user@server:/var/www/app'
                echo '✅ Deploy step placeholder — add your deploy command above.'
            }
        }

    } // end stages

    // =============================================================
    //  POST-BUILD ACTIONS
    // =============================================================
    post {

        always {
            echo '🧹 Cleaning workspace...'
            cleanWs()
        }

        success {
            echo '🎉 Pipeline completed SUCCESSFULLY!'
            // Optional: send Slack/email notification
            // slackSend(color: 'good', message: "✅ ${APP_NAME} build #${BUILD_NUMBER} succeeded!")
        }

        failure {
            echo '❌ Pipeline FAILED. Check logs above.'
            // Optional:
            // slackSend(color: 'danger', message: "❌ ${APP_NAME} build #${BUILD_NUMBER} failed!")
            // mail to: 'team@example.com', subject: "Build Failed: ${APP_NAME}", body: "Check ${BUILD_URL}"
        }

        unstable {
            echo '⚠️ Pipeline is UNSTABLE (some tests may have failed).'
        }

    } // end post

} // end pipeline