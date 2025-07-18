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
