import sys
sys.path.insert(0, '.')

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Fruit, Store, Price

app = FastAPI(title="水果价格助手 API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "水果价格助手 API 运行中", "version": "2.0.0", "region": "延吉市"}


@app.get("/api/fruits/")
def get_fruits(db: Session = Depends(get_db)):
    fruits = db.query(Fruit).all()
    return [{"id": f.id, "name": f.name, "category": f.category, "grade": f.grade} for f in fruits]


@app.get("/api/stores/")
def get_stores(region: str = None, db: Session = Depends(get_db)):
    """获取商超列表，可按地区过滤"""
    query = db.query(Store)
    if region:
        query = query.filter(Store.region == region)
    stores = query.all()
    return [{
        "id": s.id,
        "name": s.name,
        "type": s.type,
        "address": s.address,
        "region": s.region,
        "source_type": s.source_type
    } for s in stores]


@app.get("/api/regions/")
def get_regions(db: Session = Depends(get_db)):
    """获取所有地区列表"""
    regions = db.query(Store.region).distinct().all()
    return [{"region": r[0]} for r in regions]


@app.get("/api/prices/{fruit_id}")
def get_fruit_prices(fruit_id: int, region: str = None, db: Session = Depends(get_db)):
    """获取某水果在各商超的价格，可按地区过滤"""
    query = db.query(Price).filter(Price.fruit_id == fruit_id)
    if region:
        query = query.join(Store).filter(Store.region == region)
    prices = query.all()
    # 无价格时返回空数组，前端显示"暂无价格"，不报错
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


@app.get("/api/price-compare/")
def compare_prices(fruit_names: str = None, region: str = None, db: Session = Depends(get_db)):
    """多水果价格对比，可按地区过滤"""
    if not fruit_names:
        raise HTTPException(status_code=400, detail="请提供水果名称")

    names = [name.strip() for name in fruit_names.split(",")]
    result = {}

    for name in names:
        fruit = db.query(Fruit).filter(Fruit.name == name).first()
        if not fruit:
            result[name] = {"error": "水果未找到"}
            continue

        query = db.query(Price).filter(Price.fruit_id == fruit.id)
        if region:
            query = query.join(Store).filter(Store.region == region)
        prices = query.all()

        prices_list = []
        for price in prices:
            prices_list.append({
                "store": price.store.name,
                "type": price.store.type,
                "region": price.store.region,
                "source_type": price.store.source_type,
                "price": price.price,
                "grade": price.grade
            })
        result[name] = sorted(prices_list, key=lambda x: x["price"])

    return result


@app.get("/api/locate/")
def get_default_location():
    """获取默认定位信息"""
    return {
        "city": "延吉市",
        "province": "吉林省",
        "prefecture": "延边朝鲜族自治州",
        "message": "默认定位: 吉林省延边朝鲜族自治州延吉市"
    }
