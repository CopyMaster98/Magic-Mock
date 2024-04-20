
const Router = require('koa-router');
const { folderUtils } = require('../utils/index');
const router = new Router();

const { folderPath, folderExists, createFolder } = folderUtils

router.post('/', async (ctx) => {
  const folderName = ctx.request.body.folderName;
  
  if(folderName) {
    const path = folderPath(folderName)
    const isExist = folderExists(path)

    if(!isExist) {
      createFolder(path)
    }
  }
  ctx.body = 'Hello World!';
});


module.exports = router.routes()
