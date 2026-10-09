
const int RED_PIN = 6;
const int GREEN_PIN = 5;
const int BLUE_PIN = 3;
// const int BUZZER_PIN = 8;

bool phoneDetected = false;
bool buzzerOn = false;

unsigned long lastBlinkTime = 0;
unsigned long lastBuzzerTime = 0;

const unsigned long BLINK_INTERVAL = 300;
const unsigned long BUZZER_INTERVAL = 400;

String command = "";

void setColor(int red, int green, int blue) {
  // Assumes a common-cathode RGB LED
  analogWrite(RED_PIN, red);
  analogWrite(GREEN_PIN, green);
  analogWrite(BLUE_PIN, blue);
}

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  // pinMode(BUZZER_PIN, OUTPUT);

  // digitalWrite(BUZZER_PIN, LOW);
  setColor(0, 255, 0);  // Green: normal state

  Serial.begin(9600);
  Serial.setTimeout(20);
}

void loop() {
  // Receive a command from Python
  if (Serial.available() > 0) {
    command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "PHONE_DETECTED") {
      phoneDetected = true;
      lastBlinkTime = 0;
      lastBuzzerTime = 0;
      buzzerOn = false;
      // digitalWrite(BUZZER_PIN, LOW);
    }
    else if (command == "PHONE_CLEAR") {
      phoneDetected = false;
      buzzerOn = false;

      // digitalWrite(BUZZER_PIN, LOW);
      setColor(0, 255, 0);
    }
  }

  if (phoneDetected) {
    unsigned long now = millis();

    // Blink red LED
    if (now - lastBlinkTime >= BLINK_INTERVAL) {
      lastBlinkTime = now;

      if (buzzerOn) {
        setColor(0, 0, 0);  // LED off
      } else {
        setColor(255, 0, 0);  // Red warning
      }
    }

    // Pulse the active buzzer
    if (now - lastBuzzerTime >= BUZZER_INTERVAL) {
      lastBuzzerTime = now;
      buzzerOn = !buzzerOn;

      // digitalWrite(BUZZER_PIN, buzzerOn ? HIGH : LOW);
    }
  }
}