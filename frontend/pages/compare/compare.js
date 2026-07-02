var app = getApp()

Page({
  data: {
    fruits: [],
    selectedFruit: '',
    trendData: [],
    downCount: 0,
    upCount: 0,
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

  selectFruit: function (e) {
    var fruitId = e.currentTarget.dataset.id
    var fruitName = e.currentTarget.dataset.name
    this.setData({ selectedFruit: fruitName, trendData: [], downCount: 0, upCount: 0 })

    wx.cloud.callFunction({
      name: 'priceTrend',
      data: { fruitId: fruitId },
      success: (res) => {
        if (res.result && res.result.success && Array.isArray(res.result.data)) {
          var down = 0
          var up = 0
          for (var i = 0; i < res.result.data.length; i++) {
            var c = res.result.data[i].change
            if (c !== null && c < 0) down++
            else if (c !== null && c > 0) up++
          }
          this.setData({ trendData: res.result.data, downCount: down, upCount: up })
        }
      },
      fail: () => {
        wx.showToast({ title: '获取走势失败', icon: 'none' })
      }
    })
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/index/index' })
  },

  goSearch: function () {
    wx.switchTab({ url: '/pages/search/search' })
  }
})