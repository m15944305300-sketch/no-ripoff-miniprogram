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

  onShow: function () {
    if (this.data.fruits.length === 0 && !this.data.loading) {
      this.getFruits()
    }
  },

  getFruits: function () {
    if (this.data.loading) return

    this.setData({ loading: true, loadFailed: false })
    wx.request({
      url: app.globalData.baseUrl + '/fruits/',
      timeout: 8000,
      header: { 'Bypass-Tunnel-Reminder': '1' },
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          // 去重保护
          var seen = {}
          var fruits = res.data.filter(function (f) {
            if (!f || !f.id || seen[f.id]) return false
            seen[f.id] = true
            return true
          }).map(function (f) {
            return {
              id: f.id,
              name: f.name,
              category: f.category,
              selected: false
            }
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

  toggleFruit: function (e) {
    var fruitName = e.currentTarget.dataset.name
    var selectedFruits = this.data.selectedFruits
    var fruits = this.data.fruits.map(function (f) {
      if (f.name === fruitName) {
        return { id: f.id, name: f.name, category: f.category, selected: !f.selected }
      }
      return f
    })

    var idx = selectedFruits.indexOf(fruitName)
    if (idx > -1) {
      // 已选 -> 取消
      selectedFruits.splice(idx, 1)
      this.setData({ fruits: fruits, selectedFruits: selectedFruits })
    } else {
      // 未选 -> 添加
      if (selectedFruits.length >= 5) {
        wx.showToast({ title: '最多选择5种水果', icon: 'none' })
        return
      }
      selectedFruits.push(fruitName)
      this.setData({ fruits: fruits, selectedFruits: selectedFruits })
    }
  },

  compare: function () {
    if (this.data.selectedFruits.length === 0) {
      wx.showToast({ title: '请选择水果', icon: 'none' })
      return
    }

    var fruitNames = this.data.selectedFruits.join(',')

    wx.showLoading({ title: '对比中...' })

    wx.request({
      url: app.globalData.baseUrl + '/price-compare/',
      data: { fruit_names: fruitNames },
      timeout: 10000,
      header: { 'Bypass-Tunnel-Reminder': '1' },
      success: (res) => {
        wx.hideLoading()
        if (!res.data) {
          wx.showToast({ title: '对比失败', icon: 'none' })
          return
        }
        var results = res.data
        var compareData = []
        var storePrices = {}

        for (var key in results) {
          var prices = results[key]
          if (!prices || prices.error || prices.length === 0) {
            compareData.push({
              fruit: key,
              best_store: '暂无数据',
              best_price: null,
              best_grade: ''
            })
            continue
          }

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
        wx.showToast({ title: '对比失败，请检查网络', icon: 'none' })
      }
    })
  },

  clearSelection: function () {
    var fruits = this.data.fruits.map(function (f) {
      return { id: f.id, name: f.name, category: f.category, selected: false }
    })
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
