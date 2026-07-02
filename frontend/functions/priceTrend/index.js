// 云函数：同果同店昨今价格走势
// 返回每个商超的今天价格、昨天价格、涨跌额、涨跌幅
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { fruitId, region } = event

    // 今天价格
    var todayQuery = { fruitId: fruitId }
    const todayRes = await db.collection('prices').where(todayQuery).get()

    // 昨天日期
    var d = new Date()
    d.setDate(d.getDate() - 1)
    var yesterdayStr = d.toISOString().slice(0, 10)

    // 昨天价格（从 priceHistory 集合）
    const yRes = await db.collection('priceHistory').where({
      fruitId: fruitId,
      snapshotDate: yesterdayStr
    }).get()

    var yesterdayMap = {}
    yRes.data.forEach(p => { yesterdayMap[p.storeId] = p })

    // 获取所有 store 信息
    var allStoreIds = todayRes.data.map(p => p.storeId)
    yRes.data.forEach(p => { if (allStoreIds.indexOf(p.storeId) === -1) allStoreIds.push(p.storeId) })
    var storeMap = {}
    if (allStoreIds.length > 0) {
      var sRes = await db.collection('stores').where({
        _id: db.command.in(allStoreIds)
      }).get()
      sRes.data.forEach(s => { storeMap[s._id] = s })
    }

    var result = todayRes.data.map(p => {
      var store = storeMap[p.storeId] || {}
      var yp = yesterdayMap[p.storeId]
      var change = null
      var changePct = null
      if (yp) {
        change = Math.round((p.price - yp.price) * 100) / 100
        changePct = Math.round((change / yp.price) * 1000) / 10
      }
      return {
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
      }
    })

    if (region) {
      result = result.filter(r => r.region === region)
    }

    result.sort((a, b) => {
      if (a.change === null) return 1
      if (b.change === null) return -1
      return a.change - b.change
    })

    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}