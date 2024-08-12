# An appscan-issue-gateway-v2 for AppScan Enterprise(ASE) helps to synchronize issues between ASE and issue management systems like Jira. This capability  helps AppScan users to get the security issue data "pushed" into other systems thereby avoiding building all the REST calls and plumbing. For seamless  synchronization capability, this service itself operates as a REST API. An ideal use case of this service is implemented in an automated scanning  workflow where it is called for issue processing.  

## Prerequisites:

1.  A Node JS runtime of version 18.18.0  
2.  HCL Appscan Enterprise installation v10.x  
3.  A supported Issue Management system: Jira  

## Installation steps

1.  Install the Node JS runtime of version 18.18.0 (https://nodejs.org/en/)
2.  Download the binaries from the repository.
3.  Open the command prompt from the home directory and run the command "npm install". This installs all the required npm libraries.
4.  Edit the file '.env' (rename .env.temp to .env) from home directory to make changes to the below properties.  
     - ASE_URL = \<URL of the AppScan Enterprise. \>
     - keyId = \<AppScan Enterprise Key. \>
     - keySecret =  \<AppScan Enterprise Secret. \>
     - APPSCAN_PROVIDER = ASE
     - SECURE_PORT = \<Port Gateway application listens to\>  
     - SSL_PFX_CERT_FILE = \<Path to certificate in pfx format.\>  
     - SSL_PFX_CERT_PASSPHRASE = \<Certificate passphrase/password\>
     - LOCAL_ADMIN_USER=\<Set the only user who can login to IGW\>
     - ADMIN_USER_PASSWORD=\<The hashed password of the IGW user. To hash the password run the command "node .\cryptoService.js --hash <password>" from the base directory\>
     - APP_LOG = \<Path and name of the log file\>  
     - MAXLOGSIZE = \<Maximum size of the log file\>  
     - NUMBER_OF_BACKUPS = \<Number of backups\>
     - IM_PROVIDER = \<Provider Name. Ex: JIRA\>
     - GENERATE_HTML_FILE_JIRA=\< Set this to 'true' to attach Reports in Jira\>
     - SYNC_INTERVAL = \<Start the sync thread to push data from AppScan to Issue Management System. 1 means synchronizer runs everyday to push issues identified in the previous day. 2 means synchronizer runs once in 2 days to push issues 
     identified in last 2 days. \>
     - IM_SYNC_INTERVAL = \< Bidirectional Feature: Update Issue status in Appscan. The sync interval in minutes, hours, days. Ex. 1d means synchronizer runs everyday to update status in APPSCAN in the previous day and today. 10m means           
     synchronizer runs once in 10 minute to update status in APPSCAN in last 10 minute.1h means synchronizer runs once in 1hour to to update status in APPSCAN in last 1hour.\>
6.  Start the 'Gateway' application running the command "npm start" from the home directory.
7.  Access the APIs swagger page using the URL https://\<hostname\>:\<port\>/ase/api/swagger. You can get this URL from the console/log.
8.  Use the API to provide Issue Management details and start the synchronizer or edit the file in config directory. For example, rename the file JIRA.  json.temp to JIRA.json and edit the issue management details.
7.  To install/uninstall the application as a Windows Service run below commands from home directory.  
    node service.js --install  
    node service.js --uninstall
8.  If installing the service failed following the step 7, follow the below steps.
      Download the nssm utility from "https://nssm.cc/download"
      Launch the nssm.exe from win64 folder by running the command 'nssm.exe install "HCL Issue Gateway"'

## License
All files found in this project are licensed under the Apache License 2.0.
