const app = getApp()

Page({
  data: {
    fruits: [],
    selectedFruits: [],
    compareResults: null,
    compareData: [],
    bestStore: ''
  },

  onLoad: function () {
    this.getFruits()
  },

  getFruits: function () {
    wx.request({
      url: `${app.globalData.baseUrl}/fruits/`,
      success: (res) => {
        const fruits = res.data.map(f => ({
          ...f,
          selected: false
        }))
        this.setData({
          fruits: fruits
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

  toggleFruit: function (e) {
    const fruitName = e.currentTarget.dataset.name
    const selectedFruits = this.data.selectedFruits
    const fruits = this.data.fruits.map(f => {
      if (f.name === fruitName) {
        return { ...f, selected: !f.selected }
      }
      return f
    })

    if (selectedFruits.includes(fruitName)) {
      this.setData({
        fruits: fruits,
        selectedFruits: selectedFruits.filter(f => f !== fruitName)
      })
    } else {
      if (selectedFruits.length >= 5) {
        wx.showToast({
          title: '最多选择5种水果',
          icon: 'none'
        })
        return
      }
      this.setData({
        fruits: fruits,
        selectedFruits: [...selectedFruits, fruitName]
      })
    }
  },

  compare: function () {
    if (this.data.selectedFruits.length === 0) {
      wx.showToast({
        title: '请选择水果',
        icon: 'none'
      })
      return
    }

    const fruitNames = this.data.selectedFruits.join(',')

    wx.request({
      url: `${app.globalData.baseUrl}/price-compare/`,
      data: {
        fruit_names: fruitNames
      },
      success: (res) => {
        const results = res.data
        const compareData = []
        const storePrices = {}

        for (const [fruit, prices] of Object.entries(results)) {
          if (prices.error) continue

          const bestPrice = prices[0]
          compareData.push({
            fruit: fruit,
            best_store: bestPrice.store,
            best_price: bestPrice.price,
            best_grade: bestPrice.grade
          })

          for (const price of prices) {
            if (!storePrices[price.store]) {
              storePrices[price.store] = 0
            }
            storePrices[price.store] += price.price
          }
        }

        let bestStore = ''
        let minTotal = Infinity
        for (const [store, total] of Object.entries(storePrices)) {
          if (total < minTotal) {
            minTotal = total
            bestStore = store
          }
        }

        this.setData({
          compareResults: results,
          compareData: compareData,
          bestStore: bestStore
        })
      },
      fail: () => {
        wx.showToast({
          title: '对比失败',
          icon: 'none'
        })
      }
    })
  },

  clearSelection: function () {
    const fruits = this.data.fruits.map(f => ({ ...f, selected: false }))
    this.setData({
      fruits: fruits,
      selectedFruits: [],
      compareResults: null,
      compareData: [],
      bestStore: ''
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