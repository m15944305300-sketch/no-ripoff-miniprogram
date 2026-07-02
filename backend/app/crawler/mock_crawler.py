import random
from datetime import datetime
from app.database import get_db
from app.models import Fruit, Store, Price

class BaseCrawler:
    def crawl(self):
        pass

class MockCrawler(BaseCrawler):
    def __init__(self):
        self.db = next(get_db())

    def get_random_price(self, fruit_name):
        price_ranges = {
            "苹果": (5, 12),
            "香蕉": (3, 8),
            "橙子": (4, 10),
            "西瓜": (2, 6),
            "葡萄": (8, 18),
            "草莓": (15, 35),
            "芒果": (6, 15),
            "榴莲": (25, 50),
            "蓝莓": (20, 40),
            "樱桃": (30, 60),
        }
        if fruit_name in price_ranges:
            return round(random.uniform(*price_ranges[fruit_name]), 2)
        return round(random.uniform(5, 20), 2)

    def crawl(self):
        fruits = self.db.query(Fruit).all()
        stores = self.db.query(Store).all()
        grades = ["A级", "B级", "C级"]

        for fruit in fruits:
            for store in stores:
                price = self.get_random_price(fruit.name)
                grade = random.choice(grades)

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
        print(f"[{datetime.now()}] 价格数据已更新")

if __name__ == "__main__":
    crawler = MockCrawler()
    crawler.crawl()