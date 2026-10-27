
const int POT_PIN = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {  
  // long total = 0;

  // // อ่านค่า 10 ครั้ง
  // for (int i = 0; i < 10; i++) {
  //   total += analogRead(POT_PIN);
  //   delay(5);
  // }

  // int average = total / 10;

  // Serial.print("Average: ");
  // Serial.println(average);
  Serial.println(analogRead(POT_PIN));

  
  delay(200);
}
