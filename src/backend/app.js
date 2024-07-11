const Koa = require("koa");
const app = new Koa();
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const { folderUtils } = require("./src/utils/index.js");
const {
  MAGIC_MOCK_ROOT_PATH,
  LOCAL_SERVER_ROOT_PATH,
} = require("./src/constants/index.js");
const router = require("./src/router/index.js");
const createWebSocket = require("./src/websocket/index.js");
global.projectStatus = new Map();

app.use(cors());
app.use(
  bodyParser({
    enableTypes: ["json", "form", "text"],
  })
);
app.use(async (ctx, next) => {
  // 设置允许客户端访问的自定义响应头字段
  ctx.set("Access-Control-Expose-Headers", "notification");

  await next();
});
app.use(router.routes());

const clients = createWebSocket();

folderUtils.watchFolder(MAGIC_MOCK_ROOT_PATH, clients);
folderUtils.watchFolder(LOCAL_SERVER_ROOT_PATH, clients);

app.listen(9000, () => {
  console.log("server is running at http://localhost:9000");
});
