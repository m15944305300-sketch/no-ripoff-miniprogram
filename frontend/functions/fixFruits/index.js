// 云函数：修复水果+商超数据
// 简单逐条插入，3秒内完成
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const FRUITS = [
  {name:'苹果',category:'仁果类',grade:'A级'},{name:'梨',category:'仁果类',grade:'A级'},
  {name:'苹果梨',category:'仁果类',grade:'A级'},{name:'桃子',category:'核果类',grade:'A级'},
  {name:'李子',category:'核果类',grade:'A级'},{name:'杏子',category:'核果类',grade:'A级'},
  {name:'樱桃',category:'核果类',grade:'A级'},{name:'车厘子',category:'核果类',grade:'A级'},
  {name:'葡萄',category:'浆果类',grade:'A级'},{name:'提子',category:'浆果类',grade:'A级'},
  {name:'草莓',category:'浆果类',grade:'A级'},{name:'蓝莓',category:'浆果类',grade:'A级'},
  {name:'猕猴桃',category:'浆果类',grade:'A级'},{name:'无花果',category:'浆果类',grade:'A级'},
  {name:'石榴',category:'浆果类',grade:'A级'},{name:'西瓜',category:'瓜类',grade:'A级'},
  {name:'哈密瓜',category:'瓜类',grade:'A级'},{name:'香瓜',category:'瓜类',grade:'A级'},
  {name:'橙子',category:'柑橘类',grade:'A级'},{name:'柚子',category:'柑橘类',grade:'A级'},
  {name:'柠檬',category:'柑橘类',grade:'A级'},{name:'香蕉',category:'热带水果',grade:'A级'},
  {name:'芒果',category:'热带水果',grade:'A级'},{name:'榴莲',category:'热带水果',grade:'A级'},
  {name:'菠萝',category:'热带水果',grade:'A级'},{name:'山竹',category:'热带水果',grade:'A级'},
  {name:'荔枝',category:'热带水果',grade:'A级'},{name:'龙眼',category:'热带水果',grade:'A级'},
  {name:'火龙果',category:'热带水果',grade:'A级'},{name:'木瓜',category:'热带水果',grade:'A级'},
  {name:'椰子',category:'热带水果',grade:'A级'},{name:'百香果',category:'热带水果',grade:'A级'},
  {name:'牛油果',category:'热带水果',grade:'A级'},{name:'莲雾',category:'热带水果',grade:'A级'},
  {name:'释迦果',category:'热带水果',grade:'A级'},{name:'柿子',category:'其他',grade:'A级'},
  {name:'枣',category:'其他',grade:'A级'}
]
const STORES = [
  {name:'美团优选',type:'线上平台',address:'延吉市自提点',region:'延吉市',sourceType:'平台价'},
  {name:'京东秒送',type:'线上平台',address:'延吉市配送范围',region:'延吉市',sourceType:'平台价'},
  {name:'延吉百货大楼',type:'百货商超',address:'延吉市光明街',region:'延吉市',sourceType:'零售价'},
  {name:'每日隆(北大新城店)',type:'便利店',address:'延吉市新村路222号',region:'延吉市',sourceType:'门店价'},
  {name:'每日隆(牛市街店)',type:'便利店',address:'延吉市牛市街569号',region:'延吉市',sourceType:'门店价'},
  {name:'每日隆(富元小区店)',type:'便利店',address:'延吉市富元小区',region:'延吉市',sourceType:'门店价'},
  {name:'延吉西市场',type:'菜市场',address:'延吉市西市场',region:'延吉市',sourceType:'零售价'},
  {name:'珲春批发市场(一亩田)',type:'批发参考',address:'珲春市',region:'珲春市',sourceType:'批发参考价'},
  {name:'敦化农贸市场',type:'菜市场',address:'敦化市',region:'敦化市',sourceType:'零售价'},
  {name:'图们农贸市场',type:'菜市场',address:'图们市',region:'图们市',sourceType:'零售价'},
  {name:'龙井农贸市场',type:'菜市场',address:'龙井市',region:'龙井市',sourceType:'零售价'}
]

exports.main = async (event, context) => {
  try {
    // 删除所有旧数据
    await db.collection('fruits').where({_id: _.exists(true)}).remove()
    await db.collection('stores').where({_id: _.exists(true)}).remove()

    // 逐条插入水果（简单for循环，不用闭包IIFE）
    for (var fi = 0; fi < FRUITS.length; fi++) {
      var fruit = FRUITS[fi]
      await db.collection('fruits').add({
        name: fruit.name,
        category: fruit.category,
        grade: fruit.grade
      })
    }

    // 逐条插入商超
    for (var si = 0; si < STORES.length; si++) {
      var store = STORES[si]
      await db.collection('stores').add({
        name: store.name,
        type: store.type,
        address: store.address,
        region: store.region,
        sourceType: store.sourceType
      })
    }

    return { success: true, fruits: FRUITS.length, stores: STORES.length }
  } catch (err) {
    return { success: false, error: err.message }
  }
}