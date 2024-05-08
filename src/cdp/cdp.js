const CDP = require("chrome-remote-interface");
const puppeteer = require("puppeteer");
const fs = require("fs");
const args = process.argv.slice(2);
const findChrome = require("chrome-finder");
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
    responseData: newConfig.responseData,
    patterns: [
      {
        urlPattern: newConfig.rulePattern,
        requestStage: "Request",
      },
      {
        urlPattern: newConfig.rulePattern,
        requestStage: "Response",
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
  const rules = fs.readdirSync(projectName);
  const configFile = rules.filter((item) => item.endsWith(".config.json"));

  // console.log(configFile);

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
          urlPatterns = [];
        }

        const { patterns, responseData, ruleName, rulePattern } =
          updateConfig(configPath);

        config.responseData = config.responseData.filter(
          (item) => item.ruleName !== ruleName
        );
        config.responseData.push({
          ruleName,
          rulePattern,
          path: configPath,
          value: responseData,
        });
        urlPatterns = urlPatterns.filter((item) => item.ruleName !== ruleName);
        urlPatterns.push({
          ruleName,
          rulePattern,
          path: configPath,
          value: patterns,
        });

        // todos need delete
        process.stdout.write(JSON.stringify(config.responseData));
      };
      await new Promise(async (resolve) => {
        configFile.forEach(async (item, index) => {
          const configPath = `${projectName}/${item}`;

          await handleUpdate(configPath, index === 0);
          fs.watchFile(configPath, async () => {
            await handleUpdate(configPath, false);

            await Fetch.enable({
              patterns: urlPatterns.map((item) => item.value).flat(Infinity),
            });
          });
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
        const regex = /^[*?]([^*?]+)[*?]$/g;

        let match;
        while ((match = regex.exec(pattern.urlPattern)) !== null) {
          const res = params.request.url.includes(match[1]);

          if (res) return true;
        }
        return false;
      });

      if (matchedPattern) {
        console.log(`请求 ${requestUrl} 符合模式 ${matchedPattern.urlPattern}`);
        // 根据需要执行相应的逻辑
        if (params.responseStatusCode) {
          const res = await Fetch.getResponseBody({
            requestId: params.requestId,
          });
          let responseData = res.body && JSON.parse(atob(res.body));

          // modify responseData

          responseData.id = Math.random();

          const matchedResponseData = config.responseData.find(
            (item) => item.rulePattern === matchedPattern.urlPattern
          );

          if (matchedResponseData && matchedResponseData.value)
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
            params.request.postData && JSON.parse(params.request.postData);

          // modify requestData

          Fetch.continueRequest({
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
