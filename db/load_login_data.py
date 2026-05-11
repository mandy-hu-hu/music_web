import boto3
from botocore.exceptions import ClientError

REGION = "us-east-1"
TABLE_NAME = "login"

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

users = [
    {"email": "s31234561@student.rmit.edu.au", "user_name": "user1", "password": "123456"},
    {"email": "s31234562@student.rmit.edu.au", "user_name": "user2", "password": "234567"},
    {"email": "s31234563@student.rmit.edu.au", "user_name": "user3", "password": "345678"},
    {"email": "s31234564@student.rmit.edu.au", "user_name": "user4", "password": "456789"},
    {"email": "s31234565@student.rmit.edu.au", "user_name": "user5", "password": "567890"},
    {"email": "s31234566@student.rmit.edu.au", "user_name": "user6", "password": "678901"},
    {"email": "s31234567@student.rmit.edu.au", "user_name": "user7", "password": "789012"},
    {"email": "s31234568@student.rmit.edu.au", "user_name": "user8", "password": "890123"},
    {"email": "s31234569@student.rmit.edu.au", "user_name": "user9", "password": "901234"},
    {"email": "s31234570@student.rmit.edu.au", "user_name": "user0", "password": "012345"},
]

for user in users:
    try:
        table.put_item(
            Item=user,
            ConditionExpression="attribute_not_exists(email)"
        )
        print(f"Inserted: {user['email']}")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            print(f"Duplicate skipped: {user['email']}")
        else:
            raise

print("10 login users inserted successfully")