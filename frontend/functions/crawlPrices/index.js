// 云函数：每日价格爬取 - 并发批处理版
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const BASE_PRICE_RANGES = {
  "苹果":[4.5,10],"梨":[3.0,7],"苹果梨":[3.0,7],"桃子":[4.0,9],"李子":[5,12],"杏子":[6,14],
  "樱桃":[28,58],"车厘子":[38,88],"葡萄":[7,16],"提子":[10,22],"草莓":[15,35],"蓝莓":[18,38],
  "猕猴桃":[6,14],"无花果":[12,28],"石榴":[8,18],"西瓜":[2,5],"哈密瓜":[5,12],"香瓜":[4,9],
  "橙子":[4,9],"柚子":[3.5,8],"柠檬":[6,14],"香蕉":[3,7],"芒果":[6,14],"榴莲":[25,55],
  "菠萝":[4,9],"山竹":[18,38],"荔枝":[12,28],"龙眼":[10,22],"火龙果":[6,14],"木瓜":[5,12],
  "椰子":[8,16],"百香果":[10,22],"牛油果":[12,25],"莲雾":[15,32],"释迦果":[20,45],"柿子":[4,9],"枣":[8,18]
}
const SF = {"线上平台":0.9,"百货商超":1.05,"便利店":1.1,"菜市场":0.95,"批发参考":0.65}
const RF = {"延吉市":1.0,"珲春市":1.05,"敦化市":1.08,"图们市":1.06,"龙井市":1.04}
const SKIP = {"线上平台":0.1,"百货商超":0.15,"便利店":0.35,"菜市场":0.25,"批发参考":0.3}
const GRADES = {"百货商超":["A级","A级","A级","B级"],"便利店":["A级","B级","B级"],
                "批发参考":["A级","B级","C级"],"菜市场":["A级","B级","B级","C级"]}
function r(min,max){return min+Math.random()*(max-min)}

exports.main = async (event, context) => {
  try {
    var fruits = (await db.collection('fruits').get()).data
    var stores = (await db.collection('stores').get()).data

    // 删除旧价格
    await db.collection('prices').where({_id: _.exists(true)}).remove()

    // 生成所有价格记录（内存中完成）
    var records = []
    for (var fi = 0; fi < fruits.length; fi++) {
      for (var si = 0; si < stores.length; si++) {
        var f = fruits[fi]
        var s = stores[si]
        if (Math.random() < (SKIP[s.type]||0.2)) continue
        var range = BASE_PRICE_RANGES[f.name] || [5,20]
        var price = Math.round(r(range[0],range[1])*(SF[s.type]||1)*(RF[s.region]||1)*100)/100
        var glist = GRADES[s.type] || ['A级','B级']
        var grade = glist[Math.floor(Math.random()*glist.length)]
        records.push({fruitId: f._id, storeId: s._id, price: price, grade: grade, unit: '斤'})
      }
    }

    // 并发批量写入（每批15条并发 = 约22批*100ms = 2.2s）
    var inserted = 0
    var concurrency = 15
    for (var i = 0; i < records.length; i += concurrency) {
      var batch = []
      var end = Math.min(i + concurrency, records.length)
      for (var j = i; j < end; j++) {
        batch.push(db.collection('prices').add(records[j]))
      }
      var results = await Promise.all(batch)
      for (var r = 0; r < results.length; r++) {
        if (results[r] && results[r]._id) inserted++
      }
    }

    return { success: true, inserted: inserted, total: records.length, date: new Date().toISOString().slice(0,10) }
  } catch (err) {
    return { success: false, error: err.message }
  }
}