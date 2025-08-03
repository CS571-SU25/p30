from flask import Flask
from flask_cors import CORS
from apis.detection_api import detection_api
from apis.recipes_api import recipes_bp
from sorting.detection import Detection, DetectionManager

app = Flask(__name__)
CORS(app)

TEST_VIDEO_DIR = "/app/tests/test_videos"
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# TEST_VIDEO_DIR = os.path.join(BASE_DIR, "tests", "test_videos")
# video_paths = [
#     os.path.join(TEST_VIDEO_DIR, "test_video_0.mp4"),
#     os.path.join(TEST_VIDEO_DIR, "test_video_1.mp4"),
# ]
video_paths = [
    f"{TEST_VIDEO_DIR}/test_video_0.mp4",
    f"{TEST_VIDEO_DIR}/test_video_1.mp4",
]
app.config["DETECTION_MANAGER"] = DetectionManager(
    video_paths=video_paths,
    detection_class=Detection,  # import your real Detection class
    on_detected=lambda result: None,  # you can fill in logic if needed
)

# Color Detection
app.register_blueprint(detection_api)

# Recipes
app.register_blueprint(recipes_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
