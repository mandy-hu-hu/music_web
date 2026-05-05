import boto3
import json

from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from config import AWS_REGION, MUSIC_TABLE, LOGIN_TABLE, SUBSCRIPTIONS_TABLE

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
music_table = dynamodb.Table(MUSIC_TABLE)
login_table = dynamodb.Table(LOGIN_TABLE)
subscriptions_table = dynamodb.Table(SUBSCRIPTIONS_TABLE)

def make_song_id(song: dict) -> str:
    return f"{song.get('title')}#{song.get('year')}#{song.get('album')}"


def success(data=None, status_code=200):
    return {
        "ok": True,
        "statusCode": status_code,
        "data": data if data is not None else {}
    }


def error(message, status_code=400):
    return {
        "ok": False,
        "statusCode": status_code,
        "error": message
    }


def add_song_ids(items):
    result = []

    for item in items:
        item = dict(item)

        filename = item["artist"].replace(" ", "") + ".jpg"

        item["img_url"] = f"https://rmit-a2-group54-music-images.s3.amazonaws.com/{filename}"

        item["song_id"] = make_song_id(item)

        result.append(item)

    return result

def query_music(title=None, artist=None, year=None, album=None):
    try:
        conditions = []

        if title:
            conditions.append(Attr("title").contains(title))
        if artist:
            conditions.append(Attr("artist").contains(artist))
        if year:
            conditions.append(Attr("year").eq(str(year)))
        if album:
            conditions.append(Attr("album").contains(album))

        if not conditions:
            return error("At least one query field is required", 400)

        filter_expr = conditions[0]
        for cond in conditions[1:]:
            filter_expr = filter_expr & cond

        response = music_table.scan(FilterExpression=filter_expr)
        items = response.get("Items", [])

        return success({"items": add_song_ids(items)})

    except ClientError as e:
        return error(str(e), 500)
 

def login_user(email: str, password: str):
    if not email or not password:
        return error("Email and password are required", 400)

    clean_email = email.strip().lower()
    clean_password = str(password).strip()

    response = login_table.scan()
    items = response.get("Items", [])

    print("ALL USERS:", items)
    print("INPUT EMAIL:", repr(clean_email))

    user = None

    for u in items:
        try:
            parsed = json.loads(u.get("email"))

            print("PARSED:", parsed)

            if parsed.get("email", "").strip().lower() == clean_email:
                user = parsed
                break

        except Exception as e:
            print("PARSE ERROR:", e)    

    print("FOUND USER:", user)


    if not user or str(user.get("password")).strip() != clean_password:
        return error("email or password is invalid", 401)

    return success({
        "email": user.get("email"),
        "user_name": user.get("user_name")
    })


def register_user(email: str, user_name: str, password: str):
    if not email or not user_name or not password:
        return error("Email, username and password are required", 400)

    existing = login_table.get_item(Key={"email": email}).get("Item")

    if existing:
        return error("The email already exists", 409)

    item = {
        "email": email,
        "user_name": user_name,
        "password": password
    }

    login_table.put_item(Item=item)

    return success({
        "message": "User registered successfully",
        "email": email
    }, 201)


def get_subscriptions(email: str):
    if not email:
        return error("Email is required", 400)

    response = subscriptions_table.query(
        KeyConditionExpression=Key("email").eq(email)
    )

    return success({"items": response.get("Items", [])})


def add_subscription(email: str, song: dict):
    if not email:
        return error("Email is required", 400)

    if not song:
        return error("Song is required", 400)

    required = ["title", "artist", "year", "album"]

    for field in required:
        if not song.get(field):
            return error(f"Missing song field: {field}", 400)

    song_id = song.get("song_id") or make_song_id(song)

    item = {
        "email": email,
        "song_id": song_id,
        "title": song.get("title"),
        "artist": song.get("artist"),
        "year": str(song.get("year")),
        "album": song.get("album"),
        "img_url": song.get("img_url") or song.get("image_url", "")
    }

    subscriptions_table.put_item(Item=item)

    return success({
        "message": "Subscription added",
        "item": item
    }, 201)


def remove_subscription(email: str, song_id: str):
    if not email or not song_id:
        return error("Email and song_id are required", 400)

    subscriptions_table.delete_item(
        Key={
            "email": email,
            "song_id": song_id
        }
    )

    return success({"message": "Subscription removed"})
