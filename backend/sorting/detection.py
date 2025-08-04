import imageio.v3 as iio
import cv2
from threading import Thread, current_thread
from logging import getLogger
import numpy as np
from os.path import exists
import time

from constants.general import (
    BRICK_DISTANCE_MARGIN,
    CV_GREEN_COLOR,
    DETECTION_FRAME_RESIZED_SHAPE,
    MINIMUM_BRICK_SIZE_PIXELS,
    MINIMUM_FRAMES_BETWEEN_PIECES,
    MOG2_SUBTRACTOR_HISTORY,
    MOG2_SUBTRACTOR_VARIANCE_THRESHOLD,
    NOISE_REDUCTION_KERNEL_SIZE,
)
from apis.detection_api import notify_clients
from util.vision import (
    expand_bbox,
    handle_detected_piece,
)


class Detection:
    def __init__(
        self,
        video_source: int | str = 0,
        on_piece_detected: callable = None,
        preprocess: callable = None,
        debug: bool = False,
    ):
        self.video_source = video_source
        self.on_piece_detected = on_piece_detected
        self.preprocess = preprocess
        self.debug = debug
        self.running = False
        self.reader = None
        self.thread = None
        self.latest_result = None
        self.logger = getLogger("Detection")

        self.det_shape = DETECTION_FRAME_RESIZED_SHAPE
        self.margin = BRICK_DISTANCE_MARGIN
        self.area_thresh = MINIMUM_BRICK_SIZE_PIXELS

        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=MOG2_SUBTRACTOR_HISTORY,
            varThreshold=MOG2_SUBTRACTOR_VARIANCE_THRESHOLD,
            detectShadows=False,
        )
        self.kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT, NOISE_REDUCTION_KERNEL_SIZE
        )

    def start(self) -> None:
        if self.running:
            self.logger.warning("Detection already running.")
            return
        self.logger.info(f"Starting detection on source: {self.video_source}")
        print(f"[start] Trying to open video: {self.video_source}")
        print("[start] File exists:", exists(self.video_source))

        if not exists(self.video_source):
            print("[start] Video source does not exist")
            return

        print("[start] Creating reader with imageio")
        self.reader = iio.imiter(self.video_source)
        print("[start] Reader created")
        self.running = True
        self.frame_interval = 1.0 / 30
        self.thread = Thread(target=self._process_loop, daemon=True)
        self.thread.start()
        print("[start] Detection thread started")

    def stop(self) -> None:
        self.logger.info("Stopping detection.")
        self.running = False
        if self.thread is not None and current_thread() != self.thread:
            self.thread.join()
        if self.debug:
            cv2.destroyWindow("Detection Debug View")
            cv2.destroyWindow("Detection Mask")

    def _process_loop(self) -> None:
        print("[_process_loop] Entered loop")
        sent_this_piece = False
        no_piece_counter = 0
        NO_PIECE_FRAMES = MINIMUM_FRAMES_BETWEEN_PIECES

        try:
            for frame in self.reader:
                # print("[_process_loop] Got new frame")
                if not self.running:
                    print("[_process_loop] Stopped running, exiting loop")
                    break
                frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                original_frame = frame.copy()
                processed_frame = self.preprocess(frame) if self.preprocess else frame
                detection_frame = cv2.resize(processed_frame, self.det_shape)

                detected, bbox = self.detect_lego(detection_frame)
                print(f"[_process_loop] Detected: {detected}, BBox: {bbox}")

                fg_mask = self.bg_subtractor.apply(detection_frame)
                mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, self.kernel)

                if self.debug:
                    debug_frame = detection_frame.copy()
                    if detected and bbox:
                        x, y, w, h = bbox
                        cv2.rectangle(
                            debug_frame, (x, y), (x + w, y + h), CV_GREEN_COLOR, 2
                        )
                    cv2.imshow("Detection Debug View", debug_frame)
                    cv2.imshow("Detection Mask", mask)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        self.logger.info("Quit by user in debug window.")
                        break

                if detected and bbox and not sent_this_piece:
                    print("[_process_loop] Lego piece centered — sending crop")
                    sent_this_piece = True
                    no_piece_counter = 0

                    scale_x = original_frame.shape[1] / detection_frame.shape[1]
                    scale_y = original_frame.shape[0] / detection_frame.shape[0]
                    x, y, w, h = bbox
                    orig_bbox = (
                        int(x * scale_x),
                        int(y * scale_y),
                        int(w * scale_x),
                        int(h * scale_y),
                    )
                    x0, y0, w0, h0 = expand_bbox(
                        *orig_bbox, original_frame.shape, margin=1.0
                    )
                    crop = original_frame[y0 : y0 + h0, x0 : x0 + w0]
                    if self.on_piece_detected:
                        print("[_process_loop] Calling on_piece_detected")
                        self.on_piece_detected(crop)

                elif not detected:
                    if sent_this_piece:
                        no_piece_counter += 1
                        if no_piece_counter >= NO_PIECE_FRAMES:
                            sent_this_piece = False
                            no_piece_counter = 0
                time.sleep(self.frame_interval)
        except Exception as e:
            self.logger.error(f"Error reading video: {e}")
            print(f"[_process_loop] Exception: {e}")

        self.logger.info("Exiting detection loop.")
        print("[_process_loop] Exiting loop")
        self.stop()
        self.latest_result = None

    def detect_lego(
        self, frame: np.ndarray
    ) -> tuple[bool, tuple[int, int, int, int] | None]:
        fg_mask = self.bg_subtractor.apply(frame)
        mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, self.kernel)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        best_bbox = None
        best_area = 0
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            area = w * h
            if area > self.area_thresh and area > best_area:
                best_bbox = (x, y, w, h)
                best_area = area

        if best_bbox:
            x, y, w, h = best_bbox
            width, height = frame.shape[1], frame.shape[0]
            if (
                x > self.margin
                and y > self.margin
                and x + w < width - self.margin
                and y + h < height - self.margin
            ):
                print("[detect_lego] Found valid bounding box")
                return True, best_bbox

        return False, None

    def set_on_piece_detected(self, callback: callable) -> None:
        self.on_piece_detected = callback

    def handle_piece_detected(self, cropped_frame: np.ndarray):
        print("[handle_piece_detected] Calling handle_detected_piece")
        self.latest_result = handle_detected_piece(cropped_frame)
        print("[handle_piece_detected] Result:", self.latest_result)


# backend/sorting/detection_manager.py
from threading import Event


class DetectionManager:
    """
    Description:
        Manages running Detection objects on a playlist of videos, looping infinitely until stopped.
    """

    def __init__(self, video_paths: list[str], detection_class, on_detected):
        self.video_paths = video_paths
        self.detection_class = detection_class
        self.on_detected = on_detected
        self._thread = None
        self._stop_event = Event()
        self.latest_result = None
        self.current_video_idx = 0
        self._custom_video_source = None
        self._custom_callback = None

    def start(self, video_source=None, on_piece_detected=None):
        """
        Description:
            Starts the detection loop, optionally with a video_source and a callback.
        Parameters:
            video_source (int|str|None): Override the video source for this run (otherwise uses playlist).
            on_piece_detected (callable|None): Optional per-run callback.
        """
        self._custom_video_source = video_source
        self._custom_callback = on_piece_detected
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2)
        self._thread = None

    def _run_loop(self):
        video_path = (
            self._custom_video_source
            if self._custom_video_source is not None
            else self.video_paths[self.current_video_idx]
        )
        callback = (
            self._custom_callback
            if self._custom_callback is not None
            else self.on_detected
        )
        self._run_detection_on_video(video_path, callback)
        self._custom_video_source = None
        self._custom_callback = None

    def _run_detection_on_video(self, video_path, callback):
        from sorting.detection import Detection

        def wrapped_callback(cropped_frame):
            print("[DetectionManager] Running detection callback")
            result = handle_detected_piece(cropped_frame)
            self.latest_result = result
            notify_clients(self.latest_result)

            if callback:
                callback(cropped_frame)

        det = Detection(
            video_source=video_path, on_piece_detected=wrapped_callback, debug=False
        )
        det.start()
        if det.thread is not None:
            det.thread.join()
            return "ok"
        else:
            print(f"[DetectionManager] Skipping video (failed to open): {video_path}")
            return "failed_to_open"
