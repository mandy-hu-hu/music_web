import json

from services import (
    query_music,
    login_user,
    register_user,
    get_subscriptions,
    add_subscription,
    remove_subscription,
)


CORS_HEADERS = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",  # Replace with S3/CloudFront URL for final security
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
}


def response(result):
    status = result.get("statusCode", 200)
    body = {k: v for k, v in result.items() if k != "statusCode"}

    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body),
    }


def parse_body(event):
    try:
        return json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return {}


def lambda_handler(event, context):
    method = event.get("httpMethod", "")
    path = event.get("path", "")
    query = event.get("queryStringParameters") or {}
    body = parse_body(event)

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True}),
        }

    if method == "GET" and path.endswith("/health"):
        return response({
            "ok": True,
            "statusCode": 200,
            "data": {"message": "Lambda backend is running"}
        })

    if method == "GET" and path.endswith("/music"):
        return response(query_music(
            title=query.get("title"),
            artist=query.get("artist"),
            year=query.get("year"),
            album=query.get("album"),
        ))

    if method == "POST" and path.endswith("/login"):
        return response(login_user(
            email=body.get("email"),
            password=body.get("password"),
        ))

    if method == "POST" and path.endswith("/register"):
        return response(register_user(
            email=body.get("email"),
            user_name=body.get("user_name"),
            password=body.get("password"),
        ))

    if method == "GET" and path.endswith("/subscriptions"):
        return response(get_subscriptions(
            email=query.get("email"),
        ))

    if method == "POST" and path.endswith("/subscriptions"):
        return response(add_subscription(
            email=body.get("email"),
            song=body.get("song", {}),
        ))

    if method == "DELETE" and path.endswith("/subscriptions"):
        return response(remove_subscription(
            email=body.get("email"),
            song_id=body.get("song_id"),
        ))

    return response({
        "ok": False,
        "statusCode": 404,
        "error": f"No route for {method} {path}"
    })