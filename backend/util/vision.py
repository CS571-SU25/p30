import numpy as np
from constants.colors import LEGO_COLORS


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
