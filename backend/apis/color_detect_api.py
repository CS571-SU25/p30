from flask import Blueprint, request, jsonify, Response
from PIL import Image
import numpy as np
from util.vision import mean_rgb, closest_lego_color


color_api = Blueprint("color_api", __name__)


@color_api.route("/detect_color", methods=["POST"])
def detect_color() -> Response:
    file = request.files["image"]
    left = float(request.form["left"])
    upper = float(request.form["upper"])
    right = float(request.form["right"])
    lower = float(request.form["lower"])

    # Round to int for cropping
    left, upper, right, lower = map(int, map(round, [left, upper, right, lower]))
    img = Image.open(file).convert("RGB")
    cropped = img.crop((left, upper, right, lower))
    arr = np.array(cropped)
    if arr.size == 0:
        mean_color = np.array([255, 255, 255])
    else:
        mean_color = mean_rgb(arr)

    mean_color = mean_rgb(arr)
    hex_color = "#%02x%02x%02x" % tuple(mean_color)
    lego_color = closest_lego_color(mean_color)

    return jsonify(
        {
            "mean_rgb": mean_color.tolist(),
            "hex": hex_color,
            "lego_color": lego_color["name"],
            "lego_color_id": lego_color["id"],
            "lego_color_rgb": lego_color["rgb"],
        }
    )
