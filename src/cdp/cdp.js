const CDP = require('chrome-remote-interface')

async function intercept(url) {
  let client;

  try {
    client = await CDP()
    
    const {Network, Page, Fetch } = client
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
    await Page.setLifecycleEventsEnabled({
      enabled: true
    })
    await Page.navigate({ url },)
    // 等待页面加载
    await Page.loadEventFired()

    process.stdout.write('url:' + url);
    
  } catch (error) {
    console.log(error)
  }
}

intercept('https://www.baidu.com')
