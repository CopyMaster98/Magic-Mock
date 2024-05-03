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

  console.log(projectId);

  if (!isExistParentFolder) {
    ctx.response.body = {
      message: "项目不存在",
      statusCode: -1,
    };
  } else {
    const path = folderPath(`${isExistParentFolder}/${ruleName}`);
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
              responseData,
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

router.get("/info/:ruleId", async (ctx) => {
  const { ruleId } = ctx.request.body;

  console.log(ruleId);
});

module.exports = router.routes();
