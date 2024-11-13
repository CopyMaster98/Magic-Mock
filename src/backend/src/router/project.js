const Router = require("koa-router");
const { portUtils, folderUtils } = require("../utils/index");
const CONSTANT = require("../constants/index");
const router = new Router();
const { createChildProcess } = require("../../../cdp/createExec.js");
const { createLiveServer } = require("../core/createLiveServer");

router.get("/status", async (ctx) => {
  console.log(ctx);
});

router.post("/start", async (ctx, next) => {
  const { name, url, isEntiretyCache } = ctx.request.body;

  let resourceUrl = null;
  // todo 本地resource服务器启动
  const resourceItem = url.find((item) => item.type === "resource");
  if (resourceItem) {
    const resourceDir = folderUtils.folderPath(
      encodeURIComponent(resourceItem.url),
      CONSTANT.OFFLINE_RESOURCE
    );
    if (!folderUtils.folderExists(resourceDir)) {
      ctx.response.status = 500;
      ctx.response.body = {
        message: "Resource Server cannot find",
        statusCode: -1,
      };

      ctx.set("notification", true);
      return;
    }

    let port = portUtils.getRandomPort();
    while (portUtils.handleExistPort(port)) {
      port = portUtils.getRandomPort();
    }
    resourceUrl = await new Promise((resolve, reject) => {
      createLiveServer(
        {
          data: resourceItem,
          port,
        },
        resolve,
        reject
      );
    });
  }

  let port = null;

  const serverUrl = url.find((item) => item.type === "url");

  if (global.projectStatus.has(name + serverUrl?.url)) {
    port = global.projectStatus.get(name + serverUrl?.url).port;
  } else {
    port = portUtils.getRandomPort();
  }

  while (portUtils.handleExistPort(port)) {
    port = portUtils.getRandomPort();
  }

  await new Promise((resolve, reject) => {
    const info = {
      name,
      url: serverUrl?.url,
      port,
      noSelectLocalUrl: serverUrl?.noSelect,
      isEntiretyCache,
    };

    if (resourceUrl) info.resourceUrl = resourceUrl;
    if (resourceItem) info.resourceName = resourceItem?.url;
    createChildProcess(info, resolve, reject);
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
  const serverUrl = url.find((item) => item.type === "url")?.url;
  const projectStatus = global.projectStatus.get(name + serverUrl);

  if (projectStatus) projectStatus.childProcess?.stdin.write("Page: close");

  ctx.response.body = {
    message: "关闭成功",
    statusCode: 0,
  };
});

module.exports = router.routes();
