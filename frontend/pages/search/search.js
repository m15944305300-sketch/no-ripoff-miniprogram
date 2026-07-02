const app = getApp()

Page({
  data: {
    keyword: '',
    searchResults: [],
    currentPrices: [],
    selectedFruit: '',
    showPrices: false,
    hotFruits: ['苹果', '香蕉', '西瓜', '草莓', '葡萄', '芒果', '榴莲', '蓝莓', '猕猴桃', '山竹', '樱桃', '火龙果', '苹果梨', '哈密瓜', '橙子'],
    location: '延吉市'
  },

  onLoad: function () {
    this.getLocation()
  },

  getLocation: function () {
    var that = this
    wx.request({
      url: app.globalData.baseUrl + '/locate/',
      timeout: 5000,
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

  onInput: function (e) {
    this.setData({
      keyword: e.detail.value,
      showPrices: false
    })
  },

  search: function () {
    var keyword = this.data.keyword.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      return
    }

    wx.request({
      url: app.globalData.baseUrl + '/search/',
      data: { keyword: keyword },
      timeout: 8000,
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          // 去重保护
          var seen = {}
          var results = res.data.filter(function (f) {
            if (!f || !f.id || seen[f.id]) return false
            seen[f.id] = true
            return true
          })
          this.setData({
            searchResults: results,
            showPrices: false
          })
        } else {
          this.setData({ searchResults: [], showPrices: false })
        }
      },
      fail: () => {
        wx.showToast({ title: '搜索失败', icon: 'none' })
      }
    })
  },

  searchTag: function (e) {
    var tag = e.currentTarget.dataset.text
    this.setData({ keyword: tag })
    this.search()
  },

  goToCompare: function (e) {
    var fruitId = e.currentTarget.dataset.id
    var fruitName = e.currentTarget.dataset.name

    this.setData({
      selectedFruit: fruitName,
      showPrices: true,
      currentPrices: []
    })

    wx.request({
      url: app.globalData.baseUrl + '/prices/' + fruitId,
      timeout: 8000,
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          this.setData({ currentPrices: res.data })
        }
      },
      fail: () => {
        wx.showToast({ title: '获取价格失败', icon: 'none' })
      }
    })
  }
})
