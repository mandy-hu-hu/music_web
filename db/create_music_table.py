import boto3
from botocore.exceptions import ClientError

REGION = "us-east-1"
TABLE_NAME = "music"

dynamodb = boto3.resource("dynamodb", region_name=REGION)

try:
    table = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {"AttributeName": "artist", "KeyType": "HASH"},
            {"AttributeName": "song_id", "KeyType": "RANGE"}
        ],
        AttributeDefinitions=[
            {"AttributeName": "artist", "AttributeType": "S"},
            {"AttributeName": "song_id", "AttributeType": "S"},
            {"AttributeName": "year", "AttributeType": "S"},
            {"AttributeName": "title", "AttributeType": "S"}
        ],
        LocalSecondaryIndexes=[
            {
                "IndexName": "artist-year-index",
                "KeySchema": [
                    {"AttributeName": "artist", "KeyType": "HASH"},
                    {"AttributeName": "year", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "title-artist-index",
                "KeySchema": [
                    {"AttributeName": "title", "KeyType": "HASH"},
                    {"AttributeName": "artist", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"},
                "ProvisionedThroughput": {
                    "ReadCapacityUnits": 5,
                    "WriteCapacityUnits": 5
                }
            }
        ],
        ProvisionedThroughput={
            "ReadCapacityUnits": 5,
            "WriteCapacityUnits": 5
        }
    )

    table.wait_until_exists()
    print("music table created successfully")

except ClientError as e:
    if e.response["Error"]["Code"] == "ResourceInUseException":
        print("music table already exists")
    else:
        raise
