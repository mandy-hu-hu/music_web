import boto3
from botocore.exceptions import ClientError

REGION = "us-east-1"
TABLE_NAME = "login"

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)

users = [
    {"email": "s1234561@student.rmit.edu.au", "user_name": "user1", "password": "123"},
    {"email": "s1234562@student.rmit.edu.au", "user_name": "user2", "password": "123"},
    {"email": "s1234563@student.rmit.edu.au", "user_name": "user3", "password": "123"},
    {"email": "s1234564@student.rmit.edu.au", "user_name": "user4", "password": "123"},
    {"email": "s1234565@student.rmit.edu.au", "user_name": "user5", "password": "123"},
    {"email": "s1234566@student.rmit.edu.au", "user_name": "user6", "password": "123"},
    {"email": "s1234567@student.rmit.edu.au", "user_name": "user7", "password": "123"},
    {"email": "s1234568@student.rmit.edu.au", "user_name": "user8", "password": "123"},
    {"email": "s1234569@student.rmit.edu.au", "user_name": "user9", "password": "123"},
    {"email": "s1234570@student.rmit.edu.au", "user_name": "user10", "password": "123"},
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