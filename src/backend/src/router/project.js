const Router = require("koa-router");
const fs = require("fs");
const { portUtils } = require("../utils/index");
const router = new Router();
const { createChildProcess } = require("../../../cdp/createExec.js");

router.get("/status", async (ctx) => {
  console.log(ctx);
});

router.post("/start", async (ctx, next) => {
  const { name, url } = ctx.request.body;

  let port = null;

  if (global.projectStatus.has(name)) {
    port = global.projectStatus.get(name).port;
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
      console.log(err);
      ctx.response.body = {
        message: "启动失败",
        statusCode: -1,
      };

      ctx.response.status = 500;
    });
});

router.post("/stop", async (ctx) => {
  const { name } = ctx.request.body;

  global.projectStatus.get(name).childProcess.stdin.write("Page: close");

  ctx.response.body = {
    message: "关闭成功",
    statusCode: 0,
  };
});

module.exports = router.routes();
