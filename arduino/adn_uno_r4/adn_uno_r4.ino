const int RED_PIN = 6;
const int GREEN_PIN = 5;
const int BLUE_PIN = 3;

const int START_BUTTON_PIN = 2;
const int PAUSE_BUTTON_PIN = 4;
const int RESET_BUTTON_PIN = 7;

const int POTENTIOMETER_PIN = A0;

const int BUZZER_PIN = 9;

bool phoneDetected = false;
bool focusRunning = false;

String command = "";

int selectedMinutes = 25;
int lastReportedMinutes = -1;

unsigned long lastPotRead = 0;
unsigned long lastButtonCheck = 0;

const unsigned long POT_READ_INTERVAL = 100;
const unsigned long BUTTON_CHECK_INTERVAL = 20;

bool lastStartReading = HIGH;
bool lastPauseReading = HIGH;
bool lastResetReading = HIGH;

bool stableStartState = HIGH;
bool stablePauseState = HIGH;
bool stableResetState = HIGH;

unsigned long startDebounceTime = 0;
unsigned long pauseDebounceTime = 0;
unsigned long resetDebounceTime = 0;

const unsigned long DEBOUNCE_DELAY = 30;

void setColor(int red, int green, int blue) {
  // Assumes a common-cathode RGB LED.
  analogWrite(RED_PIN, red);
  analogWrite(GREEN_PIN, green);
  analogWrite(BLUE_PIN, blue);
}

int readSelectedMinutes() {
  int rawValue = analogRead(POTENTIOMETER_PIN);

  // Divide the potentiometer range into 12 steps:
  // 5, 10, 15, ... 60 minutes.
  int step = map(rawValue, 0, 1023, 1, 13);
  step = constrain(step, 1, 12);

  return step * 5;
}

void reportButtonEvent(const char* eventName) {
  Serial.println(eventName);
}

void updateButton(
  int pin,
  bool& lastReading,
  bool& stableState,
  unsigned long& debounceTime,
  const char* eventName
) {
  bool reading = digitalRead(pin);

  if (reading != lastReading) {
    debounceTime = millis();
    lastReading = reading;
  }

  if (millis() - debounceTime >= DEBOUNCE_DELAY) {
    if (reading != stableState) {
      stableState = reading;

      // INPUT_PULLUP: LOW means the button is pressed.
      if (stableState == LOW) {
        reportButtonEvent(eventName);
      }
    }
  }
}

void updateStatusLED() {
  if (phoneDetected) {
    // Red warning takes priority over focus status.
    setColor(255, 0, 0);
  } else if (focusRunning) {
    // Blue means a focus session is running.
    setColor(0, 0, 255);
  } else {
    // Green means idle or paused.
    setColor(0, 255, 0);
  }
}



void setup() {
  Serial.begin(9600);

  // Wait until Serial Monitor is ready.
  while (!Serial) {
    delay(10);
  }

  Serial.println("BOARD_READY");

  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  pinMode(START_BUTTON_PIN, INPUT_PULLUP);
  pinMode(PAUSE_BUTTON_PIN, INPUT_PULLUP);
  pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);

  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);

  Serial.setTimeout(20);

  selectedMinutes = readSelectedMinutes();

  updateStatusLED();

  Serial.print("FOCUS_MINUTES:");
  Serial.println(selectedMinutes);
}


void loop() {
  unsigned long now = millis();

  // 1. Receive commands from Python.
  if (Serial.available() > 0) {
    command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "PHONE_DETECTED") {
      phoneDetected = true;

      // แจ้งเตือนเมื่อพบโทรศัพท์
      tone(BUZZER_PIN, 1000);

      updateStatusLED();

    } else if (command == "PHONE_CLEAR") {
      phoneDetected = false;

      // หยุดเสียงเมื่อไม่พบโทรศัพท์
      noTone(BUZZER_PIN);

      updateStatusLED();
    }
  }

  // 2. Read the potentiometer periodically.
  if (now - lastPotRead >= POT_READ_INTERVAL) {
    lastPotRead = now;

    int newMinutes = readSelectedMinutes();

    if (newMinutes != lastReportedMinutes) {
      selectedMinutes = newMinutes;
      lastReportedMinutes = newMinutes;

      Serial.print("FOCUS_MINUTES:");
      Serial.println(selectedMinutes);
    }
  }

  // 3. Read buttons with debounce.
  if (now - lastButtonCheck >= BUTTON_CHECK_INTERVAL) {
    lastButtonCheck = now;

    updateButton(
      START_BUTTON_PIN,
      lastStartReading,
      stableStartState,
      startDebounceTime,
      "BUTTON_START"
    );

    updateButton(
      PAUSE_BUTTON_PIN,
      lastPauseReading,
      stablePauseState,
      pauseDebounceTime,
      "BUTTON_PAUSE"
    );

    updateButton(
      RESET_BUTTON_PIN,
      lastResetReading,
      stableResetState,
      resetDebounceTime,
      "BUTTON_RESET"
    );
  }
}
