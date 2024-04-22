const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')
const cors = require('@koa/cors')
const router = require('./src/router/index.js')
const createWebSocket = require('./src/websocket/index.js')

app.use(cors());
app.use(bodyParser({
  enableTypes: ['json', 'form', 'text']
}));
app.use(async (ctx, next) => {
  // 设置允许客户端访问的自定义响应头字段
  ctx.set('Access-Control-Expose-Headers', 'notification');

  await next();
});
app.use(router.routes())

createWebSocket()

app.listen(9000, () => {
  console.log('server is running at http://localhost:9000')
})