import sys
sys.path.insert(0, '.')

from datetime import date, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Fruit, Store, Price, PriceHistory

app = FastAPI(title="水果价格助手 API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "水果价格助手 API 运行中", "version": "3.0.0", "region": "延吉市"}


@app.get("/api/fruits/")
def get_fruits(db: Session = Depends(get_db)):
    fruits = db.query(Fruit).all()
    return [{"id": f.id, "name": f.name, "category": f.category, "grade": f.grade} for f in fruits]


@app.get("/api/stores/")
def get_stores(region: str = None, db: Session = Depends(get_db)):
    query = db.query(Store)
    if region:
        query = query.filter(Store.region == region)
    stores = query.all()
    return [{
        "id": s.id, "name": s.name, "type": s.type,
        "address": s.address, "region": s.region, "source_type": s.source_type
    } for s in stores]


@app.get("/api/regions/")
def get_regions(db: Session = Depends(get_db)):
    regions = db.query(Store.region).distinct().all()
    return [{"region": r[0]} for r in regions]


@app.get("/api/prices/{fruit_id}")
def get_fruit_prices(fruit_id: int, region: str = None, db: Session = Depends(get_db)):
    query = db.query(Price).filter(Price.fruit_id == fruit_id)
    if region:
        query = query.join(Store).filter(Store.region == region)
    prices = query.all()
    result = []
    for price in prices:
        result.append({
            "store_id": price.store.id,
            "store_name": price.store.name,
            "store_type": price.store.type,
            "region": price.store.region,
            "source_type": price.store.source_type,
            "price": price.price,
            "grade": price.grade,
            "unit": price.fruit.unit,
            "updated_at": price.updated_at.isoformat()
        })
    return sorted(result, key=lambda x: x["price"])


@app.get("/api/search/")
def search_fruit(keyword: str, db: Session = Depends(get_db)):
    fruits = db.query(Fruit).filter(Fruit.name.like(f"%{keyword}%")).all()
    return [{"id": f.id, "name": f.name, "category": f.category} for f in fruits]


@app.get("/api/locate/")
def get_default_location():
    return {
        "city": "延吉市",
        "province": "吉林省",
        "prefecture": "延边朝鲜族自治州",
        "message": "默认定位: 吉林省延边朝鲜族自治州延吉市"
    }


@app.get("/api/price-trend/{fruit_id}")
def get_price_trend(fruit_id: int, region: str = None, db: Session = Depends(get_db)):
    """同果同店昨今价格对比

    返回每个商超: 今天价格、昨天价格、涨跌额、涨跌幅
    第一性原理: 用户需要的不是苹果vs香蕉，而是今天买苹果比昨天贵了还是便宜了
    """
    fruit = db.query(Fruit).filter(Fruit.id == fruit_id).first()
    if not fruit:
        raise HTTPException(status_code=404, detail="水果未找到")

    today = date.today()
    yesterday = today - timedelta(days=1)

    # 今天价格（Price表）
    today_query = db.query(Price).filter(Price.fruit_id == fruit_id)
    if region:
        today_query = today_query.join(Store).filter(Store.region == region)
    today_prices = today_query.all()

    # 昨天价格（PriceHistory表）
    yesterday_prices = {}
    y_query = db.query(PriceHistory).filter(
        PriceHistory.fruit_id == fruit_id,
        PriceHistory.snapshot_date == yesterday
    )
    if region:
        store_ids = [s.id for s in db.query(Store).filter(Store.region == region).all()]
        y_query = y_query.filter(PriceHistory.store_id.in_(store_ids))
    for ph in y_query.all():
        yesterday_prices[ph.store_id] = ph

    result = []
    for tp in today_prices:
        store = tp.store
        today_price = tp.price
        today_grade = tp.grade

        yp = yesterday_prices.get(store.id)
        if yp:
            yesterday_price = yp.price
            yesterday_grade = yp.grade
            change = round(today_price - yesterday_price, 2)
            change_pct = round((change / yesterday_price) * 100, 1)
        else:
            yesterday_price = None
            yesterday_grade = None
            change = None
            change_pct = None

        result.append({
            "store_name": store.name,
            "store_type": store.type,
            "region": store.region,
            "source_type": store.source_type,
            "today_price": today_price,
            "today_grade": today_grade,
            "yesterday_price": yesterday_price,
            "yesterday_grade": yesterday_grade,
            "change": change,
            "change_pct": change_pct,
            "unit": fruit.unit
        })

    # 排序：降价最多排前面 → 最划算
    def sort_key(x):
        if x["change"] is None:
            return (999, 0)
        return (x["change"], -x["today_price"])

    result.sort(key=sort_key)
    return result