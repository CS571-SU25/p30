import numpy as np
from constants.brick_info import LEGO_COLORS
from cv2 import imencode
from base64 import b64encode
from requests import post


def mean_rgb(arr) -> np.ndarray:
    arr = arr.reshape(-1, 3)
    if arr.size == 0:
        return np.array([255, 255, 255])  # fallback to white
    return arr.mean(axis=0).astype(int)


def closest_lego_color(rgb) -> dict[str, int]:
    def dist(c) -> int:
        return sum((a - b) ** 2 for a, b in zip(c["rgb"], rgb))

    return min(LEGO_COLORS, key=dist)


def expand_bbox(
    x: int, y: int, w: int, h: int, frame_shape: list, margin=0.20
) -> tuple[int, int, int, int]:
    """
    Expand the bounding box by a margin (float: e.g. 0.20 = 20%).
    Ensures the box stays within frame boundaries.
    """
    cx = x + w // 2
    cy = y + h // 2
    # Determine how much to grow
    expand_w = int(w * (1 + margin))
    expand_h = int(h * (1 + margin))
    # New top-left
    new_x = max(0, cx - expand_w // 2)
    new_y = max(0, cy - expand_h // 2)
    # New bottom-right
    new_x2 = min(frame_shape[1], cx + expand_w // 2)
    new_y2 = min(frame_shape[0], cy + expand_h // 2)
    # New width and height
    new_w = new_x2 - new_x
    new_h = new_y2 - new_y
    return new_x, new_y, new_w, new_h


import cv2


def send_to_brickognize_api(image_np: np.ndarray) -> dict:
    try:
        print("[send_to_brickognize_api] Encoding image")
        # Convert color to RGB if needed
        if len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image_np

        # Encode to JPEG
        success, img_encoded = imencode(".jpg", image_rgb)
        if not success:
            raise ValueError("Failed to encode image as JPEG")

        # Correct field name is "query_image"
        files = {"query_image": ("image.jpg", img_encoded.tobytes(), "image/jpeg")}

        print("[send_to_brickognize_api] Sending request...")
        response = post("https://api.brickognize.com/predict/", files=files)
        print("[send_to_brickognize_api] Status:", response.status_code)
        response.raise_for_status()
        print(response.json())
        return response.json()

    except Exception as e:
        print(f"[send_to_brickognize_api] Error: {e}")
        return {}


def detect_color_from_array(
    image: np.ndarray, bbox: tuple[int, int, int, int]
) -> dict[str]:
    """
    Description:
        Detects the mean color and closest Lego color from a cropped region of the image.

    Parameters:
        image (np.ndarray): The input image (RGB as uint8).
        bbox (tuple[int, int, int, int]): (left, upper, right, lower) crop box.

    Returns:
        result (dict): Color analysis with mean_rgb, hex, lego_color info.
    """
    left, upper, right, lower = map(int, map(round, bbox))
    # Clamp to valid image region
    left = max(0, left)
    upper = max(0, upper)
    right = min(image.shape[1], right)
    lower = min(image.shape[0], lower)

    if right <= left or lower <= upper:
        raise ValueError("Invalid crop coordinates (zero area).")

    cropped = image[upper:lower, left:right]
    if cropped.size == 0:
        mean_color = np.array([255, 255, 255], dtype=np.uint8)
    else:
        mean_color = mean_rgb(cropped)

    hex_color = "#%02x%02x%02x" % tuple(mean_color)
    lego_color = closest_lego_color(mean_color)

    return {
        "mean_rgb": mean_color.tolist(),
        "hex": hex_color,
        "lego_color": lego_color["name"],
        "lego_color_id": lego_color["id"],
        "lego_color_rgb": lego_color["rgb"],
    }


def encode_image_to_base64(image: np.ndarray) -> str:
    _, img_bytes = imencode(".jpg", image)
    return b64encode(img_bytes.tobytes()).decode("utf-8")


def handle_detected_piece(frame: np.ndarray, bbox=None) -> dict:
    """
    Description:
        Runs Brickognize and color detection on the provided cropped frame.
        If bbox is given, will run color on that bbox region; else runs on full image.
    Parameters:
        frame (np.ndarray): Cropped image (BGR).
        bbox (tuple[int, int, int, int] or None): Crop box for color detection (left, upper, right, lower).
    Returns:
        dict: Results merged from Brickognize, color, and preview image.
    """
    try:
        # Send to Brickognize
        brickognize_data = send_to_brickognize_api(frame)
    except Exception as e:
        brickognize_data = {"brickognize_error": str(e)}

    # For color detection, convert to RGB if not already
    img_rgb = frame
    if frame.shape[2] == 3 and np.any(frame[..., 0] != frame[..., 2]):  # Likely BGR
        try:
            from cv2 import cvtColor, COLOR_BGR2RGB

            img_rgb = cvtColor(frame, COLOR_BGR2RGB)
        except ImportError:
            pass  # Already RGB

    # Use full frame or passed bbox
    if bbox:
        # bbox = (left, upper, right, lower)
        color_data = detect_color_from_array(img_rgb, bbox)
    else:
        color_data = detect_color_from_array(
            img_rgb, (0, 0, img_rgb.shape[1], img_rgb.shape[0])
        )

    # For UI, optionally return an encoded preview
    preview_base64 = encode_image_to_base64(frame)
    result = {
        **brickognize_data,
        **color_data,
        "img_base64": preview_base64,
    }
    return result
