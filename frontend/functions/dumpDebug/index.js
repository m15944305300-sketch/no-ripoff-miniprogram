// 云函数：查看数据库原始数据
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    var res = await db.collection('fruits').limit(3).get()
    var info = []
    for (var i = 0; i < res.data.length; i++) {
      var d = res.data[i]
      info.push({
        _id: d._id,
        name: d.name,
        nameType: typeof d.name,
        category: d.category,
        grade: d.grade,
        allKeys: Object.keys(d)
      })
    }
    return {
      success: true,
      count: res.data.length,
      records: info
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}