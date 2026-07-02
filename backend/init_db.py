import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, get_db
from app.models import Fruit, Store, Price

# 删除旧数据库重新创建
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fruit_price.db")
if os.path.exists(db_path):
    os.remove(db_path)

Base.metadata.create_all(bind=engine)

db = next(get_db())

# 全部水果品类（35种，覆盖延吉市场常见水果）
fruits_data = [
    # 仁果类
    {"name": "苹果", "category": "仁果类", "grade": "A级"},
    {"name": "梨", "category": "仁果类", "grade": "A级"},
    {"name": "苹果梨", "category": "仁果类", "grade": "A级"},  # 延边特产
    # 核果类
    {"name": "桃子", "category": "核果类", "grade": "A级"},
    {"name": "李子", "category": "核果类", "grade": "A级"},
    {"name": "杏子", "category": "核果类", "grade": "A级"},
    {"name": "樱桃", "category": "核果类", "grade": "A级"},
    {"name": "车厘子", "category": "核果类", "grade": "A级"},
    # 浆果类
    {"name": "葡萄", "category": "浆果类", "grade": "A级"},
    {"name": "提子", "category": "浆果类", "grade": "A级"},
    {"name": "草莓", "category": "浆果类", "grade": "A级"},
    {"name": "蓝莓", "category": "浆果类", "grade": "A级"},
    {"name": "猕猴桃", "category": "浆果类", "grade": "A级"},
    {"name": "无花果", "category": "浆果类", "grade": "A级"},
    {"name": "石榴", "category": "浆果类", "grade": "A级"},
    # 瓜类
    {"name": "西瓜", "category": "瓜类", "grade": "A级"},
    {"name": "哈密瓜", "category": "瓜类", "grade": "A级"},
    {"name": "香瓜", "category": "瓜类", "grade": "A级"},
    # 柑橘类
    {"name": "橙子", "category": "柑橘类", "grade": "A级"},
    {"name": "柚子", "category": "柑橘类", "grade": "A级"},
    {"name": "柠檬", "category": "柑橘类", "grade": "A级"},
    # 热带水果
    {"name": "香蕉", "category": "热带水果", "grade": "A级"},
    {"name": "芒果", "category": "热带水果", "grade": "A级"},
    {"name": "榴莲", "category": "热带水果", "grade": "A级"},
    {"name": "菠萝", "category": "热带水果", "grade": "A级"},
    {"name": "山竹", "category": "热带水果", "grade": "A级"},
    {"name": "荔枝", "category": "热带水果", "grade": "A级"},
    {"name": "龙眼", "category": "热带水果", "grade": "A级"},
    {"name": "火龙果", "category": "热带水果", "grade": "A级"},
    {"name": "木瓜", "category": "热带水果", "grade": "A级"},
    {"name": "椰子", "category": "热带水果", "grade": "A级"},
    {"name": "百香果", "category": "热带水果", "grade": "A级"},
    {"name": "牛油果", "category": "热带水果", "grade": "A级"},
    {"name": "莲雾", "category": "热带水果", "grade": "A级"},
    {"name": "释迦果", "category": "热带水果", "grade": "A级"},
    # 其他
    {"name": "柿子", "category": "其他", "grade": "A级"},
    {"name": "枣", "category": "其他", "grade": "A级"},
]

# 延吉市真实商超数据
stores_data = [
    # === 延吉市本地商超 ===
    {"name": "美团优选", "type": "线上平台", "address": "延吉市自提点", "region": "延吉市", "source_type": "平台价"},
    {"name": "京东秒送", "type": "线上平台", "address": "延吉市配送范围", "region": "延吉市", "source_type": "平台价"},
    {"name": "延吉百货大楼", "type": "百货商超", "address": "延吉市光明街", "region": "延吉市", "source_type": "零售价"},
    {"name": "每日隆(北大新城店)", "type": "便利店", "address": "延吉市新村路222号北大新城", "region": "延吉市", "source_type": "门店价"},
    {"name": "每日隆(牛市街店)", "type": "便利店", "address": "延吉市牛市街569号", "region": "延吉市", "source_type": "门店价"},
    {"name": "每日隆(富元小区店)", "type": "便利店", "address": "延吉市富元小区", "region": "延吉市", "source_type": "门店价"},
    {"name": "延吉西市场", "type": "菜市场", "address": "延吉市西市场", "region": "延吉市", "source_type": "零售价"},
    # === 周边县市（商超不足时扩展） ===
    {"name": "珲春批发市场(一亩田)", "type": "批发参考", "address": "珲春市", "region": "珲春市", "source_type": "批发参考价"},
    {"name": "敦化农贸市场", "type": "菜市场", "address": "敦化市", "region": "敦化市", "source_type": "零售价"},
    {"name": "图们农贸市场", "type": "菜市场", "address": "图们市", "region": "图们市", "source_type": "零售价"},
    {"name": "龙井农贸市场", "type": "菜市场", "address": "龙井市", "region": "龙井市", "source_type": "零售价"},
]

for fruit_data in fruits_data:
    if not db.query(Fruit).filter(Fruit.name == fruit_data["name"]).first():
        fruit = Fruit(**fruit_data)
        db.add(fruit)

for store_data in stores_data:
    if not db.query(Store).filter(Store.name == store_data["name"]).first():
        store = Store(**store_data)
        db.add(store)

db.commit()
print("数据库初始化完成！")
print(f"水果数量: {db.query(Fruit).count()} 种")
print(f"商超数量: {db.query(Store).count()} 家")
print("\n水果列表:")
for f in db.query(Fruit).order_by(Fruit.category, Fruit.id).all():
    print(f"  [{f.category}] {f.name}")
