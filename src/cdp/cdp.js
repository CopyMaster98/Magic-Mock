const CDP = require('chrome-remote-interface')
const args = process.argv.slice(2)
async function intercept(url) {
  let client;

  try {
    client = await CDP()
    
    const {Network, Page, Fetch, Target } = client
    await Promise.all([
      Network.enable(),
      Page.enable(),
      Fetch.enable({
        patterns:[]
      })
    ]);

    Fetch.requestPaused(async params => {
      const res = await Fetch.getResponseBody({
        requestId: params.requestId
      })
      let responseData = JSON.parse(atob(res.body))

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
      // await Target.createTarget({
      //   url: 'about:blank'
      // })
      // 在这里执行页面加载完成后的操作
    });

    await Page.setLifecycleEventsEnabled({
      enabled: true
    })

    await Page.navigate({ url })
    // 等待页面加载
    await Page.loadEventFired()

   
    process.stdout.write('url:' + url);
    
  } catch (error) {
    console.log(error)
  }
}

intercept(args[0] ?? 'about:blank')
