from unittest.mock import patch


@patch("backend.app.get_subscriptions")
def test_get_subscriptions(mock_subs, client):

    mock_subs.return_value = {
        "statusCode": 200,
        "subscriptions": []
    }

    response = client.get(
        "/subscriptions?email=test@gmail.com"
    )

    assert response.status_code == 200

    data = response.get_json()

    assert "subscriptions" in data