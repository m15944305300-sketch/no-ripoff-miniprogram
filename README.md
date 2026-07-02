# 🍎 延吉水果价格助手 - 微信小程序

> 基于微信云开发的延吉水果价格查询与对比小程序

## 📋 项目信息

| 项目 | 值 |
|------|------|
| 小程序 AppID | `wx4626eae432978d3f` |
| 云环境 ID | `cloudbase-d8g6jxgthdd1f2afe` |
| GitHub 仓库 | `https://github.com/m15944305300-sketch/no-ripoff-miniprogram.git` |

## 🚀 环境搭建

1. **克隆代码**
   ```bash
   git clone https://github.com/m15944305300-sketch/no-ripoff-miniprogram.git
   cd no-ripoff-miniprogram/fruit_price_helper
   ```

2. **微信开发者工具打开**
   - 打开 `frontend/` 目录
   - 填入 AppID：`wx4626eae432978d3f`
   - 确保云开发环境 ID 配置正确

3. **云函数安装依赖**
   在微信开发者工具中，右键每个云函数 → 「在终端中打开」→ `npm install`，需安装的云函数：
   - `getFruits/`（不需要额外依赖）
   - `getPrices/`（不需要额外依赖）
   - `search/`（不需要额外依赖）
   - `priceTrend/`（不需要额外依赖）
   - `locate/`（不需要额外依赖）
   - `crawlPrices/`（需要 `wx-server-sdk` 依赖）
   - `initDB/`（不需要额外依赖）
   - `fixFruits/`（需要 `wx-server-sdk` 依赖）
   - `dumpDebug/`（不需要额外依赖）

## 🧹 当前已知问题（需继续修复）

### 问题一：name 字段为空（核心问题）
**症状：** `getFruits` 返回 37 条记录但 `name: ""`，首页显示 40 个红苹果无汉字
**根因：** 之前使用 `db.collection().add([数组])` 方式写入，云开发会将整个数组存为单条记录的字段值，而不是创建多条记录
**修复方案（已写好代码但未部署）：**
1. 右键 `fixFruits/` → 上传并部署（云端安装依赖）
2. 在云控制台或通过调用运行 `fixFruits`
3. 调用 `getFruits` 验证 name 字段是否正常
4. 调用 `crawlPrices` 生成价格数据
5. 删除 `fixFruits` 和 `dumpDebug` 云函数（临时工具）

### 问题二：crawlPrices 超时
**症状：** `Invoking task timed out after 3 seconds`
**修复方案（已写好但未部署）：**
- 最新版使用 `Promise.all(15路并发)` 替代串行写入
- 跳过了历史快照步骤
- 需部署验证是否通过

### 问题三：dumpDebug（调试工具）
**用途：** 查看数据库实际存储结构，验证 name 字段实际存储格式
**操作：** 右键 `dumpDebug/` → 上传并部署 → 调用查看结果，用完后删除

## 📐 项目结构

```
fruit_price_helper/
├── backend/                          # Python 后端（本地开发用，已迁移到云开发）
│   ├── main.py
│   ├── init_db.py
│   └── app/
│       ├── database.py
│       ├── api/routes.py
│       └── crawler/
│           ├── mock_crawler.py
│           └── scheduler.py
├── frontend/                         # 微信小程序前端
│   ├── app.js                        # 入口 + 云环境配置
│   ├── app.json
│   ├── app.wxss
│   ├── project.config.json           # AppID: wx4626eae432978d3f
│   ├── project.private.config.json   # 本地私有配置（已 gitignore）
│   ├── sitemap.json
│   ├── utils/
│   │   └── helper.wxs                # getEmoji 等前端工具函数
│   ├── images/                       # tabBar 图标
│   │   ├── home.png / home-active.png
│   │   ├── compare.png / compare-active.png
│   │   └── search.png / search-active.png
│   ├── pages/
│   │   ├── index/                    # 首页 - 37种水果展示
│   │   ├── compare/                  # 对比页 - 同果同店价格走势
│   │   └── search/                   # 搜索页
│   └── functions/                    # 云函数（共9个）
│       ├── getFruits/                # 获取全部水果列表
│       ├── getPrices/                # 获取某水果各商超价格
│       ├── search/                   # 搜索水果
│       ├── priceTrend/               # 价格走势
│       ├── locate/                   # 默认定位
│       ├── crawlPrices/              # 每日价格爬取（并发版）
│       ├── initDB/                   # 初始化数据库（已废弃）
│       ├── fixFruits/                # 修复数据库name字段（临时工具，用完删除）
│       └── dumpDebug/                # 调试查看数据（临时工具，用完删除）
└── .gitignore
```

## 📊 数据库集合

| 集合名 | 用途 | 权限 |
|--------|------|------|
| `fruits` | 水果品类（37种） | 所有用户可读，仅创建者可写 |
| `stores` | 商超信息（11家） | 所有用户可读，仅创建者可写 |
| `prices` | 每日价格数据 | 所有用户可读，仅创建者可写 |
| `priceHistory` | 价格历史（暂用prices替代） | 所有用户可读，仅创建者可写 |

## 🔑 关键配置

### 云环境 ID
文件：`frontend/app.js`
```javascript
wx.cloud.init({
  env: 'cloudbase-d8g6jxgthdd1f2afe',  // 确认此值
  traceUser: true
})
```

### AppID
文件：`frontend/project.config.json` 中的 `appid` 字段

## 📝 后续开发步骤（回家后）

### 第一阶段：修复数据（最重要）
```bash
# 1. 微信开发者工具打开 frontend 目录
# 2. 右键 fixFruits/ → 上传并部署（勾选"云端安装依赖"）
# 3. 在云控制台调用 fixFruits（或通过小程序调用）
# 4. 右键 dumpDebug/ → 上传并部署
# 5. 调用 dumpDebug 查看数据库存储结构
```

### 第二阶段：验证数据
```bash
# 1. 调用 getFruits 查看 name 字段是否正常
# 2. 调用 crawlPrices 生成价格数据
# 3. Ctrl+S 重新编译，查看首页是否显示37种带汉字的水果
# 4. 测试对比页和搜索页功能
```

### 第三阶段：清理上线
```bash
# 1. 删除临时云函数：fixFruits/、dumpDebug/
# 2. 提交小程序审核
# 3. 正式发布
```

## 💡 注意事项

1. **云函数最多执行3秒** - `crawlPrices` 已优化为并发批处理
2. **add(数组) 不会创建多条记录** - 必须用 for 循环逐条 add
3. **get() 默认返回20条** - 需要分页时用 skip+limit
4. **remove() 必须有非空查询条件** - 使用 `where({_id: _.exists(true)})` 替代 `where({})`
5. **小程序组件按需注入** - `app.json` 中添加 `"lazyCodeLoading": "requiredComponents"`
