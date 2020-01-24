// Global Variable so it can be changed between stages
def GIT_BRANCH_NAME=getGitBranchName()

pipeline {
  agent any
  parameters {
    string(name: 'REPOSITORY_SERVER', defaultValue: 'gcr.io/stack-test-186501', description: 'Registry server URL to pull/push images', trim: true)
    string(name: 'NAMESPACE', defaultValue: 'default', description: 'In which namespace micro services needs to be deploy', trim: true)
    string(name: 'CONNECTION_ID', defaultValue: 'test', description: 'connection id', trim: true)
    string(name: 'WORKSPACE_ID', defaultValue: 'fullstack-pro', description: 'workspace id', trim: true)
    string(name: 'UNIQUE_NAME', defaultValue: 'fullstack-pro', description: 'chart name', trim: true)
    string(name: 'HEMERA_LOG_LEVEL', defaultValue: 'info', description: 'log level for hemera')
    string(name: 'LOG_LEVEL', defaultValue: 'info', description: 'log level')
    string(name: 'DOMAIN_NAME', defaultValue: 'cdebase.io', description: 'domain of the ingress')
    string(name: 'DEPLOYMENT_PATH', defaultValue: '/servers', description: 'folder path to load helm charts')
    string(name: 'EXCLUDE_SETTING_NAMESPACE_FILTER', defaultValue: 'brigade', description: 'exclude setting namespace that matches search string')
    string(name: 'GIT_CREDENTIAL_ID', defaultValue: 'github-deploy-keys', description: 'jenkins credential id of git deploy secret')
    string(name: 'REPOSITORY_SSH_URL', defaultValue: 'git@github.com:cdmbase/fullstack-pro.git', description: 'ssh url of the git repository')
    string(name: 'REPOSITORY_BRANCH', defaultValue: 'develop', description: 'the branch of repository')
    // by default first value of the choice will be choosen
    choice choices: ['buildOnly', 'buildAndPublish', 'dev', 'stage', 'prod', 'allenv'], description: 'Where to deploy micro services?', name: 'ENV_CHOICE'
    booleanParam (defaultValue: false, description: 'Tick to enable debug mode', name: 'DEBUG')
  }

  // Setup common + secret key variables for pipeline.
  environment {
    BUILD_COMMAND = getBuildCommand()
    PYTHON='/usr/bin/python'
    GCR_KEY = credentials('jenkins-gcr-login-key')
    GCLOUDSECRETKEY = credentials('jenkins_gcp_access_key')
    GIT_PR_BRANCH_NAME = getGitPrBranchName()
  }

  // Initialize npm and docker commands using plugins
  tools {
    nodejs 'nodejs'
    'org.jenkinsci.plugins.docker.commons.tools.DockerTool' 'docker'
  }

  stages {

    stage('define environment') {
      steps {
        checkout([$class: 'GitSCM', branches: [[name: '*/'+ params.REPOSITORY_BRANCH]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'CleanBeforeCheckout']], submoduleCfg: [], userRemoteConfigs: [[credentialsId: params.GIT_CREDENTIAL_ID, url: params.REPOSITORY_SSH_URL]]])
        // env.NODEJS_HOME = "${tool 'node_v8'}"
  	    // env.PATH="${env.NODEJS_HOME}/bin:${env.PATH}"
  	    //sh 'npm --version'
      }
    }

    stage('Unlock secrets'){ //unlock keys for all runs
      environment{ deployment_env = 'dev' }
      steps{
        sh 'git-crypt unlock'
        load "./jenkins_variables.groovy"
        sh "curl -H 'Authorization: token ${env.GITHUB_ACCESS_TOKEN}' -H 'Accept: application/vnd.github.v3.raw' -O -L https://raw.githubusercontent.com/cdmbase/kube-orchestration/master/idestack/values-stage.yaml"
      }
    }

    // Install packages. If
    // a. any branch
    // b. ENV_CHOICE set not selected `dev`, `stage` or `prod`
    stage ('Install git repository'){
      when {  expression { params.ENV_CHOICE == 'allenv' || params.ENV_CHOICE == 'buildOnly' } }
       steps{
          sh """
            echo "what is docker git version $GIT_BRANCH_NAME -- ${params.ENV_CHOICE}"
            git checkout ${env.GIT_PR_BRANCH_NAME}
            npm install
            npm run lerna
          """
       }
    }

    // Run build for all cases except when ENV_CHOICE is 'buildAndPublish' and `dev`, `stage` or `prod`
    stage ('Build packages'){
      when {
        expression { GIT_BRANCH_NAME != 'devpublish' }
        expression { params.ENV_CHOICE == 'allenv' || params.ENV_CHOICE == 'buildOnly' }
      }
      steps{
        sh """
          npm run build
        """
      }
    }
    // if PR is from branch other than `develop` then merge to `develop` if we chose ENV_CHOICE as 'buildAndPublish'.
    stage ('Merge PR to `develop` branch and publish'){
      when {
        expression { params.GIT_PR_BRANCH_NAME != 'develop' }
        expression { params.ENV_CHOICE == 'buildAndPublish' }
      }
      steps{
        sh """
          git checkout develop
          git merge ${env.GIT_PR_BRANCH_NAME} -m 'auto merging'
          npm install
          npm run lerna
          npm run build
        """
        script {
          GIT_BRANCH_NAME = 'develop'
        }
      }
    }

    // publish packages to npm repository.
    // commit new package-lock.json that might get generated during install
    stage ('Publish packages'){
      when {
        expression { GIT_BRANCH_NAME == 'develop' }
        expression { params.ENV_CHOICE == 'buildOnly' ||  params.ENV_CHOICE == 'buildAndPublish' }
      }
      steps{
        script {
          GIT_BRANCH_NAME='devpublish'
        }
        sshagent (credentials: [params.GIT_CREDENTIAL_ID]) {
          sh """
            git add -A
            git diff-index --quiet HEAD || git commit -am 'auto commit'
            git fetch origin develop
            git checkout develop
            npm run devpublish:auto
            git push origin develop
            git checkout devpublish
          """
        }
      }
    }
    stage('Docker login'){
      when {
        expression { GIT_BRANCH_NAME == 'devpublish' }
      }
      steps{
        sh 'cat "$GCR_KEY" | docker login -u _json_key --password-stdin https://gcr.io'
      }
    }

    stage('Build Docker Images') {
      when {
        expression { GIT_BRANCH_NAME == 'devpublish' }
        expression { params.ENV_CHOICE == 'allenv' || params.ENV_CHOICE == 'buildOnly' || params.ENV_CHOICE == 'buildAndPublish' }
      }

      // Below variable is only set to load all (variables, functions) from jenkins_variables.groovy file.
      environment{ deployment_env = 'dev' }
        steps{
          load "./jenkins_variables.groovy"
          script {
            def servers = getDirs(pwd() + params.DEPLOYMENT_PATH)
            def parallelStagesMap = servers.collectEntries {
             ["${it}" : generateBuildStage(it)]
            }
            parallel parallelStagesMap
          }
        }
    }

  // Below are dev stages
    stage('Get Dev Secrets'){
      when {
        expression { GIT_BRANCH_NAME == 'devpublish' }
        expression { params.ENV_CHOICE == 'dev' || params.ENV_CHOICE == 'allenv' || params.ENV_CHOICE == 'buildOnly' || params.ENV_CHOICE == 'buildAndPublish' }
        beforeInput true
      }
      steps{
        sh """
          gcloud auth activate-service-account --key-file """ + GCLOUDSECRETKEY + """
          gcloud container clusters get-credentials deployment-cluster --zone us-central1-a
          helm repo update
        """
      }
    }

    stage('Dev deployment') {
      environment{ deployment_env = 'dev' }
      when {
        expression { GIT_BRANCH_NAME == 'devpublish' }
        expression { params.ENV_CHOICE == 'dev' || params.ENV_CHOICE == 'allenv' || params.ENV_CHOICE == 'buildOnly' || params.ENV_CHOICE == 'buildAndPublish' }
        beforeInput true
      }

      steps {
        script {
          def servers = getDirs(pwd() + params.DEPLOYMENT_PATH)
          def parallelStagesMap = servers.collectEntries {
           ["${it}" : generateStage(it)]
          }
          parallel parallelStagesMap
        }
      }

    } // End of dev deployment code block.

  // Below are stage code block
    stage('Get Stage Secrets'){
      options {
         timeout(time: 30, unit: 'SECONDS')
       }
      when {
        expression { GIT_BRANCH_NAME == 'devpublish' }
        expression { params.ENV_CHOICE == 'stage' || params.ENV_CHOICE == 'allenv' }
        beforeInput true
      }
      steps{
        sh """
          gcloud auth activate-service-account --key-file """ + GCLOUDSECRETKEY + """
          gcloud container clusters get-credentials deployment-cluster --zone us-central1-a
          helm repo update
        """
      }
    }

    stage('Stage deployment') {
      options {
         timeout(time: 300, unit: 'SECONDS')
       }
      environment{ deployment_env = 'stage'}
      when {
        expression { GIT_BRANCH_NAME == 'devpublish' }
        expression {params.ENV_CHOICE == 'stage' || params.ENV_CHOICE == 'allenv'}
        beforeInput true
      }

      input {
        message "Want to deploy fullstack-pro on stage cluster?"
        parameters {
          choice choices: ['yes', 'no'], description: 'Want to deploy micro service on stage?', name: 'STAGE_DEPLOYMENT'
        }
      }

      steps {
        load "./jenkins_variables.groovy"
        script {
          def servers = getDirs(pwd() + params.DEPLOYMENT_PATH)
          def parallelStagesMap = servers.collectEntries {
           ["${it}" : generateStage(it)]
          }
          parallel parallelStagesMap
        }
      }
    } // End of staging deployment code block.

  // Below are production stages
    stage('Get Prod Secrets'){
      when {
        expression { GIT_BRANCH_NAME == 'devpublish' }
        expression { params.ENV_CHOICE == 'prod' || params.ENV_CHOICE == 'allenv' }
        beforeInput true
      }
      steps{
        sh """
          gcloud auth activate-service-account --key-file """ + GCLOUDSECRETKEY + """
          gcloud container clusters get-credentials deployment-cluster --zone us-central1-a
          helm repo update
        """
      }
    }
    stage('Prod deployment') {
      options {
          timeout(time: 300, unit: 'SECONDS')
      }
      environment{ deployment_env = 'prod'}
      when {
        expression { GIT_BRANCH_NAME == 'devpublish' }
        expression {params.ENV_CHOICE == 'prod' || params.ENV_CHOICE == 'allenv'}
        beforeInput true
      }

      input {
        message "Want to deploy fullstack-pro on prod cluster?"
        parameters {
          choice choices: ['yes', 'no'], description: 'Want to deploy micro service on prod?', name: 'PROD_DEPLOYMENT'
        }
      }

      steps {
        load "./jenkins_variables.groovy"
        script {
          def servers = getDirs(pwd() + params.DEPLOYMENT_PATH)
          def parallelStagesMap = servers.collectEntries {
           ["${it}" : generateStage(it)]
          }
          parallel parallelStagesMap
        }
      }
    } // End of production deployment code block.

  }

  post {
    always {
      deleteDir()
    }
    success{
      slackSend (color: '#00FF00', message: "SUCCESSFUL:  Job  '${env.JOB_NAME}'  BUILD NUMBER:  '${env.BUILD_NUMBER}'  Job success. click <${env.RUN_DISPLAY_URL}|here> to see the log.", channel: 'idestack-automation')
    }
    failure{
      slackSend (color: '#FF0000', message: "FAILED:  Job  '${env.JOB_NAME}'  BUILD NUMBER:  '${env.BUILD_NUMBER}'  Job failed. click <${env.RUN_DISPLAY_URL}|here> to see the log.", channel: 'idestack-automation')
    }
  }
}

def getBuildCommand(){
  if(DEBUG.toBoolean()){
    return 'build:debug'
  } else {
    return 'build'
  }
}

def getGitPrBranchName() {
    // The branch name could be in the BRANCH_NAME or GIT_BRANCH variable depending on the type of job
  //def branchName = env.BRANCH_NAME ? env.BRANCH_NAME : env.GIT_BRANCH
  //return branchName || ghprbSourceBranch
  if(env.ghprbSourceBranch){
    return ghprbSourceBranch
  } else {
    return params.REPOSITORY_BRANCH
  }
}

def getGitBranchName(){ // we can place some conditions in future
  if(env.ghprbSourceBranch){
    return ghprbSourceBranch
  } else {
    return params.REPOSITORY_BRANCH
  }
}

@NonCPS
def getDirs(path){
  def currentDir = new File(path)
  def dirs = []
  currentDir.eachDir() {
      dirs << it.name
  }
  return dirs
}

def generateStage(server) {
  return {
    stage("stage: ${server}") {
      echo "This is ${server}."
      def filterExist = "${server}".contains(params.EXCLUDE_SETTING_NAMESPACE_FILTER)
      def namespace = filterExist ? '' : "--namespace=${params.NAMESPACE}"
      def name = getName(pwd() + "${params.DEPLOYMENT_PATH}/${server}/package.json")
      def version = getVersion(pwd() + params.DEPLOYMENT_PATH + "/${server}/package.json")
      // deploy anything matching `*backend-server` or `*frontend-server` to use idestack chart
      try{
        if ("${server}".endsWith("backend-server") | "${server}".endsWith("frontend-server")) {
          echo "${server} deployment skipped"

          if ("${server}".endsWith("frontend-server")){
            deployment_flag = " --set backend.enabled='false' --set external.enabled='true' "
          }

          if ("${server}".endsWith("backend-server")){
            deployment_flag = " --set frontend.enabled='false' --set external.enabled='false' "
          }

          sh """
            helm upgrade -i \
            ${deployment_flag} \
            --set frontend.image="${REPOSITORY_SERVER}/${name}" \
            --set frontend.imageTag=${version} \
            --set backend.image="${REPOSITORY_SERVER}/${name}" \
            --set backend.imageTag=${version} \
            --set settings.workspaceId="${WORKSPACE_ID}" \
            --set frontend.pullPolicy=Always \
            --set backend.pullPolicy=Always \
            --set ingress.domain=${params.DOMAIN_NAME} \
            --namespace=${env.NAMESPACE} ${UNIQUE_NAME}-${server} kube-orchestration/idestack
          """
        } else {
          sh """
            cd servers/${server}
            helm upgrade -i ${server}-api --namespace=${env.NAMESPACE} \
            --set image.repository=${REPOSITORY_SERVER}/${name} \
            --set image.tag=${version} \
            charts/chart
          """
        }
      } catch (Exception err) {
        slackSend (color: '#FF0000', message: "FAILED:  Job  '${env.JOB_NAME}'  BUILD NUMBER:  '${env.BUILD_NUMBER}'  Job failed in stage deployment ${server}. click <${env.RUN_DISPLAY_URL}|here> to see the log. Error: ${err.toString()}", channel: 'idestack-automation')
        println err
        throw(err)
      }
    }
  }
}

// Docker build parllel loop
def generateBuildStage(server) {
  return {
    stage("stage: ${server}") {
     try{
      echo "This is ${server}."
      def name = getName(pwd() + params.DEPLOYMENT_PATH + "/${server}/package.json")
      def version = getVersion(pwd() + params.DEPLOYMENT_PATH + "/${server}/package.json")
        sh """
            lerna exec --scope=*${server} npm run docker:${env.BUILD_COMMAND}
            docker tag ${name}:${version} ${REPOSITORY_SERVER}/${name}:${version}
            docker push ${REPOSITORY_SERVER}/${name}:${version}
            docker rmi ${REPOSITORY_SERVER}/${name}:${version}
        """
      } catch (e) {
        slackSend (color: '#FF0000', message: "FAILED:  Job  '${env.JOB_NAME}'  BUILD NUMBER:  '${env.BUILD_NUMBER}'  Job failed in stage docker-build ${server}. click <${env.RUN_DISPLAY_URL}|here> to see the log. Error: ${e}", channel: 'idestack-automation')
        throw(e)
      }
    }
  }
}

import groovy.json.JsonSlurper
def getVersion(json_file_path){
  def inputFile = readFile(json_file_path)
  def InputJSON = new JsonSlurper().parseText(inputFile)
  def version = InputJSON.version
return version
}

def getName(json_file_path){
  def inputFile = readFile(json_file_path)
  def InputJSON = new JsonSlurper().parseText(inputFile)
  def name = InputJSON.name
return name
}