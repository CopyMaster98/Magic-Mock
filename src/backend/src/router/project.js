const Router = require("koa-router");
const { portUtils } = require("../utils/index");
const router = new Router();
const { createChildProcess } = require("../../../cdp/createExec.js");

router.get("/status", async (ctx) => {
  console.log(ctx);
});

router.post("/start", async (ctx, next) => {
  const { name, url } = ctx.request.body;

  let port = null;

  if (global.projectStatus.has(name + url)) {
    port = global.projectStatus.get(name + url).port;
  } else {
    port = portUtils.getRandomPort();
  }

  while (portUtils.handleExistPort(port)) {
    port = portUtils.getRandomPort();
  }

  await new Promise((resolve, reject) => {
    createChildProcess(
      {
        name,
        url,
        port,
      },
      resolve,
      reject
    );
  })
    .then(() => {
      ctx.response.body = {
        message: "启动成功",
        statusCode: 0,
      };
    })
    .catch((err) => {
      console.log(err.toString("utf8"));
      ctx.response.status = 500;
      ctx.response.body = {
        message: "启动失败",
        statusCode: -1,
      };
    });
});

router.post("/stop", async (ctx) => {
  const { name, url } = ctx.request.body;

  const projectStatus = global.projectStatus.get(name + url);

  if (projectStatus) projectStatus.childProcess?.stdin.write("Page: close");

  ctx.response.body = {
    message: "关闭成功",
    statusCode: 0,
  };
});

module.exports = router.routes();
