// 云函数：查看fruits集合中实际存储的原始数据结构
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  var res = await db.collection('fruits').limit(5).get()
  
  var raw = []
  for (var i = 0; i < res.data.length; i++) {
    raw.push(res.data[i])
  }
  
  return {
    success: true,
    totalReturned: res.data.length,
    firstRecord: res.data[0] ? JSON.stringify(res.data[0]) : 'empty',
    allKeys: res.data[0] ? Object.keys(res.data[0]).join(',') : 'empty',
    raw: raw
  }
}