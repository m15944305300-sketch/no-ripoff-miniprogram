// 云函数：获取全部水果列表
// 第一性原理：用循环替代map确保_id字符串序列化
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    var res = await db.collection('fruits').orderBy('name', 'asc').get()
    var list = []
    for (var i = 0; i < res.data.length; i++) {
      var d = res.data[i]
      list.push({
        id: '' + d._id,
        name: d.name,
        category: d.category || '',
        grade: d.grade || ''
      })
    }
    return { success: true, data: list }
  } catch (err) {
    return { success: false, error: err.message }
  }
}