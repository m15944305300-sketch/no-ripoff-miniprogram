// 云函数：搜索水果
var cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
var db = cloud.database()

exports.main = async (event, context) => {
  try {
    var keyword = event.keyword || ''

    // 获取全部水果，前端过滤（避免 db.RegExp 兼容性问题）
    var res = await db.collection('fruits').limit(100).get()

    var result = []
    var lowerKeyword = keyword.toLowerCase()
    for (var i = 0; i < res.data.length; i++) {
      var d = res.data[i]
      var name = d.name || ''
      if (name.toLowerCase().indexOf(lowerKeyword) !== -1) {
        result.push({
          id: '' + d._id,
          name: name,
          category: d.category || ''
        })
      }
    }
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: err.message }
  }
}