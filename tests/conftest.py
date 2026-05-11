import sys
import os

sys.path.insert(
    0,
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )
)

import pytest
import boto3
from moto import mock_aws

from backend.app import app


@pytest.fixture(scope="function")
def aws_credentials():

    import os

    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture(scope="function")
def dynamodb(aws_credentials):

    with mock_aws():

        dynamodb = boto3.resource(
            "dynamodb",
            region_name="us-east-1"
        )

        # login table
        dynamodb.create_table(
            TableName="login",
            KeySchema=[
                {
                    "AttributeName": "email",
                    "KeyType": "HASH"
                }
            ],
            AttributeDefinitions=[
                {
                    "AttributeName": "email",
                    "AttributeType": "S"
                }
            ],
            BillingMode="PAY_PER_REQUEST"
        )

        # music table
        dynamodb.create_table(
            TableName="music",
            KeySchema=[
                {
                    "AttributeName": "title",
                    "KeyType": "HASH"
                }
            ],
            AttributeDefinitions=[
                {
                    "AttributeName": "title",
                    "AttributeType": "S"
                }
            ],
            BillingMode="PAY_PER_REQUEST"
        )

        yield dynamodb


@pytest.fixture
def client():

    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client