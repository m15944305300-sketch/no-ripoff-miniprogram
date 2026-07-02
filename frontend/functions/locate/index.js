// 云函数：获取默认定位
exports.main = async (event, context) => {
  return {
    city: '延吉市',
    province: '吉林省',
    prefecture: '延边朝鲜族自治州',
    message: '默认定位: 吉林省延边朝鲜族自治州延吉市'
  }
}