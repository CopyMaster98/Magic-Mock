const CDP = require('chrome-remote-interface')

async function intercept(url) {
  let client;

  try {
    client = await CDP()

    const {Network, Page, Fetch } = client

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
      console.log(params.request.url)
    })

    Network.responseReceived(async params => {
    })

    await Fetch.enable({
      patterns:[]
    })
    // 允许跟踪网络 这时网络事件可以发送到客户端
    await Network.enable()
    await Page.enable()
    // 等待页面加载
    await Page.loadEventFired()

    const history = await Page.getNavigationHistory()

    await Page.navigateToHistoryEntry({
      entryId: history.entries[history.entries.length - 2].id
    })
  } catch (error) {
    console.log(error)
  }
}

intercept('http://127.0.0.1:3000/')