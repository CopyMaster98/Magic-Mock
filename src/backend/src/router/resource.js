const Router = require("koa-router");
const fs = require("fs");
const { folderUtils, hashUtils } = require("../utils/index");
const { OFFLINE_RESOURCE } = require("../constants");
const router = new Router();
const { folderPath, folderExists, createFolder, folderInfo, folderContent } =
  folderUtils;

router.get("/info", async (ctx) => {});

module.exports = router.routes();
