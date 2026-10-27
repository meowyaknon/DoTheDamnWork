
const int BUZZER_PIN = 9;

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  // สร้างเสียงความถี่ 1000 Hz นาน 500 ms
  tone(BUZZER_PIN, 500, 500);

  // เว้นช่วงก่อนส่งเสียงรอบถัดไป
  delay(1000);
}
