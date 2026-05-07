import os
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
MUSIC_TABLE = os.getenv("MUSIC_TABLE", "music")
LOGIN_TABLE = os.getenv("LOGIN_TABLE", "login")
SUBSCRIPTIONS_TABLE = os.getenv("SUBSCRIPTIONS_TABLE", "subscriptions")
S3_BUCKET = os.getenv("S3_BUCKET", "rmit-a2-group54-music-images")
PRESIGNED_URL_EXPIRES = int(os.getenv("PRESIGNED_URL_EXPIRES", "3600"))