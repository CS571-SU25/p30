from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
from flask_cors import CORS
from constants.colors import LEGO_COLORS


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


# Helper: get mean RGB of ALL pixels (no white skipping)
def mean_rgb(arr):
    arr = arr.reshape(-1, 3)
    if arr.size == 0:
        return np.array([255, 255, 255])  # fallback to white
    return arr.mean(axis=0).astype(int)


def closest_lego_color(rgb):
    def dist(c):
        return sum((a - b) ** 2 for a, b in zip(c["rgb"], rgb))

    return min(LEGO_COLORS, key=dist)


@app.route("/detect_color", methods=["POST"])
def detect_color():
    file = request.files["image"]
    left = float(request.form["left"])
    upper = float(request.form["upper"])
    right = float(request.form["right"])
    lower = float(request.form["lower"])

    # Round to int for cropping (Pillow)
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
