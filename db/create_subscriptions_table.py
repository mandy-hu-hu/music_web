import boto3
from botocore.exceptions import ClientError

REGION = "us-east-1"
TABLE_NAME = "subscriptions"

dynamodb = boto3.resource("dynamodb", region_name=REGION)

try:
    table = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {"AttributeName": "email", "KeyType": "HASH"},
            {"AttributeName": "song_id", "KeyType": "RANGE"}
        ],
        AttributeDefinitions=[
            {"AttributeName": "email", "AttributeType": "S"},
            {"AttributeName": "song_id", "AttributeType": "S"}
        ],
        ProvisionedThroughput={
            "ReadCapacityUnits": 5,
            "WriteCapacityUnits": 5
        }
    )

    table.wait_until_exists()
    print("subscriptions table created successfully")

except ClientError as e:
    if e.response["Error"]["Code"] == "ResourceInUseException":
        print("subscriptions table already exists")
    else:
        raise