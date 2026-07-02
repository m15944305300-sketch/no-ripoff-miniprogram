App({
  onLaunch: function () {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloudbase-d8g6jxgthdd1f2afe',
        traceUser: true
      })
    }
    console.log('水果价格助手启动')
  },
  globalData: {
    // 云开发模式下无需 baseUrl，使用 wx.cloud.callFunction
    baseUrl: '',
    selectedFruits: [],
    // 云开发环境ID
    cloudEnv: 'cloudbase-d8g6jxgthdd1f2afe'
  }
})