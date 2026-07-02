const app = getApp()

Page({
  data: {
    keyword: '',
    searchResults: [],
    currentPrices: [],
    selectedFruit: '',
    showPrices: false,
    hotFruits: ['苹果', '香蕉', '西瓜', '草莓', '葡萄', '芒果', '榴莲', '蓝莓']
  },

  onInput: function (e) {
    this.setData({
      keyword: e.detail.value,
      showPrices: false
    })
  },

  search: function () {
    const keyword = this.data.keyword.trim()
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: `${app.globalData.baseUrl}/search/`,
      data: {
        keyword: keyword
      },
      success: (res) => {
        this.setData({
          searchResults: res.data,
          showPrices: false
        })
      },
      fail: () => {
        wx.showToast({
          title: '搜索失败',
          icon: 'none'
        })
      }
    })
  },

  searchTag: function (e) {
    const tag = e.currentTarget.dataset.text || e.currentTarget.innerText
    this.setData({
      keyword: tag
    })
    this.search()
  },

  goToCompare: function (e) {
    const fruitId = e.currentTarget.dataset.id
    const fruitName = e.currentTarget.dataset.name

    this.setData({
      selectedFruit: fruitName,
      showPrices: true
    })

    wx.request({
      url: `${app.globalData.baseUrl}/prices/${fruitId}`,
      success: (res) => {
        this.setData({
          currentPrices: res.data
        })
      },
      fail: () => {
        wx.showToast({
          title: '获取价格失败',
          icon: 'none'
        })
      }
    })
  },

  getEmoji: function (fruitName) {
    const emojis = {
      '苹果': '🍎',
      '香蕉': '🍌',
      '橙子': '🍊',
      '西瓜': '🍉',
      '葡萄': '🍇',
      '草莓': '🍓',
      '芒果': '🥭',
      '榴莲': '🫐',
      '蓝莓': '🫐',
      '樱桃': '🍒'
    }
    return emojis[fruitName] || '🍎'
  }
})