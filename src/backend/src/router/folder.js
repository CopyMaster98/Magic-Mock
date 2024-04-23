
const Router = require('koa-router');
const fs = require('fs')
const { folderUtils, } = require('../utils/index');
const router = new Router();

const { folderPath, folderExists, createFolder, folderInfo, folderContent } = folderUtils

router.post('/create', async (ctx) => {
  const { url, name } = ctx.request.body;
  
  if(name) {
    const path = folderPath(`${name}@@${encodeURIComponent(url)}`)
    const isExist = folderExists(path)

    if(!isExist) {
      createFolder(path)
      global.projectStatus.set(name, {
        url: url,
        name: name,
        status: false
      })
      ctx.response.body = {
        message: '项目创建成功',
        statusCode: 0
      }
    } else {
      ctx.response.body = {
        message: '项目名字已存在',
        statusCode: -1
      }
    }
    ctx.set('notification', true);
  }
});

router.get('/info', async(ctx, next) => {
  const path = folderPath('')
  const isExist = folderExists(path)
  let folder = []

  if(isExist) {
    const items = fs.readdirSync(path)
    items.forEach(item => {
      try {
        const stats = folderInfo(`${path}/${item}`);
        
        const [name, url] = item.split('@@')
        const currentProjectStatus = global.projectStatus.get(name)
        
        folder.push({
          name,
          url: decodeURIComponent(url),
          status: currentProjectStatus?.status,
          stats
        })
      } catch (err) {
        console.error(err);
      }
    })
  }

  folder = folder.sort((a, b) => a.stats.birthtimeMs - b.stats.birthtimeMs)

  ctx.response.body = {
    project: !isExist ? [] : folder,
    statusCode: 0
  }
})

router.get('/project/:projectName', async(ctx, next) => {
  const path = folderPath('') + '/' + ctx.params.projectName
  const projectInfo = fs.readdirSync(path)
  // const content = folderContent(path)

  console.log(projectInfo)
  
  if(!projectInfo.length)
    ctx.response.body = {
      statusCode: 0,
      projectInfo: []
    }
})

module.exports = router.routes()
