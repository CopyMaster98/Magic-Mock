const Router = require("koa-router");
const fs = require("fs");
const { folderUtils, hashUtils } = require("../utils/index");
const router = new Router();

const { folderPath, folderExists, createFolder, folderInfo, folderContent } =
  folderUtils;

router.post("/create", async (ctx) => {
  const { url, name } = ctx.request.body;

  if (name) {
    const path = folderPath(`${name}@@${encodeURIComponent(url)}`);
    const isExist = folderExists(path);

    if (!isExist) {
      createFolder(path);
      global.projectStatus.set(name, {
        url: url,
        name: name,
        status: false,
      });
      ctx.response.body = {
        message: "项目创建成功",
        statusCode: 0,
      };
    } else {
      ctx.response.body = {
        message: "项目名字已存在",
        statusCode: -1,
      };
    }
    ctx.set("notification", true);
  }
});

router.get("/info", async (ctx, next) => {
  const path = folderPath("");
  const isExist = folderExists(path);
  let folder = [];

  if (isExist) {
    const items = fs.readdirSync(path);
    items.forEach((item) => {
      try {
        const stats = folderInfo(`${path}/${item}`);

        const [name, url] = item.split("@@");
        const currentProjectStatus = global.projectStatus.get(name);

        folder.push({
          id: hashUtils.getHash(item),
          name,
          url: decodeURIComponent(url),
          status: currentProjectStatus?.status,
          stats,
        });
      } catch (err) {
        console.error(err);
      }
    });
  }

  folder = folder.sort((a, b) => a.stats.birthtimeMs - b.stats.birthtimeMs);

  ctx.response.body = {
    project: !isExist ? [] : folder,
    statusCode: 0,
  };
});

router.get("/project/:projectId", async (ctx, next) => {
  const projectName = (fs.readdirSync(folderPath("")) ?? []).find((item) => {
    return hashUtils.getHash(item) === ctx.params.projectId;
  });
  const projectPath = folderPath("") + "/" + projectName;

  const projectInfo = fs.readdirSync(projectPath);

  if (!projectInfo.length)
    ctx.response.body = {
      statusCode: 0,
      projectInfo: [],
    };
});

router.put("/project/:projectName", async (ctx) => {
  const { url, name } = ctx.request.body;
  const projectName = (fs.readdirSync(folderPath("")) ?? []).find(
    (item) => item.split("@@")[0] === ctx.params.projectName
  );
  const projectPath = folderPath("") + "/" + projectName;
  const newProjectName = [name, encodeURIComponent(url)].join("@@");
  const newProjectPath = folderPath("") + "/" + newProjectName;
  const isExist = folderExists(newProjectPath);

  if (isExist) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "项目名字已存在",
      statusCode: -1,
    };

    return;
  }
  try {
    fs.renameSync(projectPath, newProjectPath);
    console.log("文件已成功重命名为:", newProjectName);
    ctx.response.body = {
      message: "修改成功",
      statusCode: 0,
    };
  } catch (err) {
    console.error("重命名文件失败:", err);
    ctx.response.status = 500;
    ctx.response.body = {
      message: "修改失败",
      statusCode: -1,
    };
  }
  ctx.set("notification", true);
});

module.exports = router.routes();
