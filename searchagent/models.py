import pymongo
from pymongo.collection import Collection
import bcrypt
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

# MongoDB setup
mongo_client = pymongo.MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db = mongo_client["linkedin_networking"]
users_collection: Collection = db["users"]

# Create geospatial index
users_collection.create_index([("coords", "2dsphere")])
logger.info("Created 2dsphere index on users.coords")

# Password hashing utility
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(12)
    return bcrypt.hashpw(password.encode(), salt).decode()

def compare_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())