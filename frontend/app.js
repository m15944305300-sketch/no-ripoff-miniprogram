App({
  onLaunch: function () {
    console.log('水果价格助手启动')
  },
  globalData: {
    // 真机调试: localtunnel内网穿透(需保持隧道运行)
    // 模拟器调试: 可改回 http://localhost:8000/api
    // 上线后: 替换为云开发或正式域名
    baseUrl: 'https://cute-spies-repeat.loca.lt/api',
    selectedFruits: []
  }
})