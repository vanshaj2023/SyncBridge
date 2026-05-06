import os
import redis.asyncio as aioredis
from motor.motor_asyncio import AsyncIOMotorClient

_redis: aioredis.Redis | None = None
_mongo: AsyncIOMotorClient | None = None

def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379"),
            decode_responses=True
        )
    return _redis

def get_mongo() -> AsyncIOMotorClient:
    global _mongo
    if _mongo is None:
        _mongo = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017/syncbridge"))
    return _mongo

def get_db():
    return get_mongo()[os.getenv("MONGO_DB", "syncbridge")]
