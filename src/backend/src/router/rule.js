const Router = require("koa-router");
const fs = require("fs");
const router = new Router();
const { folderUtils, hashUtils } = require("../utils/index");
const { resolve } = require("path");
const { info } = require("console");
const { renameFile } = require("../utils/folder");
const { folderPath, folderExists, createFolder, createFile, folderContent } =
  folderUtils;

router.post("/create", async (ctx) => {
  const {
    projectId,
    ruleName,
    rulePattern,
    requestHeader,
    responseData,
    payload,
    ruleMethod,
    ruleStatus,
    responseStatusCode,
  } = ctx.request.body;
  const folders = fs.readdirSync(folderPath("")) ?? [];
  const isExistParentFolder = folders.find(
    (item) => hashUtils.getHash(item) === projectId
  );

  if (!isExistParentFolder) {
    ctx.response.body = {
      message: "项目不存在",
      statusCode: -1,
    };
  } else {
    const path = folderPath(
      `${isExistParentFolder}/${encodeURIComponent(ruleName)}.config.json`
    );
    const isExist = folderExists(path);

    if (isExist) {
      ctx.response.body = {
        message: "规则已存在",
        statusCode: -1,
      };
    } else {
      try {
        const info = {
          requestHeaderType: requestHeader.type,
          responseDataType: responseData.type,
        };
        if (requestHeader.type === "text") {
          info.requestHeader = requestHeader?.data?.map((item) => ({
            [item.key]: item.value,
          }));
        } else {
          info.requestHeaderJSON = requestHeader?.data;
        }

        if (responseData.type === "text") {
          info.responseData = responseData?.data?.map((item) => ({
            [item.key]: item.value,
          }));
        } else {
          info.responseDataJSON = responseData?.data;
        }

        if (payload) info.payloadJSON = payload;

        if (responseStatusCode) info.responseStatusCode = responseStatusCode;

        createFile(
          `${folderPath(`${isExistParentFolder}`)}/${encodeURIComponent(
            ruleName
          )}.config.json`,
          JSON.stringify(
            {
              id: hashUtils.getHash(JSON.stringify(+new Date())),
              ruleName,
              rulePattern,
              ruleMethod,
              ruleStatus,
              ...info,
            },
            null,
            2
          )
        );
        ctx.response.body = {
          message: "规则创建成功",
          statusCode: 0,
        };
      } catch (err) {
        console.log(err);
        ctx.response.body = {
          message: "规则创建失败",
          statusCode: -1,
        };
      }
    }
  }
  ctx.set("notification", true);
});

router.get("/info/:projectId/:ruleId", async (ctx) => {
  const { ruleId, projectId } = ctx.params;
  const folder = folderUtils.findFile(projectId);
  const rule = folderUtils.findFile(ruleId, folder);

  if (rule) {
    const content = folderUtils.folderContent(folderPath(`${folder}/${rule}`));

    ctx.response.body = {
      message: "规则信息获取成功",
      statusCode: 0,
      data: content ? JSON.parse(content) : {},
    };
  } else {
    ctx.response.body = {
      message: "规则信息获取失败",
      statusCode: -1,
      data: null,
    };
  }
  ctx.set("notification", true);
});

router.put("/info/:projectId/:ruleId", async (ctx) => {
  const { ruleId, projectId } = ctx.params;
  const { ruleInfo } = ctx.request.body;
  const folderName = folderUtils.findFile(projectId);
  const oldRuleName = folderUtils.findFile(ruleId, folderName);
  const oldRulePath = folderPath(`${folderName}/${oldRuleName}`);
  const ruleInfoName = ruleInfo.ruleName
    ? encodeURIComponent(ruleInfo.ruleName)
    : oldRuleName.split(".config.json")[0];
  const newRuleName = ruleInfoName + ".config.json";
  const newRulePath = folderPath(`${folderName}/${newRuleName}`);

  if (
    ruleInfoName &&
    newRuleName !== oldRuleName &&
    folderExists(newRulePath)
  ) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "规则名字已存在",
      statusCode: -1,
    };

    return;
  }

  let currentRuleData = JSON.parse(folderUtils.folderContent(oldRulePath));

  if (currentRuleData) {
    for (let key in ruleInfo) {
      const flag = ["requestHeader", "responseData"].includes(key);
      const ruleData = flag ? ruleInfo[key]?.data : ruleInfo[key];

      if (flag) currentRuleData[key + "Type"] = ruleInfo[key].type;

      if (flag && Array.isArray(ruleData) && ruleInfo[key]?.type === "text") {
        currentRuleData[key] = ruleData?.map((item) => ({
          [item.key]: item.value,
        }));
        delete currentRuleData[key + "JSON"];
      } else {
        if (ruleInfo[key]?.type === "json" || key === "payload") {
          currentRuleData[key + "JSON"] = ruleData;
          delete currentRuleData[key];
        } else currentRuleData[key] = ruleData;
      }
    }
  }

  try {
    createFile(oldRulePath, JSON.stringify(currentRuleData, null, 2));
    ctx.response.body = {
      message: "保存成功",
      statusCode: 0,
    };

    if (ruleInfoName && newRuleName !== oldRuleName)
      renameFile(oldRulePath, newRulePath);
  } catch (error) {
    ctx.response.body = {
      message: "保存失败",
      statusCode: -1,
    };
  }

  ctx.set("notification", true);
});

router.delete("/info/:projectId/:ruleId", async (ctx) => {
  const { ruleId, projectId } = ctx.params;
  const folderName = folderUtils.findFile(projectId);
  const ruleName = folderUtils.findFile(ruleId, folderName);
  const rulePath = folderPath(`${folderName}/${ruleName}`);

  try {
    folderUtils.deleteFile(rulePath);
    ctx.response.body = {
      message: "删除成功",
      statusCode: 0,
    };
  } catch (error) {
    ctx.response.body = {
      message: "删除成功",
      statusCode: -1,
    };
  }
  ctx.set("notification", true);
});

module.exports = router.routes();
