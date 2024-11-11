const Router = require("koa-router");
const router = new Router();
const fs = require("fs");
const { folderUtils, hashUtils } = require("../utils/index");
const { folderPath, folderExists, createFile, findFile, folderContent } =
  folderUtils;

router.get("/info", async (ctx) => {});

router.put("/info/:projectId", async (ctx) => {
  const { projectId } = ctx.params;
  const { status } = ctx.request.body;
  const folderName = findFile(projectId);
  const projectPath = folderPath(`${folderName}/ζζconfig.json`);
  let content = folderContent(projectPath);
  if (content) content = JSON.parse(content);

  try {
    fs.writeFileSync(
      projectPath,
      JSON.stringify(
        {
          ...content,
          staticResourceCache: status,
        },
        null,
        2
      )
    );

    ctx.response.body = {
      message: "修改成功",
      statusCode: 0,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "修改失败",
      statusCode: -1,
    };
  }

  ctx.set("notification", true);
});

module.exports = router.routes();
