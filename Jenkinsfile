def registry = "harbor.cubastion.net"
def targetImage = params.targetImage
def build_num = params.build_number
def harborCred = params.harbor_cred
def argocdServer = params.argocd_server
def argocdAppName = params.argocd_appName
def argocdJenkinsDeployRole = params.argocd_jenkinsDeployRole
def argocdStatefulsetName = params.argocd_statefuleset_name

pipeline {
    agent any
    options {
        timeout(time: 59, unit: 'MINUTES')
    }

    stages {
        stage('Clone Repository') {
            steps {
                script {
                    cleanWs()
                    checkout scm
                }
            }
        }

        stage('Build Image') {
            steps {
                script {
                    env.DOCKER_OPTS = "--no-cache"
                    llmEngine = docker.build("${registry}/${targetImage}:${build_num}")
                }
            }
        }

        stage('Push Image') {
            steps {
                retry(count: 2) {
                    script {
                        docker.withRegistry("https://${registry}", "${harborCred}") {
                            llmEngine.push()
                        }
                    }
                }
            }
        }

        stage('Restart StatefulSet') {
            steps {
                retry(count: 2) {
                    withCredentials([string(credentialsId: "${argocdJenkinsDeployRole}", variable: 'ARGOCD_AUTH_TOKEN')]) {
                        sh """ARGOCD_SERVER=${argocdServer} argocd app actions run ${argocdAppName} restart --kind StatefulSet --resource-name ${argocdStatefulsetName}
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    sh "docker rmi ${registry}/${targetImage}:${build_num}"
                } catch (Exception e) {
                    echo "Docker image doesn't exist or already deleted"
                }
                cleanWs()
            }
        }
    }
}
