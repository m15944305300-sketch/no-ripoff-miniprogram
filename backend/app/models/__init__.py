from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Fruit(Base):
    __tablename__ = "fruits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True, nullable=False)
    category = Column(String, index=True)
    grade = Column(String, index=True)
    unit = Column(String, default="斤")
    created_at = Column(DateTime, default=datetime.now)

    prices = relationship("Price", back_populates="fruit")


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True, nullable=False)
    # 商超类型: 线上平台 / 百货商超 / 便利店 / 批发参考 / 菜市场
    type = Column(String, index=True)
    address = Column(String)
    # 地区: 延吉市 / 珲春市 / 敦化市 / 图们市 / 龙井市 / 和龙市 / 汪清县 / 安图县
    region = Column(String, index=True, default="延吉市")
    # 数据来源类型: 平台价 / 零售价 / 批发参考价 / 门店价
    source_type = Column(String, default="零售价")
    created_at = Column(DateTime, default=datetime.now)

    prices = relationship("Price", back_populates="store")


class Price(Base):
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True, index=True)
    fruit_id = Column(Integer, ForeignKey("fruits.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))
    price = Column(Float, nullable=False)
    grade = Column(String)
    updated_at = Column(DateTime, default=datetime.now)

    fruit = relationship("Fruit", back_populates="prices")
    store = relationship("Store", back_populates="prices")
