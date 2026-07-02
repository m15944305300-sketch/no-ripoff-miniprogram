import random
from datetime import datetime
from app.database import get_db
from app.models import Fruit, Store, Price


class BaseCrawler:
    def crawl(self):
        pass


class MockCrawler(BaseCrawler):
    """延吉市场水果价格爬虫

    数据来源说明:
    - 美团优选/京东秒送: 平台价，通常比线下便宜5-15%
    - 延吉百货大楼: 零售价，品质有保障，价格中等偏高
    - 每日隆便利店: 门店价，便利溢价，价格略高
    - 延吉西市场: 菜市场价格，通常最便宜
    - 珲春批发(一亩田): 批发参考价，最低
    - 周边县市农贸市场: 零售价，运输成本略高
    """

    def __init__(self):
        self.db = next(get_db())

    # 延吉市场水果基础价格范围（元/斤）
    BASE_PRICE_RANGES = {
        "苹果": (4.5, 10.0),
        "香蕉": (3.0, 7.0),
        "橙子": (4.0, 9.0),
        "西瓜": (2.0, 5.0),
        "葡萄": (7.0, 16.0),
        "草莓": (15.0, 35.0),
        "芒果": (6.0, 14.0),
        "榴莲": (25.0, 55.0),
        "蓝莓": (18.0, 38.0),
        "樱桃": (28.0, 58.0),
        "苹果梨": (3.0, 7.0),
        "桔梗": (8.0, 18.0),
    }

    # 不同商超类型的价格系数
    STORE_PRICE_FACTOR = {
        "线上平台": 0.90,        # 美团优选/京东秒送，平台补贴略便宜
        "百货商超": 1.05,         # 延吉百货大楼，品质好略贵
        "便利店": 1.10,           # 每日隆，便利溢价
        "菜市场": 0.95,           # 西市场，价格实惠
        "批发参考": 0.65,         # 一亩田批发价，最低
    }

    # 周边县市运输成本加价
    REGION_FACTOR = {
        "延吉市": 1.0,
        "珲春市": 1.05,
        "敦化市": 1.08,
        "图们市": 1.06,
        "龙井市": 1.04,
    }

    def get_price_for_store(self, fruit_name, store):
        """根据水果和商超类型生成价格"""
        if fruit_name in self.BASE_PRICE_RANGES:
            low, high = self.BASE_PRICE_RANGES[fruit_name]
        else:
            low, high = 5.0, 20.0

        # 基础价格
        base_price = random.uniform(low, high)

        # 商超类型系数
        store_factor = self.STORE_PRICE_FACTOR.get(store.type, 1.0)

        # 地区系数
        region_factor = self.REGION_FACTOR.get(store.region, 1.0)

        # 计算最终价格
        price = base_price * store_factor * region_factor

        return round(price, 2)

    def get_grade_for_store(self, store):
        """根据商超类型生成等级"""
        if store.type == "百货商超":
            # 百货大楼品质好，A级概率高
            grades = ["A级", "A级", "A级", "B级"]
        elif store.type == "便利店":
            # 便利店品质中等
            grades = ["A级", "B级", "B级"]
        elif store.type == "批发参考":
            # 批发市场混级
            grades = ["A级", "B级", "C级"]
        elif store.type == "菜市场":
            # 菜市场混级
            grades = ["A级", "B级", "B级", "C级"]
        else:
            # 线上平台
            grades = ["A级", "B级"]

        return random.choice(grades)

    def crawl(self):
        fruits = self.db.query(Fruit).all()
        stores = self.db.query(Store).all()

        for fruit in fruits:
            for store in stores:
                price = self.get_price_for_store(fruit.name, store)
                grade = self.get_grade_for_store(store)

                existing_price = self.db.query(Price).filter(
                    Price.fruit_id == fruit.id,
                    Price.store_id == store.id
                ).first()

                if existing_price:
                    existing_price.price = price
                    existing_price.grade = grade
                    existing_price.updated_at = datetime.now()
                else:
                    new_price = Price(
                        fruit_id=fruit.id,
                        store_id=store.id,
                        price=price,
                        grade=grade
                    )
                    self.db.add(new_price)

        self.db.commit()
        print(f"[{datetime.now()}] 价格数据已更新（延吉市场）")


if __name__ == "__main__":
    crawler = MockCrawler()
    crawler.crawl()
