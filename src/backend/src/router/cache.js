const Router = require("koa-router");
const { createFile, folderPath } = require("../utils/folder");
const { folderUtils, ruleUtils } = require("../utils");
const { LOCAL_SERVER } = require("../constants");
const { isValidJSON } = require("../utils/common");
const router = new Router();

router.get("/info/:projectId/:ruleId", async (ctx) => {
  const { projectId, ruleId } = ctx.params;
  const methodType = ctx.originalUrl.split("methodType=")[1];
  const res = ruleUtils.formatRule({
    projectId,
    methodType,
    ruleId,
  });

  if (res) {
    res.cacheStatus = res.status;
    delete res.status;
    ctx.response.body = {
      message: "规则信息获取成功",
      statusCode: 0,
      data: res ?? {},
    };
  } else
    ctx.response.body = {
      message: "规则信息获取失败",
      statusCode: -1,
      data: null,
    };
  ctx.set("notification", true);
});

router.put("/info/:projectId/:ruleId", async (ctx) => {
  const { projectId, ruleId } = ctx.params;
  const { cacheInfo } = ctx.request.body;
  const { cacheStatus, cacheMethodType } = cacheInfo;
  const folder =
    folderUtils.findFile(projectId, "", LOCAL_SERVER) + "/" + cacheMethodType;
  const cacheFile = folderUtils.findFile(ruleId, folder, LOCAL_SERVER);
  const cacheFilePath = folderPath(`${folder}/${cacheFile}`, LOCAL_SERVER);
  const content = JSON.parse(folderUtils.folderContent(cacheFilePath));

  if (content) content.cacheStatus = cacheStatus;

  try {
    createFile(cacheFilePath, JSON.stringify(content, null, 2));
    ctx.response.body = {
      message: "保存成功",
      statusCode: 0,
    };
  } catch (error) {
    ctx.response.body = {
      message: "保存失败",
      statusCode: -1,
    };
  }

  ctx.set("notification", true);
});

module.exports = router.routes();
