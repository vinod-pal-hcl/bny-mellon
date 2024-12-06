const FormData = require("form-data");
const axios = require('axios').default;
var methods = {};

methods.httpCall = async function (method, token, url, data, etag) {
  if (process.env.APPSCAN_PROVIDER == 'ASE') {
    const httpOptions = httpASEConfig(token, method, url, data, etag);
    return await httpASECall(httpOptions);
  } else if (process.env.APPSCAN_PROVIDER == 'ASOC') {
    const httpOptions = httpASOCConfig(token, method, url, data, etag);
    return await httpASOCCall(httpOptions);
  }
}

httpASEConfig = function (token, method, url, data, etag) {
  return {
    method: method,
    url: `${process.env.ASE_URL}${url}`,
    data: data,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'asc_session_id=' + token,
      'asc_xsrf_token': token,
      'If-Match': etag ? etag : ''
    }
  };
}

httpASOCConfig = function (token, method, url, data, etag) {
  return {
    method: method,
    url: `${process.env.ASOC_URL}${url}`,
    data: data,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'asc_session_id=' + token,
      'asc_xsrf_token': token,
      'If-Match': etag ? etag : '',
      'Authorization': "Bearer " + token
    }
  };
}

httpASECall = async (config) => {
  const result = await axios(config);
  if (result.headers["etag"] != 'undefined') result.data["etag"] = result.headers["etag"];
  return { "code": result.status, "data": result.data };
}

httpASOCCall = async (config) => {
  const result = await axios(config);
  if (result.headers["etag"] != 'undefined') result.data["etag"] = result.headers["etag"];
  return { "code": result.status, "data": result.data };
}

methods.httpFileUpload = async function (token, url, filePath, fileName) {
  var formData = new FormData();
  const stream = require("fs").createReadStream(filePath);

  formData.append("uploadedfile", stream, "file.dast.config");
  formData.append("asc_xsrf_token", token);

  const httpOptions = httpASEConfig(token, "POST", url, formData);
  return await httpASECall(httpOptions);
}


methods.downloadFile = async (url, downloadPath, token) => {
  const writer = require("fs").createWriteStream(downloadPath);
  if (process.env.APPSCAN_PROVIDER == 'ASE') {
    var httpOptions = httpASEConfig(token, "GET", url);
  } else if (process.env.APPSCAN_PROVIDER == 'ASOC') {
    var httpOptions = httpASOCConfig(token, "GET", url);
  }
  httpOptions["responseType"] = 'stream';
  return axios(httpOptions).then(response => {
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
      });
    });
  });
}

methods.httpImCall = async (config) => {
  try {
    const result = await axios(config);
    return { "code": result.status, "data": result.data };
  }
  catch (err) {
    return { "code": err.response.status, "data": err.response.data };
  }

}

module.exports = methods;