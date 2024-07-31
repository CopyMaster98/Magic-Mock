const CDP = require("chrome-remote-interface");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const CONSTANT = require("../backend/src/constants/index");
const args = process.argv.slice(2);
const findChrome = require("chrome-finder");
const chokidar = require("chokidar");
const { folderUtils, commonUtils, hashUtils } = require("../backend/src/utils");
const { request } = require("http");
const { isValidJSON } = require("../backend/src/utils/common");

(async () => {
  const chromePath = findChrome();
  // 如果找到了 Chrome，启动 Puppeteer 并指定 Chrome 可执行文件的路径
  if (!chromePath) {
    // console.log('Chrome not found, please install it first.')
    process.stderr.write(`Error: Chrome not found.`);
    return;
  }

  const { name, url, port } = process.env.projectInfo
    ? JSON.parse(process.env.projectInfo)
    : {};
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
  intercept(
    {
      name,
      url,
      port,
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
    payload: payloadJSON,
    responseStatusCode,
    requestHeader:
      requestHeaderType === "text" ? requestHeader : requestHeaderJSON,
    responseData: responseDataType === "text" ? responseData : responseDataJSON,
    requestHeaderType,
    responseDataType,
    configPath,
    patterns: [
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

const updateFileOrFolder = (data, path) => {
  if (!folderUtils.folderExists(path)) folderUtils.createFolder(path);

  const methodPath = path + "/" + data.params.request.method;

  if (!folderUtils.folderExists(methodPath))
    folderUtils.createFolder(methodPath);
  const requestFile =
    methodPath +
    "/" +
    hashUtils.getHash(
      encodeURIComponent(data.params.request.url?.split("?")[0])
    ) +
    ".request.json";

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
  const cacheDataConfig = {};
  const { name, url, port } = data;
  const projectName = folderUtils.folderPath(
    `${name}@@${encodeURIComponent(url)}`
  );
  const cacheDataProjectName = folderUtils.folderPath(
    `${name}@@${encodeURIComponent(url)}`,
    CONSTANT.LOCAL_SERVER
  );

  let cacheDataUrlPatterns = [];
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
        responseStatusCode,
      });

      config.requestHeader?.push({
        value: requestHeader,
        requestHeaderType,
        ruleMethod,
        ruleName,
        rulePattern,
        path: configPath,
        responseStatusCode,
      });

      urlPatterns = urlPatterns.filter((item) => item.ruleName !== ruleName);
      if (ruleStatus)
        urlPatterns.push({
          ruleName,
          rulePattern,
          path: configPath,
          value: patterns,
          ruleMethod: ruleMethod,
        });

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
              resourceType: "XHR",
              init: true,
            },
            {
              urlPattern: "*",
              requestStage: "Response",
              resourceType: "Fetch",
              init: true,
            },
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
          const url = item.params.request.url.split("?")[0];
          const findCachePattern = urlPattern.find(
            (_item) => _item.rulePattern === `*${url}*`
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
                    urlPattern: `*${url}*`,
                    requestStage: "Request",
                    methodType: method,
                    patternType: "cache",
                  },
                  {
                    ...item,
                    responseStatusCode: 200,
                    urlPattern: `*${url}*`,
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
                rulePattern: `*${url}*`,
                ruleName: item.id,
                cacheStatus: item.cacheStatus,
                value: [
                  {
                    ...item,
                    responseStatusCode: 200,
                    urlPattern: `*${url}*`,
                    requestStage: "Request",
                    methodType: method,
                    patternType: "cache",
                  },
                  {
                    ...item,
                    responseStatusCode: 200,
                    urlPattern: `*${url}*`,
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

      await Fetch.enable({
        patterns: newUrlPatters,
      });
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
              resourceType: "XHR",
              init: true,
            },
            {
              urlPattern: "*",
              requestStage: "Response",
              resourceType: "Fetch",
              init: true,
            },
          ],
        });
      }

      await Fetch.enable({
        patterns: urlPatterns.map((item) => item.value).flat(Infinity),
      });

      await initWatch();
    }

    Fetch.requestPaused(async (params) => {
      const requestUrl = params.request.url;
      const allUrlPatterns = urlPatterns
        .map((item) => item.value)
        .flat(Infinity);

      let matchedPattern = allUrlPatterns.find((pattern) => {
        const regex = /^[*]?([^*]+)[*]?$/g;

        let match;
        while ((match = regex.exec(pattern.urlPattern)) !== null) {
          const res = params.request.url.includes(match[1]);

          if (res) return true;
        }
        return false;
      });

      let cacheMatchedPattern = false;
      if (!matchedPattern) {
        cacheMatchedPattern = cacheDataUrlPatterns
          .filter((item) => item.cacheStatus)
          .map((item) => item.value)
          .flat(Infinity)
          .find((pattern) => {
            const regex = /^[*]?([^*]+)[*]?$/g;

            let match;
            while ((match = regex.exec(pattern.urlPattern)) !== null) {
              const res =
                params.request.url.split("?")[0] === match[1] &&
                params.request.method === pattern.methodType;

              if (res) return true;
            }
            return false;
          });
      }

      let payloadMatched = true;

      if (matchedPattern && matchedPattern.payload) {
        const payload = matchedPattern.payload;
        const payloadKeysLength = Object.keys(payload).length;

        if (params.request.method.toLowerCase() === "get") {
          const searchParamsKeyValue = new URL(params.request.url).searchParams;
          const searchParamsKeysLength =
            Object.keys(searchParamsKeyValue)?.length;

          if (
            !searchParamsKeysLength ||
            searchParamsKeysLength !== payloadKeysLength
          )
            payloadMatched = false;
          else {
            payloadMatched = Object.keys(payload).every(
              (key) => payload[key] === searchParamsKeyValue[key]
            );
          }
        } else {
          const requestData = commonUtils.isValidJSON(params.request.postData)
            ? JSON.parse(params.request.postData)
            : {};

          const requestDataLength = Object.keys(requestData)?.length;

          if (!requestDataLength || requestDataLength !== payloadKeysLength)
            payloadMatched = false;
          else
            payloadMatched = Object.keys(payload).every(
              (key) => payload[key] === requestData[key]
            );
        }
      }

      const isExistLocalServer = folderUtils.folderExists(
        CONSTANT.LOCAL_SERVER
      );
      // const projectName = path.dirname(matchedPattern.configPath);
      // .match(/[^\/]+$/)[0];

      let localServerPath = `${name}@@${encodeURIComponent(url)}`;

      const localServerProjectPath = folderUtils.folderPath(
        localServerPath,
        CONSTANT.LOCAL_SERVER
      );
      let response = null;
      let responseData = null;

      if (params.responseStatusCode) {
        response = await Fetch.getResponseBody({
          requestId: params.requestId,
        });

        try {
          responseData =
            response.body &&
            JSON.parse(Buffer.from(response.body, "base64").toString());
        } catch (error) {}

        params.responseData = responseData;

        if (!cacheMatchedPattern && !matchedPattern) {
          if (
            isExistLocalServer &&
            (params.responseStatusCode.toString().startsWith("2") ||
              params.responseStatusCode.toString().startsWith("3"))
          ) {
            updateFileOrFolder(
              { params, cacheStatus: false },
              localServerProjectPath
            );
          } else {
            const serverPath = folderUtils.folderPath(
              CONSTANT.LOCAL_SERVER,
              ""
            );
            folderUtils.createFolder(serverPath);
            updateFileOrFolder(
              { params, cacheStatus: false },
              localServerProjectPath
            );
          }
        }
      }

      if (matchedPattern) {
        if (
          matchedPattern &&
          payloadMatched &&
          (!matchedPattern.ruleMethod?.length ||
            matchedPattern.ruleMethod.includes(params.request.method))
        ) {
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
              body: Buffer.from(JSON.stringify(responseData)).toString(
                "base64"
              ),
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
                const formatMatchedRequestHeader =
                  matchedRequestHeader.value.map((item) => {
                    const [name, value] = Object.entries(item)[0];

                    return {
                      name,
                      value: value?.toString(),
                    };
                  });
                newHeaders = [...headersArray, ...formatMatchedRequestHeader];
              } else if (matchedRequestHeader.value)
                newHeaders = Object.entries(matchedRequestHeader?.value).map(
                  ([name, value]) => ({ name, value: value?.toString() })
                );
            }

            await Fetch.continueRequest({
              headers: newHeaders,
              requestId: params.requestId,
              postData: data
                ? Buffer.from(JSON.stringify(data), "utf8").toString("base64")
                : data,
            });
          } else {
            await Fetch.continueRequest({ requestId: params.requestId });
          }
        } else {
          // console.log(`请求 ${requestUrl} 不匹配任何模式`);
          await Fetch.continueRequest({ requestId: params.requestId });
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
        } else {
          await Fetch.continueRequest({ requestId: params.requestId });
        }
      } else {
        // console.log(`请求 ${requestUrl} 不匹配任何模式`);
        await Fetch.continueRequest({ requestId: params.requestId });
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

    // 在页面加载前执行你的操作
    await page.goto(url);

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
