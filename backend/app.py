import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from services import query_music, login_user, register_user, get_subscriptions, add_subscription, remove_subscription

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://rmit-a2-group54-music-web.s3-website-us-east-1.amazonaws.com"
        ],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})


def send(result):
    status = result.get("statusCode", 200)
    body = {k: v for k, v in result.items() if k != "statusCode"}
    return jsonify(body), status


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "message": "Backend is running"}), 200


@app.route("/music", methods=["GET"])
def music():
    result = query_music(
        title=request.args.get("title"),
        artist=request.args.get("artist"),
        year=request.args.get("year"),
        album=request.args.get("album")
    )
    return send(result)


@app.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}

    result = login_user(
        email=body.get("email"),
        password=body.get("password")
    )

    return send(result)


@app.route("/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}

    result = register_user(
        email=body.get("email"),
        user_name=body.get("user_name"),
        password=body.get("password")
    )

    return send(result)


@app.route("/subscriptions", methods=["GET"])
def subscriptions_get():
    result = get_subscriptions(
        email=request.args.get("email")
    )

    return send(result)


@app.route("/subscriptions", methods=["POST"])
def subscriptions_post():
    body = request.get_json(silent=True) or {}

    result = add_subscription(
        email=body.get("email"),
        song=body.get("song", {})
    )

    return send(result)


@app.route("/subscriptions", methods=["DELETE"])
def subscriptions_delete():
    body = request.get_json(silent=True) or {}

    result = remove_subscription(
        email=body.get("email"),
        song_id=body.get("song_id")
    )

    return send(result)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    app.run(host="0.0.0.0", port=port, debug=debug)