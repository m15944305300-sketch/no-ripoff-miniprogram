// 云函数：获取某水果在各商超的价格，按价格从低到高排序
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { fruitId, region } = event
    var query = db.collection('prices').where({ fruitId: fruitId })
    const res = await query.get()

    // 联表查询 store 名称
    var storeIds = res.data.map(p => p.storeId)
    var stores = {}
    if (storeIds.length > 0) {
      var sRes = await db.collection('stores').where({
        _id: db.command.in(storeIds)
      }).get()
      sRes.data.forEach(s => { stores[s._id] = s })
    }

    var result = res.data.map(p => {
      var s = stores[p.storeId] || {}
      return {
        store_id: p.storeId,
        store_name: s.name || '未知',
        store_type: s.type || '',
        region: s.region || '延吉市',
        source_type: s.sourceType || '零售价',
        price: p.price,
        grade: p.grade,
        unit: p.unit || '斤'
      }
    })

    if (region) {
      result = result.filter(r => r.region === region)
    }

    result.sort((a, b) => a.price - b.price)
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}