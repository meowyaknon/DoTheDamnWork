#include "pitches.h"
#include <Arduino.h>

//============================== โน้ตเพลง Star Wars (Main Theme) ===========================================
// int melody[] = {
//   NOTE_A4, NOTE_A4, NOTE_A4, NOTE_F4, NOTE_C5,
//   NOTE_A4, NOTE_F4, NOTE_C5, NOTE_A4,
//   NOTE_E5, NOTE_E5, NOTE_E5, NOTE_F5, NOTE_C5,
//   NOTE_GS4, NOTE_F4, NOTE_C5, NOTE_A4
// };

// // จังหวะโน้ตแต่ละตัว (4 = ตัวดำ, 2 = ตัวขาว, เลขมาก = จังหวะสั้น)
// int durations[] = {
//   4, 4, 4, 6, 12,
//   4, 6, 12, 2,
//   4, 4, 4, 6, 12,
//   4, 6, 12, 2
// };

// int songLength = sizeof(melody) / sizeof(melody[0]);

// void setup() {
//   for (int thisNote = 0; thisNote < songLength; thisNote++) {
//     int duration = 1000 / durations[thisNote];
//     tone(9, melody[thisNote], duration); // เล่นออก Pin 9
//     int pause = duration * 1.30;          // เว้นระยะห่างระหว่างโน้ตเล็กน้อย
//     delay(pause);
//     noTone(9);
//   }
// }

// ============================== โน้ตเพลง Harry Potter (Hedwig's Theme) ==============================
int melody[] = {
  NOTE_B4, 
  NOTE_E5, NOTE_G5, NOTE_FS5, 
  NOTE_E5, NOTE_B5, 
  NOTE_A5, 
  NOTE_FS5, 
  NOTE_E5, NOTE_G5, NOTE_FS5, 
  NOTE_D5, NOTE_F5, 
  NOTE_B4
};

// จังหวะโน้ตแต่ละตัว (4 = ตัวดำ, 2 = ตัวขาว, 8 = ตัวเขบ็ต 1 ชั้น, 1 = ตัวกลม)
int durations[] = {
  4, 
  3, 8, 4, 
  2, 4, 
  2, 
  2, 
  3, 8, 4, 
  2, 4, 
  1
};

int songLength = sizeof(melody) / sizeof(melody[0]);

void setup() {
  for (int thisNote = 0; thisNote < songLength; thisNote++) {
    int duration = 1000 / durations[thisNote];
    tone(9, melody[thisNote], duration); // เล่นออก Pin 9
    int pause = duration * 1.30;          // เว้นระยะห่างระหว่างโน้ต
    delay(pause);
    noTone(9);
  }
}

void loop() {
  // เล่นจบครั้งเดียวใน setup()
}
