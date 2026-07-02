App({
  onLaunch: function () {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-0gkm1fee3b4d013e',
        traceUser: true
      })
    }
    console.log('水果价格助手启动')
  },
  globalData: {
    // 云开发模式下无需 baseUrl，使用 wx.cloud.callFunction
    baseUrl: '',
    selectedFruits: [],
    // 云开发环境ID（需在开通云开发后替换）
    cloudEnv: 'cloud1-0gkm1fee3b4d013e'
  }
})