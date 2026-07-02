from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
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
    type = Column(String, index=True)
    address = Column(String)
    region = Column(String, index=True, default="延吉市")
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


class PriceHistory(Base):
    """每日价格快照：爬虫更新前，把当前价格存入此表"""
    __tablename__ = "price_history"
    id = Column(Integer, primary_key=True, index=True)
    fruit_id = Column(Integer, index=True)
    store_id = Column(Integer, index=True)
    price = Column(Float, nullable=False)
    grade = Column(String)
    snapshot_date = Column(Date, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.now)