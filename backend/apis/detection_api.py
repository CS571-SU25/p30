from flask import (
    Blueprint,
    request,
    jsonify,
    Response,
    current_app,
    stream_with_context,
    send_file,
)
from PIL import Image
import numpy as np
from util.vision import mean_rgb, closest_lego_color
import io
from base64 import b64decode
from queue import Queue
import threading
import json

detection_api = Blueprint("detection_api", __name__, url_prefix="/api/detection")


# -------------------------------
# Color Detection Endpoint
# -------------------------------
@detection_api.route("/detect_color", methods=["POST"])
def detect_color() -> Response:
    file = request.files["image"]
    left = float(request.form["left"])
    upper = float(request.form["upper"])
    right = float(request.form["right"])
    lower = float(request.form["lower"])

    left, upper, right, lower = map(int, map(round, [left, upper, right, lower]))
    img = Image.open(file).convert("RGB")
    cropped = img.crop((left, upper, right, lower))
    arr = np.array(cropped)

    mean_color = np.array([255, 255, 255]) if arr.size == 0 else mean_rgb(arr)
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


# -------------------------------
# SSE and Detection Control
# -------------------------------
# Shared state
client_queues = []
sse_ready = threading.Event()
latest_result_cache = None


@detection_api.route("/start", methods=["POST"])
def start_detection():
    payload = request.get_json(force=True)
    video_source = payload.get("video_source", None)

    detection_manager = current_app.config["DETECTION_MANAGER"]

    # Wait for client to connect
    current_app.logger.info("Waiting for SSE client...")
    connected = sse_ready.wait(timeout=3)
    if not connected:
        current_app.logger.warning("No SSE client connected in time.")

    detection_manager.start(video_source=video_source)
    return jsonify({"status": "started", "source": video_source})


@detection_api.route("/stop", methods=["POST"])
def stop_detection():
    detection_manager = current_app.config["DETECTION_MANAGER"]
    detection_manager.stop()

    while client_queues:
        q = client_queues.pop()
        try:
            while True:
                q.get_nowait()
        except Exception:
            pass

    global latest_result_cache
    latest_result_cache = None
    sse_ready.clear()

    current_app.logger.info("Queues cleared and SSE state reset.")

    return jsonify({"stopped": True})


@detection_api.route("/stream")
def stream():
    q = Queue()
    client_queues.append(q)
    sse_ready.set()

    def event_stream():
        if latest_result_cache:
            q.put(latest_result_cache)

        while True:
            data = q.get()
            yield f"data: {json.dumps(data)}\n\n"

    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    }

    return Response(stream_with_context(event_stream()), headers=headers)


def notify_clients(data):
    global latest_result_cache
    latest_result_cache = data
    for q in client_queues:
        q.put(data)


# -------------------------------
# Latest Result & Image Fetching
# -------------------------------
@detection_api.route("/latest", methods=["GET"])
def get_latest_detection():
    detection_manager = current_app.config.get("DETECTION_MANAGER")
    if detection_manager and hasattr(detection_manager, "latest_result"):
        latest = detection_manager.latest_result
        if latest is None:
            return Response(status=204)
        return jsonify({"image_url": "/api/detection/image", "part_info": latest})
    return Response(status=204)


@detection_api.route("/image", methods=["GET"])
def get_detection_image():
    detection_manager = current_app.config.get("DETECTION_MANAGER")
    if detection_manager and hasattr(detection_manager, "latest_result"):
        latest = detection_manager.latest_result
        if latest and "image" in latest:
            try:
                img_data = b64decode(latest["image"])
                return send_file(io.BytesIO(img_data), mimetype="image/jpeg")
            except Exception as e:
                current_app.logger.error(f"Failed to decode image: {e}")
                return Response("Invalid image", status=500)
    return Response(status=204)
