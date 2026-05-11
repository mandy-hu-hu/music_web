def test_query_music_mock_data(dynamodb):

    table = dynamodb.Table("music")

    table.put_item(
        Item={
            "title": "Love Story",
            "artist": "Taylor Swift",
            "album": "Fearless",
            "year": "2008"
        }
    )

    response = table.scan()

    assert len(response["Items"]) == 1