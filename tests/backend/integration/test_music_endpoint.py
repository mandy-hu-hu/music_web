from unittest.mock import patch


@patch("backend.app.query_music")
def test_music_endpoint(mock_query, client):

    mock_query.return_value = {
        "statusCode": 200,
        "songs": [
            {
                "title": "Love Story"
            }
        ]
    }

    response = client.get(
        "/music?artist=Taylor Swift"
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data["songs"]) == 1