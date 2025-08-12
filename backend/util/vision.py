import numpy as np
from constants.brick_info import LEGO_COLORS
from cv2 import imencode
from base64 import b64encode
from requests import post


# --- Mean color (round, then clamp) ---
def mean_rgb(arr: np.ndarray) -> np.ndarray:
    arr = arr.reshape(-1, 3)
    if arr.size == 0:
        return np.array([255, 255, 255], dtype=np.uint8)
    m = np.rint(arr.astype(np.float32).mean(axis=0))  # round, not floor
    return np.clip(m, 0, 255).astype(np.uint8)


# --- Palette building helpers ---
_EXCLUDE_PREFIXES = (
    "Trans-",
    "Glitter",
    "Chrome",
    "Pearl",
    "Metallic",
    "Modulex",
    "HO ",
    "Duplo",
    "Two-tone",
    "Opal",
    "Vintage",
    "Speckle",
)


def _build_palette(lego_colors, *, exclude_finishes=True):
    if exclude_finishes:
        pool = [
            c
            for c in lego_colors
            if c["id"] != 9999
            and not any(c["name"].startswith(p) for p in _EXCLUDE_PREFIXES)
        ]
    else:
        pool = [c for c in lego_colors if c["id"] != 9999]
    pal_rgb = np.array([c["rgb"] for c in pool], dtype=np.uint8)
    return pal_rgb, pool


# sRGB -> Lab (D65). Vectorized, fast enough for small palettes.
def _srgb_to_linear(c):
    c = c / 255.0
    a = 0.055
    return np.where(c <= 0.04045, c / 12.92, ((c + a) / (1 + a)) ** 2.4)


def _rgb_to_lab(rgb_uint8: np.ndarray) -> np.ndarray:
    rgb = rgb_uint8.astype(np.float32)
    lin = _srgb_to_linear(rgb)

    M = np.array(
        [
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041],
        ],
        dtype=np.float32,
    )
    XYZ = lin @ M.T

    Xn, Yn, Zn = 0.95047, 1.00000, 1.08883
    x = XYZ[..., 0] / Xn
    y = XYZ[..., 1] / Yn
    z = XYZ[..., 2] / Zn

    eps = 216 / 24389
    kappa = 24389 / 27

    def f(t):
        return np.where(t > eps, np.cbrt(t), (kappa * t + 16) / 116)

    fx, fy, fz = f(x), f(y), f(z)
    L = 116 * fy - 16
    a = 500 * (fx - fy)
    b = 200 * (fy - fz)
    return np.stack([L, a, b], axis=-1).astype(np.float32)


# --- Closest color (ΔE in Lab; safe types; optional BGR) ---
# Precompute once (solid colors only by default)
_LEGO_PALETTE_RGB, _LEGO_META = _build_palette(LEGO_COLORS, exclude_finishes=True)
_LEGO_PALETTE_LAB = _rgb_to_lab(_LEGO_PALETTE_RGB)


def closest_lego_color(
    rgb: np.ndarray, assume_bgr: bool = False, use_lab: bool = True
) -> dict:
    v = np.asarray(rgb, dtype=np.uint8).reshape(3)
    if assume_bgr:
        v = v[::-1]  # BGR -> RGB

    if use_lab:
        lab = _rgb_to_lab(v[np.newaxis, :])[0]
        diff = _LEGO_PALETTE_LAB - lab
        dist2 = np.einsum("ij,ij->i", diff, diff)  # ΔE76^2
    else:
        # Safe RGB Euclidean (no uint8 wrap)
        diff = _LEGO_PALETTE_RGB.astype(np.int16) - v.astype(np.int16)
        dist2 = np.einsum("ij,ij->i", diff, diff)

    return _LEGO_META[int(np.argmin(dist2))]


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

    # Clamp bbox to image bounds
    h, w = image.shape[:2]
    left = max(0, left)
    upper = max(0, upper)
    right = min(w, right)
    lower = min(h, lower)

    if right <= left or lower <= upper:
        raise ValueError("Invalid crop coordinates (zero area).")

    # Center of the (clamped) bbox
    cx = (left + right) // 2
    cy = (upper + lower) // 2

    # Build a 3x3 window around the center, clamped to the image
    x0 = max(0, cx - 1)
    x1 = min(w - 1, cx + 1)
    y0 = max(0, cy - 1)
    y1 = min(h - 1, cy + 1)

    patch = image[y0 : y1 + 1, x0 : x1 + 1]

    if patch.size == 0:
        mean_color = np.array([255, 255, 255], dtype=np.uint8)
    else:
        # Average over the 3x3 region; round to nearest uint8
        mean_color = np.rint(patch.reshape(-1, 3).mean(axis=0)).astype(np.uint8)

    hex_color = "#%02x%02x%02x" % tuple(int(c) for c in mean_color)
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
