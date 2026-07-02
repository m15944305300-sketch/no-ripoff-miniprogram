// 云函数：每日价格爬取（定时触发器调用）
// 模拟延吉市场水果价格数据
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 37种水果基础价格范围
const BASE_PRICE_RANGES = {
  "苹果": [4.5, 10.0], "梨": [3.0, 7.0], "苹果梨": [3.0, 7.0],
  "桃子": [4.0, 9.0], "李子": [5.0, 12.0], "杏子": [6.0, 14.0],
  "樱桃": [28.0, 58.0], "车厘子": [38.0, 88.0],
  "葡萄": [7.0, 16.0], "提子": [10.0, 22.0], "草莓": [15.0, 35.0],
  "蓝莓": [18.0, 38.0], "猕猴桃": [6.0, 14.0], "无花果": [12.0, 28.0],
  "石榴": [8.0, 18.0], "西瓜": [2.0, 5.0], "哈密瓜": [5.0, 12.0],
  "香瓜": [4.0, 9.0], "橙子": [4.0, 9.0], "柚子": [3.5, 8.0],
  "柠檬": [6.0, 14.0], "香蕉": [3.0, 7.0], "芒果": [6.0, 14.0],
  "榴莲": [25.0, 55.0], "菠萝": [4.0, 9.0], "山竹": [18.0, 38.0],
  "荔枝": [12.0, 28.0], "龙眼": [10.0, 22.0], "火龙果": [6.0, 14.0],
  "木瓜": [5.0, 12.0], "椰子": [8.0, 16.0], "百香果": [10.0, 22.0],
  "牛油果": [12.0, 25.0], "莲雾": [15.0, 32.0], "释迦果": [20.0, 45.0],
  "柿子": [4.0, 9.0], "枣": [8.0, 18.0]
}

const STORE_FACTOR = {
  "线上平台": 0.90, "百货商超": 1.05, "便利店": 1.10,
  "菜市场": 0.95, "批发参考": 0.65
}

const REGION_FACTOR = {
  "延吉市": 1.0, "珲春市": 1.05, "敦化市": 1.08,
  "图们市": 1.06, "龙井市": 1.04
}

const SKIP_PROB = {
  "线上平台": 0.10, "百货商超": 0.15, "便利店": 0.35,
  "菜市场": 0.25, "批发参考": 0.30
}

function rand(min, max) { return min + Math.random() * (max - min) }

exports.main = async (event, context) => {
  try {
    // 1. 获取所有水果和商超
    var fruitsRes = await db.collection('fruits').get()
    var storesRes = await db.collection('stores').get()
    var fruits = fruitsRes.data
    var stores = storesRes.data

    var today = new Date().toISOString().slice(0, 10)
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    // 2. 检查今天是否已有快照，如果没有则创建（把当前prices存为昨天的快照）
    var snapRes = await db.collection('priceHistory').where({
      snapshotDate: yesterday
    }).count()
    var snapCount = snapRes.total || 0

    if (snapCount === 0) {
      // 把当前价格存为昨天的快照
      var oldPrices = await db.collection('prices').get()
      for (var i = 0; i < oldPrices.data.length; i += 20) {
        var batch = oldPrices.data.slice(i, i + 20).map(p => ({
          fruitId: p.fruitId,
          storeId: p.storeId,
          price: p.price,
          grade: p.grade || 'B级',
          snapshotDate: yesterday
        }))
        await db.collection('priceHistory').add(batch)
      }
      console.log(`历史快照: ${oldPrices.data.length} 条`)
    }

    // 3. 删除旧价格，生成新价格
    await db.collection('prices').where({}).remove()

    var updated = 0
    var skipped = 0
    var batch = []

    for (var fi = 0; fi < fruits.length; fi++) {
      for (var si = 0; si < stores.length; si++) {
        var fruit = fruits[fi]
        var store = stores[si]
        var skipProb = SKIP_PROB[store.type] || 0.2
        if (Math.random() < skipProb) { skipped++; continue }

        var range = BASE_PRICE_RANGES[fruit.name] || [5.0, 20.0]
        var base = rand(range[0], range[1])
        var sf = STORE_FACTOR[store.type] || 1.0
        var rf = REGION_FACTOR[store.region] || 1.0
        var price = Math.round(base * sf * rf * 100) / 100

        var grade = 'B级'
        if (store.type === '百货商超') grade = ['A级','A级','A级','B级'][Math.floor(Math.random()*4)]
        else if (store.type === '便利店') grade = ['A级','B级','B级'][Math.floor(Math.random()*3)]
        else if (store.type === '批发参考') grade = ['A级','B级','C级'][Math.floor(Math.random()*3)]
        else if (store.type === '菜市场') grade = ['A级','B级','B级','C级'][Math.floor(Math.random()*4)]

        batch.push({
          fruitId: fruit._id,
          storeId: store._id,
          price: price,
          grade: grade,
          unit: '斤'
        })
        updated++

        if (batch.length >= 50) {
          await db.collection('prices').add(batch)
          batch = []
        }
      }
    }
    if (batch.length > 0) {
      await db.collection('prices').add(batch)
    }

    return { success: true, updated: updated, skipped: skipped, date: today }
  } catch (err) {
    console.error(err)
    return { success: false, error: err.message }
  }
}