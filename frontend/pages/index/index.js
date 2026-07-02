var app = getApp()

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
    if (this.data.fruits.length === 0 && !this.data.loading) {
      this.getFruits()
    }
  },

  getLocation: function () {
    var that = this
    wx.cloud.callFunction({
      name: 'locate',
      success: function (res) {
        that.setData({ location: res.result.city || '延吉市' })
      },
      fail: function () {
        that.setData({ location: '延吉市' })
      }
    })
  },

  getFruits: function () {
    if (this.data.loading) return
    this.setData({ loading: true, loadFailed: false })
    wx.cloud.callFunction({
      name: 'getFruits',
      success: (res) => {
        if (res.result && res.result.success && Array.isArray(res.result.data)) {
          var seen = {}
          var fruits = res.result.data.filter(function (f) {
            if (!f || !f.id || seen[f.id]) return false
            seen[f.id] = true
            return true
          })
          this.setData({ fruits: fruits, loading: false, loadFailed: false })
        } else {
          this.setData({ loading: false, loadFailed: true })
        }
      },
      fail: () => {
        this.setData({ loading: false, loadFailed: true })
        wx.showToast({ title: '网络连接失败', icon: 'none', duration: 2000 })
      }
    })
  },

  goToCompare: function (e) {
    var fruitId = e.currentTarget.dataset.id
    var fruitName = e.currentTarget.dataset.name
    this.setData({ selectedFruit: fruitName, currentPrices: [] })

    wx.cloud.callFunction({
      name: 'getPrices',
      data: { fruitId: fruitId },
      success: (res) => {
        if (res.result && res.result.success && Array.isArray(res.result.data)) {
          this.setData({ currentPrices: res.result.data })
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