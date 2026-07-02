const app = getApp()

Page({
  data: {
    fruits: [],
    currentPrices: [],
    selectedFruit: null,
    loading: false,
    loadFailed: false,
    location: '延吉市'
  },

  onLoad: function () {
    this.getLocation()
    this.getFruits()
  },

  getLocation: function () {
    var that = this
    wx.request({
      url: app.globalData.baseUrl.replace('/api', '') + '/api/locate/',
      success: function (res) {
        that.setData({
          location: res.data.city
        })
      },
      fail: function () {
        that.setData({ location: '延吉市' })
      }
    })
  },

  getFruits: function () {
    this.setData({ loading: true, loadFailed: false })
    wx.request({
      url: `${app.globalData.baseUrl}/fruits/`,
      success: (res) => {
        this.setData({
          fruits: res.data,
          loading: false,
          loadFailed: false
        })
      },
      fail: () => {
        this.setData({ loading: false, loadFailed: true })
        wx.showToast({
          title: '网络连接失败，请检查后端服务',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  goToCompare: function (e) {
    const fruitId = e.currentTarget.dataset.id
    const fruitName = e.currentTarget.dataset.name

    this.setData({ selectedFruit: fruitName })

    wx.request({
      url: `${app.globalData.baseUrl}/prices/${fruitId}`,
      success: (res) => {
        this.setData({ currentPrices: res.data })
      },
      fail: () => {
        wx.showToast({ title: '获取价格失败', icon: 'none' })
      }
    })
  },

  guideTap: function (e) {
    const action = e.currentTarget.dataset.action
    if (action === 'search') {
      wx.switchTab({ url: '/pages/search/search' })
    } else if (action === 'compare') {
      wx.switchTab({ url: '/pages/compare/compare' })
    } else if (action === 'buy') {
      if (this.data.currentPrices.length > 0) {
        wx.showToast({ title: '最低价已标红，去购买吧！', icon: 'none' })
      } else {
        wx.showToast({ title: '请先选择一种水果查看价格', icon: 'none' })
      }
    }
  }
})
