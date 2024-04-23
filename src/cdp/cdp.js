const CDP = require('chrome-remote-interface')
const puppeteer = require('puppeteer');
const args = process.argv.slice(2);

(async() => {
  const browser = await puppeteer.launch({ headless: false, args: [`--remote-debugging-port=${args[2]}`]  });
  const page = await browser.newPage();

  // 设置页面视口大小为屏幕大小
  await page.setViewport({
    width: 0, // 设置为0表示自动调整为浏览器窗口宽度
    height: 0, // 设置为0表示自动调整为浏览器窗口高度
    deviceScaleFactor: 1, // 设置设备像素比
  });

  const pages = await browser.pages(); // 获取所有打开的页面

  pages[0].close()
  intercept({
    name: args[0],
    url: args[1],
    port: args[2]
  }, page)
})()

async function intercept(data, page) {
  let client;
  const { name, url, port } = data
  try {
    client = await CDP({ port })
    
    const {Network, Page, Fetch } = client

    await Promise.all([
      Network.enable(),
      Page.enable(),
      Fetch.enable({
        patterns:[{
          urlPattern: '*todos*',
          requestStage: 'Response'
        }]
      })
    ]);

    Fetch.requestPaused(async params => {
      const res = await Fetch.getResponseBody({
        requestId: params.requestId
      })
      let responseData = JSON.parse(atob(res.body))

      responseData.id = Math.random()

      Fetch.fulfillRequest({
        requestId: params.requestId,
        responseHeaders: params.responseHeaders,
        responseCode: params.responseStatusCode,
        body: btoa(JSON.stringify(responseData))
      })
    })

    // 网络请求发出前触发
    Network.requestWillBeSent(params => {
      // console.log(params.request.url.slice(0, 100))
    })

    Network.responseReceived(async params => {
    })

    Page.lifecycleEvent((params) => {
      const { name } = params;
      // console.log(params)
      if (name === 'networkAlmostIdle') {
        console.log('Page is about to close');
      }
    });
    
    Page.on('loadEventFired', async () => {
      console.log('Page load event fired: page has finished loading.');
      // 在这里执行页面加载完成后的操作
    });


    await Page.setLifecycleEventsEnabled({
      enabled: true
    })

    // await Page.navigate({ url })

    // 在页面加载前执行你的操作
    await page.goto(url);

    process.stdout.write(`projectName=${name}&url=${url}`);
  } catch (error) {
    console.log(error)
  }
}
