
import importlib
import time

try:
  cv2 = importlib.import_module("cv2")
except ModuleNotFoundError as exc:
  if exc.name != "cv2":
    raise
  raise SystemExit("Install the missing dependency with: python -m pip install opencv-python") from exc

try:
  YOLO = importlib.import_module("ultralytics").YOLO
except ModuleNotFoundError as exc:
  if exc.name != "ultralytics":
    raise
  raise SystemExit("Install the missing dependency with: python -m pip install ultralytics") from exc

# serial = importlib.import_module("serial")

# ---------- Configuration ----------
MODEL_PATH = "yolo26n.pt"
# SERIAL_PORT = "COM3"   # Change this to your Arduino COM port
# BAUD_RATE = 9600
CONFIDENCE_THRESHOLD = 0.50
CLEAR_DELAY = 1.5      # Seconds without detection before clearing
# -----------------------------------

model = YOLO(MODEL_PATH)

# Open serial connection to Arduino
# board = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.1)

# Allow Arduino to reset after opening the serial port
# time.sleep(2)
# board.write(b"PHONE_CLEAR\n")

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

phone_detected = False
last_phone_seen = 0.0


def send_command(command):
    # board.write((command + "\n").encode("utf-8"))
    print("Arduino command:", command)


try:
    if not cap.isOpened():
        raise RuntimeError("Cannot open webcam")

    while True:
        success, frame = cap.read()
        if not success:
            print("Cannot read webcam frame")
            break

        # Run YOLO on the current frame
        results = model.predict(frame, verbose=False)

        found_phone = False

        for result in results:
            for box in result.boxes:
                class_id = int(box.cls.item())
                confidence = float(box.conf.item())
                class_name = result.names[class_id]
                label = str(class_name).lower().replace("_", " ")

                # COCO models commonly use the label "cell phone".
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

        # Draw detection boxes and display status
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
    # Ensure the warning stops when the program exits
    try:
        # board.write(b"PHONE_CLEAR\n")
        # time.sleep(0.1)
        # board.close()
        pass
    except Exception:
        pass

    cap.release()
    cv2.destroyAllWindows()