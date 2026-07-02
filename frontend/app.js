App({
  onLaunch: function () {
    console.log('水果价格助手启动')
  },
  globalData: {
    // 真机调试: localtunnel内网穿透(需保持隧道运行)
    // 模拟器调试: 可改回 http://localhost:8000/api
    // 上线后: 替换为云开发或正式域名
    baseUrl: 'https://upset-ducks-do.loca.lt/api',
    selectedFruits: [],
    // 通用请求头
    requestHeaders: {
      'Bypass-Tunnel-Reminder': '1',
      'Content-Type': 'application/json'
    }
  },
  // 封装请求方法，统一加超时和请求头
  request: function (options) {
    var that = this
    wx.request({
      url: options.url,
      data: options.data,
      method: options.method || 'GET',
      timeout: options.timeout || 8000,
      header: {
        'Bypass-Tunnel-Reminder': '1',
        'Content-Type': 'application/json'
      },
      success: options.success,
      fail: options.fail
    })
  }
})