
const Router = require('koa-router');
const fs = require('fs')
const { folderUtils, } = require('../utils/index');
const router = new Router();

router.get('/status', async(ctx) => {
  console.log(ctx)
})

module.exports = router.routes()