from cv2 import (
    VideoCapture,
    resize,
    imshow,
    waitKey,
    destroyWindow,
    createBackgroundSubtractorMOG2,
    getStructuringElement,
    MORPH_RECT,
    morphologyEx,
    MORPH_OPEN,
    findContours,
    RETR_EXTERNAL,
    CHAIN_APPROX_SIMPLE,
    boundingRect,
    rectangle,
)
from threading import Thread, current_thread
from logging import getLogger
import numpy as np

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
from util.vision import expand_bbox


class Detection:
    """
    Description:
        Automated Lego piece detection for conveyor-based sorting.
        Handles video capture, background subtraction, noise filtering, and robust piece detection.
        Designed for live camera or video file testing. When a Lego is fully in view, triggers callback with generous crop.

    Parameters:
        video_source (int | str): Camera index or path to video file.
        on_piece_detected (Callable[[np.ndarray], None]): Callback for when a Lego piece is detected. Receives cropped frame.
        preprocess (Callable[[np.ndarray], np.ndarray] | None): Optional preprocessing function (e.g., denoise).
        debug (bool): If True, shows OpenCV debug windows with live mask and detection view.

    """

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
        self.capture = None
        self.thread = None
        self.logger = getLogger("Detection")

        # Detection parameters
        self.det_shape = DETECTION_FRAME_RESIZED_SHAPE
        self.margin = BRICK_DISTANCE_MARGIN
        self.area_thresh = MINIMUM_BRICK_SIZE_PIXELS

        # Background subtraction setup
        self.bg_subtractor = createBackgroundSubtractorMOG2(
            history=MOG2_SUBTRACTOR_HISTORY,
            varThreshold=MOG2_SUBTRACTOR_VARIANCE_THRESHOLD,
            detectShadows=False,
        )
        self.kernel = getStructuringElement(MORPH_RECT, NOISE_REDUCTION_KERNEL_SIZE)

    def start(self) -> None:
        """
        Description:
            Starts video capture and detection thread.

        Returns:
            None
        """
        if self.running:
            self.logger.warning("Detection already running.")
            return
        self.logger.info(f"Starting detection on source: {self.video_source}")
        self.capture = VideoCapture(self.video_source)
        print("Video source:", self.video_source)
        if not self.capture.isOpened():
            self.logger.error(f"Could not open video source {self.video_source}")
            return
        self.running = True
        self.thread = Thread(target=self._process_loop, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        """
        Description:
            Stops detection and releases resources. Destroys OpenCV windows if debugging.

        Returns:
            None
        """
        self.logger.info("Stopping detection.")
        self.running = False
        if self.thread is not None and current_thread() != self.thread:
            self.thread.join()
        if self.capture is not None:
            self.capture.release()
        if self.debug:
            destroyWindow("Detection Debug View")
            destroyWindow("Detection Mask")

    def _process_loop(self) -> None:
        """
        Description:
            Main detection loop. Reads frames, applies detection, and triggers callback on new Lego pieces.
            Uses stateful logic to avoid duplicate triggers on the same part.

        Returns:
            None
        """
        sent_this_piece = False  # Only trigger once per piece
        no_piece_counter = 0
        NO_PIECE_FRAMES = MINIMUM_FRAMES_BETWEEN_PIECES

        while self.running:
            ret, frame = self.capture.read()
            if not self.debug:
                print(
                    f"Detection.read: ret={ret}, frame={None if frame is None else frame.shape}"
                )
            if not ret:
                self.logger.warning("Failed to read frame, stopping.")
                break

            original_frame = frame.copy()
            processed_frame = self.preprocess(frame) if self.preprocess else frame
            detection_frame = resize(processed_frame, self.det_shape)

            detected, bbox = self.detect_lego(detection_frame)

            # Show debug windows for mask and detection
            fg_mask = self.bg_subtractor.apply(detection_frame)
            mask = morphologyEx(fg_mask, MORPH_OPEN, self.kernel)

            if self.debug:
                debug_frame = detection_frame.copy()
                if detected and bbox:
                    x, y, w, h = bbox
                    rectangle(debug_frame, (x, y), (x + w, y + h), CV_GREEN_COLOR, 2)
                imshow("Detection Debug View", debug_frame)
                imshow("Detection Mask", mask)
                if waitKey(1) & 0xFF == ord("q"):
                    self.logger.info("Quit by user in debug window.")
                    break

            # Only trigger callback once per piece, when fully in FOV
            if detected and bbox and not sent_this_piece:
                self.logger.info("Lego piece detected (centered, will send crop).")
                sent_this_piece = True
                no_piece_counter = 0

                # Map bbox from detection_frame to original_frame
                scale_x = original_frame.shape[1] / detection_frame.shape[1]
                scale_y = original_frame.shape[0] / detection_frame.shape[0]
                x, y, w, h = bbox
                orig_bbox = (
                    int(x * scale_x),
                    int(y * scale_y),
                    int(w * scale_x),
                    int(h * scale_y),
                )
                # Generous crop using expand_bbox (margin=1.0 = 100% bigger)
                x0, y0, w0, h0 = expand_bbox(
                    *orig_bbox, original_frame.shape, margin=1.0
                )
                crop = original_frame[y0 : y0 + h0, x0 : x0 + w0]
                if self.on_piece_detected:
                    self.on_piece_detected(crop)

            elif not detected:
                # Reset flag only after enough frames with no piece
                if sent_this_piece:
                    no_piece_counter += 1
                    if no_piece_counter >= NO_PIECE_FRAMES:
                        sent_this_piece = False
                        no_piece_counter = 0

        self.logger.info("Exiting detection loop.")
        self.stop()

    def detect_lego(
        self, frame: np.ndarray
    ) -> tuple[bool, tuple[int, int, int, int] | None]:
        """
        Description:
            Detects presence of a Lego piece in the frame using background subtraction and contour filtering.

        Parameters:
            frame (np.ndarray): The detection-sized frame to analyze.

        Returns:
            detected (bool): True if a piece is detected and fully in view.
            bbox (tuple[int, int, int, int] | None): Bounding box (x, y, w, h) if detected, else None.
        """
        fg_mask = self.bg_subtractor.apply(frame)
        mask = morphologyEx(fg_mask, MORPH_OPEN, self.kernel)
        contours, _ = findContours(mask, RETR_EXTERNAL, CHAIN_APPROX_SIMPLE)

        best_bbox = None
        best_area = 0
        for cnt in contours:
            x, y, w, h = boundingRect(cnt)
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
                return True, best_bbox

        return False, None

    def set_on_piece_detected(self, callback: callable) -> None:
        """
        Description:
            Sets the callback for when a Lego piece is detected.

        Parameters:
            callback (Callable[[np.ndarray], None]): Function to call with the cropped image.

        Returns:
            None
        """
        self.on_piece_detected = callback
