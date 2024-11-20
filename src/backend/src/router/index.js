const Router = require("koa-router");
const router = new Router();
const createRouter = require("./folder");
const folderRouter = require("./project");
const ruleRouter = require("./rule");
const cacheRouter = require("./cache");
const resourceRouter = require("./resource");

router.get("/", async (ctx) => {
  ctx.body = "Hello";
});

router.use("/folder", createRouter);

router.use("/project", folderRouter);

router.use("/rule", ruleRouter);

router.use("/cache", cacheRouter);

router.use("/resource", resourceRouter);

module.exports = router;
