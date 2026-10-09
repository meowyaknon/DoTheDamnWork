# Physical Computing Project 2026 - IT KMITL

<!-- # DTDW : Do The Damn Work -->
<!-- about this project blah blah blah -->


## การเริ่มต้นใช้งาน (Getting Started)

ทำตามขั้นตอนต่อไปนี้เพื่อติดตั้งและใช้งานโปรเจกต์บนเครื่องของคุณ

### 1. สิ่งที่ต้องเตรียม (Prerequisites)

ก่อนเริ่มใช้งาน โปรดตรวจสอบว่าคุณมีสิ่งต่อไปนี้

* Python ติดตั้งอยู่ในเครื่อง
* กล้อง Webcam สำหรับตรวจจับโทรศัพท์แบบเรียลไทม์
* อินเทอร์เน็ตสำหรับดาวน์โหลด Dependencies
* Arduino UNO R4 WiFi และสาย USB (หากต้องการใช้งานระบบแจ้งเตือนผ่านบอร์ด Arduino)

### 2. ดาวน์โหลดโปรเจกต์ (Clone Repository)

เปิด Terminal แล้วรันคำสั่งต่อไปนี้

```bash
git clone https://github.com/meowyaknon/DoTheDamnWork.git
cd DoTheDamnWork
```

### 3. ติดตั้ง Dependencies (Install Dependencies)

ติดตั้ง Python Packages ที่โปรเจกต์ต้องใช้ด้วยคำสั่ง

```bash
python -m pip install -r requirements.txt
```

### 4. เริ่มใช้งานโปรแกรม (Run the Program)

รันโปรแกรมตรวจจับโทรศัพท์ด้วยคำสั่ง

```bash
python camera.py
```

ตรวจสอบให้แน่ใจว่ากล้อง Webcam พร้อมใช้งาน และไฟล์ AI Model ที่ระบุใน `camera.py` อยู่ในตำแหน่งที่ถูกต้อง

### 5. การตั้งค่า Arduino (Arduino Setup)

หากต้องการใช้งานระบบแจ้งเตือนผ่าน Arduino ให้ทำตามขั้นตอนต่อไปนี้

1. ติดตั้ง Arduino IDE บนคอมพิวเตอร์
2. เปิด Arduino IDE และติดตั้งบอร์ดแพ็กเกจที่รองรับ Arduino UNO R4 WiFi ผ่าน Boards Manager หากยังไม่ได้ติดตั้ง
3. เปิดไฟล์ arduino/adn_uno_r4/adn_uno_r4.ino แล้วกด OK
4. เชื่อมต่อ Arduino UNO R4 WiFi เข้ากับคอมพิวเตอร์ผ่านสาย USB
5. เลือกบอร์ด Arduino UNO R4 WiFi และ Port ที่ถูกต้องใน Arduino IDE
6. กด Upload เพื่ออัปโหลดโปรแกรมลงบนบอร์ด
7. ตรวจสอบ COM Port และ Baud Rate ใน camera.py ให้ตรงกับการตั้งค่าของ Arduino

หมายเหตุ: ต้องอัปโหลดโปรแกรมลงบอร์ดก่อนใช้งานระบบแจ้งเตือน และควรตรวจสอบการต่อวงจร LED และ Buzzer ให้ตรงกับโค้ด

### 6. การแก้ไขปัญหาเบื้องต้น (Troubleshooting)

* **ไม่พบโมดูล (ModuleNotFoundError):** ติดตั้ง Dependencies อีกครั้งด้วยคำสั่ง `python -m pip install -r requirements.txt`
* **ไม่พบไฟล์โมเดล (Model file not found):** ตรวจสอบชื่อไฟล์และตำแหน่งของโมเดลที่ระบุใน `camera.py`
* **ไม่สามารถเปิดกล้องได้ (Webcam not available):** ตรวจสอบสิทธิ์การเข้าถึงกล้อง และตรวจสอบว่าไม่มีโปรแกรมอื่นกำลังใช้งานกล้องอยู่
* **เชื่อมต่อ Arduino ไม่ได้ (Arduino connection failed):** ตรวจสอบสาย USB, COM Port, Baud Rate และตรวจสอบว่าไม่มีโปรแกรมอื่นกำลังใช้ Serial Port อยู่

---

## English Version

Follow these steps to install and run the project locally.

### 1. Prerequisites

Before running the project, make sure you have:

* Python installed on your computer.
* A webcam for real-time phone detection.
* Internet access for downloading dependencies.
* Arduino UNO R4 WiFi and a USB cable (if using the Arduino alert system).

### 2. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/meowyaknon/DoTheDamnWork.git
cd DoTheDamnWork
```

### 3. Install Dependencies

Install the required Python packages:

```bash
python -m pip install -r requirements.txt
```

### 4. Run the Program

Start the phone detection program:

```bash
python camera.py
```

Make sure the webcam is available and the AI model file configured in `camera.py` exists in the expected location.

### 5. Arduino Setup

To use the Arduino alert system, follow these steps:

1. Install Arduino IDE on your computer.
2. Open Arduino IDE and install the board package for Arduino UNO R4 WiFi through Boards Manager if it is not already installed.
3. Open arduino/adn_uno_r4/adn_uno_r4.ino.
4. Connect the Arduino UNO R4 WiFi to your computer using a USB cable.
5. Select Arduino UNO R4 WiFi and the correct port in Arduino IDE.
6. Click Upload to upload the firmware to the board.
7. Make sure the COM port and baud rate in camera.py match the Arduino configuration.

Note: The firmware must be uploaded to the board before using the alert system. Make sure the LED and buzzer wiring matches the code.

### 6. Troubleshooting

* **ModuleNotFoundError:** Install the dependencies using `python -m pip install -r requirements.txt`.
* **Model file not found:** Check the model filename and path configured in `camera.py`.
* **Webcam not available:** Check camera permissions and make sure another application is not using the webcam.
* **Arduino connection failed:** Check the USB cable, COM port, baud rate, and whether another application is using the serial port.



## สมาชิก

| รหัสนักศึกษา   |  ชื่อ  |  นามสกุล  |  รับผิดชอบหัวข้อ |
| ------------ | ---- | -------- | ------------- |
| 68070250     | ณัฐชนนท์  | เหมือนเดช |                 |
| 68070265     | ธนานนต์ | เจียจงเจริญชัย |                 |
| 68070286     | ปรียาพร | เอี่ยมประดิษฐ์ภัณ |                 |
| 68070316     | ศิริเทพ | บดิการ |                 |
| 68070328     | เอมม่า | เพียร์สัน |                 |