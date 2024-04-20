const Router = require('koa-router');
const router = new Router();
const createRouter = require('./create');

router.get('/', async (ctx) => {
  ctx.body = 'Hello';
});

router.use('/create', createRouter)

module.exports = router