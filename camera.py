
import importlib
import time
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


try:
    cv2 = importlib.import_module("cv2")
except ModuleNotFoundError as exc:
    if exc.name != "cv2":
        raise
    raise SystemExit(
        "Install the missing dependency with: "
        "python -m pip install opencv-python"
    ) from exc


try:
    YOLO = importlib.import_module("ultralytics").YOLO
except ModuleNotFoundError as exc:
    if exc.name != "ultralytics":
        raise
    raise SystemExit(
        "Install the missing dependency with: "
        "python -m pip install ultralytics"
    ) from exc


# ---------- ZONE 1: Configuration ----------
MODEL_PATH = "yolo26n.pt"
CONFIDENCE_THRESHOLD = 0.50
CLEAR_DELAY = 1.5
FOCUS_POLL_INTERVAL = 0.5

PHONE_URL = "http://localhost:3000/api/status/phone"
PERSON_URL = "http://localhost:3000/api/status/person"
FOCUS_URL = "http://localhost:3000/api/focus"
# ------------------------------------------


# ---------- ZONE 2: Initialize Model & Camera ----------
model = YOLO(MODEL_PATH)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

phone_detected = False
person_present = None
last_phone_seen = 0.0
last_focus_poll = 0.0
focus_status = "unknown"

# ---------- Performance Diagnostics ----------
perf_window_start = time.perf_counter()
perf_frames = 0
perf_read = 0.0
perf_focus_http = 0.0
perf_yolo = 0.0
perf_total = 0.0

# -------------------------------------------------------


# ---------- ZONE 3: Backend Communication ----------
def post_backend_json(url: str, payload: dict):
    data = json.dumps(payload).encode("utf-8")

    request = Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=2) as response:
            return json.loads(response.read().decode("utf-8"))

    except HTTPError as exc:
        print(f"[Backend] HTTP error {exc.code}: {url}")

    except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        print(f"[Backend] Request failed: {exc}")

    return None


def update_backend_phone_status(detected: bool):
    result = post_backend_json(
        PHONE_URL,
        {"detected": detected},
    )

    if result is not None:
        status = "detected" if detected else "clear"
        print(f"[Backend] Phone detection: {status}")


def update_backend_person_status(present: bool | None):
    result = post_backend_json(
        PERSON_URL,
        {"present": present},
    )

    if result is not None:
        status = (
            "present" if present is True
            else "absent" if present is False
            else "inactive"
        )
        print(f"[Backend] Person detection: {status}")


def get_backend_focus_status():
    request = Request(
        FOCUS_URL,
        headers={"Accept": "application/json"},
        method="GET",
    )

    try:
        with urlopen(request, timeout=2) as response:
            payload = json.loads(response.read().decode("utf-8"))

        # Support common response shapes:
        # {"status":"focusing"}
        # {"data":{"status":"focusing"}}
        # {"data":{"focus":"focusing"}}
        candidates = [
            payload.get("data", {}).get("status")
            if isinstance(payload.get("data"), dict)
            else None,
            payload.get("data", {}).get("focus")
            if isinstance(payload.get("data"), dict)
            else None,
            payload.get("focus"),
            payload.get("status"),
        ]

        valid_statuses = {
            "idle",
            "focusing",
            "paused",
            "completed",
        }

        for candidate in candidates:
            if candidate in valid_statuses:
                return candidate

        print("[Backend] Unknown focus response format")
        return "unknown"

    except HTTPError as exc:
        print(f"[Backend] Focus HTTP error: {exc.code}")

    except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        print(f"[Backend] Cannot read focus status: {exc}")

    return "unknown"
# --------------------------------------------------


# ---------- ZONE 4: Detection State Management ----------
def clear_detection_states():
    """Clear active alerts when focus monitoring is inactive."""
    global phone_detected, person_present, last_phone_seen

    if phone_detected:
        phone_detected = False
        update_backend_phone_status(False)

    if person_present is not None:
        person_present = None
        update_backend_person_status(None)

    last_phone_seen = 0.0


def update_detection_status(found_phone: bool, found_person: bool):
    global phone_detected, person_present, last_phone_seen

    now = time.monotonic()

    # Phone detection with the existing clear delay.
    if found_phone:
        last_phone_seen = now

        if not phone_detected:
            phone_detected = True
            update_backend_phone_status(True)

    elif phone_detected and now - last_phone_seen >= CLEAR_DELAY:
        phone_detected = False
        update_backend_phone_status(False)

    # Person presence is reported only when its state changes.
    if person_present is None or person_present != found_person:
        person_present = found_person
        update_backend_person_status(found_person)
# -------------------------------------------------------


# ---------- ZONE 5: Main Detection Loop ----------
try:
    if not cap.isOpened():
        raise RuntimeError("Cannot open webcam")

    # Clear any stale states from a previous run.
    update_backend_phone_status(False)
    update_backend_person_status(None)

    while True:
        loop_start = time.perf_counter()

        # Measure camera capture time.
        t0 = time.perf_counter()
        success, frame = cap.read()
        perf_read += time.perf_counter() - t0

        if not success:
            print("[Camera] Cannot read webcam frame")
            break

        now = time.monotonic()

        # Poll focus status periodically.
        if now - last_focus_poll >= FOCUS_POLL_INTERVAL:
            t0 = time.perf_counter()
            focus_status = get_backend_focus_status()
            perf_focus_http += time.perf_counter() - t0
            last_focus_poll = time.monotonic()

        is_focusing = focus_status == "focusing"

        if is_focusing:
            # Run one YOLO inference for both phone and person.
            t0 = time.perf_counter()
            results = model.predict(frame, verbose=False)
            perf_yolo += time.perf_counter() - t0
            found_phone = False
            found_person = False

            for result in results:
                for box in result.boxes:
                    class_id = int(box.cls.item())
                    confidence = float(box.conf.item())
                    class_name = str(
                        result.names[class_id]
                    ).lower().replace("_", " ")

                    if confidence < CONFIDENCE_THRESHOLD:
                        continue

                    if class_name in {
                        "cell phone",
                        "mobile phone",
                        "phone",
                    }:
                        found_phone = True

                    elif class_name == "person":
                        found_person = True

            update_detection_status(
                found_phone,
                found_person,
            )

            annotated_frame = results[0].plot()

            if phone_detected:
                display_status = "PHONE DETECTED"
                display_color = (0, 0, 255)
            elif person_present is False:
                display_status = "NO PERSON"
                display_color = (0, 165, 255)
            else:
                display_status = "FOCUS ACTIVE"
                display_color = (0, 255, 0)

        else:
            # Pause, idle, completed, or unknown:
            # stop inference and clear active detection states.
            clear_detection_states()
            annotated_frame = frame.copy()

            if focus_status == "paused":
                display_status = "PAUSED"
            elif focus_status == "unknown":
                display_status = "BACKEND UNAVAILABLE"
            else:
                display_status = "FOCUS INACTIVE"

            display_color = (180, 180, 180)

        cv2.putText(
            annotated_frame,
            display_status,
            (20, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            display_color,
            2,
        )

        cv2.imshow("Smart Focus Guardian", annotated_frame)

        key = cv2.waitKey(1) & 0xFF

        perf_frames += 1
        perf_total += time.perf_counter() - loop_start

        elapsed = time.perf_counter() - perf_window_start

        if elapsed >= 2.0:
            count = max(perf_frames, 1)

            print(
                f"[PERF] FPS={perf_frames / elapsed:.1f} | "
                f"Read={perf_read * 1000 / count:.1f}ms | "
                f"FocusAPI={perf_focus_http * 1000 / count:.1f}ms | "
                f"YOLO={perf_yolo * 1000 / count:.1f}ms | "
                f"Loop={perf_total * 1000 / count:.1f}ms"
            )

            perf_window_start = time.perf_counter()
            perf_frames = 0
            perf_read = 0.0
            perf_focus_http = 0.0
            perf_yolo = 0.0
            perf_total = 0.0

        if key == ord("q"):
            break

finally:
    try:
        clear_detection_states()
    finally:
        # Ensure inactive states are sent on shutdown.
        update_backend_phone_status(False)
        update_backend_person_status(None)
        cap.release()
        cv2.destroyAllWindows()
# --------------------------------------------------
