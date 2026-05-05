import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('music')

with open('../2026a2_songs.json') as f:
    data = json.load(f)

for song in data['songs']:
    table.put_item(
        Item={
            'title': song['title'],
            'artist': song['artist'],
            'year': str(song['year']),
            'album': song['album'],
            'image_url': song['img_url']
        }
    )

print("Upload complete")
