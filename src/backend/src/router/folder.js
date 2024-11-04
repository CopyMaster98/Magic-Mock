const Router = require("koa-router");
const fs = require("fs");
const { folderUtils, hashUtils } = require("../utils/index");
const { getLocalServerProjectData } = require("../core");
const { LOCAL_SERVER, OFFLINE_RESOURCE } = require("../constants");
const router = new Router();

const { folderPath, folderExists, createFolder, folderInfo, folderContent } =
  folderUtils;

router.post("/create", async (ctx) => {
  const { url, name } = ctx.request.body;

  const path = folderPath(
    `${encodeURIComponent(name)}εε${encodeURIComponent(url)}`
  );

  const files = fs.readdirSync(folderPath(""));
  let isExist = folderExists(path);

  if (
    !isExist &&
    files
      .filter((file) => file.includes("εε"))
      .map((file) => file.split("εε")[0])
      .find((file) => file === name)
  )
    isExist = true;

  if (!isExist) {
    createFolder(path);
    global.projectStatus.set(name + url, {
      url: url,
      name: name,
      status: false,
    });
    ctx.response.body = {
      message: "项目创建成功",
      statusCode: 0,
    };

    try {
      fs.writeFileSync(
        `${path}/ζζconfig.json`,
        JSON.stringify(
          {
            urls: [url],
            staticResourceCache: true,
          },
          null,
          2
        )
      );
    } catch (error) {}
  } else {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "项目名字已存在",
      statusCode: -1,
    };
  }
  ctx.set("notification", true);
});

router.get("/info", async (ctx, next) => {
  const path = folderPath("");
  const isExist = folderExists(path);
  const resourcePath = folderPath("", OFFLINE_RESOURCE);
  const isResourceExist = folderExists(resourcePath);
  let folder = [];

  let resourceItems = [];
  if (isResourceExist) {
    resourceItems = fs
      .readdirSync(resourcePath)
      .filter((item) => !item.startsWith("."))
      .map((path) => {
        const stats = folderInfo(folderPath(`${resourcePath}/${path}`));

        return {
          key: `resourceγγ${path}`,
          name: encodeURIComponent(path),
          stats,
          cacheData: [],
          id: hashUtils.getHash(path),
        };
      });
  }

  if (isExist) {
    const items = fs.readdirSync(path).filter((item) => item.includes("εε"));

    items.forEach((item) => {
      try {
        const _folderPath = `${path}/${item}`;
        const stats = folderInfo(_folderPath);
        const files = fs.readdirSync(_folderPath);
        const rules = files
          .filter((item) => item.includes(".json") && item !== "ζζconfig.json")
          .map((item) => {
            const content = folderUtils.folderContent(
              folderPath(`${_folderPath}/${item}`)
            );
            return {
              id: hashUtils.getHash(item),
              name: encodeURIComponent(item),
              stats: folderInfo(`${_folderPath}/${item}`),
              content: content.length ? JSON.parse(content) : {},
              type: "mock",
            };
          })
          .sort((a, b) => b.stats.birthtimeMs - a.stats.birthtimeMs);
        const [name, url] = item.split("εε");
        const currentProjectStatus = global.projectStatus.get(
          name + decodeURIComponent(url)
        );
        const info = {
          id: hashUtils.getHash(item),
          name,
          url: decodeURIComponent(url),
          status: currentProjectStatus?.status ?? false,
          stats,
          rules,
          config: {
            urls: [],
            staticResourceCache: true,
          },
          cacheData: getLocalServerProjectData(item),
          resource: resourceItems,
        };

        if (files.includes("ζζconfig.json")) {
          const config = folderContent(`${_folderPath}/ζζconfig.json`);

          const { urls, staticResourceCache } = JSON.parse(config);
          info.config = {
            ...info.config,
            urls,
            staticResourceCache,
          };
        }

        folder.push(info);
      } catch (err) {
        console.error(err);
      }
    });

    folder = folder.sort((a, b) => b.stats.birthtimeMs - a.stats.birthtimeMs);
  }

  ctx.response.body = {
    project: !isExist ? [] : folder,
    resource: !isResourceExist ? [] : resourceItems,
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
  const { name, id, url } = ctx.request.body;
  const projectName = (fs.readdirSync(folderPath("")) ?? []).find(
    (item) => hashUtils.getHash(item) === id
  );
  const projectPath = folderPath(projectName);
  const cacheProjectPath = folderPath(projectName, LOCAL_SERVER);
  const newProjectName = [
    name ? name : projectName.split("εε")[0],
    url ? encodeURIComponent(url) : projectName.split("εε")[1],
  ].join("εε");
  const newProjectPath = folderPath("") + "/" + newProjectName;
  const newCacheProjectPath =
    folderPath("", LOCAL_SERVER) + "/" + newProjectName;

  const files = fs.readdirSync(folderPath(""));
  let isExist = folderExists(newProjectPath);

  if (
    !isExist &&
    name &&
    files
      .filter((file) => file.includes("εε"))
      .map((file) => file.split("εε")[0])
      .find((file) => file === name)
  )
    isExist = true;

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

    if (folderExists(cacheProjectPath)) {
      try {
        fs.renameSync(cacheProjectPath, newCacheProjectPath);
      } catch (err) {
        if (err.toString().includes("operation not permitted")) {
          fs.cpSync(cacheProjectPath, newCacheProjectPath, { recursive: true });
          fs.rmdirSync(cacheProjectPath, { recursive: true });
        }
      }
    }

    console.log("文件已成功重命名为:", newProjectName);
    ctx.response.body = {
      message: "修改成功",
      statusCode: 0,
    };
  } catch (err) {
    if (err.toString().includes("operation not permitted")) {
      try {
        fs.cpSync(projectPath, newProjectPath, { recursive: true });
        fs.rmdirSync(projectPath, { recursive: true });
        console.log("文件已成功重命名为:", newProjectName);
        ctx.response.body = {
          message: "修改成功",
          statusCode: 0,
        };
      } catch (error) {
        console.error("重命名文件失败:", err);
        ctx.response.status = 500;
        ctx.response.body = {
          message: "修改失败",
          statusCode: -1,
        };
      }
    } else {
      console.error("重命名文件失败:", err);
      ctx.response.status = 500;
      ctx.response.body = {
        message: "修改失败",
        statusCode: -1,
      };
    }
  }
  ctx.set("notification", true);
});

router.put("/project/:projectName/url", async (ctx) => {
  const { newUrl, id } = ctx.request.body;
  const projectName = (fs.readdirSync(folderPath("")) ?? []).find(
    (item) => hashUtils.getHash(item) === id
  );

  const projectPath = folderPath(projectName);
  const config = folderContent(`${projectPath}/ζζconfig.json`);

  const fileContent = JSON.parse(config);

  const newUrls = [newUrl];
  if (fileContent) newUrls.unshift(...fileContent.urls);

  try {
    fs.writeFileSync(
      `${projectPath}/ζζconfig.json`,
      JSON.stringify(
        {
          ...fileContent,
          urls: newUrls,
        },
        null,
        2
      )
    );

    ctx.response.body = {
      message: "新增成功",
      statusCode: 0,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "新增失败",
      statusCode: -1,
    };
  }

  ctx.set("notification", true);
});

router.delete("/project/:projectName/url", async (ctx) => {
  const { deleteUrl, id } = ctx.request.body;
  const projectName = (fs.readdirSync(folderPath("")) ?? []).find(
    (item) => hashUtils.getHash(item) === id
  );

  const projectPath = folderPath(projectName);
  const config = folderContent(`${projectPath}/ζζconfig.json`);

  const fileContent = JSON.parse(config);
  const { urls } = fileContent;
  const newUrls = urls.filter((item) => item !== deleteUrl);

  try {
    fs.writeFileSync(
      `${projectPath}/ζζconfig.json`,
      JSON.stringify(
        {
          ...fileContent,
          urls: newUrls,
        },
        null,
        2
      )
    );

    ctx.response.body = {
      message: "删除成功",
      statusCode: 0,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "删除失败",
      statusCode: -1,
    };
  }

  ctx.set("notification", true);
});

router.delete("/project/:projectId", async (ctx) => {
  const { projectId } = ctx.params;
  const folderName = folderUtils.findFile(projectId);
  const _folderPath = folderPath(`${folderName}`);
  const cacheFolderPath = folderPath(`${folderName}`, LOCAL_SERVER);

  try {
    await Promise.allSettled([
      folderUtils.deleteFolderRecursive(_folderPath),
      folderUtils.deleteFolderRecursive(cacheFolderPath),
    ]);
    ctx.response.body = {
      message: "删除成功",
      statusCode: 0,
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "删除失败",
      statusCode: -1,
    };
  }
  ctx.set("notification", true);
});

module.exports = router.routes();
