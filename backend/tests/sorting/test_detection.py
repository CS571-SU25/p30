from os.path import join, dirname, abspath
import sys

sys.path.insert(0, abspath(dirname(__file__) + "/../../.."))

# Insert backend directory into sys.path as the first path TODO: Dix imports
BACKEND_DIR = abspath(join(dirname(__file__), "../../"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


import pytest
import numpy as np
from sorting.detection import Detection


@pytest.mark.parametrize(
    "video_filename,expected_pieces",
    [
        (
            "test_video_0.mp4",
            {0: (243, 216), 1: (236, 216), 2: (236, 232), 3: (236, 208)},
        ),
        (
            "test_video_1.mp4",
            {
                0: (222, 328),
                1: (175, 128),
                2: (337, 312),
                3: (239, 216),
            },
        ),
    ],
)
def test_detection_piece_centers(
    video_filename: str, expected_pieces: dict[int, tuple[int, int]]
):
    """
    Description:
        Tests Detection for correct order and center of detected pieces in video.

    Parameters:
        video_filename (str): Path to test video.
        expected_pieces (dict[int, tuple[int, int]]): Detection index to expected center mapping.

    Returns:
        None
    """
    MAX_DISTANCE_ERROR_PIXELS = 10
    relative_path = join(dirname(__file__), "../test_videos", video_filename)
    video_path = abspath(relative_path)
    detected_centers = []

    def on_piece_detected(frame: np.ndarray):
        # Calculate crop center
        center_x = frame.shape[1] // 2
        center_y = frame.shape[0] // 2
        detected_centers.append((center_x, center_y))
        print(f"Detected piece center: ({center_x},{center_y})")

    det = Detection(
        video_source=video_path,
        on_piece_detected=on_piece_detected,
        debug=True,
    )
    det.start()
    det.thread.join()

    assert len(detected_centers) == len(expected_pieces), (
        f"Expected {len(expected_pieces)} pieces, but detected {len(detected_centers)}"
    )

    for idx, (exp_x, exp_y) in expected_pieces.items():
        det_x, det_y = detected_centers[idx]
        assert abs(det_x - exp_x) <= MAX_DISTANCE_ERROR_PIXELS, (
            f"Piece {idx}: X center mismatch (expected {exp_x}, got {det_x})"
        )
        assert abs(det_y - exp_y) <= MAX_DISTANCE_ERROR_PIXELS, (
            f"Piece {idx}: Y center mismatch (expected {exp_y}, got {det_y})"
        )
        print(
            f"Piece {idx} matched: Detected ({det_x},{det_y}), Expected ({exp_x},{exp_y})"
        )
