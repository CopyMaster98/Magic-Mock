const { LOCAL_SERVER } = require("../constants");
const { isValidJSON } = require("./common");
const { findFile, folderContent, folderPath } = require("./folder");

const formatRule = ({ projectId, methodType, ruleId, ruleContent }) => {
  if (ruleContent) {
    const { id, params, cacheStatus } = ruleContent;
    let ruleName = params.request.url?.replaceAll("*", "");

    try {
      ruleName = new URL(params.request.url).pathname;
    } catch (error) {}

    const payload = params?.request?.postData;
    let newPayLoadJSON = null;
    if (payload) {
      const payloadKeyValues = payload
        .split("&")
        .map((item) => item.split("="));

      newPayLoadJSON = payloadKeyValues.reduce(
        (pre, cur) => ({
          ...pre,
          [cur[0]]: isValidJSON(cur[1]) ? JSON.parse(cur[1]) : cur[1],
        }),
        {}
      );
    }

    return {
      id,
      status: cacheStatus,
      payloadJSON: newPayLoadJSON,
      requestHeaderJSON: params?.request?.headers,
      requestHeaderType: "json",
      responseDataJSON: params?.responseData,
      responseDataType: "json",
      responseStatusCode: 200,
      ruleMethod: [params?.request?.method],
      resourceType: [params?.resourceType],
      ruleName: ruleName === "/" ? params?.request?.url : ruleName,
      rulePattern: params?.request?.url,
    };
  }

  const folder = findFile(projectId, "", LOCAL_SERVER) + "/" + methodType;
  const cacheFile = findFile(ruleId, folder, LOCAL_SERVER);

  if (cacheFile) {
    let content = folderContent(
      folderPath(`${folder}/${cacheFile}`, LOCAL_SERVER)
    );

    if (content) {
      content = JSON.parse(content);
      const { id, params, cacheStatus } = content;

      let ruleName = params.request.url?.replaceAll("*", "");

      try {
        ruleName = new URL(params.request.url).pathname;
      } catch (error) {}

      const payload = params?.request?.postData;
      let newPayLoadJSON = null;
      if (payload) {
        const payloadKeyValues = payload
          .split("&")
          .map((item) => item.split("="));

        newPayLoadJSON = payloadKeyValues.reduce(
          (pre, cur) => ({
            ...pre,
            [cur[0]]: isValidJSON(cur[1]) ? JSON.parse(cur[1]) : cur[1],
          }),
          {}
        );
      }

      return {
        id,
        status: cacheStatus,
        payloadJSON: newPayLoadJSON,
        requestHeaderJSON: params?.request?.headers,
        requestHeaderType: "json",
        responseDataJSON: params?.responseData,
        responseDataType: "json",
        responseStatusCode: 200,
        ruleMethod: params?.request?.method,
        resourceType: params?.resourceType,
        ruleName: ruleName === "/" ? params?.request?.url : ruleName,
        rulePattern: params?.request?.url,
      };
    }
  }

  return null;
};

module.exports = {
  formatRule,
};
