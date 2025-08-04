import os
import json
from flask import Blueprint, jsonify, request
from constants.general import RECIPES_DIR
from constants.brick_info import LEGO_COLORS, LEGO_CATEGORIES

recipes_bp = Blueprint("recipes", __name__, url_prefix="/api/recipes")
colors_bp = Blueprint("colors", __name__, url_prefix="/api/colors")

RECIPE_DIR = os.path.join(os.path.dirname(__file__), "..", "recipes")
os.makedirs(RECIPE_DIR, exist_ok=True)


@recipes_bp.route("/", methods=["POST"])
def upload_or_update_recipe():
    try:
        data = request.get_json()
        name = data.get("name", "").strip()
        bins = data.get("bins", [])

        if not name:
            return jsonify({"error": "Missing recipe name."}), 400

        filename = os.path.join(RECIPE_DIR, f"{name}.json")
        js_content = f"{json.dumps({'name': name, 'bins': bins}, indent=2)}"

        with open(filename, "w") as f:
            f.write(js_content)

        return jsonify({"status": "success", "message": f"Recipe '{name}' saved."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@recipes_bp.route("/", methods=["GET"])
def get_recipe_names():
    if not os.path.exists(RECIPES_DIR):
        return jsonify([])
    files = [f for f in os.listdir(RECIPES_DIR) if f.lower().endswith(".json")]
    names = [os.path.splitext(f)[0] for f in files]
    return jsonify(names)


@recipes_bp.route("/<recipe_name>", methods=["GET"])
def get_recipe(recipe_name: str):
    path = os.path.join(RECIPES_DIR, f"{recipe_name}.json")
    if not os.path.exists(path):
        return jsonify({"error": "Recipe not found"}), 404
    with open(path) as f:
        recipe = json.load(f)
    return jsonify(recipe)


@recipes_bp.route("/colors", methods=["GET"])
def get_colors():
    def rgb_to_hex(rgb):
        return "#{:02X}{:02X}{:02X}".format(*rgb)

    colors = [
        {"name": color["name"], "hex": rgb_to_hex(color["rgb"])}
        for color in LEGO_COLORS
        if color.get("name") and color.get("rgb")
    ]
    return jsonify(colors)


@recipes_bp.route("/categories", methods=["GET"])
def get_categories():
    return jsonify(LEGO_CATEGORIES)
