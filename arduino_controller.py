import time
from typing import Literal


Mode = Literal["mock", "serial"]

VALID_COMMANDS = {
    "PHONE_DETECTED",
    "PHONE_CLEAR",
}


class ArduinoController:
    def __init__(
        self,
        mode: Mode = "mock",
        port: str | None = None,
        baud_rate: int = 9600,
        timeout: float = 0.1,
    ):
        if mode not in ("mock", "serial"):
            raise ValueError(f"Unsupported mode: {mode}")

        self.mode = mode
        self.port = port
        self.baud_rate = baud_rate
        self.timeout = timeout

        self.connection = None
        self.connected = False
        self.commands_sent: list[str] = []

    def connect(self) -> None:
        if self.connected:
            return

        if self.mode == "mock":
            self.connected = True
            print("[MOCK] Arduino controller connected")
            return

        if not self.port:
            raise ValueError(
                "A serial port is required in serial mode"
            )

        # Import pyserial only when using real hardware.
        import serial

        self.connection = serial.Serial(
            self.port,
            self.baud_rate,
            timeout=self.timeout,
        )

        # Arduino may reset when its serial port opens.
        time.sleep(2)

        self.connected = True
        print(f"[SERIAL] Connected to {self.port}")

        # Start from the normal, no-phone-detected state.
        self.send_command("PHONE_CLEAR")

    def send_command(self, command: str) -> None:
        if command not in VALID_COMMANDS:
            raise ValueError(f"Invalid Arduino command: {command}")

        if not self.connected:
            raise RuntimeError(
                "Arduino controller is not connected"
            )

        if self.mode == "mock":
            print(f"[MOCK] Arduino command: {command}")
        else:
            if self.connection is None:
                raise RuntimeError("Serial connection is unavailable")

            message = f"{command}\n".encode("utf-8")
            self.connection.write(message)

        self.commands_sent.append(command)

    def read_message(self) -> str | None:
        # """Read one line of text from Arduino, if available."""
        if not self.connected:
            return None

        if self.mode == "mock":
            return None

        if self.connection is None:
            return None

        try:
            if self.connection.in_waiting == 0:
                return None

            message = self.connection.readline().decode(
                "utf-8",
                errors="replace",
            ).strip()

            return message or None

        except Exception as exc:
            print(f"[Arduino] Failed to read message: {exc}")
            return None

    def close(self) -> None:
        if not self.connected:
            return

        try:
            # Return the board to its normal state before closing.
            self.send_command("PHONE_CLEAR")
        finally:
            if self.connection is not None:
                self.connection.close()
                self.connection = None

            self.connected = False
            print("[INFO] Arduino controller closed")
