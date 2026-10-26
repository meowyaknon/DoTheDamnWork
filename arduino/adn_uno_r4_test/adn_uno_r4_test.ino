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
#include <ArduinoMqttClient.h>
#include "arduino_secrets.h"

WiFiClient mqttNetworkClient;
MqttClient mqttClient(mqttNetworkClient);

const char MQTT_BROKER[] = "broker.hivemq.com";
const int MQTT_PORT = 1883;

const char TOPIC_PREFIX[] = "dotheDamnWork/demo-2026-x7k9";
const char TOPIC_DEVICE_STATUS[] =
  "dotheDamnWork/demo-2026-x7k9/device/status";
const char TOPIC_PHONE[] =
  "dotheDamnWork/demo-2026-x7k9/phone";
const char TOPIC_FOCUS_COMMAND[] =
  "dotheDamnWork/demo-2026-x7k9/focus/command";
const char TOPIC_BOARD_FOCUS_MINUTES[] =
  "dotheDamnWork/demo-2026-x7k9/board/focus/minutes";
const char TOPIC_BOARD_FOCUS_BUTTON[] =
  "dotheDamnWork/demo-2026-x7k9/board/focus/button";

const unsigned long HEARTBEAT_INTERVAL = 5000;
const unsigned long WIFI_RETRY_INTERVAL = 10000;
const unsigned long MQTT_RETRY_INTERVAL = 5000;

unsigned long lastHeartbeat = 0;
unsigned long lastWifiAttempt = 0;
unsigned long lastMqttAttempt = 0;

bool wifiWasConnected = false;

int lastPublishedMqttFocusMinutes = -1;
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

#if NETWORK_ENABLED
  void publishMqttMessage(const char* topic, const char* message);
#endif

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

  #if NETWORK_ENABLED
    publishMqttMessage(TOPIC_BOARD_FOCUS_BUTTON, "start");
  #endif
  }

  if (buttonPressed(pauseButton)) {
    focusRunning = false;
    updateStatusLED();
    Serial.println("BUTTON_PAUSE");

  #if NETWORK_ENABLED
    publishMqttMessage(TOPIC_BOARD_FOCUS_BUTTON, "pause");
  #endif  
  }

  if (buttonPressed(resetButton)) {
    focusRunning = false;
    updateStatusLED();
    Serial.println("BUTTON_RESET");

  #if NETWORK_ENABLED
    publishMqttMessage(TOPIC_BOARD_FOCUS_BUTTON, "reset");
  #endif
  }
}


// ============================================================
// ZONE 10: NETWORK — START WI-FI
// Comment this zone when testing Serial only.
// ============================================================


#if NETWORK_ENABLED

void publishMqttMessage(const char* topic, const char* message) {
  if (!mqttClient.connected()) {
    return;
  }

  mqttClient.beginMessage(topic);
  mqttClient.print(message);

  if (mqttClient.endMessage() == 1) {
    Serial.print("[MQTT] Published ");
    Serial.print(topic);
    Serial.print(": ");
    Serial.println(message);
  } else {
    Serial.println("[MQTT] Publish failed");
  }
}

void onMqttMessage(int messageSize) {
  String topic = mqttClient.messageTopic();
  String command = "";

  while (mqttClient.available()) {
    command += (char)mqttClient.read();
  }

  command.trim();

  Serial.print("[MQTT] Received ");
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(command);

  if (topic == TOPIC_FOCUS_COMMAND) {
    if (command == "start") {
      focusRunning = true;
      updateStatusLED();
      Serial.println("[MQTT] Focus started");
    }
    else if (command == "pause") {
      focusRunning = false;
      updateStatusLED();
      Serial.println("[MQTT] Focus paused");
    }
    else if (command == "reset") {
      focusRunning = false;
      updateStatusLED();
      Serial.println("[MQTT] Focus reset");
    }
  }

  if (topic == TOPIC_PHONE) {
    if (command == "detected") {
      phoneDetected = true;
      tone(BUZZER_PIN, 1000);
      updateStatusLED();

      Serial.println("[ARDUINO] Phone detected via MQTT");
    }
    else if (command == "clear") {
      phoneDetected = false;
      noTone(BUZZER_PIN);
      updateStatusLED();

      Serial.println("[ARDUINO] Phone cleared via MQTT");
    }

    return;
  }

  if (topic == TOPIC_FOCUS_COMMAND) {
    if (command == "start") {
      focusRunning = true;
      updateStatusLED();
      Serial.println("[MQTT] Focus started");
    }
    else if (command == "pause") {
      focusRunning = false;
      updateStatusLED();
      Serial.println("[MQTT] Focus paused");
    }
    else if (command == "reset") {
      focusRunning = false;
      updateStatusLED();
      Serial.println("[MQTT] Focus reset");
    }
  }
}

void beginWifiConnection() {
  Serial.println("[NETWORK] Starting Wi-Fi connection...");
  WiFi.begin(SECRET_SSID, SECRET_PASS);
  lastWifiAttempt = millis();
}

void maintainWifiConnection() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiWasConnected) {
      wifiWasConnected = true;
      Serial.print("[NETWORK] Wi-Fi connected. Arduino IP: ");
      Serial.println(WiFi.localIP());
    }
    return;
  }

  if (wifiWasConnected) {
    wifiWasConnected = false;
    Serial.println("[NETWORK] Wi-Fi disconnected");
    mqttClient.stop();
  }

  if (millis() - lastWifiAttempt >= WIFI_RETRY_INTERVAL) {
    lastWifiAttempt = millis();
    WiFi.begin(SECRET_SSID, SECRET_PASS);
  }
}

void maintainMqttConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (mqttClient.connected()) {
    return;
  }

  if (millis() - lastMqttAttempt < MQTT_RETRY_INTERVAL) {
    return;
  }

  lastMqttAttempt = millis();

  Serial.println("[MQTT] Connecting to public broker...");

  // Client ID ต้องไม่ซ้ำกับ Backend หรืออุปกรณ์อื่น
  String clientId = "ddtw_arduino_" + String(millis()) +
                  "_" + String(random(0xFFFF), HEX);

  mqttClient.setId(clientId);

  if (!mqttClient.connect(MQTT_BROKER, MQTT_PORT)) {
    Serial.print("[MQTT] Connection failed. Error: ");
    Serial.println(mqttClient.connectError());
    return;
  }

  Serial.println("[MQTT] Connected to public broker");

  mqttClient.onMessage(onMqttMessage);

  if (mqttClient.subscribe(TOPIC_FOCUS_COMMAND)) {
    Serial.println("[MQTT] Subscribed to focus commands");
  } else {
    Serial.println("[MQTT] Failed to subscribe to focus commands");
  }

  if (mqttClient.subscribe(TOPIC_PHONE)) {
    Serial.println("[MQTT] Subscribed to phone detection");
  } else {
    Serial.println("[MQTT] Failed to subscribe to phone detection");
  }

  publishMqttMessage(TOPIC_DEVICE_STATUS, "online");
  lastHeartbeat = millis();
}

void sendHeartbeat() {
  if (!mqttClient.connected()) {
    return;
  }

  if (millis() - lastHeartbeat < HEARTBEAT_INTERVAL) {
    return;
  }

  lastHeartbeat = millis();
  publishMqttMessage(TOPIC_DEVICE_STATUS, "online");
}

void publishBoardFocusMinutesIfChanged() {
  if (!mqttClient.connected()) {
    static bool warned = false;

    if (!warned) {
      Serial.println("[MQTT] Cannot publish focus minutes: disconnected");
      warned = true;
    }

    return;
  }

  if (focusMinutes == lastPublishedMqttFocusMinutes) {
    return;
  }

  char payload[4];
  snprintf(payload, sizeof(payload), "%d", focusMinutes);

  Serial.print("[MQTT] Attempting to publish focus minutes: ");
  Serial.println(payload);

  publishMqttMessage(TOPIC_BOARD_FOCUS_MINUTES, payload);

  lastPublishedMqttFocusMinutes = focusMinutes;
}

#endif

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
  maintainMqttConnection();

  if (mqttClient.connected()) {
    mqttClient.poll();
    sendHeartbeat();
  }
#endif

  // ----- Receive commands from Python -----
  while (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    processSerialCommand(command);
  }

  // ----- Read potentiometer -----
  updatePotentiometer();

  #if NETWORK_ENABLED
  publishBoardFocusMinutesIfChanged();
  #endif

  // ----- Read buttons -----
  updateButtons();
}