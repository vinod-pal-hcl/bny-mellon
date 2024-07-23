var constants = {
	ASE_API_GATEWAY: "appScan-issue-gateway-2",
	LOG_LEVEL: "debug",
	LOG_APPENDER1: "out",
	LOG_APPENDER2: "app",
	CONTEXT_URL: "/api",
	SWAGGER_CONTEXT_URL: "/api/swagger",
	SWAGGER_PAGE_URL: "Swagger page URL is - ",
	START_SERVER_MSG: "Server started.....",
	AUTH_TOKEN: "auth-token",
	TOKEN_ABSENT: "Token does not exist or invalid token",
	TOKEN_EXPIRY_TIME: 43200, //JWT expiry time is 12 hours (3600 x 12)
	JWT_SECRET_KEY: "2022_token_for_ase_for_IGW_Integration",
	CONTEXT_API: "/api",
	SWAGGER_VERSION: "1.0.0",

	//ASE APIs
	ASE_API_KEYLOGIN: "/api/keylogin/apikeylogin",
	ASE_SCAN_DETAILS: "/api/jobs/{JOBID}",
	ASE_ISSUES_APPLICATION: "/api/issues?query=Application%20Name%3D{APPNAME}&compactResponse=false",
	ASE_APPLICATION_DETAILS: "/api/applications/{APPID}",
	ASE_ISSUE_DETAILS: "/api/issues/{ISSUEID}/application/{APPID}/",
	ASE_UPDATE_ISSUE: "/api/issues/{ISSUEID}/",
	ASE_GET_HTML_ISSUE_DETAILS: "/api/issues/details_v2?appId={APPID}&ids=[\"{ISSUEID}\"]",
	ASE_JOB_SEARCH: "/api/jobs/search",

	//ASOC APIs
	ASOC_API_KEYLOGIN: "/api/v4/Account/ApiKeyLogin",
	ASOC_JOB_SEARCH: '/api/v4/Scans?%24top=500&%24skip=${skipValue}&%24count=true',
	ASOC_ISSUES_APPLICATION: "/api/v4/Issues/Application/{APPID}?applyPolicies=None&%24top=500&%24skip=${skipValue}&%24count=true",
	ASOC_APPLICATION_DETAILS: "/api/v4/Apps?%24filter=Id%20eq%20{APPID}&%24count=false", 
	ASOC_ISSUE_DETAILS: "/api/v4/Issues/{ISSUEID}",
	ASOC_ISSUE_COMMENTS: "/api/v4/Issues/{ISSUEID}/Comments?%24top=500&%24skip=${skipValue}&%24count=true",
	ASOC_UPDATE_ISSUE: "/api/v4/Issues/Application/{APPID}?odataFilter=Id%20eq%20{ISSUEID}&applyPolicies=All",
	ASOC_CREATE_HTML_SCAN_ISSUE_DETAILS: "/api/v4/Reports/Security/Scan/{SCANID}",
	ASOC_CREATE_HTML_APP_ISSUE_DETAILS: "/api/v4/Reports/Security/Application/{APPID}",
	ASOC_REPORT_STATUS: "/api/v4/Reports?%24top=100&%24orderby=ValidUntil&%24count=true",
	ASOC_GET_HTML_ISSUE_DETAILS: "/api/v4/Reports/{REPORTID}/Download",
	ASOC_SCAN_ISSUE_DETAILS: "/api/v4/Issues/Scan/{SCANID}?applyPolicies=None&%24top=500&%24skip=${skipValue}&%24count=true",
	DAST_SCAN_DATA: '/api/v4/Scans/Dast/{SCANID}',
    SAST_SCAN_DATA: '/api/v4/Scans/Sast/{SCANID}',
    IAST_SCAN_DATA: '/api/v4/Scans/DownloadIastConfig/{SCANID}',
    SCA_SCAN_DATA: '/api/v4/Scans/Sca/{SCANID}',
	CREATE_REPORT_REQUEST_CONFIGURATION : {
		"Configuration": {
		  "Summary": true,
		  "Details": true,
		  "Discussion": true,
		  "Overview": true,
		  "TableOfContent": true,
		  "Advisories": true,
		  "FixRecommendation": true,
		  "History": true,
		  "Coverage": true,
		  "MinimizeDetails": true,
		  "Articles": true,
		  "ReportFileType": "html",
		},
		"OdataFilter": "",
		"ApplyPolicies": "None",
		"SelectPolicyIds": [
		  "00000000-0000-0000-0000-000000000000"
		]
	  },

	//JIRA APIs
	JIRA_PING_API: "/rest/api/latest/mypermissions",
	JIRA_ATTACH_FILE: "/rest/api/latest/issue/{JIRAID}/attachments",
	JIRA_CREATE_TICKET: "/rest/api/2/issue",
	JIRA_UPDATE_TICKET: "/rest/api/2/issue/{JIRAID}",
	JIRA_LATEST_ISSUE : "/rest/api/2/search?jql=status=Closed%20AND%20updated%20>=%20-{SYNCINTERVAL}&maxResults=100",
	JIRA_LABELS_ISSUE : "/rest/api/2/search?jql=project%20=%20{PROJECTNAME}%20AND%20summary%20~%20%27found%20by%20Appscan%27&maxResults=100&startAt={SKIPVALUE}",
	JIRA_UPDATE_TRANSITION : "/rest/api/2/issue/{JIRAID}/transitions",

	INVALID_ADMIN_EMAIL: "Invalid admin email",
	INVALID_ADMIN_PASSWORD: "Invalid admin password",
	INVALID_PROVIDER_ID: "Invalid Provider Id",
	INVALID_SYNC_INTERVAL: "Invalid Sync Interval",
	INVALID_APP_ID: "Invalid application Id",
	INVALID_JOB_ID: "Invalid job Id",
	INVALID_MAX_ISSUES_VALUE: "Invalid max issues value",
	INVALID_ISSUE_STATES: "Invalid issue states",
	INVALID_ISSUE_SEVERITIES: "Invalid issue severities",
	INVALID_IM_URL: "Invalid IM URL",
	INVALID_IM_USERNAME: "Invalid IM Username",
	INVALID_IM_PASSWORD: "Invalid IM password",
	INVALID_PROJECT_KEY: "Invalid Project Key",
	INVALID_IM_ISSUE_TYPE: "Invalid IM issue type",
	INVALID_IM_SUMMARY: "Invalid ticket summary",
	

	ERR_WRONG_CREDENTIALS: "Wrong Credentials",
	HASHING_SALT: '1ffcd164fb8efa56604a4425d14c4455',	
	DTS_JIRA: "JIRA",
	PROVIDERS: ["JIRA"],
};

module.exports = Object.freeze( constants );