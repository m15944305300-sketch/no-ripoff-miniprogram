import random
import os
from datetime import datetime, date, timedelta
from app.database import get_db
from app.models import Fruit, Store, Price, PriceHistory


class BaseCrawler:
    def crawl(self):
        pass


class MockCrawler(BaseCrawler):
    """延吉市场水果价格爬虫

    第一性原理:
    - 每次爬取前，先把当前Price表数据快照到PriceHistory
    - 快照日期 = 今天，如果今天已快照则跳过
    - 这样同果同店昨今对比就有数据支撑
    """

    def __init__(self):
        self.db = next(get_db())

    BASE_PRICE_RANGES = {
        "苹果": (4.5, 10.0), "梨": (3.0, 7.0), "苹果梨": (3.0, 7.0),
        "桃子": (4.0, 9.0), "李子": (5.0, 12.0), "杏子": (6.0, 14.0),
        "樱桃": (28.0, 58.0), "车厘子": (38.0, 88.0),
        "葡萄": (7.0, 16.0), "提子": (10.0, 22.0), "草莓": (15.0, 35.0),
        "蓝莓": (18.0, 38.0), "猕猴桃": (6.0, 14.0), "无花果": (12.0, 28.0),
        "石榴": (8.0, 18.0), "西瓜": (2.0, 5.0), "哈密瓜": (5.0, 12.0),
        "香瓜": (4.0, 9.0), "橙子": (4.0, 9.0), "柚子": (3.5, 8.0),
        "柠檬": (6.0, 14.0), "香蕉": (3.0, 7.0), "芒果": (6.0, 14.0),
        "榴莲": (25.0, 55.0), "菠萝": (4.0, 9.0), "山竹": (18.0, 38.0),
        "荔枝": (12.0, 28.0), "龙眼": (10.0, 22.0), "火龙果": (6.0, 14.0),
        "木瓜": (5.0, 12.0), "椰子": (8.0, 16.0), "百香果": (10.0, 22.0),
        "牛油果": (12.0, 25.0), "莲雾": (15.0, 32.0), "释迦果": (20.0, 45.0),
        "柿子": (4.0, 9.0), "枣": (8.0, 18.0),
    }

    STORE_PRICE_FACTOR = {
        "线上平台": 0.90, "百货商超": 1.05, "便利店": 1.10,
        "菜市场": 0.95, "批发参考": 0.65,
    }

    REGION_FACTOR = {
        "延吉市": 1.0, "珲春市": 1.05, "敦化市": 1.08,
        "图们市": 1.06, "龙井市": 1.04,
    }

    STORE_TYPE_SKIP_PROBABILITY = {
        "线上平台": 0.10, "百货商超": 0.15, "便利店": 0.35,
        "菜市场": 0.25, "批发参考": 0.30,
    }

    def _save_history_snapshot(self):
        """把当前Price表数据快照到PriceHistory（存为昨天日期，因为更新后数据代表今天）"""
        yesterday = date.today() - timedelta(days=1)
        existing = self.db.query(PriceHistory).filter(
            PriceHistory.snapshot_date == yesterday
        ).first()
        if existing:
            print(f"  [历史快照] {yesterday} 已存在，跳过")
            return

        prices = self.db.query(Price).all()
        snapshots = []
        for p in prices:
            snapshots.append(PriceHistory(
                fruit_id=p.fruit_id,
                store_id=p.store_id,
                price=p.price,
                grade=p.grade,
                snapshot_date=yesterday
            ))
        self.db.bulk_save_objects(snapshots)
        self.db.commit()
        print(f"  [历史快照] {yesterday} 保存 {len(snapshots)} 条记录")

    def should_skip(self, store_type):
        skip_prob = self.STORE_TYPE_SKIP_PROBABILITY.get(store_type, 0.2)
        return random.random() < skip_prob

    def get_price_for_store(self, fruit_name, store):
        if fruit_name in self.BASE_PRICE_RANGES:
            low, high = self.BASE_PRICE_RANGES[fruit_name]
        else:
            low, high = 5.0, 20.0
        base_price = random.uniform(low, high)
        store_factor = self.STORE_PRICE_FACTOR.get(store.type, 1.0)
        region_factor = self.REGION_FACTOR.get(store.region, 1.0)
        price = base_price * store_factor * region_factor
        return round(price, 2)

    def get_grade_for_store(self, store):
        if store.type == "百货商超":
            return random.choice(["A级", "A级", "A级", "B级"])
        elif store.type == "便利店":
            return random.choice(["A级", "B级", "B级"])
        elif store.type == "批发参考":
            return random.choice(["A级", "B级", "C级"])
        elif store.type == "菜市场":
            return random.choice(["A级", "B级", "B级", "C级"])
        return random.choice(["A级", "B级"])

    def crawl(self):
        print(f"[{datetime.now()}] 开始爬取...")

        # 第一步：保存今日快照（用于后续的昨今对比）
        self._save_history_snapshot()

        # 第二步：更新当日价格
        fruits = self.db.query(Fruit).all()
        stores = self.db.query(Store).all()

        updated_count = 0
        skipped_count = 0

        for fruit in fruits:
            for store in stores:
                if self.should_skip(store.type):
                    old = self.db.query(Price).filter(
                        Price.fruit_id == fruit.id,
                        Price.store_id == store.id
                    ).first()
                    if old:
                        self.db.delete(old)
                    skipped_count += 1
                    continue

                price = self.get_price_for_store(fruit.name, store)
                grade = self.get_grade_for_store(store)

                existing = self.db.query(Price).filter(
                    Price.fruit_id == fruit.id,
                    Price.store_id == store.id
                ).first()

                if existing:
                    existing.price = price
                    existing.grade = grade
                    existing.updated_at = datetime.now()
                else:
                    self.db.add(Price(
                        fruit_id=fruit.id,
                        store_id=store.id,
                        price=price,
                        grade=grade
                    ))
                updated_count += 1

        self.db.commit()
        print(f"  已更新: {updated_count} 条 | 无报价: {skipped_count} 条")


if __name__ == "__main__":
    MockCrawler().crawl()