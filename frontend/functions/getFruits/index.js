// 云函数：获取全部水果列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const res = await db.collection('fruits')
      .orderBy('_id', 'asc')
      .get()
    return {
      success: true,
      data: res.data.map(d => ({
        id: d._id,
        name: d.name,
        category: d.category,
        grade: d.grade
      }))
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err.message
    }
  }
}