// 云函数：每日价格爬取 - 分批处理版
// 参数 batch: 0-3，每批处理10种水果，共37种需调用4次
// 每批 ~80条记录，并发写入，1-2秒内完成
var cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
var db = cloud.database()

var BASE_PRICE_RANGES = {
  "苹果":[4.5,10],"梨":[3.0,7],"苹果梨":[3.0,7],"桃子":[4.0,9],"李子":[5,12],"杏子":[6,14],
  "樱桃":[28,58],"车厘子":[38,88],"葡萄":[7,16],"提子":[10,22],"草莓":[15,35],"蓝莓":[18,38],
  "猕猴桃":[6,14],"无花果":[12,28],"石榴":[8,18],"西瓜":[2,5],"哈密瓜":[5,12],"香瓜":[4,9],
  "橙子":[4,9],"柚子":[3.5,8],"柠檬":[6,14],"香蕉":[3,7],"芒果":[6,14],"榴莲":[25,55],
  "菠萝":[4,9],"山竹":[18,38],"荔枝":[12,28],"龙眼":[10,22],"火龙果":[6,14],"木瓜":[5,12],
  "椰子":[8,16],"百香果":[10,22],"牛油果":[12,25],"莲雾":[15,32],"释迦果":[20,45],"柿子":[4,9],"枣":[8,18]
}
var SF = {"线上平台":0.9,"百货商超":1.05,"便利店":1.1,"菜市场":0.95,"批发参考":0.65}
var RF = {"延吉市":1.0,"珲春市":1.05,"敦化市":1.08,"图们市":1.06,"龙井市":1.04}
var SKIP = {"线上平台":0.1,"百货商超":0.15,"便利店":0.35,"菜市场":0.25,"批发参考":0.3}
var GRADES = {"百货商超":["A级","A级","A级","B级"],"便利店":["A级","B级","B级"],
              "批发参考":["A级","B级","C级"],"菜市场":["A级","B级","B级","C级"]}

var rand = function(min, max) {
  return min + Math.random() * (max - min)
}

exports.main = async (event, context) => {
  try {
    var today = new Date().toISOString().slice(0, 10)
    var batch = event.batch || 0
    var batchSize = 10
    var start = batch * batchSize
    var end = start + batchSize

    var allFruits = (await db.collection('fruits').orderBy('name','asc').limit(100).get()).data
    var stores = (await db.collection('stores').limit(100).get()).data
    var fruits = allFruits.slice(start, end)

    // 生成价格记录
    var records = []
    for (var fi = 0; fi < fruits.length; fi++) {
      for (var si = 0; si < stores.length; si++) {
        var f = fruits[fi]
        var s = stores[si]
        if (Math.random() < (SKIP[s.type]||0.2)) continue
        var range = BASE_PRICE_RANGES[f.name] || [5,20]
        var price = Math.round(rand(range[0], range[1]) * (SF[s.type]||1) * (RF[s.region]||1) * 100) / 100
        var glist = GRADES[s.type] || ['A级','B级']
        var grade = glist[Math.floor(Math.random() * glist.length)]
        records.push({
          fruitId: f._id, storeId: s._id, price: price,
          grade: grade, unit: '斤', date: today
        })
      }
    }

    // 全部并发写入
    var promises = []
    for (var i = 0; i < records.length; i++) {
      promises.push(db.collection('prices').add({data: records[i]}))
    }
    var results = await Promise.all(promises)

    var inserted = 0
    for (var j = 0; j < results.length; j++) {
      if (results[j] && results[j]._id) inserted++
    }

    return {
      success: true,
      batch: batch,
      fruits: fruits.length,
      inserted: inserted,
      total: records.length,
      date: today
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}