const Router = require("koa-router");
const router = new Router();
const createRouter = require("./folder");
const folderRouter = require("./project");
const ruleRouter = require("./rule");

router.get("/", async (ctx) => {
  ctx.body = "Hello";
});

router.use("/folder", createRouter);

router.use("/project", folderRouter);

router.use("/rule", ruleRouter);

module.exports = router;
