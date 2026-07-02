App({
  onLaunch: function () {
    console.log('水果价格助手启动')
  },
  globalData: {
    // 真机调试: 用电脑局域网IP, 手机和电脑需在同一WiFi
    // 模拟器调试: localhost 也可以用
    // 上线后: 替换为云开发或公网域名
    baseUrl: 'http://192.168.88.23:8000/api',
    selectedFruits: []
  }
})