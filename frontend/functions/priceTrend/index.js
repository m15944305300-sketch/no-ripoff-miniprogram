// 云函数：同果同店昨今价格走势
// 返回每个商超的今天价格、昨天价格、涨跌额、涨跌幅
var cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
var db = cloud.database()

exports.main = async (event, context) => {
  try {
    var fruitId = event.fruitId
    var region = event.region

    var today = new Date().toISOString().slice(0, 10)
    var d = new Date()
    d.setDate(d.getDate() - 1)
    var yesterday = d.toISOString().slice(0, 10)

    // 今天价格
    var todayRes = await db.collection('prices').where({
      fruitId: fruitId,
      date: today
    }).limit(500).get()

    // 昨天价格（直接从prices集合按date查询）
    var yRes = await db.collection('prices').where({
      fruitId: fruitId,
      date: yesterday
    }).limit(500).get()

    var yesterdayMap = {}
    for (var i = 0; i < yRes.data.length; i++) {
      var yp = yRes.data[i]
      yesterdayMap[yp.storeId] = yp
    }

    // 获取所有 store 信息
    var allStoreIds = []
    for (var j = 0; j < todayRes.data.length; j++) {
      allStoreIds.push(todayRes.data[j].storeId)
    }
    for (var k = 0; k < yRes.data.length; k++) {
      var sid = yRes.data[k].storeId
      if (allStoreIds.indexOf(sid) === -1) allStoreIds.push(sid)
    }
    var storeMap = {}
    if (allStoreIds.length > 0) {
      var sRes = await db.collection('stores').where({
        _id: db.command.in(allStoreIds)
      }).limit(500).get()
      for (var m = 0; m < sRes.data.length; m++) {
        var s = sRes.data[m]
        storeMap[s._id] = s
      }
    }

    var result = []
    for (var n = 0; n < todayRes.data.length; n++) {
      var p = todayRes.data[n]
      var store = storeMap[p.storeId] || {}
      var yp = yesterdayMap[p.storeId]
      var change = null
      var changePct = null
      if (yp) {
        change = Math.round((p.price - yp.price) * 100) / 100
        changePct = Math.round((change / yp.price) * 1000) / 10
      }
      result.push({
        store_name: store.name || '未知',
        store_type: store.type || '',
        region: store.region || '延吉市',
        source_type: store.sourceType || '零售价',
        today_price: p.price,
        today_grade: p.grade,
        yesterday_price: yp ? yp.price : null,
        yesterday_grade: yp ? yp.grade : null,
        change: change,
        change_pct: changePct,
        unit: p.unit || '斤'
      })
    }

    if (region) {
      result = result.filter(function(r) { return r.region === region })
    }

    result.sort(function(a, b) {
      if (a.change === null) return 1
      if (b.change === null) return -1
      return a.change - b.change
    })

    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}