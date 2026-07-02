// 云函数：搜索水果
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const keyword = event.keyword || ''
    const res = await db.collection('fruits').where({
      name: db.RegExp({ regexp: keyword, options: 'i' })
    }).get()
    return {
      success: true,
      data: res.data.map(d => ({
        id: d._id,
        name: d.name,
        category: d.category
      }))
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}