from flask import Flask
from flask_cors import CORS
from apis.color_detect_api import color_api

app = Flask(__name__)
CORS(app)

app.register_blueprint(color_api)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
