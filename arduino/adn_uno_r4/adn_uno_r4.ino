
/*
 * DoTheDamnWork
 * Board: Arduino UNO R4 WiFi
 *
 * Serial commands from Python:
 *   PHONE_DETECTED
 *   PHONE_CLEAR
 *
 * Messages from Arduino:
 *   BOARD_READY
 *   FOCUS_MINUTES:<minutes>
 *   BUTTON_START
 *   BUTTON_PAUSE
 *   BUTTON_RESET
 *
 * Network:
 *   POST /api/status/device/heartbeat
 */

// ============================================================
// ZONE 1: NETWORK SWITCH
// ============================================================

// 1 = Enable Wi-Fi and backend heartbeat
// 0 = Disable all network code for Serial/hardware testing
#define NETWORK_ENABLED 1


// ============================================================
// ZONE 2: NETWORK LIBRARIES AND SETTINGS
// Comment this whole zone when NETWORK_ENABLED is 0.
// ============================================================

#if NETWORK_ENABLED
#include <WiFiS3.h>
#include "arduino_secrets.h"

WiFiClient heartbeatClient;

// Change this IP if your computer's IPv4 address changes.
IPAddress backendIP(10, 122, 38, 124);
const char* BACKEND_HOST = "LAPTOP-KNIGHTsss";

const int BACKEND_PORT = 3000;

const unsigned long HEARTBEAT_INTERVAL = 5000;
const unsigned long HTTP_TIMEOUT = 1000;
const unsigned long WIFI_RETRY_INTERVAL = 10000;

unsigned long lastHeartbeat = 0;
unsigned long lastWifiAttempt = 0;

bool wifiWasConnected = false;
#endif


// ============================================================
// ZONE 3: HARDWARE PIN CONFIGURATION
// ============================================================

// RGB LED
const int RED_PIN = 2;
const int GREEN_PIN = 3;
const int BLUE_PIN = 4;

// Buttons
const int START_BUTTON_PIN = 5;
const int PAUSE_BUTTON_PIN = 6;
const int RESET_BUTTON_PIN = 7;

// Other components
const int BUZZER_PIN = 8;
const int POTENTIOMETER_PIN = A0;


// ============================================================
// ZONE 4: HARDWARE AND FOCUS SETTINGS
// ============================================================

const unsigned long DEBOUNCE_DELAY = 50;

const int MIN_FOCUS_MINUTES = 5;
const int MAX_FOCUS_MINUTES = 60;
const int FOCUS_STEP_MINUTES = 5;

bool phoneDetected = false;
bool focusRunning = false;

int focusMinutes = 25;
int lastReportedFocusMinutes = -1;


// Button debounce state
struct ButtonState {
  int pin;
  int lastReading;
  int stableState;
  unsigned long lastChangeTime;
};

ButtonState startButton = {
  START_BUTTON_PIN, HIGH, HIGH, 0
};

ButtonState pauseButton = {
  PAUSE_BUTTON_PIN, HIGH, HIGH, 0
};

ButtonState resetButton = {
  RESET_BUTTON_PIN, HIGH, HIGH, 0
};


// ============================================================
// ZONE 5: RGB LED
// Common-cathode RGB LED
// ============================================================

void setColor(int red, int green, int blue) {
  analogWrite(RED_PIN, red);
  analogWrite(GREEN_PIN, green);
  analogWrite(BLUE_PIN, blue);
}

void updateStatusLED() {
  // Red: phone detected
  if (phoneDetected) {
    setColor(255, 0, 0);
  }
  // Blue: focus session running
  else if (focusRunning) {
    setColor(0, 0, 255);
  }
  // Green: idle or paused
  else {
    setColor(0, 255, 0);
  }
}


// ============================================================
// ZONE 6: SERIAL COMMANDS
// Keep these command names synchronized with Python.
// ============================================================

void processSerialCommand(String command) {
  command.trim();

  if (command == "PHONE_DETECTED") {
    phoneDetected = true;
    tone(BUZZER_PIN, 1000);
    updateStatusLED();

    Serial.println("[ARDUINO] Phone detected");
  }
  else if (command == "PHONE_CLEAR") {
    phoneDetected = false;
    noTone(BUZZER_PIN);
    updateStatusLED();

    Serial.println("[ARDUINO] Phone cleared");
  }
  else if (command.length() > 0) {
    Serial.print("[ARDUINO] Unknown command: ");
    Serial.println(command);
  }
}


// ============================================================
// ZONE 7: POTENTIOMETER
// Maps the knob position to 5–60 minutes in 5-minute steps.
// ============================================================

void updatePotentiometer() {
  int rawValue = analogRead(POTENTIOMETER_PIN);

  int steps = map(
    rawValue,
    0,
    1023,
    0,
    (MAX_FOCUS_MINUTES - MIN_FOCUS_MINUTES) / FOCUS_STEP_MINUTES
  );

  int newMinutes =
    MIN_FOCUS_MINUTES + steps * FOCUS_STEP_MINUTES;

  newMinutes = constrain(
    newMinutes,
    MIN_FOCUS_MINUTES,
    MAX_FOCUS_MINUTES
  );

  if (newMinutes != focusMinutes) {
    focusMinutes = newMinutes;
  }

  if (focusMinutes != lastReportedFocusMinutes) {
    Serial.print("FOCUS_MINUTES:");
    Serial.println(focusMinutes);

    lastReportedFocusMinutes = focusMinutes;
  }
}


// ============================================================
// ZONE 8: BUTTON DEBOUNCE
// Buttons use INPUT_PULLUP, so pressed = LOW.
// ============================================================

bool buttonPressed(ButtonState &button) {
  int reading = digitalRead(button.pin);

  if (reading != button.lastReading) {
    button.lastChangeTime = millis();
    button.lastReading = reading;
  }

  if (millis() - button.lastChangeTime >= DEBOUNCE_DELAY) {
    if (reading != button.stableState) {
      button.stableState = reading;

      if (button.stableState == LOW) {
        return true;
      }
    }
  }

  return false;
}


// ============================================================
// ZONE 9: BUTTON EVENTS
// ============================================================

void updateButtons() {
  if (buttonPressed(startButton)) {
    focusRunning = true;
    updateStatusLED();
    Serial.println("BUTTON_START");
  }

  if (buttonPressed(pauseButton)) {
    focusRunning = false;
    updateStatusLED();
    Serial.println("BUTTON_PAUSE");
  }

  if (buttonPressed(resetButton)) {
    focusRunning = false;
    updateStatusLED();
    Serial.println("BUTTON_RESET");
  }
}


// ============================================================
// ZONE 10: NETWORK — START WI-FI
// Comment this zone when testing Serial only.
// ============================================================

#if NETWORK_ENABLED

void beginWifiConnection() {
  Serial.println("[NETWORK] Starting Wi-Fi connection...");
  WiFi.begin(SECRET_SSID, SECRET_PASS);
  lastWifiAttempt = millis();
}


void maintainWifiConnection() {
  int wifiStatus = WiFi.status();

  if (wifiStatus == WL_CONNECTED) {
    if (!wifiWasConnected) {
      wifiWasConnected = true;

      Serial.println("[NETWORK] Wi-Fi connected");

      Serial.print("[NETWORK] Arduino IP: ");
      Serial.println(WiFi.localIP());

      Serial.print("[NETWORK] Backend IP: ");
      Serial.println(backendIP);
    }

    return;
  }

  if (wifiWasConnected) {
    wifiWasConnected = false;
    Serial.println("[NETWORK] Wi-Fi disconnected");
  }

  if (millis() - lastWifiAttempt >= WIFI_RETRY_INTERVAL) {
    lastWifiAttempt = millis();

    Serial.println("[NETWORK] Retrying Wi-Fi...");
    WiFi.begin(SECRET_SSID, SECRET_PASS);
  }
}


// ============================================================
// ZONE 11: NETWORK — BACKEND HEARTBEAT
// Sends POST /api/status/device/heartbeat every 5 seconds.
// ============================================================

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (millis() - lastHeartbeat < HEARTBEAT_INTERVAL) {
    return;
  }

  lastHeartbeat = millis();

  Serial.println("[NETWORK] Sending heartbeat...");

  if (!heartbeatClient.connect(BACKEND_HOST, BACKEND_PORT)) {
    Serial.println("[NETWORK] Backend connection failed");
    heartbeatClient.stop();
    return;
  }

  heartbeatClient.setTimeout(HTTP_TIMEOUT);

  heartbeatClient.println(
    "POST /api/status HTTP/1.1"
  );

  heartbeatClient.print("Host: ");
  heartbeatClient.print(backendIP);
  heartbeatClient.print(":");
  heartbeatClient.println(BACKEND_PORT);

  heartbeatClient.println("Content-Type: application/json");
  heartbeatClient.println("Content-Length: 2");
  heartbeatClient.println("Connection: close");
  heartbeatClient.println();
  heartbeatClient.println("{}");

  // Read the HTTP status line returned by the backend.
  String response = heartbeatClient.readStringUntil('\n');
  response.trim();

  if (response.length() > 0) {
    Serial.print("[NETWORK] HTTP response: ");
    Serial.println(response);
  }
  else {
    Serial.println("[NETWORK] No HTTP response received");
  }

  heartbeatClient.stop();
}

#endif // NETWORK_ENABLED


// ============================================================
// ZONE 12: SETUP
// ============================================================

void setup() {
  Serial.begin(9600);

  // RGB LED pins
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  // Buttons use internal pull-up resistors
  pinMode(START_BUTTON_PIN, INPUT_PULLUP);
  pinMode(PAUSE_BUTTON_PIN, INPUT_PULLUP);
  pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);

  // Buzzer and potentiometer
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(POTENTIOMETER_PIN, INPUT);

  noTone(BUZZER_PIN);
  updateStatusLED();

  Serial.println("BOARD_READY");

#if NETWORK_ENABLED
  beginWifiConnection();
#else
  Serial.println("[NETWORK] Disabled by NETWORK_ENABLED");
#endif
}


// ============================================================
// ZONE 13: MAIN LOOP
// ============================================================

void loop() {
  // ----- Network zone -----
#if NETWORK_ENABLED
  maintainWifiConnection();
  sendHeartbeat();
#endif

  // ----- Receive commands from Python -----
  while (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    processSerialCommand(command);
  }

  // ----- Read potentiometer -----
  updatePotentiometer();

  // ----- Read buttons -----
  updateButtons();
}
