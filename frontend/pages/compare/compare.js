const app = getApp()

Page({
  data: {
    fruits: [],
    selectedFruits: [],
    compareResults: null,
    compareData: [],
    bestStore: '',
    hasResults: false,
    loading: false,
    loadFailed: false
  },

  onLoad: function () {
    this.getFruits()
  },

  getFruits: function () {
    this.setData({ loading: true, loadFailed: false })
    wx.request({
      url: `${app.globalData.baseUrl}/fruits/`,
      success: (res) => {
        const fruits = res.data.map(f => ({
          ...f,
          selected: false
        }))
        this.setData({
          fruits: fruits,
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

    wx.showLoading({ title: '对比中...' })

    wx.request({
      url: `${app.globalData.baseUrl}/price-compare/`,
      data: {
        fruit_names: fruitNames
      },
      success: (res) => {
        wx.hideLoading()
        const results = res.data
        const compareData = []
        const storePrices = {}

        for (var key in results) {
          var prices = results[key]
          if (prices.error) continue

          var bestPrice = prices[0]
          compareData.push({
            fruit: key,
            best_store: bestPrice.store,
            best_price: bestPrice.price,
            best_grade: bestPrice.grade
          })

          for (var i = 0; i < prices.length; i++) {
            var storeName = prices[i].store
            if (!storePrices[storeName]) {
              storePrices[storeName] = 0
            }
            storePrices[storeName] += prices[i].price
          }
        }

        var bestStore = ''
        var minTotal = Infinity
        for (var store in storePrices) {
          if (storePrices[store] < minTotal) {
            minTotal = storePrices[store]
            bestStore = store
          }
        }

        this.setData({
          compareResults: results,
          compareData: compareData,
          bestStore: bestStore,
          hasResults: compareData.length > 0
        })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '对比失败，请检查网络',
          icon: 'none'
        })
      }
    })
  },

  clearSelection: function () {
    var fruits = this.data.fruits.map(f => ({ ...f, selected: false }))
    this.setData({
      fruits: fruits,
      selectedFruits: [],
      compareResults: null,
      compareData: [],
      bestStore: '',
      hasResults: false
    })
  }
})
