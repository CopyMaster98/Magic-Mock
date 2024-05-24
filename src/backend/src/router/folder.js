const Router = require("koa-router");
const fs = require("fs");
const { folderUtils, hashUtils } = require("../utils/index");
const router = new Router();

const { folderPath, folderExists, createFolder, folderInfo, folderContent } =
  folderUtils;

router.post("/create", async (ctx) => {
  const { url, name } = ctx.request.body;

  if (name) {
    const path = folderPath(
      `${encodeURIComponent(name)}@@${encodeURIComponent(url)}`
    );
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
    const items = fs.readdirSync(path).filter((item) => item.includes("@@"));
    items.forEach((item) => {
      try {
        const _folderPath = `${path}/${item}`;
        const stats = folderInfo(_folderPath);
        const rules = fs
          .readdirSync(_folderPath)
          .filter((item) => item.includes(".json"))
          .map((item) => {
            const content = folderUtils.folderContent(
              folderPath(`${_folderPath}/${item}`)
            );
            return {
              id: hashUtils.getHash(item),
              name: item,
              stats: folderInfo(`${_folderPath}/${item}`),
              content: content.length ? JSON.parse(content) : {},
            };
          });
        const [name, url] = item.split("@@");
        const currentProjectStatus = global.projectStatus.get(name);

        folder.push({
          id: hashUtils.getHash(item),
          name,
          url: decodeURIComponent(url),
          status: currentProjectStatus?.status ?? false,
          stats,
          rules,
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
  const projectName = folderUtils.findFile(ctx.params.projectId);
  const projectPath = folderPath("") + "/" + projectName;
  const projectInfo = fs.readdirSync(projectPath);

  ctx.response.body = {
    statusCode: 0,
    projectInfo: !projectInfo.length ? [] : projectInfo,
  };
});

router.put("/project/:projectName", async (ctx) => {
  const { url, name, id } = ctx.request.body;
  const projectName = (fs.readdirSync(folderPath("")) ?? []).find(
    (item) => hashUtils.getHash(item) === id
  );
  const projectPath = folderPath(projectName);
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

router.delete("/project/:projectId", async (ctx) => {
  const { projectId } = ctx.params;
  const folderName = folderUtils.findFile(projectId);
  const _folderPath = folderPath(`${folderName}`);

  try {
    folderUtils.deleteFolderRecursive(_folderPath);
    ctx.response.body = {
      message: "删除成功",
      statusCode: 0,
    };
  } catch (error) {
    ctx.response.body = {
      message: "删除成功",
      statusCode: -1,
    };
  }
  ctx.set("notification", true);
});

module.exports = router.routes();
