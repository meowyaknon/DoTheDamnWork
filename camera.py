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

BACKEND_URL = "http://localhost:3000/api/status/phone"
# ------------------------------------------


# ---------- ZONE 2: Backend URLs ----------
FOCUS_URL = "http://localhost:3000/api/focus"
FOCUS_START_URL = f"{FOCUS_URL}/start"
FOCUS_PAUSE_URL = f"{FOCUS_URL}/pause"
FOCUS_RESET_URL = f"{FOCUS_URL}/reset"
FOCUS_DURATION_URL = f"{FOCUS_URL}/duration"
# -----------------------------------------


# ---------- ZONE 3: Initialize Model & Camera ----------
model = YOLO(MODEL_PATH)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

phone_detected = False
last_phone_seen = 0.0
# -------------------------------------------------------


# ---------- ZONE 4: Backend Communication ----------
def update_backend_phone_status(detected: bool):
    payload = json.dumps({
        "detected": detected
    }).encode("utf-8")

    request = Request(
        BACKEND_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=2) as response:
            response.read()

        status = "detected" if detected else "clear"
        print(f"[Backend] Phone detection: {status}")

    except HTTPError as exc:
        print(f"[Backend] HTTP error: {exc.code}")

    except (URLError, TimeoutError, OSError) as exc:
        print(f"[Backend] Connection failed: {exc}")


def post_backend_json(url: str, payload: dict | None = None):
    """Send a JSON request to the backend."""
    data = None

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=2) as response:
            result = json.loads(response.read().decode("utf-8"))

        print(f"[Backend] POST {url} -> success")
        return result

    except HTTPError as exc:
        print(f"[Backend] HTTP error {exc.code}: {url}")

    except (URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        print(f"[Backend] Request failed: {exc}")

    return None
# --------------------------------------------------


# ---------- ZONE 5: Phone Detection Commands ----------
def send_command(command: str):
    """Send phone detection status to the backend."""

    if command == "PHONE_DETECTED":
        update_backend_phone_status(True)

    elif command == "PHONE_CLEAR":
        update_backend_phone_status(False)
# -----------------------------------------------------


# ---------- ZONE 6: Main Detection Loop ----------
try:
    # Clear stale phone-detection status on startup.
    update_backend_phone_status(False)

    if not cap.isOpened():
        raise RuntimeError("Cannot open webcam")

    while True:
        # Read one camera frame per iteration.
        success, frame = cap.read()

        if not success:
            print("Cannot read webcam frame")
            break

        # Run YOLO on the current frame.
        results = model.predict(frame, verbose=False)

        found_phone = False

        for result in results:
            for box in result.boxes:
                class_id = int(box.cls.item())
                confidence = float(box.conf.item())
                class_name = result.names[class_id]
                label = str(class_name).lower().replace("_", " ")

                is_phone = label in {
                    "cell phone",
                    "mobile phone",
                    "phone",
                }

                if is_phone and confidence >= CONFIDENCE_THRESHOLD:
                    found_phone = True
                    break

            if found_phone:
                break

        now = time.monotonic()

        if found_phone:
            last_phone_seen = now

            if not phone_detected:
                phone_detected = True
                send_command("PHONE_DETECTED")

        elif phone_detected and now - last_phone_seen >= CLEAR_DELAY:
            phone_detected = False
            send_command("PHONE_CLEAR")

        # Draw detection boxes and display status.
        annotated_frame = results[0].plot()

        status = "PHONE DETECTED" if phone_detected else "FOCUS"

        cv2.putText(
            annotated_frame,
            status,
            (20, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 0, 255) if phone_detected else (0, 255, 0),
            2,
        )

        cv2.imshow("Smart Focus Guardian", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

finally:
    try:
        update_backend_phone_status(False)
    finally:
        cap.release()
        cv2.destroyAllWindows()
# ------------------------------------------------
