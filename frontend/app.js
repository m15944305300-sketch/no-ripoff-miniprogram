App({
  onLaunch: function () {
    console.log('水果价格助手启动')
  },
  globalData: {
    baseUrl: 'http://localhost:8000/api',
    selectedFruits: []
  }
})