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

  let isExist = folderExists(path);

  if (!isExist && folderExists(folderPath(""))) {
    const files = fs.readdirSync(folderPath(""));
    if (
      files
        .filter((file) => file.includes("εε"))
        .map((file) => file.split("εε")[0])
        .find((file) => file === name)
    )
      isExist = true;
  }

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
            staticResourceCache: false,
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
  const { isResource } = ctx.query;
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
        const currentResourcePath = folderPath(`${resourcePath}/${path}`);
        const stats = folderInfo(currentResourcePath);
        let cacheData = [];

        if (isResource) {
          const resourceCacheFiles = fs
            .readdirSync(currentResourcePath)
            .filter((item) => item.endsWith(".request.json"));

          cacheData = resourceCacheFiles
            .map((item) => {
              const content = folderContent(
                folderPath(`${currentResourcePath}/${item}`)
              );
              let fileContent = null;
              try {
                if (content.length) fileContent = JSON.parse(content);
              } catch (error) {}
              return {
                id: hashUtils.getHash(item),
                name: item,
                method: fileContent
                  ? fileContent?.params?.request?.method
                  : null,
                stats: folderInfo(folderPath(`${currentResourcePath}/${item}`)),
                content: fileContent,
                type: "cache",
              };
            })
            .sort((a, b) => b.stats.birthtimeMs - a.stats.birthtimeMs);
        }

        return {
          key: `resourceγγ${path}`,
          name: path,
          stats,
          cacheData,
          rules: [],
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
              name: item,
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
            staticResourceCache: false,
          },
          cacheData: getLocalServerProjectData(item),
          resource: resourceItems,
        };

        if (files.includes("ζζconfig.json")) {
          const config = folderContent(`${_folderPath}/ζζconfig.json`);

          const {
            urls = [],
            staticResourceCache = false,
            currentUrl = [],
          } = JSON.parse(config);
          info.config = {
            ...info.config,
            urls,
            staticResourceCache,
            currentUrl,
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
  const urlArr = url.map((item) => {
    let suffix = item.startsWith("url_") ? "url_" : "resource_";

    return {
      type: suffix.slice(0, suffix.length - 1),
      url: item.split(suffix)[1],
    };
  });

  const urlItem = urlArr.find((item) => item.type === "url");
  const projectName = (fs.readdirSync(folderPath("")) ?? []).find(
    (item) => hashUtils.getHash(item) === id
  );
  const projectPath = folderPath(projectName);
  const cacheProjectPath = folderPath(projectName, LOCAL_SERVER);
  const newProjectName = [
    name ? name : projectName.split("εε")[0],
    urlItem ? encodeURIComponent(urlItem.url) : projectName.split("εε")[1],
  ].join("εε");
  const newProjectPath = folderPath("") + "/" + newProjectName;
  const newCacheProjectPath =
    folderPath("", LOCAL_SERVER) + "/" + newProjectName;
  const files = fs.readdirSync(folderPath(""));

  let isNewUrl = false;
  let oldFileContent = null;

  if (!folderExists(`${projectPath}/ζζconfig.json`)) {
    fs.writeFileSync(
      `${projectPath}/ζζconfig.json`,
      JSON.stringify(
        {
          currentUrl: urlArr,
          staticResourceCache: false,
        },
        null,
        2
      )
    );
  } else {
    let content = fs.readFileSync(`${projectPath}/ζζconfig.json`, "utf8");
    if (content) content = JSON.parse(content);

    oldFileContent = content;
    fs.writeFileSync(
      `${projectPath}/ζζconfig.json`,
      JSON.stringify(
        {
          ...content,
          currentUrl: urlArr,
        },
        null,
        2
      )
    );
  }

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

  if (
    oldFileContent &&
    urlArr.length === oldFileContent.currentUrl?.length &&
    urlArr.every((item) =>
      oldFileContent.currentUrl?.find(
        (url) => url.url === item.url && url.type === item.type
      )
    )
  )
    isNewUrl = false;
  else isNewUrl = true;

  if (isNewUrl) {
    ctx.response.body = {
      message: "修改成功",
      statusCode: 0,
    };
  } else {
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
  const newUrls = urls.filter((item) => `url_${item}` !== deleteUrl);

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
