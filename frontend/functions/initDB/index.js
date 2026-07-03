// 云函数：初始化数据库（水果+商超基础数据）
// 只在首次部署时手动调用一次
var cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
var db = cloud.database()

var FRUITS = [
  { name: "苹果", category: "仁果类", grade: "A级" },
  { name: "梨", category: "仁果类", grade: "A级" },
  { name: "苹果梨", category: "仁果类", grade: "A级" },
  { name: "桃子", category: "核果类", grade: "A级" },
  { name: "李子", category: "核果类", grade: "A级" },
  { name: "杏子", category: "核果类", grade: "A级" },
  { name: "樱桃", category: "核果类", grade: "A级" },
  { name: "车厘子", category: "核果类", grade: "A级" },
  { name: "葡萄", category: "浆果类", grade: "A级" },
  { name: "提子", category: "浆果类", grade: "A级" },
  { name: "草莓", category: "浆果类", grade: "A级" },
  { name: "蓝莓", category: "浆果类", grade: "A级" },
  { name: "猕猴桃", category: "浆果类", grade: "A级" },
  { name: "无花果", category: "浆果类", grade: "A级" },
  { name: "石榴", category: "浆果类", grade: "A级" },
  { name: "西瓜", category: "瓜类", grade: "A级" },
  { name: "哈密瓜", category: "瓜类", grade: "A级" },
  { name: "香瓜", category: "瓜类", grade: "A级" },
  { name: "橙子", category: "柑橘类", grade: "A级" },
  { name: "柚子", category: "柑橘类", grade: "A级" },
  { name: "柠檬", category: "柑橘类", grade: "A级" },
  { name: "香蕉", category: "热带水果", grade: "A级" },
  { name: "芒果", category: "热带水果", grade: "A级" },
  { name: "榴莲", category: "热带水果", grade: "A级" },
  { name: "菠萝", category: "热带水果", grade: "A级" },
  { name: "山竹", category: "热带水果", grade: "A级" },
  { name: "荔枝", category: "热带水果", grade: "A级" },
  { name: "龙眼", category: "热带水果", grade: "A级" },
  { name: "火龙果", category: "热带水果", grade: "A级" },
  { name: "木瓜", category: "热带水果", grade: "A级" },
  { name: "椰子", category: "热带水果", grade: "A级" },
  { name: "百香果", category: "热带水果", grade: "A级" },
  { name: "牛油果", category: "热带水果", grade: "A级" },
  { name: "莲雾", category: "热带水果", grade: "A级" },
  { name: "释迦果", category: "热带水果", grade: "A级" },
  { name: "柿子", category: "其他", grade: "A级" },
  { name: "枣", category: "其他", grade: "A级" }
]

var STORES = [
  { name: "美团优选", type: "线上平台", address: "延吉市自提点", region: "延吉市", sourceType: "平台价" },
  { name: "京东秒送", type: "线上平台", address: "延吉市配送范围", region: "延吉市", sourceType: "平台价" },
  { name: "延吉百货大楼", type: "百货商超", address: "延吉市光明街", region: "延吉市", sourceType: "零售价" },
  { name: "每日隆(北大新城店)", type: "便利店", address: "延吉市新村路222号", region: "延吉市", sourceType: "门店价" },
  { name: "每日隆(牛市街店)", type: "便利店", address: "延吉市牛市街569号", region: "延吉市", sourceType: "门店价" },
  { name: "每日隆(富元小区店)", type: "便利店", address: "延吉市富元小区", region: "延吉市", sourceType: "门店价" },
  { name: "延吉西市场", type: "菜市场", address: "延吉市西市场", region: "延吉市", sourceType: "零售价" },
  { name: "珲春批发市场(一亩田)", type: "批发参考", address: "珲春市", region: "珲春市", sourceType: "批发参考价" },
  { name: "敦化农贸市场", type: "菜市场", address: "敦化市", region: "敦化市", sourceType: "零售价" },
  { name: "图们农贸市场", type: "菜市场", address: "图们市", region: "图们市", sourceType: "零售价" },
  { name: "龙井农贸市场", type: "菜市场", address: "龙井市", region: "龙井市", sourceType: "零售价" }
]

exports.main = async (event, context) => {
  try {
    // 清空旧数据（云开发要求非空查询条件）
    var oldFruits = await db.collection('fruits').limit(100).get()
    for (var k = 0; k < oldFruits.data.length; k++) {
      await db.collection('fruits').doc(oldFruits.data[k]._id).remove()
    }
    var oldStores = await db.collection('stores').limit(100).get()
    for (var m = 0; m < oldStores.data.length; m++) {
      await db.collection('stores').doc(oldStores.data[m]._id).remove()
    }

    // 插入水果：逐条插入，使用 data 包裹
    var fruitCount = 0
    for (var i = 0; i < FRUITS.length; i++) {
      await db.collection('fruits').add({ data: FRUITS[i] })
      fruitCount++
    }

    // 插入商超：逐条插入
    var storeCount = 0
    for (var j = 0; j < STORES.length; j++) {
      await db.collection('stores').add({ data: STORES[j] })
      storeCount++
    }

    return {
      success: true,
      fruits: fruitCount,
      stores: storeCount,
      message: '数据库初始化完成！请运行 crawlPrices 云函数生成价格数据'
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}