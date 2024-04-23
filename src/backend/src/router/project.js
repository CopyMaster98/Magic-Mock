
const Router = require('koa-router');
const fs = require('fs')
const { portUtils } = require('../utils/index');
const router = new Router();
const { createChildProcess } = require('../../../cdp/createExec.js')

router.get('/status', async(ctx) => {
  console.log(ctx)
})

router.post('/start', async(ctx) => {
  const { name, url } = ctx.request.body;

  console.log(name, url)
  let port = portUtils.getRandomPort()

  while(portUtils.handleExistPort(port)) {
    port = portUtils.getRandomPort()
  }

  try {
    console.log({
      name,
      url,
      port
    })
    createChildProcess({
      name,
      url,
      port
    })
    ctx.response.body = {
      message: '启动成功',
      statusCode: 1
    }
  } catch(err) {
    ctx.response.body = {
      message: '启动失败',
      statusCode: 500
    }
  }
})

module.exports = router.routes()