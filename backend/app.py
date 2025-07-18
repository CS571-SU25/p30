from flask import Flask
from flask_cors import CORS
from apis.color_detect_api import color_api
from apis.recipes_api import recipes_bp

app = Flask(__name__)
CORS(app)

# Color Detection
app.register_blueprint(color_api)

# Recipes
app.register_blueprint(recipes_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
