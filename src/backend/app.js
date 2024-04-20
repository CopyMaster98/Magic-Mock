const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')
const cors = require('@koa/cors')
const router = require('./src/router/index.js')
app.use(cors());
app.use(bodyParser({
  enableTypes: ['json', 'form', 'text']
}));
app.use(router.routes())

app.listen(9000, () => {
  console.log('server is running at http://localhost:9000')
})