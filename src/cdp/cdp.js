const CDP = require("chrome-remote-interface");
const puppeteer = require("puppeteer");
const fs = require("fs");
const _url = require("url");
const querystring = require("querystring");
const args = process.argv.slice(2);
const findChrome = require("chrome-finder");
const chokidar = require("chokidar");
const { folderUtils, commonUtils } = require("../backend/src/utils");

(async () => {
  const chromePath = findChrome();
  // 如果找到了 Chrome，启动 Puppeteer 并指定 Chrome 可执行文件的路径
  if (!chromePath) {
    // console.log('Chrome not found, please install it first.')
    process.stderr.write(`Error: Chrome not found.`);
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    args: [`--remote-debugging-port=${args[2]}`],
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
      name: args[0],
      url: args[1],
      port: args[2],
    },
    page
  );
})();

const updateConfig = (configPath) => {
  const newConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));

  return {
    ruleName: newConfig.ruleName,
    rulePattern: newConfig.rulePattern,
    ruleStatus: newConfig.ruleStatus,
    ruleMethod: newConfig.ruleMethod,
    payload: newConfig.payloadJSON,
    requestHeader:
      newConfig.requestHeaderType === "text"
        ? newConfig.requestHeader
        : newConfig.requestHeaderJSON,
    responseData:
      newConfig.responseDataType === "text"
        ? newConfig.responseData
        : newConfig.responseDataJSON,
    requestHeaderType: newConfig.requestHeaderType,
    responseDataType: newConfig.responseDataType,
    patterns: [
      {
        urlPattern: newConfig.rulePattern,
        requestStage: "Request",
        ruleMethod: newConfig.ruleMethod,
        payload: newConfig.payloadJSON,
      },
      {
        urlPattern: newConfig.rulePattern,
        requestStage: "Response",
        ruleMethod: newConfig.ruleMethod,
        payload: newConfig.payloadJSON,
      },
    ],
  };
};

async function intercept(data, page) {
  let client;
  let config = {};
  let urlPatterns = [];
  const { name, url, port } = data;
  const projectName = folderUtils.folderPath(
    `${name}@@${encodeURIComponent(url)}`
  );
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

    if (configFile.length) {
      const handleUpdate = async (configPath, isInit = false) => {
        if (isInit) {
          config.responseData = [];
          config.requestHeader = [];
          urlPatterns = [];
        }

        let isFileExists = folderUtils.folderExists(configPath);

        let fileContent = !isFileExists
          ? fileContentMap.get(configPath)
          : updateConfig(configPath);

        if (!isFileExists) {
          config.responseData = config.responseData.filter(
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
        } = fileContent;

        config.responseData = config.responseData.filter(
          (item) => item.ruleName !== ruleName
        );
        config.requestHeader = config.requestHeader.filter(
          (item) => item.ruleName !== ruleName
        );

        config.responseData.push({
          ruleName,
          rulePattern,
          path: configPath,
          value: responseData,
          responseDataType,
          ruleMethod,
        });

        config.requestHeader.push({
          value: requestHeader,
          requestHeaderType,
          ruleMethod,
          ruleName,
          rulePattern,
          path: configPath,
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

        // todos need delete
        process.stdout.write(JSON.stringify(config.responseData));
      };
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
    }

    Fetch.requestPaused(async (params) => {
      const requestUrl = params.request.url;
      const allUrlPatterns = urlPatterns
        .map((item) => item.value)
        .flat(Infinity);
      const matchedPattern = allUrlPatterns.find((pattern) => {
        const regex = /^[*]?([^*]+)[*]?$/g;

        let match;
        while ((match = regex.exec(pattern.urlPattern)) !== null) {
          const res = params.request.url.includes(match[1]);

          if (res) return true;
        }
        return false;
      });

      let payloadMatched = true;

      console.log(params.request);
      if (matchedPattern && matchedPattern.payload) {
        const payload = matchedPattern.payload;
        const payloadKeysLength = Object.keys(payload).length;

        if (params.request.method.toLowerCase() === "get") {
          const searchParamsKeyValue = new URL(params.request.url).searchParams;
          const searchParamsKeysLength =
            Object.keys(searchParamsKeyValue)?.length;

          if (
            !searchParamsKeysLength ||
            searchParamsKeysLength < payloadKeysLength
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

          if (!requestDataLength || requestDataLength < payloadKeysLength)
            payloadMatched = false;
          else
            payloadMatched = Object.keys(payload).every(
              (key) => payload[key] === requestData[key]
            );
        }
      }
      if (
        matchedPattern &&
        payloadMatched &&
        (!matchedPattern.ruleMethod?.length ||
          matchedPattern.ruleMethod.includes(params.request.method))
      ) {
        console.log(`请求 ${requestUrl} 符合模式 ${matchedPattern.urlPattern}`);
        // 根据需要执行相应的逻辑
        if (params.responseStatusCode) {
          const res = await Fetch.getResponseBody({
            requestId: params.requestId,
          });
          let responseData = res.body && JSON.parse(atob(res.body));

          // modify responseData

          // responseData.id = Math.random();
          const matchedResponseData = config.responseData.find(
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

          Fetch.fulfillRequest({
            requestId: params.requestId,
            responseHeaders: params.responseHeaders,
            responseCode: params.responseStatusCode,
            body: btoa(JSON.stringify(responseData)),
          });
        } else if (params.request.method !== "OPTIONS") {
          const data =
            commonUtils.isValidJSON(params.request.postData) &&
            JSON.parse(params.request.postData);

          // modify requestData
          const headersArray = Object.entries(params.request.headers).map(
            ([name, value]) => ({ name, value: value?.toString() })
          );
          const matchedRequestHeader = config.requestHeader.find(
            (item) => item.rulePattern === matchedPattern.urlPattern
          );

          let newHeaders = headersArray;

          if (matchedRequestHeader.requestHeaderType === "text") {
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
          } else
            newHeaders = Object.entries(matchedRequestHeader.value).map(
              ([name, value]) => ({ name, value: value?.toString() })
            );

          Fetch.continueRequest({
            headers: newHeaders,
            requestId: params.requestId,
            postData: btoa(JSON.stringify(data)),
          });
        } else {
          Fetch.continueRequest({ requestId: params.requestId });
        }
      } else {
        // console.log(`请求 ${requestUrl} 不匹配任何模式`);
        Fetch.continueRequest({ requestId: params.requestId });
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

    process.stdin.on("data", (data) => {
      if (data.includes("Page: close")) Page.close();
    });

    process.stdout.write(`projectName=${name}&url=${url}`);
    page.on("close", () => {
      console.log("Page: close");
      // 在这里执行页面关闭时的操作
      // 例如执行清理操作或者关闭浏览器等
    });
  } catch (error) {
    console.log(error);
  }
}
