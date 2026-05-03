import os
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
MUSIC_TABLE = os.getenv("MUSIC_TABLE", "music")
LOGIN_TABLE = os.getenv("LOGIN_TABLE", "login")
SUBSCRIPTIONS_TABLE = os.getenv("SUBSCRIPTIONS_TABLE", "subscriptions")