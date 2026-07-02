import random
import os
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

    特性:
    - 并非所有商超都卖所有水果（模拟真实情况）
    - 部分水果当天可能无价格数据（当天不显示）
    """

    def __init__(self):
        self.db = next(get_db())

    # 延吉市场水果基础价格范围（元/斤）
    BASE_PRICE_RANGES = {
        # 仁果类
        "苹果": (4.5, 10.0),
        "梨": (3.0, 7.0),
        "苹果梨": (3.0, 7.0),
        # 核果类
        "桃子": (4.0, 9.0),
        "李子": (5.0, 12.0),
        "杏子": (6.0, 14.0),
        "樱桃": (28.0, 58.0),
        "车厘子": (38.0, 88.0),
        # 浆果类
        "葡萄": (7.0, 16.0),
        "提子": (10.0, 22.0),
        "草莓": (15.0, 35.0),
        "蓝莓": (18.0, 38.0),
        "猕猴桃": (6.0, 14.0),
        "无花果": (12.0, 28.0),
        "石榴": (8.0, 18.0),
        # 瓜类
        "西瓜": (2.0, 5.0),
        "哈密瓜": (5.0, 12.0),
        "香瓜": (4.0, 9.0),
        # 柑橘类
        "橙子": (4.0, 9.0),
        "柚子": (3.5, 8.0),
        "柠檬": (6.0, 14.0),
        # 热带水果
        "香蕉": (3.0, 7.0),
        "芒果": (6.0, 14.0),
        "榴莲": (25.0, 55.0),
        "菠萝": (4.0, 9.0),
        "山竹": (18.0, 38.0),
        "荔枝": (12.0, 28.0),
        "龙眼": (10.0, 22.0),
        "火龙果": (6.0, 14.0),
        "木瓜": (5.0, 12.0),
        "椰子": (8.0, 16.0),
        "百香果": (10.0, 22.0),
        "牛油果": (12.0, 25.0),
        "莲雾": (15.0, 32.0),
        "释迦果": (20.0, 45.0),
        # 其他
        "柿子": (4.0, 9.0),
        "枣": (8.0, 18.0),
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

    # 某些商超不卖某些水果的概率（模拟真实缺货情况）
    # 线上平台和百货大楼品类全，便利店和小市场品类少
    STORE_TYPE_SKIP_PROBABILITY = {
        "线上平台": 0.10,     # 线上平台90%覆盖
        "百货商超": 0.15,     # 百货大楼85%覆盖
        "便利店": 0.35,       # 便利店65%覆盖（小众水果不卖）
        "菜市场": 0.25,       # 菜市场75%覆盖
        "批发参考": 0.30,     # 批发市场70%覆盖
    }

    def should_skip(self, store_type):
        """判断该商超今天是否有该水果的报价"""
        skip_prob = self.STORE_TYPE_SKIP_PROBABILITY.get(store_type, 0.2)
        return random.random() < skip_prob

    def get_price_for_store(self, fruit_name, store):
        """根据水果和商超类型生成价格"""
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
        """根据商超类型生成等级"""
        if store.type == "百货商超":
            grades = ["A级", "A级", "A级", "B级"]
        elif store.type == "便利店":
            grades = ["A级", "B级", "B级"]
        elif store.type == "批发参考":
            grades = ["A级", "B级", "C级"]
        elif store.type == "菜市场":
            grades = ["A级", "B级", "B级", "C级"]
        else:
            grades = ["A级", "B级"]
        return random.choice(grades)

    def crawl(self):
        fruits = self.db.query(Fruit).all()
        stores = self.db.query(Store).all()

        updated_count = 0
        skipped_count = 0

        for fruit in fruits:
            for store in stores:
                # 模拟：部分商超今天没有该水果的报价
                if self.should_skip(store.type):
                    # 删除可能存在的旧价格记录
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
                updated_count += 1

        self.db.commit()
        print(f"[{datetime.now()}] 价格数据已更新（延吉市场）")
        print(f"  已更新: {updated_count} 条 | 当天无报价跳过: {skipped_count} 条")


if __name__ == "__main__":
    crawler = MockCrawler()
    crawler.crawl()
