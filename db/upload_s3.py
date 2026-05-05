import boto3
import json
import requests

s3 = boto3.client('s3')
bucket_name = 'rmit-a2-group54-music-images'

with open('../2026a2_songs.json') as f:
    data = json.load(f)

for song in data['songs']:
    url = song['img_url']
    filename = url.split('/')[-1]

    try:
        response = requests.get(url)
        s3.put_object(
            Bucket=bucket_name,
            Key=filename,
            Body=response.content
        )
        print(f"Uploaded: {filename}")
    except:
        print(f"Failed: {filename}")

print("All images uploaded")
