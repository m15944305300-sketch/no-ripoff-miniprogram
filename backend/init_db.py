import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, get_db
from app.models import Fruit, Store, Price

Base.metadata.create_all(bind=engine)

db = next(get_db())

fruits_data = [
    {"name": "苹果", "category": "苹果类", "grade": "A级"},
    {"name": "香蕉", "category": "香蕉类", "grade": "A级"},
    {"name": "橙子", "category": "柑橘类", "grade": "A级"},
    {"name": "西瓜", "category": "瓜类", "grade": "A级"},
    {"name": "葡萄", "category": "浆果类", "grade": "A级"},
    {"name": "草莓", "category": "浆果类", "grade": "A级"},
    {"name": "芒果", "category": "热带水果", "grade": "A级"},
    {"name": "榴莲", "category": "热带水果", "grade": "A级"},
    {"name": "蓝莓", "category": "浆果类", "grade": "A级"},
    {"name": "樱桃", "category": "浆果类", "grade": "A级"},
]

stores_data = [
    {"name": "沃尔玛", "type": "商超", "address": "市中心店"},
    {"name": "永辉超市", "type": "商超", "address": "万达广场店"},
    {"name": "盒马鲜生", "type": "精品超市", "address": "CBD店"},
    {"name": "美团优选", "type": "线上平台", "address": "线上配送"},
    {"name": "多多买菜", "type": "线上平台", "address": "线上配送"},
    {"name": "本地菜市场", "type": "菜市场", "address": "城东市场"},
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