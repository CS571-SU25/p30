import os
import json
from flask import Blueprint, jsonify
from constants.general import RECIPES_DIR

recipes_bp = Blueprint("recipes", __name__, url_prefix="/api/recipes")


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
