const Router = require("koa-router");
const fs = require("fs");
const router = new Router();
const { folderUtils, hashUtils } = require("../utils/index");
const { folderPath, folderExists, createFolder, createFile, folderContent } =
  folderUtils;

router.post("/create", async (ctx) => {
  const { projectId, ruleName, rulePattern, requestHeader, responseData } =
    ctx.request.body;
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
    const path = folderPath(`${isExistParentFolder}/${ruleName}.config.json`);
    const isExist = folderExists(path);

    if (isExist) {
      ctx.response.body = {
        message: "规则已存在",
        statusCode: -1,
      };
    } else {
      try {
        createFile(
          `${folderPath(`${isExistParentFolder}`)}/${ruleName}.config.json`,
          JSON.stringify(
            {
              id: hashUtils.getHash(
                JSON.stringify([
                  ruleName,
                  rulePattern,
                  requestHeader,
                  responseData,
                ])
              ),
              ruleName,
              rulePattern,
              requestHeader,
              responseData: responseData.map((item) => ({
                [item.dataKey]: item.newDataValue,
              })),
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
        ctx.response.body = {
          message: "规则创建失败",
          statusCode: -1,
        };
      }
    }
  }

  // if (!isExist) {
  //   createFile();
  // }

  ctx.set("notification", true);
});

router.get("/info/:projectId/:ruleId", async (ctx) => {
  const { ruleId, projectId } = ctx.params;
  const folder = (fs.readdirSync(folderPath("")) ?? []).find(
    (item) => hashUtils.getHash(item) === projectId
  );
  const rule = (fs.readdirSync(folderPath(folder)) ?? []).find(
    (item) => hashUtils.getHash(item) === ruleId
  );

  if (rule) {
    ctx.response.body = {
      message: "规则信息获取成功",
      statusCode: 0,
      data: JSON.parse(fs.readFileSync(folderPath(`${folder}/${rule}`))),
    };
  } else {
    ctx.response.body = {
      message: "规则信息获取失败",
      statusCode: -1,
      data: null,
    };
    ctx.set("notification", true);
  }
});

module.exports = router.routes();
