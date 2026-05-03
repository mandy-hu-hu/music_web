import json
import boto3
from botocore.exceptions import ClientError

REGION = "us-east-1"
TABLE_NAME = "music"

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

with open("2026a2_songs.json", "r", encoding="utf-8") as file:
    data = json.load(file)

songs = data["songs"]

inserted = 0
duplicates = 0

for song in songs:
    title = song["title"]
    artist = song["artist"]
    year = song["year"]
    album = song["album"]
    img_url = song["img_url"]

    song_id = f"{title}#{year}#{album}"

    item = {
        "artist": artist,
        "song_id": song_id,
        "title": title,
        "year": year,
        "album": album,
        "img_url": img_url
    }

    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(artist) AND attribute_not_exists(song_id)"
        )
        inserted += 1

    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            duplicates += 1
            print(f"Duplicate skipped: {artist} - {song_id}")
        else:
            raise

print("Import completed")
print(f"Inserted: {inserted}")
print(f"Duplicates skipped: {duplicates}")
