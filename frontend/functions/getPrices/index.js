// 云函数：获取某水果今日各商超价格，按价格从低到高排序
var cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
var db = cloud.database()

exports.main = async (event, context) => {
  try {
    var fruitId = event.fruitId
    var region = event.region
    var today = new Date().toISOString().slice(0, 10)

    // 只查今天的价格
    var res = await db.collection('prices').where({
      fruitId: fruitId,
      date: today
    }).limit(500).get()

    // 联表查询 store 名称
    var storeIds = []
    for (var i = 0; i < res.data.length; i++) {
      storeIds.push(res.data[i].storeId)
    }
    var stores = {}
    if (storeIds.length > 0) {
      var sRes = await db.collection('stores').where({
        _id: db.command.in(storeIds)
      }).limit(500).get()
      for (var j = 0; j < sRes.data.length; j++) {
        var s = sRes.data[j]
        stores[s._id] = s
      }
    }

    var result = []
    for (var k = 0; k < res.data.length; k++) {
      var p = res.data[k]
      var s = stores[p.storeId] || {}
      result.push({
        store_id: p.storeId,
        store_name: s.name || '未知',
        store_type: s.type || '',
        region: s.region || '延吉市',
        source_type: s.sourceType || '零售价',
        price: p.price,
        grade: p.grade,
        unit: p.unit || '斤'
      })
    }

    if (region) {
      result = result.filter(function(r) { return r.region === region })
    }

    result.sort(function(a, b) { return a.price - b.price })
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}