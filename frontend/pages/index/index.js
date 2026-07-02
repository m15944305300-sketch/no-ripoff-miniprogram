const app = getApp()

Page({
  data: {
    fruits: [],
    currentPrices: [],
    selectedFruit: null
  },

  onLoad: function () {
    this.getFruits()
  },

  getFruits: function () {
    wx.request({
      url: `${app.globalData.baseUrl}/fruits/`,
      success: (res) => {
        this.setData({
          fruits: res.data
        })
      },
      fail: () => {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    })
  },

  goToCompare: function (e) {
    const fruitId = e.currentTarget.dataset.id
    const fruitName = e.currentTarget.dataset.name

    this.setData({
      selectedFruit: fruitName
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