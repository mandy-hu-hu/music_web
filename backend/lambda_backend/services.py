import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from config import (
    AWS_REGION,
    MUSIC_TABLE,
    LOGIN_TABLE,
    SUBSCRIPTIONS_TABLE,
    S3_BUCKET,
    PRESIGNED_URL_EXPIRES
)

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
music_table = dynamodb.Table(MUSIC_TABLE)
login_table = dynamodb.Table(LOGIN_TABLE)
subscriptions_table = dynamodb.Table(SUBSCRIPTIONS_TABLE)
s3 = boto3.client("s3", region_name=AWS_REGION)

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
        item["song_id"] = make_song_id(item)
        result.append(item)

    return add_presigned_image_urls(result)


def query_music(title=None, artist=None, year=None, album=None):
    try:
        title = title.strip() if title else None
        artist = artist.strip() if artist else None
        year = str(year).strip() if year else None
        album = album.strip() if album else None

        if not title and not artist and not year and not album:
            return error("At least one query field is required", 400)

        # 1. Artist + year -> use LSI
        if artist and year:
            response = music_table.query(
                IndexName="artist-year-index",
                KeyConditionExpression=Key("artist").eq(artist) & Key("year").eq(year)
            )
            items = response.get("Items", [])
            strategy = "Query using LSI artist-year-index"

        # 2. Artist -> use base table Query
        elif artist:
            response = music_table.query(
                KeyConditionExpression=Key("artist").eq(artist)
            )
            items = response.get("Items", [])
            strategy = "Query using base table artist key"

        # 3. Title -> use GSI
        elif title:
            response = music_table.query(
                IndexName="title-artist-index",
                KeyConditionExpression=Key("title").eq(title)
            )
            items = response.get("Items", [])
            strategy = "Query using GSI title-artist-index"

        # 4. Album only / year only -> Scan
        else:
            conditions = []

            if year:
                conditions.append(Attr("year").eq(year))
            if album:
                conditions.append(Attr("album").contains(album))

            filter_expr = conditions[0]
            for cond in conditions[1:]:
                filter_expr = filter_expr & cond

            response = music_table.scan(FilterExpression=filter_expr)
            items = response.get("Items", [])
            strategy = "Scan for non-key search"

        # Apply remaining AND filters after Query
        if title:
            items = [i for i in items if title.lower() in i.get("title", "").lower()]
        if artist:
            items = [i for i in items if artist.lower() in i.get("artist", "").lower()]
        if year:
            items = [i for i in items if str(i.get("year")) == year]
        if album:
            items = [i for i in items if album.lower() in i.get("album", "").lower()]

        # Fallback Scan for case-insensitive / partial searches where exact Query found nothing.
        if not items and (artist or title or album):
            conditions = []

            # Keep year filter in DynamoDB because year is exact and case is not an issue
            if year:
                conditions.append(Attr("year").eq(year))

            if conditions:
                filter_expr = conditions[0]
                for cond in conditions[1:]:
                    filter_expr = filter_expr & cond

                response = music_table.scan(FilterExpression=filter_expr)
            else:
                response = music_table.scan()

            items = response.get("Items", [])

            # Apply case-insensitive matching in Python
            if title:
                items = [i for i in items if title.lower() in i.get("title", "").lower()]
            if artist:
                items = [i for i in items if artist.lower() in i.get("artist", "").lower()]
            if year:
                items = [i for i in items if str(i.get("year")) == year]
            if album:
                items = [i for i in items if album.lower() in i.get("album", "").lower()]

            strategy = strategy + " then fallback Scan with Python case-insensitive filter"

        return success({
            "items": add_song_ids(items),
            "count": len(items),
            "strategy": strategy
        })

    except ClientError as e:
        return error(str(e), 500)


def login_user(email: str, password: str):
    if not email or not password:
        return error("Email and password are required", 400)

    response = login_table.get_item(Key={"email": email})
    user = response.get("Item")

    if not user or user.get("password") != password:
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

    items = response.get("Items", [])
    items = add_presigned_image_urls(items)

    return success({"items": items})


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
        "image_key": get_image_key(song)
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


def get_image_key(song: dict) -> str:
    """
    Converts original dataset image URL into S3 object key.
    Example:
    https://raw.githubusercontent.com/.../TaylorSwift.jpg
    -> TaylorSwift.jpg
    """
    if song.get("image_key"):
        return song["image_key"]

    url = song.get("img_url") or song.get("image_url") or ""
    return url.split("/")[-1] if url else ""


def add_presigned_image_urls(items):
    result = []

    for item in items:
        item = dict(item)

        image_key = get_image_key(item)
        item["image_key"] = image_key

        if image_key:
            item["img_url"] = s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": S3_BUCKET,
                    "Key": image_key,
                },
                ExpiresIn=PRESIGNED_URL_EXPIRES,
            )
        else:
            item["img_url"] = ""

        result.append(item)

    return result