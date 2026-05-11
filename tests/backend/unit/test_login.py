def test_login_mock_data(dynamodb):

    table = dynamodb.Table("login")

    response = table.put_item(
        Item={
            "email": "test@gmail.com",
            "password": "123456"
        }
    )

    assert response["ResponseMetadata"]["HTTPStatusCode"] == 200