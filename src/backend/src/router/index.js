const Router = require('koa-router');
const router = new Router();
const createRouter = require('./folder');
const folderRouter = require('./project');

router.get('/', async (ctx) => {
  ctx.body = 'Hello';
});

router.use('/folder', createRouter)

router.use('/project', folderRouter)

module.exports = router