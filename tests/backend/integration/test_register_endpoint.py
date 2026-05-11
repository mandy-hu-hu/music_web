from unittest.mock import patch


@patch("backend.app.register_user")
def test_register_endpoint(mock_register, client):

    mock_register.return_value = {
        "statusCode": 201,
        "message": "register success"
    }

    response = client.post(
        "/register",
        json={
            "email": "new@gmail.com",
            "user_name": "joyce",
            "password": "123456"
        }
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["message"] == "register success"