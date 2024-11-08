const CDP = require("chrome-remote-interface");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const CONSTANT = require("../backend/src/constants/index");
const args = process.argv.slice(2);
const findChrome = require("chrome-finder");
const chokidar = require("chokidar");
const { folderUtils, commonUtils, hashUtils } = require("../backend/src/utils");
const { isValidJSON } = require("../backend/src/utils/common");
const { JSDOM } = require("jsdom");
(async () => {
  const chromePath = findChrome();
  // 如果找到了 Chrome，启动 Puppeteer 并指定 Chrome 可执行文件的路径
  if (!chromePath) {
    // console.log('Chrome not found, please install it first.')
    process.stderr.write(`Error: Chrome not found.`);
    return;
  }

  const {
    name,
    url,
    resourceUrl,
    port,
    isEntiretyCache,
    resourceName,
    noSelectLocalUrl,
  } = process.env.projectInfo ? JSON.parse(process.env.projectInfo) : {};
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    args: [`--remote-debugging-port=${port}`],
  });
  const page = await browser.newPage();

  // 设置页面视口大小为屏幕大小
  await page.setViewport({
    width: 0, // 设置为0表示自动调整为浏览器窗口宽度
    height: 0, // 设置为0表示自动调整为浏览器窗口高度
    deviceScaleFactor: 1, // 设置设备像素比
  });

  const pages = await browser.pages(); // 获取所有打开的页面

  pages[0].close();

  if (resourceUrl) {
    await page.setRequestInterception(true);
    let files = [];
    try {
      files = fs.readdirSync(
        folderUtils.folderPath(
          encodeURIComponent(resourceName),
          CONSTANT.OFFLINE_RESOURCE
        )
      );
    } catch (error) {}

    page.on("request", async (request) => {
      const url = request.url();
      // 检查请求 URL 是否是目标 URL
      if (resourceUrl && !url.includes(resourceUrl)) {
        if (
          !["stylesheet", "image", "script"].includes(request.resourceType()) ||
          !url.includes("http")
        )
          await request.continue();
        else {
          const suffix = url.split("/").slice(3).join("/");

          await request.continue({
            url: `${resourceUrl}/${suffix}`,
          });
        }
      } else {
        await request.continue();
      }
    });
  }

  intercept(
    {
      name,
      url,
      resourceUrl,
      port,
      isEntiretyCache,
      resourceName,
      noSelectLocalUrl,
    },
    page
  );
})();

const updateConfig = (configPath) => {
  const newConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  const {
    ruleName,
    rulePattern,
    ruleStatus,
    ruleMethod,
    resourceType,
    payloadJSON,
    responseStatusCode,
    requestHeaderType,
    requestHeader,
    requestHeaderJSON,
    responseDataType,
    responseData,
    responseDataJSON,
  } = newConfig;

  return {
    ruleName,
    rulePattern,
    ruleStatus,
    ruleMethod,
    resourceType,
    payload: payloadJSON,
    responseStatusCode,
    requestHeader:
      requestHeaderType === "text" ? requestHeader : requestHeaderJSON,
    responseData: responseDataType === "text" ? responseData : responseDataJSON,
    requestHeaderType,
    responseDataType,
    configPath,
    patterns:
      resourceType && resourceType.length
        ? resourceType
            .map((item) => [
              {
                urlPattern: rulePattern,
                requestStage: "Request",
                ruleMethod,
                payload: payloadJSON,
                resourceType: item,
                responseStatusCode,
                configPath,
              },
              {
                urlPattern: rulePattern,
                requestStage: "Response",
                ruleMethod,
                payload: payloadJSON,
                resourceType: item,
                responseStatusCode,
                configPath,
              },
            ])
            .flat(Infinity)
        : [
            {
              urlPattern: rulePattern,
              requestStage: "Request",
              ruleMethod,
              payload: payloadJSON,
              responseStatusCode,
              configPath,
            },
            {
              urlPattern: rulePattern,
              requestStage: "Response",
              ruleMethod,
              payload: payloadJSON,
              responseStatusCode,
              configPath,
            },
          ],
  };
};

const updateFileOrFolder = (data, path, newFilePath, cacheDataUrlPatterns) => {
  if (!folderUtils.folderExists(path)) folderUtils.createFolder(path);

  if (!folderUtils.folderExists(newFilePath))
    folderUtils.createFolder(newFilePath);

  const fileNameHash = hashUtils.getHash(
    encodeURIComponent(data.params.request.url?.split("?")[0])
  );

  if (
    cacheDataUrlPatterns.find(
      (item) => item.ruleName === fileNameHash && item.cacheStatus
    )
  )
    return;

  const requestFile = newFilePath + "/" + fileNameHash + ".request.json";

  if (folderUtils.folderExists(requestFile)) {
    fs.writeFileSync(
      requestFile,
      JSON.stringify(
        {
          id: hashUtils.getHash(
            encodeURIComponent(data.params.request.url?.split("?")[0])
          ),
          ...data,
        },
        null,
        2
      )
    );
  } else {
    folderUtils.createFile(
      requestFile,
      JSON.stringify(
        {
          id: hashUtils.getHash(
            encodeURIComponent(data.params.request.url?.split("?")[0])
          ),
          ...data,
        },
        null,
        2
      )
    );
  }
};

async function intercept(data, page) {
  let client;
  let config = {};
  let urlPatterns = [];
  let staticResourceName = "";
  const cacheDataConfig = {};
  let resourceDataConfig = [];
  let prevRequest = {
    data: null,
    request: null,
    needSave: false,
  };
  const {
    name,
    url,
    port,
    isEntiretyCache,
    resourceUrl,
    noSelectLocalUrl,
    resourceName,
  } = data;
  const projectName = folderUtils.folderPath(
    `${name}εε${encodeURIComponent(url)}`
  );
  const cacheDataProjectName = folderUtils.folderPath(
    `${name}εε${encodeURIComponent(url)}`,
    CONSTANT.LOCAL_SERVER
  );

  const resourceProjectName = resourceName
    ? folderUtils.folderPath(
        encodeURIComponent(resourceName),
        CONSTANT.OFFLINE_RESOURCE
      )
    : "";

  let cacheDataUrlPatterns = [];
  let resourceDataUrlPatterns = [];
  let rules = fs.readdirSync(projectName);
  let configFile = rules.filter((item) => item.endsWith(".config.json"));
  const fileContentMap = new Map();

  try {
    client = await CDP({ port });

    let { Network, Page, Fetch } = client;

    await Promise.all([
      Network.enable(),
      Page.enable(),
      Fetch.enable({
        patterns: urlPatterns.map((item) => item.value).flat(Infinity),
      }),
    ]);

    const handleUpdate = async (configPath, isInit = false) => {
      if (isInit) {
        config.responseData = [];
        config.requestHeader = [];
        urlPatterns = [];
      }

      if (!config.responseData) config.responseData = [];

      if (!config.requestHeader) config.requestHeader = [];

      let isFileExists = folderUtils.folderExists(configPath);

      let fileContent = !isFileExists
        ? fileContentMap.get(configPath)
        : updateConfig(configPath);

      if (!isFileExists) {
        config.responseData = config.responseData?.filter(
          (item) => item.ruleName !== fileContent?.ruleName
        );
        urlPatterns = urlPatterns.filter(
          (item) => item.ruleName !== fileContent?.ruleName
        );
        fileContentMap.delete(configPath);
        return;
      }

      fileContentMap.set(configPath, fileContent);

      const {
        patterns,
        responseData,
        requestHeader,
        requestHeaderType,
        ruleName,
        rulePattern,
        ruleMethod,
        resourceType,
        ruleStatus,
        responseDataType,
        responseStatusCode,
      } = fileContent;

      config.responseData = config.responseData?.filter(
        (item) => item.ruleName !== ruleName
      );
      config.requestHeader = config.requestHeader?.filter(
        (item) => item.ruleName !== ruleName
      );

      config.responseData?.push({
        ruleName,
        rulePattern,
        path: configPath,
        value: responseData,
        responseDataType,
        ruleMethod,
        resourceType,
        responseStatusCode,
      });

      config.requestHeader?.push({
        value: requestHeader,
        requestHeaderType,
        ruleMethod,
        resourceType,
        ruleName,
        rulePattern,
        path: configPath,
        responseStatusCode,
      });

      urlPatterns = urlPatterns.filter((item) => item.ruleName !== ruleName);
      if (ruleStatus) {
        const newPatterns =
          resourceType && resourceType.length > 0
            ? resourceType.map((item) => ({
                ruleName,
                rulePattern,
                path: configPath,
                value: patterns,
                ruleMethod,
                resourceType: item,
              }))
            : [
                {
                  ruleName,
                  rulePattern,
                  path: configPath,
                  value: patterns,
                  ruleMethod,
                },
              ];
        urlPatterns.push(...newPatterns);
      }

      if (
        (urlPatterns.length > 0 &&
          !urlPatterns[0].value[0].hasOwnProperty("init")) ||
        urlPatterns.length === 0
      ) {
        urlPatterns.unshift({
          value: [
            {
              urlPattern: "*",
              requestStage: "Response",
              // resourceType: "XHR",
              init: true,
            },
            // {
            //   urlPattern: "*",
            //   requestStage: "Response",
            //   resourceType: "Fetch",
            //   init: true,
            // },
          ],
        });
      }
      // TODO need delete
      config.responseData &&
        process.stdout.write(JSON.stringify(config.responseData));
    };
    const initWatch = async () =>
      await new Promise(async (resolve) => {
        rules = fs.readdirSync(projectName);
        configFile = rules.filter((item) => item.endsWith(".config.json"));
        const watcher = chokidar.watch(projectName, {
          ignored: /(^|[/\\])\../, // 忽略隐藏文件
          persistent: true, // 持续监听
        });
        watcher.on("all", async (event, configPath) => {
          if (["unlink", "add", "change"].includes(event)) {
            await handleUpdate(configPath, false);

            await Fetch.enable({
              patterns: urlPatterns.map((item) => item.value).flat(Infinity),
            });
          }
        });
        configFile.forEach(async (item, index) => {
          const configPath = `${projectName}/${item}`;
          await handleUpdate(configPath, index === 0);
        });

        await Fetch.enable({
          patterns: urlPatterns.map((item) => item.value).flat(Infinity),
        });
        resolve();
      });

    const initResourceDataConfig = async (resourcePath) => {
      // const _resourcePath = path
      //   .dirname(resourcePath)
      //   .endsWith("Offline-Resource")
      //   ? resourcePath
      //   : path.dirname(resourcePath);
      if (!path.dirname(resourcePath).endsWith("Offline-Resource")) {
        let content = fs.readFileSync(resourcePath, "utf8");

        content = isValidJSON(content)
          ? JSON.parse(fs.readFileSync(resourcePath, "utf8"))
          : content;
        content.path = resourcePath;

        resourceDataConfig = resourceDataConfig.filter(
          (item) => item.id !== content.id
        );
        resourceDataConfig.push(content);
      } else {
        try {
          const configFileNames = fs
            .readdirSync(resourcePath)
            .filter((item) => item.endsWith(".request.json"));

          configFileNames.forEach(async (name) => {
            const content = JSON.parse(
              fs.readFileSync(`${resourcePath}/${name}`, "utf8")
            );

            content.path = `${resourcePath}/${name}`;
            resourceDataConfig.push(content);
          });
        } catch (error) {}
      }

      const urlPattern = [];
      resourceDataConfig.forEach((item) => {
        const url = item.params?.request.url;
        const method = item.params?.request.method;
        const findCachePattern = urlPattern.find(
          (_item) => _item.rulePattern === url
        );

        if (findCachePattern) {
          findCachePattern.value = findCachePattern.value.filter(
            (_item) =>
              _item.methodType &&
              _item.methodType !== item.params.request.method
          );

          findCachePattern.value.push(
            ...[
              {
                ...item,
                responseStatusCode: 200,
                urlPattern: url + "*",
                requestStage: "Request",
                methodType: method,
                patternType: "cache",
              },
              {
                ...item,
                responseStatusCode: 200,
                urlPattern: url + "*",
                requestStage: "Response",
                methodType: method,
                patternType: "cache",
              },
            ]
          );
        } else {
          urlPattern.push({
            rulePattern: url,
            ruleName: item.id,
            value: [
              {
                ...item,
                responseStatusCode: 200,
                urlPattern: url + "*",
                requestStage: "Request",
                methodType: method,
                patternType: "cache",
              },
              {
                ...item,
                responseStatusCode: 200,
                urlPattern: url + "*",
                requestStage: "Response",
                methodType: method,
                patternType: "cache",
              },
            ],
          });
        }
      });
      resourceDataUrlPatterns = urlPattern;
    };

    const initCacheDataConfig = async (dataPath) => {
      if (dataPath) {
        const method = path.basename(path.dirname(dataPath));
        let content = fs.readFileSync(dataPath, "utf8");
        content = isValidJSON(content)
          ? JSON.parse(fs.readFileSync(dataPath, "utf8"))
          : content;
        content.path = dataPath;
        if (!cacheDataConfig[method]) cacheDataConfig[method] = [];
        cacheDataConfig[method] = cacheDataConfig[method].filter(
          (item) => item.id !== content.id
        );
        cacheDataConfig[method].push(content);
      } else if (folderUtils.folderExists(cacheDataProjectName)) {
        const methods = fs
          .readdirSync(cacheDataProjectName)
          ?.filter((method) => CONSTANT.METHODS.includes(method));

        methods.forEach((method) => {
          const cacheFilePath = fs
            .readdirSync(`${cacheDataProjectName}/${method}`)
            ?.filter((file) => file.endsWith(".request.json"));
          cacheFilePath.forEach((fileName) => {
            const localPath = `${cacheDataProjectName}/${method}/${fileName}`;
            const content = JSON.parse(fs.readFileSync(localPath, "utf8"));

            content.path = localPath;

            if (!cacheDataConfig[method]) cacheDataConfig[method] = [];

            cacheDataConfig[method].filter((item) => item.id !== content.id);
            cacheDataConfig[method].push(content);
          });
        });
      }

      const urlPattern = [];
      Object.keys(cacheDataConfig).forEach((method) => {
        cacheDataConfig[method].forEach((item) => {
          const url = item.params?.request.url;
          const findCachePattern = urlPattern.find(
            (_item) => _item.rulePattern === url
          );

          if (findCachePattern) {
            findCachePattern.value = findCachePattern.value.filter(
              (_item) =>
                _item.methodType &&
                _item.methodType !== item.params.request.method
            );

            if (item.cacheStatus) {
              findCachePattern.value.push(
                ...[
                  {
                    ...item,
                    responseStatusCode: 200,
                    urlPattern: url,
                    requestStage: "Request",
                    methodType: method,
                    patternType: "cache",
                  },
                  {
                    ...item,
                    responseStatusCode: 200,
                    urlPattern: url,
                    requestStage: "Response",
                    methodType: method,
                    patternType: "cache",
                  },
                ]
              );
              if (findCachePattern.value.length === 0)
                findCachePattern.cacheStatus = false;
            }
          } else {
            if (item.cacheStatus) {
              urlPattern.push({
                rulePattern: url,
                ruleName: item.id,
                cacheStatus: item.cacheStatus,
                value: [
                  {
                    ...item,
                    responseStatusCode: 200,
                    urlPattern: url,
                    requestStage: "Request",
                    methodType: method,
                    patternType: "cache",
                  },
                  {
                    ...item,
                    responseStatusCode: 200,
                    urlPattern: url,
                    requestStage: "Response",
                    methodType: method,
                    patternType: "cache",
                  },
                ],
              });
            }
          }
        });
      });

      cacheDataUrlPatterns = urlPattern;

      const newUrlPatters = [
        ...urlPatterns.map((item) => item.value).flat(Infinity),
        ...cacheDataUrlPatterns
          .filter((item) => item.cacheStatus)
          .map((item) => item.value)
          .flat(Infinity),
      ];

      try {
        await Fetch.enable({
          patterns: newUrlPatters,
        });
      } catch (error) {}
    };

    const watcher = chokidar.watch(cacheDataProjectName, {
      ignored: /(^|[/\\])\../, // 忽略隐藏文件
      persistent: true, // 持续监听
    });

    watcher.on("change", async (path, stats) => {
      await initCacheDataConfig(path);
    });

    watcher.on("unlink", async (_path, stats) => {
      const name = path.basename(_path).split(".request.json")[0];
      const methodType = path.basename(path.dirname(_path));

      const currentRule = cacheDataUrlPatterns.find(
        (item) => item.ruleName === name
      );

      if (currentRule)
        currentRule.value = currentRule.value.filter(
          (item) => item.methodType !== methodType
        );
    });
    await initCacheDataConfig();
    if (configFile.length) {
      await initWatch();
    } else {
      if (
        (urlPatterns.length > 0 &&
          !urlPatterns[0].value[0].hasOwnProperty("init")) ||
        urlPatterns.length === 0
      ) {
        urlPatterns.unshift({
          value: [
            {
              urlPattern: "*",
              requestStage: "Response",
              // resourceType: "XHR",
              init: true,
            },
            // {
            //   urlPattern: "*",
            //   requestStage: "Response",
            //   resourceType: "Fetch",
            //   init: true,
            // },
          ],
        });
      }

      await Fetch.enable({
        patterns: urlPatterns.map((item) => item.value).flat(Infinity),
      });

      await initWatch();
    }

    if (noSelectLocalUrl && resourceUrl) {
      const watcher = chokidar.watch(resourceProjectName, {
        ignored: /(^|[/\\])\../, // 忽略隐藏文件
        persistent: true, // 持续监听
      });

      watcher.on("change", async (path, stats) => {
        if (!path.endsWith(".request.json")) return;
        await initResourceDataConfig(path);
      });

      watcher.on("unlink", async (_path, stats) => {
        if (!_path.endsWith(".request.json")) return;

        const name = path.basename(_path).split(".request.json")[0];

        const currentRule = resourceDataUrlPatterns.find(
          (item) => item.ruleName === name
        );

        if (currentRule)
          currentRule.value = currentRule.value.filter(
            (item) => item.aaa7d2e2fd8e7610 !== name
          );
      });
      await initResourceDataConfig(resourceProjectName);
    }

    Fetch.requestPaused(async (params) => {
      const requestUrl = params.request.url;
      const allUrlPatterns = urlPatterns
        .map((item) => item.value)
        .flat(Infinity);

      let matchedPattern = null;
      let matchedPatternStr = "";

      if (!noSelectLocalUrl) {
        allUrlPatterns.forEach((pattern) => {
          let flag =
            (!pattern.ruleMethod?.length ||
              pattern.ruleMethod.includes(params.request.method)) &&
            (!pattern.resourceType?.length ||
              pattern.resourceType.includes(params.resourceType));

          if (flag && pattern.payload) {
            if (matchedPattern && matchedPattern.payload) {
              const payload = matchedPattern.payload;
              const payloadKeysLength = Object.keys(payload).length;

              if (params.request.method.toLowerCase() === "get") {
                const searchParamsKeyValue = new URL(params.request.url)
                  .searchParams;
                const searchParamsKeysLength =
                  Object.keys(searchParamsKeyValue)?.length;

                if (
                  !searchParamsKeysLength ||
                  searchParamsKeysLength !== payloadKeysLength
                )
                  flag = false;
                else {
                  flag = Object.keys(payload).every(
                    (key) => payload[key] === searchParamsKeyValue[key]
                  );
                }
              } else {
                const requestData = commonUtils.isValidJSON(
                  params.request.postData
                )
                  ? JSON.parse(params.request.postData)
                  : {};

                const requestDataLength = Object.keys(requestData)?.length;

                if (
                  !requestDataLength ||
                  requestDataLength !== payloadKeysLength
                )
                  flag = false;
                else
                  flag = Object.keys(payload).every(
                    (key) => payload[key] === requestData[key]
                  );
              }
            }
          }

          if (
            pattern.urlPattern.length > 1 &&
            pattern.urlPattern.endsWith("*") &&
            params.request.url.startsWith(pattern.urlPattern.slice(0, -1))
          ) {
            if (
              pattern.urlPattern.slice(0, -1).length >
                matchedPatternStr.length &&
              flag
            ) {
              matchedPattern = pattern;
              matchedPatternStr = pattern.urlPattern.slice(0, -1);
            }
          } else if (
            pattern.urlPattern.length > 1 &&
            pattern.urlPattern.startsWith("*") &&
            params.request.url.endsWith(pattern.urlPattern.slice(1))
          ) {
            if (
              pattern.urlPattern.slice(1).length > matchedPatternStr.length &&
              flag
            ) {
              matchedPattern = pattern;
              matchedPatternStr = pattern.urlPattern.slice(1);
            }
          } else {
            const regex = /^[*]?([^*]+)[*]?$/g;

            let match;
            while ((match = regex.exec(pattern.urlPattern)) !== null) {
              const res = params.request.url.includes(match[1]);

              if (res) {
                if (match[1].length > matchedPatternStr.length && flag) {
                  matchedPattern = pattern;
                  matchedPatternStr = match[1];
                }
              }
            }
          }
        });
      }

      let cacheMatchedPattern = null;
      let cacheMatchedPatternStr = "";

      let resourceMatchedPattern = null;
      let resourceMatchedPatternStr = "";

      if (!matchedPattern) {
        cacheDataUrlPatterns
          .filter((item) => item.cacheStatus)
          .map((item) => item.value)
          .flat(Infinity)
          .forEach((pattern) => {
            const regex = /^[*]?([^*]+)[*]?$/g;

            let match;
            while ((match = regex.exec(pattern.urlPattern)) !== null) {
              const res =
                params.request.url.includes(match[1]) &&
                params.request.method === pattern.methodType &&
                params.resourceType ===
                  (pattern.resourceType ?? pattern.params.resourceType);

              if (res) {
                if (
                  match[1].length > cacheMatchedPatternStr.length &&
                  pattern.methodType === params.request.method &&
                  (pattern.resourceType ?? pattern.params.resourceType) ===
                    params.resourceType
                ) {
                  cacheMatchedPattern = pattern;
                  cacheMatchedPatternStr = match[1];
                }
              }
            }
          });
      }

      if (!cacheMatchedPattern) {
        resourceDataUrlPatterns
          .map((item) => item.value)
          .flat(Infinity)
          .forEach((pattern) => {
            const regex = /^[*]?([^*]+)[*]?$/g;

            let match;
            while ((match = regex.exec(pattern.urlPattern)) !== null) {
              const res =
                params.request.url.includes(match[1]) &&
                params.request.method === pattern.methodType &&
                params.resourceType ===
                  (pattern.resourceType ?? pattern.params.resourceType);

              if (res) {
                if (
                  match[1].length > resourceMatchedPatternStr.length &&
                  pattern.methodType === params.request.method &&
                  (pattern.resourceType ?? pattern.params.resourceType) ===
                    params.resourceType
                ) {
                  resourceMatchedPattern = pattern;
                  resourceMatchedPatternStr = match[1];
                }
              }
            }
          });
      }
      const isExistLocalServer = folderUtils.folderExists(
        CONSTANT.LOCAL_SERVER
      );

      let localServerPath = `${name}εε${encodeURIComponent(url)}`;

      const localServerProjectPath = folderUtils.folderPath(
        localServerPath,
        CONSTANT.LOCAL_SERVER
      );
      let responseData = "";

      if (params.responseStatusCode) {
        const isEntiretyCacheFlag =
          isEntiretyCache ||
          (!isEntiretyCache && ["Fetch", "XHR"].includes(params.resourceType));
        try {
          await Fetch.getResponseBody({
            requestId: params.requestId,
          }).then((data) => {
            responseData += data.body;
          });
        } catch (error) {}

        if (responseData) responseData = Buffer.from(responseData, "base64");

        if (params.resourceType !== "Image")
          responseData = responseData.toString();

        try {
          responseData = responseData && JSON.parse(responseData);
        } catch (error) {}

        params.responseData = responseData;

        //TODO
        if (isEntiretyCacheFlag && !resourceUrl && responseData) {
          const fileSuffix = {
            Document: ".html",
            Stylesheet: ".css",
            Script: ".js",
          };
          const fileNameArr = params.request.url
            .split("?")[0]
            .split("/")
            .slice(3);

          let staticResourcePath = `${process.cwd()}/Offline-Resource`;

          if (!folderUtils.folderExists(staticResourcePath))
            folderUtils.createFolder(staticResourcePath);

          if (params.resourceType === "Document") {
            responseData = new JSDOM(responseData).serialize();
            const urlName =
              params.request.url.length > 50
                ? params.request.url.includes(".com")
                  ? params.request.url.split(".com")[0] + ".com"
                  : params.request.url.slice(0, 50)
                : params.request.url;
            staticResourceName = encodeURIComponent(urlName) + +new Date();

            if (
              !folderUtils.folderExists(
                `${staticResourcePath}/${staticResourceName}`
              )
            )
              folderUtils.createFolder(
                `${staticResourcePath}/${staticResourceName}`
              );
            fs.writeFile(
              `${staticResourcePath}/${staticResourceName}/index${
                fileSuffix[params.resourceType]
              }`,
              responseData,
              (err) => err && console.error("Error saving file:", err)
            );
          } else if (["Stylesheet", "Script"].includes(params.resourceType)) {
            fs.mkdir(
              `${staticResourcePath}/${staticResourceName}/${fileNameArr
                .slice(0, fileNameArr.length - 1)
                .join("/")}`,
              { recursive: true },
              (err) => {
                if (err) {
                  console.error("Error creating directory:", err);
                } else {
                  fs.writeFile(
                    `${staticResourcePath}/${staticResourceName}/${fileNameArr.join(
                      "/"
                    )}`,
                    responseData,
                    (err) => {
                      if (err) {
                        console.error("Error writing file:", err);
                      } else {
                        console.log("File created successfully!");
                      }
                    }
                  );
                }
              }
            );
          } else if (params.resourceType === "Image") {
            // TODO buffer chunk
            // if (
            //   prevRequest?.request?.request.url.split("?")[0] !==
            //   params.request.url.split("?")[0]
            // ) {
            //   fs.writeFile(
            //     `${staticResourcePath}/${staticResourceName}/${saveName}`,
            //     prevRequest.needSave ? prevRequest.data : responseData,
            //     (err) => err && console.error("Error saving file:", err)
            //   );

            //   prevRequest = {
            //     request: params,
            //     data: Buffer.from(responseData, "base64"),
            //     needSave: false,
            //   };
            // } else {
            //   prevRequest.data = Buffer.concat([
            //     prevRequest.data,
            //     responseData,
            //   ]);

            //   prevRequest.needSave = true;
            // }
            fs.mkdir(
              `${staticResourcePath}/${staticResourceName}/${fileNameArr
                .slice(0, fileNameArr.length - 1)
                .join("/")}`,
              { recursive: true },
              (err) => {
                if (err) {
                  console.error("Error creating directory:", err);
                } else {
                  fs.writeFile(
                    `${staticResourcePath}/${staticResourceName}/${fileNameArr.join(
                      "/"
                    )}`,
                    responseData,
                    (err) => {
                      if (err) {
                        console.error("Error writing file:", err);
                      } else {
                        console.log("File created successfully!");
                      }
                    }
                  );
                }
              }
            );
          }
        }

        if (!cacheMatchedPattern && !matchedPattern) {
          // TODO 当本地启动服务器时 禁止缓存静态资源
          if (!resourceUrl) {
            let savePath = localServerProjectPath;
            let newFilePath =
              localServerProjectPath + "/" + params.request.method;
            if (
              ["Document", "Stylesheet", "Script", "Image"].includes(
                params.resourceType
              )
            ) {
              savePath = folderUtils.folderPath(
                staticResourceName,
                CONSTANT.OFFLINE_RESOURCE
              );

              newFilePath = savePath;
            }

            if (
              isEntiretyCacheFlag ||
              (!isEntiretyCacheFlag &&
                !["Document", "Stylesheet", "Script", "Image"].includes(
                  params.resourceType
                ))
            ) {
              if (
                isExistLocalServer &&
                (params.responseStatusCode.toString().startsWith("2") ||
                  params.responseStatusCode.toString().startsWith("3"))
              ) {
                updateFileOrFolder(
                  { params, cacheStatus: false },
                  savePath,
                  newFilePath,
                  cacheDataUrlPatterns
                );
              } else {
                const serverPath = folderUtils.folderPath(
                  CONSTANT.LOCAL_SERVER,
                  ""
                );
                folderUtils.createFolder(serverPath);
                updateFileOrFolder(
                  { params, cacheStatus: false },
                  savePath,
                  newFilePath,
                  cacheDataUrlPatterns
                );
              }
            }
          }
        }
      }

      if (matchedPattern) {
        console.log(
          `请求 ${requestUrl} 符合Mock模式 ${matchedPattern.urlPattern}`
        );

        // 根据需要执行相应的逻辑
        if (params.responseStatusCode) {
          // process.stdout.write(
          //   `matchedPath=${matchedPattern.configPath}&projectName=${name}&url=${url}`
          // );

          console.log(
            `matchedPath=${matchedPattern.configPath}δprojectName=${name}δurl=${url}δtype=Mock`
          );

          // modify responseData

          const matchedResponseData = config.responseData?.find(
            (item) => item.rulePattern === matchedPattern.urlPattern
          );

          if (matchedResponseData && matchedResponseData.value)
            if (matchedResponseData.responseDataType === "json")
              responseData = matchedResponseData.value;
            else
              matchedResponseData.value.forEach((item) => {
                Object.keys(item).forEach((key) => {
                  commonUtils.deepUpdateValue(responseData, key, item[key]);
                });
              });

          await Fetch.fulfillRequest({
            requestId: params.requestId,
            responseHeaders: params.responseHeaders,
            responseCode:
              matchedPattern.responseStatusCode ?? params.responseStatusCode,
            body: Buffer.from(JSON.stringify(responseData)).toString("base64"),
          });
        } else if (params.request.method !== "OPTIONS") {
          const data = commonUtils.isValidJSON(params.request.postData)
            ? JSON.parse(params.request.postData)
            : params.request.postData;

          // modify requestData
          const headersArray = Object.entries(params.request.headers).map(
            ([name, value]) => ({ name, value: value?.toString() })
          );
          const matchedRequestHeader = config.requestHeader?.find(
            (item) => item.rulePattern === matchedPattern.urlPattern
          );

          let newHeaders = headersArray;

          if (matchedRequestHeader) {
            if (matchedRequestHeader?.requestHeaderType === "text") {
              const formatMatchedRequestHeader = matchedRequestHeader.value.map(
                (item) => {
                  const [name, value] = Object.entries(item)[0];

                  return {
                    name,
                    value: value?.toString(),
                  };
                }
              );
              newHeaders = [...headersArray, ...formatMatchedRequestHeader];
            } else if (matchedRequestHeader.value)
              newHeaders = Object.entries(matchedRequestHeader?.value).map(
                ([name, value]) => ({ name, value: value?.toString() })
              );
          }

          try {
            await Fetch.continueRequest({
              headers: newHeaders,
              requestId: params.requestId,
              postData: data
                ? Buffer.from(JSON.stringify(data), "utf8").toString("base64")
                : data,
            });
          } catch (error) {
            console.log(error);
          }
        } else {
          try {
            await Fetch.continueRequest({ requestId: params.requestId });
          } catch (error) {
            console.log(error);
          }
        }
      } else if (cacheMatchedPattern) {
        console.log(
          `请求 ${requestUrl} 符合Cache模式 ${cacheMatchedPattern.urlPattern}`
        );

        // 根据需要执行相应的逻辑
        if (params.responseStatusCode) {
          // process.stdout.write(
          //   `matchedPath=${cacheMatchedPattern.path}&projectName=${name}&url=${url}`
          // );

          console.log(
            `matchedPath=${cacheMatchedPattern.path}δprojectName=${name}δurl=${url}δtype=Cache`
          );
          // modify responseData
          responseData = cacheMatchedPattern.params.responseData;

          await Fetch.fulfillRequest({
            requestId: params.requestId,
            responseHeaders: params.responseHeaders,
            responseCode:
              cacheMatchedPattern.params.responseStatusCode ??
              params.responseStatusCode,
            body: Buffer.from(JSON.stringify(responseData)).toString("base64"),
          });
        } else if (params.request.method !== "OPTIONS") {
          const headersArray = Object.entries(params.request.headers).map(
            ([name, value]) => ({ name, value: value?.toString() })
          );
          try {
            await Fetch.continueRequest({
              headers: headersArray,
              requestId: params.requestId,
              postData: params.request.postData
                ? Buffer.from(
                    JSON.stringify(params.request.postData),
                    "utf8"
                  ).toString("base64")
                : params.request.postData,
            });
          } catch (error) {
            console.log(error);
          }
        } else {
          try {
            await Fetch.continueRequest({ requestId: params.requestId });
          } catch (error) {
            console.log(error);
          }
        }
      }
      // else if (resourceMatchedPattern) {
      //   console.log(
      //     `请求 ${requestUrl} 符合Resource模式 ${resourceMatchedPattern.urlPattern}`
      //   );

      //   // 根据需要执行相应的逻辑
      //   if (
      //     params.responseStatusCode
      //     // || params.responseErrorReason === "InternetDisconnected"
      //   ) {
      //     console.log(
      //       `matchedPath=${resourceMatchedPattern.path}δprojectName=${name}δurl=${url}δtype=Resource`
      //     );
      //     // modify responseData
      //     responseData = resourceMatchedPattern.params.responseData;

      //     responseData =
      //       params.resourceType === "Image"
      //         ? responseData
      //         : JSON.stringify(responseData);
      //     await Fetch.fulfillRequest({
      //       requestId: params.requestId,
      //       responseHeaders: params.responseHeaders ?? [
      //         {
      //           name: "Access-Control-Allow-Origin",
      //           value: "*",
      //         },
      //       ],
      //       responseCode:
      //         resourceMatchedPattern.params.responseStatusCode ??
      //         params.responseStatusCode,
      //       body: Buffer.from(responseData).toString("base64"),
      //     });
      //   } else if (params.request.method !== "OPTIONS") {
      //     const headersArray = Object.entries(params.request.headers).map(
      //       ([name, value]) => ({ name, value: value?.toString() })
      //     );
      //     try {
      //       await Fetch.continueRequest({
      //         headers: headersArray,
      //         requestId: params.requestId,
      //         postData: params.request.postData
      //           ? Buffer.from(
      //               JSON.stringify(params.request.postData),
      //               "utf8"
      //             ).toString("base64")
      //           : params.request.postData,
      //       });
      //     } catch (error) {
      //       console.log(error);
      //     }
      //   } else {
      //     try {
      //       await Fetch.continueRequest({ requestId: params.requestId });
      //     } catch (error) {
      //       console.log(error);
      //     }
      //   }
      // }
      else {
        // console.log(`请求 ${requestUrl} 不匹配任何模式`);
        try {
          await Fetch.continueRequest({ requestId: params.requestId });
        } catch (error) {
          console.log(error);
        }
      }
    });

    // 网络请求发出前触发
    Network.requestWillBeSent((params) => {
      // console.log(params.request.url.slice(0, 100))
    });

    Network.responseReceived(async (params) => {});

    Page.lifecycleEvent((params) => {
      const { name } = params;
    });

    Page.on("loadEventFired", async () => {
      console.log("Page load event fired: page has finished loading.");
      // 在这里执行页面加载完成后的操作
    });

    await Page.setLifecycleEventsEnabled({
      enabled: true,
    });

    // await Page.navigate({ url })

    // 监听网络请求
    Network.responseReceived(async (response) => {
      if (response.response.mimeType.startsWith("image")) {
      }
    });

    // 在页面加载前执行你的操作
    await page.goto(resourceUrl || url);

    process.stdin.on("data", async (data) => {
      if (data?.toString().includes("Page: close")) {
        try {
          await Page.close();
        } catch (error) {
          console.log(error);
          process.stdout.write("Page: close");
        }
      }
    });

    process.stdout.write(`projectName=${name}δurl=${url}`);

    page.on("close", () => {
      console.log("Page: close");
      // 在这里执行页面关闭时的操作
      // 例如执行清理操作或者关闭浏览器等
    });
  } catch (error) {
    console.log(error);
  }
}
