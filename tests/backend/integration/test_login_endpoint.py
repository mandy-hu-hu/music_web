from unittest.mock import patch


@patch("backend.app.login_user")
def test_login_endpoint(mock_login, client):

    mock_login.return_value = {
        "statusCode": 200,
        "message": "login success"
    }

    response = client.post(
        "/login",
        json={
            "email": "test@gmail.com",
            "password": "123456"
        }
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["message"] == "login success"