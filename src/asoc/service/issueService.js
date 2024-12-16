const util = require("../../utils/util");
const log4js = require("log4js");
const logger = log4js.getLogger("igwController");
const constants = require("../../utils/constants");
const igwService = require('../../igw/services/igwService')
var methods = {};


methods.getIssuesOfApplication = async (token, skipValue, appId) => {
    const appDetails = await methods.getApplicationDetails(appId, token);
    try {
        let data = appDetails?.data?.Items[0];
        const url = constants.ASOC_ISSUES_APPLICATION.replace("{APPID}", appId).replace('${skipValue}', skipValue);
        let appData = await util.httpCall("GET", token, url);
        if (appData.code == 200) {
            appData.data.applicationName = data?.Name || '';
        }
        return appData;
    } catch (err) {
        logger.error(`Failed to Fetch Application Issues ${skipValue} ${err}`)
    }

};

methods.getIssuesOfScan = async (token, skipValue, scanId) => {
    const url = constants.ASOC_SCAN_ISSUE_DETAILS.replace("{SCANID}", scanId).replace('${skipValue}', skipValue);
    return await util.httpCall("GET", token, url);
};

methods.getCommentsOfIssue = async (token, skipValue, issueId) => {
    const url = constants.ASOC_ISSUE_COMMENTS.replace("{ISSUEID}", issueId).replace('${skipValue}', skipValue);
    return await util.httpCall("GET", token, url);
};

methods.getScanDetails = async (scanId, technology, token) => {
    const url = technology == 'DynamicAnalyzer' ? constants.DAST_SCAN_DATA.replace("{SCANID}", scanId) : technology == 'StaticAnalyzer' ? constants.SAST_SCAN_DATA.replace("{SCANID}", scanId) : constants.SCA_SCAN_DATA.replace("{SCANID}", scanId);
    return await util.httpCall("GET", token, url);
};

methods.updateIssuesOfApplication = async (appId, issueId, status, comment, externalId, token) => {
    const url = constants.ASOC_UPDATE_ISSUE.replace("{ISSUEID}", issueId).replace("{APPID}", appId);
    let data = {
        "ExternalId": externalId,
        "Status": status,
        "Comment": comment
    }
    return await util.httpCall("PUT", token, url, data);
};

methods.getApplicationDetails = async (appId, token) => {
    const url = constants.ASOC_APPLICATION_DETAILS.replace("{APPID}", appId);
    return await util.httpCall("GET", token, url);
};

methods.getIssueDetails = async (appId, issueId, token) => {
    const url = constants.ASOC_ISSUE_DETAILS.replace("{ISSUEID}", issueId);
    var result = await util.httpCall("GET", token, url);
    var issue = result.data;
    if (result.code === 200) {
        var attributesArray = (issue?.attributeCollection?.attributeArray) ? (issue?.attributeCollection?.attributeArray) : [];
        var attribute = {};
        for (var i = 0; i < attributesArray.length; i++) {
            if ((attributesArray[i].value).length > 0)
                attribute[attributesArray[i].name] = (attributesArray[i].value)[0];
        }
        delete issue["attributeCollection"];
        result.data = Object.assign(issue, attribute);
    }
    return result;
}

methods.updateIssue = async (appId, issueId, data, token, eTag) => {
    const url = constants.ASOC_UPDATE_ISSUE.replace("{ISSUEID}", issueId).replace("{APPID}", appId);
    return await util.httpCall("PUT", token, url, JSON.stringify(data), eTag);
}

methods.getHTMLIssueDetails = async (appId, issueId, downloadPath, token) => {
    const createReportUrl = constants.ASOC_CREATE_HTML_SCAN_ISSUE_DETAILS.replace("{APPID}", appId);
    const data = constants.CREATE_REPORT_REQUEST_CONFIGURATION; //CREATE ISSUE PAYLOAD

    const reportID = 'f5eb6475-abff-468f-a35e-ac63d234c5a5'
    const getDownloadReportsUrl = await constants.ASOC_GET_HTML_ISSUE_DETAILS.replace("{REPORTID}", reportID); //GET REPORT DOWNLOAD URL
    const getReportStatusUrl = await constants.ASOC_REPORT_STATUS.replace("{REPORTID}", reportID); //GET REPORT STATUS

    let intervalid
    async function testFunction() {
        intervalid = setInterval(async () => {
            let getDownloadUrl = await util.httpCall("GET", token, getReportStatusUrl);
            if (getDownloadUrl.data.Status == 'Ready') {
                clearInterval(intervalid)
                return await util.downloadFile(getDownloadReportsUrl, downloadPath, token);
            }
        }, 3000)
    }
    await testFunction()

}

methods.downloadAsocReport = async (providerId, appId, scanId, issues, token) => {
    const createReportUrl = scanId != '' ? constants.ASOC_CREATE_HTML_SCAN_ISSUE_DETAILS.replace("{SCANID}", scanId) : constants.ASOC_CREATE_HTML_APP_ISSUE_DETAILS.replace("{APPID}", appId);
    const data = constants.CREATE_REPORT_REQUEST_CONFIGURATION; //CREATE ISSUE PAYLOAD

    try {
        let createIssue = await util.httpCall("POST", token, createReportUrl, data); //CREATE ISSUE REPORT;
        var reportID = await createIssue?.code == 200 ? createIssue?.data?.Id : createIssue;

        const getDownloadReportsUrl = await constants.ASOC_GET_HTML_ISSUE_DETAILS.replace("{REPORTID}", reportID); //GET REPORT DOWNLOAD URL
        const getReportStatusUrl = await constants.ASOC_REPORT_STATUS.replace("{REPORTID}", reportID); //GET REPORT STATUS

        var downloadPath = `./temp/${appId}.html`;
        let intervalid;
        async function splitFile() {
            return new Promise(
                function (resolve) {
                    return intervalid = setInterval(async () => {
                        try {
                            let getDownloadUrl = await util.httpCall("GET", token, getReportStatusUrl);
                            getDownloadUrl?.data?.Items.map(async res => {
                                if (res.Status == 'Ready' && res.Id == reportID) {
                                    let downloadFileData = await util.downloadFile(getDownloadReportsUrl, downloadPath, token);
                                    if (downloadFileData) {
                                        let res = await igwService.splitHtmlFile(downloadPath, appId)
                                        clearInterval(intervalid)
                                        resolve(res)
                                    }
                                }
                            })
                        } catch (err) {
                            logger.error(err)
                        }
                    }, 3000)
                }
            )
        }

        // async function splitFile() {
        //     return new Promise((resolve, reject) => {
        //         let intervalid = setInterval(async () => {
        //             try {
        //                 let getDownloadUrl = await util.httpCall("GET", token, getReportStatusUrl);

        //                 if (getDownloadUrl.data.Status === 'Ready') {
        //                     let downloadFileData = await util.downloadFile(getDownloadReportsUrl, downloadPath, token);

        //                     if (downloadFileData) {
        //                         let res = await igwService.splitHtmlFile(downloadPath, appId);
        //                         clearInterval(intervalid);
        //                         resolve(res);
        //                     }
        //                 }
        //             } catch (error) {
        //                 clearInterval(intervalid);
        //                 reject(error);
        //             }
        //         }, 3000);
        //     });
        // }

        let splitFiles = await splitFile();
        return splitFiles;
    } catch (err) {
        throw err
    }
}

methods.getIssuesOfApplicationByStatusAndTime = async (appId, token, status, fromDateTime) => {
    try {
        const formattedFromDateTime = fromDateTime.replace(/:/g, "%3A");
        const url = constants.ASOC_ISSUES_APPLICATION_STATUS_TIME.replace("{APPID}", appId).replace("{STATUS}", status).replace("{DATERANGE}", formattedFromDateTime);
        return await util.httpCall("GET", token, url);
    }
    catch (err) {
        logger.error(err);
    }

}

module.exports = methods;
