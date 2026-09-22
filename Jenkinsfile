// Pipeline-as-code: Install -> Test -> Security scan (gate) -> Docker build -> Push
pipeline {
    agent any    // controller has Docker CLI -> DinD; used for docker build/push stages

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))
    }

    environment {
        IMAGE_NAME     = 'sandeepkumar006/nodejs-sample-app'
        IMAGE_TAG      = "${env.BUILD_NUMBER}"
        REGISTRY_CREDS = 'dockerhub-creds'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --pretty="Commit: %h %s (%an)"'
            }
        }

        stage('Install Dependencies') {
            agent { docker { image 'node:16'; reuseNode true; args '-e npm_config_cache=/tmp/.npm -e HOME=/tmp' } }
            steps {
                echo '=== STAGE: BUILD (install dependencies) ==='
                sh 'node --version && npm --version'
                sh 'npm ci --no-audit --no-fund'
            }
        }

        stage('Unit Tests') {
            agent { docker { image 'node:16'; reuseNode true; args '-e npm_config_cache=/tmp/.npm -e HOME=/tmp' } }
            steps {
                echo '=== STAGE: TEST ==='
                sh '''#!/bin/bash
                    set -o pipefail
                    npm test 2>&1 | tee test-output.log
                '''
            }
            post {
                always { archiveArtifacts artifacts: 'test-output.log, coverage/**', allowEmptyArchive: true }
            }
        }

        stage('Security Scan - Dependencies') {
            agent { docker { image 'node:16'; reuseNode true; args '-e npm_config_cache=/tmp/.npm -e HOME=/tmp' } }
            steps {
                echo '=== STAGE: SECURITY SCAN (npm audit) ==='
                sh 'npm audit --json > npm-audit-report.json || true'
                sh 'npm audit > npm-audit-report.txt || true'
                sh 'cat npm-audit-report.txt'
                // SECURITY GATE: fails the build on High or Critical findings
                sh 'npm audit --audit-level=high'
            }
            post {
                always { archiveArtifacts artifacts: 'npm-audit-report.*', allowEmptyArchive: true }
            }
        }

        stage('Docker Build') {
            steps {
                echo '=== STAGE: DOCKER IMAGE CREATION ==='
                sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest .'
                sh 'docker images ${IMAGE_NAME}'
            }
        }

        stage('Push to Registry') {
            steps {
                echo '=== STAGE: PUBLISH ==='
                withCredentials([usernamePassword(credentialsId: env.REGISTRY_CREDS,
                                                  usernameVariable: 'REG_USER',
                                                  passwordVariable: 'REG_PASS')]) {
                    sh 'echo "$REG_PASS" | docker login -u "$REG_USER" --password-stdin'
                    sh 'docker push ${IMAGE_NAME}:${IMAGE_TAG}'
                    sh 'docker push ${IMAGE_NAME}:latest'
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
            archiveArtifacts artifacts: 'package.json, package-lock.json, Dockerfile', allowEmptyArchive: true
        }
        success { echo "SUCCESS: ${IMAGE_NAME}:${IMAGE_TAG} published." }
        failure { echo 'FAILURE: check the failing stage log above (e.g. the security gate).' }
    }
}
