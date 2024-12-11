const util = require("../../utils/util");
const constants = require("../../utils/constants");
const log4js = require("log4js");
const logger = log4js.getLogger("jiraService");
const FormData = require("form-data");
const cryptoService = require("../../../cryptoService");
var methods = {};

methods.jiraValidateToken = async (token) => {
    const url = constants.JIRA_PING_API;
    const imConfig = getConfig("GET", token, url, undefined);
    return await util.httpImCall(imConfig);
};

methods.createTickets = async (issues, imConfigObject, applicationId, applicationName) => {
    var output = {};
    var success = [];
    var failures = [];
    for (var i = 0; i < issues.length; i++) {
        if (process.env.APPSCAN_PROVIDER == "ASE") {
            issues[i].ApplicationId = applicationId;
        }
        const imPayload = await createPayload(issues[i], imConfigObject, applicationId, applicationName);
        try {
            var basicToken = "Basic " + btoa(imConfigObject.imUserName + ":" + imConfigObject.imPassword);
            const imConfig = getConfig("POST", basicToken, imConfigObject.imurl + constants.JIRA_CREATE_TICKET, imPayload);
            const result = await util.httpImCall(imConfig);
            await delay(3000);
            if (result.code === 201) {
                const imTicket = imConfigObject.imurl + "/browse/" + result.data.key;
                //if the issue is status is Noise then update the status of corresponding Jira ticket to False Positive
                if (issues[i].Status === "Noise") {
                    const transitionData = {
                        "transition": {
                            "id": `${imConfigObject.statusIdMapping["False Positive"]}`
                        }
                    }
                    await methods.updateImStatus(imConfigObject, transitionData, result.data.key);
                    //This global set is used to keep track of the issues that are already transitioned so that we don't transition them again in the status sync job
                    alreadyTransitionedIssues.add(issues[i].id);
                }

                //create Jira issue property to indentify the issues created by AppScan
                await methods.createJiraIssueProperty(imConfigObject, result.data.key);
                process.env.APPSCAN_PROVIDER == "ASOC" ? success.push({ issueId: issues[i]["Id"], ticket: imTicket }) : success.push({ issueId: issues[i]["id"], ticket: imTicket });
            }
            else {
                process.env.APPSCAN_PROVIDER == "ASOC" ? failures.push({ issueId: issues[i]["Id"], errorCode: result.code, errorMsg: result.data }) : failures.push({ issueId: issues[i]["id"], errorCode: result.code, errorMsg: result.data });
                logger.error(`Failed to create ticket for issue Id ${process.env.APPSCAN_PROVIDER == "ASOC" ? issues[i]["Id"] : issues[i]["id"]} and the error is ${JSON.stringify(result.data)}`);
            }
        } catch (error) {
            logger.error(`Failed to create ticket for issue Id ${process.env.APPSCAN_PROVIDER == "ASOC" ? issues[i]["Id"] : issues[i]["id"]} and the error is ${JSON.stringify(error.response.data)}`);
            failures.push({ issueId: process.env.APPSCAN_PROVIDER == "ASOC" ? issues[i]["Id"] : issues[i]["id"], errorMsg: error.message });
        }
    }
    output["success"] = success;
    output["failure"] = failures;
    return output;
};

methods.updateTickets = async (bodyData, imConfigObject, applicationId, projectKey) => {
    var output = {};
    var success = [];
    var failures = [];
    const imPayload = bodyData;

    try {
        var basicToken = "Basic " + btoa(imConfigObject.imUserName + ":" + imConfigObject.imPassword);
        let imUrl = (imConfigObject.imurl + constants.JIRA_UPDATE_TICKET).replace("{JIRAID}", projectKey)
        const imTicket = imConfigObject.imurl + "/browse/" + projectKey;
        const imConfig = getConfig("PUT", basicToken, imUrl, imPayload);
        const result = await util.httpImCall(imConfig);
        await delay(3000);
        if (result.code === 204) {
            process.env.APPSCAN_PROVIDER == "ASOC" ? success.push({ ticket: imTicket, bodyData: JSON.stringify(bodyData) }) : success.push({ issueId: issues[i]["id"], ticket: imTicket });
        }
        else {
            process.env.APPSCAN_PROVIDER == "ASOC" ? failures.push({ ticket: imTicket, errorCode: result.code, errorMsg: result.data }) : failures.push({ issueId: issues[i]["id"], errorCode: result.code, errorMsg: result.data });
            logger.error(`Failed to create ticket for Project Key -  ${projectKey} and the error is ${result.data}`);
        }
    } catch (error) {
        logger.error(`Failed to create ticket for Project Key - ${projectKey} and the error is ${JSON.stringify(error.response.data)}`);
        failures.push({ ticket: imTicket, errorMsg: error.message });
    }
    output["success"] = success;
    output["failure"] = failures;
    return output;
};

methods.updateImStatus = async (imConfigObject, bodyData, projectKey) => {
    try {
        let url = constants.JIRA_UPDATE_TRANSITION.replace("{JIRAID}", projectKey);
        var basicToken = "Basic " + btoa(imConfigObject.imUserName + ":" + imConfigObject.imPassword);
        const imConfig = getConfig("POST", basicToken, imConfigObject.imurl + url, bodyData);

        const result = await util.httpImCall(imConfig);
    } catch (err) {
        logger.error(`Failed to update ticket for Project Key - ${projectKey} and the error is ${JSON.stringify(error.response.data)}`);
    }
}

methods.createJiraIssueProperty = async (imConfigObject, issue) => {
    try {
        const url = constants.JIRA_ISSUE_PROPERTY.replace("{JIRAID}", issue).replace("{PROPERTY_KEY}", "appscan");
        var basicToken = "Basic " + btoa(imConfigObject.imUserName + ":" + imConfigObject.imPassword);
        const bodyData = { "createdBy": "appScan" };
        const imConfig = getConfig("PUT", basicToken, imConfigObject.imurl + url, bodyData);

        const result = await util.httpImCall(imConfig);
    }
    catch (err) {
        logger.error(`Failed to create issue property for issue Id ${issue} and the error is ${JSON.stringify(err.response.data)}`);
    }
};

methods.getJiraIssueProperty = async (issue, imConfigObject) => {
    try {
        const url = constants.JIRA_ISSUE_PROPERTY.replace("{JIRAID}", issue).replace("{PROPERTY_KEY}", "appscan");
        var basicToken = "Basic " + btoa(imConfigObject.imUserName + ":" + imConfigObject.imPassword);
        const imConfig = getConfig("GET", basicToken, imConfigObject.imurl + url, "");

        const result = await util.httpImCall(imConfig);
        return result;
    }
    catch (err) {
        logger.error(`Failed to get issue property for issue Id ${issue} and the error is ${JSON.stringify(err.response.data)}`);
    }
};

methods.createScanTickets = async (issues, imConfigObject, applicationId, applicationName, scanId, discoveryMethod) => {
    var output = {};
    var success = [];
    var failures = [];
    for (var i = 0; i < issues.length; i++) {
        let improjectscanKey = imConfigObject.improjectscanKey;
        imConfigObject.improjectkey = improjectscanKey;
        const imPayload = await createScanPayload(issues[i], imConfigObject, applicationId, applicationName, scanId, discoveryMethod);
        try {
            var basicToken = "Basic " + btoa(imConfigObject.imUserName + ":" + imConfigObject.imPassword);
            const imConfig = getConfig("POST", basicToken, imConfigObject.imurl + constants.JIRA_CREATE_TICKET, imPayload);
            const result = await util.httpImCall(imConfig);
            await delay(3000);
            if (result.code === 201) {
                const imTicket = imConfigObject.imurl + "/browse/" + result.data.key;
                process.env.APPSCAN_PROVIDER == "ASOC" ? success.push({ scanId: scanId, ticket: imTicket }) : success.push({ scanId: scanId, ticket: imTicket });
            }
            else {
                process.env.APPSCAN_PROVIDER == "ASOC" ? failures.push({ scanId: scanId, errorCode: result.code, errorMsg: result.data }) : failures.push({ scanId: scanId, errorCode: result.code, errorMsg: result.data });
                logger.error(`Failed to create ticket for scan Id ${scanId} and the error is ${result.data}`);
            }
        } catch (error) {
            logger.error(`Failed to create ticket for scan Id ${scanId} and the error is ${JSON.stringify(error.response.data)}`);
            failures.push({ scanId: scanId, errorMsg: error.message });
        }
    }
    output["success"] = success;
    output["failure"] = failures;
    return output;
};

const createPayload = async (issue, imConfigObject, applicationId, applicationName) => {
    if (typeof imConfigObject.improjectkey == 'string') {
        var payload = {};
        var attrMap = {};
        attrMap["project"] = { "key": imConfigObject.improjectkey };
        attrMap["issuetype"] = { "name": imConfigObject.imissuetype };
        if (process.env.APPSCAN_PROVIDER == "ASOC") {
            attrMap["summary"] = applicationName + " - " + issue["IssueType"] + " found by AppScan";
        } else {
            attrMap["summary"] = "Security issue: " + issue["Issue Type"].replaceAll("&#40;", "(").replaceAll("&#41;", ")") + " found by AppScan";
        }
        attrMap["description"] = JSON.stringify(issue, null, 4);
        const attributeMappings = typeof imConfigObject.attributeMappings != 'undefined' ? imConfigObject.attributeMappings : [];

        for (var i = 0; i < attributeMappings.length; i++) {
            if (attributeMappings[i].type === 'Array') {
                attrMap[attributeMappings[i].imAttr] = [issue[attributeMappings[i].appScanAttr] || ''];
            }
            else {
                attrMap[attributeMappings[i].imAttr] = issue[attributeMappings[i].appScanAttr];
            }
        }
        payload["fields"] = attrMap;
        return payload;
    } else {
        var payload = {};
        var attrMap = {};
        attrMap["project"] = { "key": imConfigObject.improjectkey[applicationId] == undefined ? imConfigObject.improjectkey['default'] : imConfigObject.improjectkey[applicationId] };
        attrMap["issuetype"] = { "name": imConfigObject.imissuetype };
        if (process.env.APPSCAN_PROVIDER == "ASOC") {
            attrMap["summary"] = applicationName + " - " + issue["IssueType"] + " found by AppScan";
        } else {
            attrMap["summary"] = issue["Issue Type"].replaceAll("&#40;", "(").replaceAll("&#41;", ")");
        }


        attrMap["description"] = JSON.stringify(issue, null, 4);
        const attributeMappings = typeof imConfigObject.attributeMappings != 'undefined' ? imConfigObject.attributeMappings : [];

        let labelName = issue["Application Name"] != null || issue["Application Name"] != undefined ? issue["Application Name"].trim() || '' : '';
        let labelLanguage = issue?.Language != null || issue?.Language != undefined ? issue?.Language.trim() || '' : '';
        let labelSource = issue?.Source != null || issue?.Source != undefined ? issue?.Source.trim() || '' : '';
        let labelSeverity = issue?.Severity != null || issue?.Severity != undefined ? issue?.Severity.trim() || '' : '';
        let labelStatus = issue?.Status != null || issue?.Status != undefined ? issue?.Status.trim() || '' : '';
        let labelID = issue?.id != null || issue?.id != undefined ? issue?.id.trim() || '' : '';
        let labelLocation = issue?.Location != null || issue?.Location != undefined ? issue?.Location.trim() || '' : '';
        let labelCreatedDate = issue["Date Created"] != null || issue["Date Created"] != undefined ? issue["Date Created"].trim() || '' : '';
        labelName = labelName.split(/\s+/).join('_');
        labelLanguage = labelLanguage.split(/\s+/).join('_');
        labelSource = labelSource.split(/\s+/).join('_');
        if (labelSeverity === "Information") {
            labelSeverity = "Informational";
        }
        labelSeverity = labelSeverity
        labelStatus = labelStatus.split(/\s+/).join('_');
        labelID = labelID.split(/\s+/).join('_');
        labelLocation = labelLocation.split(/\s+/).join('_');
        const createdDate = new Date(labelCreatedDate);
        const isoDateString = createdDate.toISOString();
        const modifiedDateString = isoDateString.replace("Z", "");
        labelCreatedDate = modifiedDateString + "+0000";
        const token = await appscanLogin();
        const appDetails = await getApplicationDetails(applicationId, token);
        const applicationMnemonic = getApplicationMnemonic(appDetails.data);

        for (var i = 0; i < attributeMappings.length; i++) {

            if (attributeMappings[i].imAttr == 'labels') {
                attrMap[attributeMappings[i].imAttr] = [labelName || '', String(applicationId)];
            } else if (attributeMappings[i].imAttr == 'customfield_10419') {
                attrMap[attributeMappings[i].imAttr] = String(labelName);
            } else if (attributeMappings[i].imAttr == 'customfield_10401') {
                attrMap[attributeMappings[i].imAttr] = {
                    "value": "ASE - Self Service"
                }
            } else if (attributeMappings[i].imAttr == 'customfield_10415') {
                attrMap[attributeMappings[i].imAttr] = String(issue["Issue Type"]);
            } else if (attributeMappings[i].imAttr == 'customfield_10452') {
                attrMap[attributeMappings[i].imAttr] = String(labelID);
            } else if (attributeMappings[i].imAttr == 'customfield_10407') {
                attrMap[attributeMappings[i].imAttr] = String(labelLocation);
            } else if (attributeMappings[i].imAttr == 'customfield_10412') {
                attrMap[attributeMappings[i].imAttr] = {
                    "value": "AppScan Enterprise"
                }
            } else if (attributeMappings[i].imAttr == 'customfield_10406') {
                attrMap[attributeMappings[i].imAttr] = {
                    "value": labelSeverity
                }
            } else if (attributeMappings[i].imAttr == 'customfield_10507') {
                attrMap[attributeMappings[i].imAttr] = labelCreatedDate;
            } else if (attributeMappings[i].imAttr == 'customfield_10416') {
                attrMap[attributeMappings[i].imAttr] = applicationMnemonic;
            } else if (attributeMappings[i].imAttr == 'customfield_10414') {
                attrMap[attributeMappings[i].imAttr] = {
                    "value": "NA"
                }
            } else if (attributeMappings[i].imAttr == 'customfield_10404') {
                attrMap[attributeMappings[i].imAttr] = {
                    "value": "NA"
                }
            } else if (attributeMappings[i].imAttr == 'customfield_10405') {
                attrMap[attributeMappings[i].imAttr] = "NA";
            }


        }
        payload["fields"] = attrMap;
        return payload;
    }
}

const createScanPayload = async (issue, imConfigObject, applicationId, applicationName, scanId, discoveryMethod) => {
    if (typeof imConfigObject.improjectkey == 'string') {
        var payload = {};
        var attrMap = {};
        attrMap["project"] = { "key": imConfigObject.improjectkey };
        attrMap["issuetype"] = { "name": imConfigObject.imissuetype };

        if (process.env.APPSCAN_PROVIDER == "ASOC") {
            attrMap["summary"] = applicationName + " - " + issue["IssueType"] + " found by AppScan";
        } else {
            attrMap["summary"] = "Security issue: " + issue["Issue Type"].replaceAll("&#40;", "(").replaceAll("&#41;", ")") + " found by AppScan";
        }
        attrMap["description"] = JSON.stringify(issue, null, 4);
        const attributeMappings = typeof imConfigObject.attributeMappings != 'undefined' ? imConfigObject.attributeMappings : [];

        for (var i = 0; i < attributeMappings.length; i++) {
            if (attributeMappings[i].type === 'Array') {
                attrMap[attributeMappings[i].imAttr] = [issue[attributeMappings[i].appScanAttr] || ''];
            }
            else {
                attrMap[attributeMappings[i].imAttr] = issue[attributeMappings[i].appScanAttr];
            }
        }
        payload["fields"] = attrMap;
        return payload;
    } else {
        var payload = {};
        var attrMap = {};
        attrMap["project"] = { "key": imConfigObject.improjectkey[applicationId] == undefined ? imConfigObject.improjectkey['default'] : imConfigObject.improjectkey[applicationId] };
        attrMap["issuetype"] = { "name": imConfigObject.imissuetype };
        attrMap["issuetype"] = { "name": 'Task' };
        if (process.env.APPSCAN_PROVIDER == "ASOC") {
            attrMap["summary"] = discoveryMethod + ' - ' + applicationName + " - " + scanId + " scanned by ASOC";
        } else {
            attrMap["summary"] = "Security issue: " + scanId + ' ' + discoveryMethod + " found by AppScan";
        }
        attrMap["description"] = JSON.stringify(issue, null, 4);
        const attributeMappings = typeof imConfigObject.attributeMappings != 'undefined' ? imConfigObject.attributeMappings : [];
        let labelName = applicationName.trim();
        labelName = labelName.split(/\s+/).join('_')
        for (var i = 0; i < attributeMappings.length; i++) {
            if (attributeMappings[i].type === 'Array') {
                if (attributeMappings[i].imAttr == 'labels') {
                    attrMap[attributeMappings[i].imAttr] = [labelName || '', applicationId];
                } else if (attributeMappings[i].imAttr == 'customfield_11292') {
                    attrMap[attributeMappings[i].imAttr] = `${labelName}`
                }
            }
            else {
                attrMap[attributeMappings[i].imAttr] = [labelName || '', applicationId];
            }
        }
        payload["fields"] = attrMap;
        return payload;
    }
}
methods.attachIssueDataFile = async (ticket, filePath, imConfigObject) => {
    const url = imConfigObject.imurl + constants.JIRA_ATTACH_FILE.replace("{JIRAID}", ticket);
    const formData = new FormData();
    formData.append('file', require("fs").createReadStream(filePath));
    let userData = imConfigObject.imUserName + ":" + imConfigObject.imPassword;
    var basicToken = `Basic ${Buffer.from(userData).toString('base64')}`;
    const imConfig = getConfig("POST", basicToken, url, formData);
    return await util.httpImCall(imConfig);
}

methods.getMarkedTickets = async (syncInterval, imConfigObject) => {

    const imStatus = Object.keys(imConfigObject.bidirectionalStatusMapping);
    let jql = "";
    imStatus.forEach((status) => {
        jql += `(status CHANGED TO ${status} during (-${syncInterval},now()) AND status = ${status}) OR `;
    });
    jql = jql.substring(0, jql.length - 4);//removing the last OR
    jql = encodeURIComponent(jql);

    // const url = imConfigObject.imurl + constants.JIRA_LATEST_ISSUE.replace("{SYNCINTERVAL}", syncInterval)
    const url = imConfigObject.imurl + constants.JIRA_ISSUE_SEARCH + jql;
    let userData = imConfigObject.imUserName + ":" + imConfigObject.imPassword;
    var basicToken = `Basic ${Buffer.from(userData).toString('base64')}`;
    const imConfig = getConfig("GET", basicToken, url, "");
    return await util.httpImCall(imConfig);
}

methods.getTicketsByProject = async (projectName, imConfigObject, skipValue) => {
    const url = imConfigObject.imurl + constants.JIRA_LABELS_ISSUE.replace("{PROJECTNAME}", projectName).replace("{SKIPVALUE}", skipValue)
    let userData = imConfigObject.imUserName + ":" + imConfigObject.imPassword;
    var basicToken = `Basic ${Buffer.from(userData).toString('base64')}`;
    const imConfig = getConfig("GET", basicToken, url, "");
    return await util.httpImCall(imConfig);
}

const getConfig = function (method, token, url, data) {
    return {
        method: method,
        url: url,
        data: data,
        rejectUnauthorized: false,
        headers: {
            'Authorization': token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Atlassian-Token': 'nocheck'
        }
    };
}

const appscanLogin = async () => {
    var token;
    try {
        if (process.env.APPSCAN_PROVIDER == 'ASE') {
            token = await aseLogin();
            if (typeof token === 'undefined') logger.error(`Failed to login to the AppScan.`);
        }
        else if (process.env.APPSCAN_PROVIDER == 'ASOC') {
            token = await asocLogin();
            if (typeof token === 'undefined') logger.error(`Failed to login to the AppScan.`);
        }
    } catch (error) {
        logger.error(`Login to AppScan failed with the error ${error}`);
    }
    return token;
}
const getApplicationDetails = async (appId, token) => {
    const url = constants.ASE_APPLICATION_DETAILS.replace("{APPID}", appId);
    return await util.httpCall("GET", token, url);
};

const getApplicationMnemonic = (data) => {
    const attributes = data.attributeCollection.attributeArray;
    for (const attribute of attributes) {
        if (attribute.name === "Application Mnemonic") {
            return attribute.value[0];
        }
    }
    return null;
}

const aseLogin = async () => {
    var inputData = {};
    inputData["keyId"] = process.env.keyId;
    inputData["keySecret"] = process.env.keySecret;
    const result = await keyLogin(inputData);
    return result.data.sessionId;
}

const asocLogin = async () => {
    var inputData = {};
    inputData["keyId"] = process.env.keyId;
    inputData["keySecret"] = process.env.keySecret;
    const result = await asocAuthService.keyLogin(inputData);
    return result.data.Token;
}

const keyLogin = async (inputData) => {
    const url = constants.ASE_API_KEYLOGIN;
    return await util.httpCall("POST", "", url, JSON.stringify(inputData));
};
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = methods;
