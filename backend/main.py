import sys
sys.path.insert(0, '.')

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Fruit, Store, Price

app = FastAPI(title="水果价格助手 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/fruits/")
def get_fruits(db: Session = Depends(get_db)):
    fruits = db.query(Fruit).all()
    return [{"id": f.id, "name": f.name, "category": f.category, "grade": f.grade} for f in fruits]

@app.get("/api/stores/")
def get_stores(db: Session = Depends(get_db)):
    stores = db.query(Store).all()
    return [{"id": s.id, "name": s.name, "type": s.type, "address": s.address} for s in stores]

@app.get("/api/prices/{fruit_id}")
def get_fruit_prices(fruit_id: int, db: Session = Depends(get_db)):
    prices = db.query(Price).filter(Price.fruit_id == fruit_id).all()
    if not prices:
        raise HTTPException(status_code=404, detail="价格数据未找到")

    result = []
    for price in prices:
        result.append({
            "store_id": price.store.id,
            "store_name": price.store.name,
            "store_type": price.store.type,
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
def compare_prices(fruit_names: str = None, db: Session = Depends(get_db)):
    if not fruit_names:
        raise HTTPException(status_code=400, detail="请提供水果名称")

    names = [name.strip() for name in fruit_names.split(",")]
    result = {}

    for name in names:
        fruit = db.query(Fruit).filter(Fruit.name == name).first()
        if not fruit:
            result[name] = {"error": "水果未找到"}
            continue

        prices = db.query(Price).filter(Price.fruit_id == fruit.id).all()
        prices_list = []
        for price in prices:
            prices_list.append({
                "store": price.store.name,
                "type": price.store.type,
                "price": price.price,
                "grade": price.grade
            })
        result[name] = sorted(prices_list, key=lambda x: x["price"])

    return result

@app.get("/")
def root():
    return {"message": "水果价格助手 API 运行中"}