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

  onShow: function () {
    // 如果水果列表为空，重新加载（tab切换回来时）
    if (this.data.fruits.length === 0 && !this.data.loading) {
      this.getFruits()
    }
  },

  getLocation: function () {
    var that = this
    wx.request({
      url: app.globalData.baseUrl + '/locate/',
      timeout: 5000,
      header: { 'Bypass-Tunnel-Reminder': '1' },
      success: function (res) {
        if (res.data && res.data.city) {
          that.setData({ location: res.data.city })
        }
      },
      fail: function () {
        that.setData({ location: '延吉市' })
      }
    })
  },

  getFruits: function () {
    // 防止重复调用
    if (this.data.loading) return

    this.setData({ loading: true, loadFailed: false })
    wx.request({
      url: app.globalData.baseUrl + '/fruits/',
      timeout: 8000,
      header: { 'Bypass-Tunnel-Reminder': '1' },
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          // 确保每项都有唯一key，去重保护
          var seen = {}
          var fruits = res.data.filter(function (f) {
            if (!f || !f.id || seen[f.id]) return false
            seen[f.id] = true
            return true
          })
          this.setData({
            fruits: fruits,
            loading: false,
            loadFailed: false
          })
        } else {
          this.setData({ loading: false, loadFailed: true })
        }
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
    var fruitId = e.currentTarget.dataset.id
    var fruitName = e.currentTarget.dataset.name

    this.setData({
      selectedFruit: fruitName,
      currentPrices: []
    })

    wx.request({
      url: app.globalData.baseUrl + '/prices/' + fruitId,
      timeout: 8000,
      header: { 'Bypass-Tunnel-Reminder': '1' },
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          this.setData({ currentPrices: res.data })
        }
      },
      fail: () => {
        wx.showToast({ title: '获取价格失败', icon: 'none' })
      }
    })
  },

  guideTap: function (e) {
    var action = e.currentTarget.dataset.action
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
