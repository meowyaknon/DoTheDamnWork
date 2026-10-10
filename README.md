# Physical Computing Project 2026 — IT KMITL

<!-- DTDW: Do The Damn Work -->

**DTDW (Do The Damn Work)** เป็นโปรเจกต์ Physical Computing ที่พัฒนาระบบตรวจจับโทรศัพท์มือถือแบบเรียลไทม์ด้วยเทคโนโลยี YOLO และกล้องเว็บแคม เพื่อสาธิตการประยุกต์ใช้ Computer Vision ร่วมกับอุปกรณ์ฮาร์ดแวร์ โดยสามารถเชื่อมต่อกับ Arduino UNO R4 WiFi เพื่อแจ้งเตือนผ่าน LED และ Buzzer ได้

## Features

* ตรวจจับโทรศัพท์มือถือผ่านกล้องเว็บแคมแบบเรียลไทม์
* ใช้ YOLO ในการตรวจจับวัตถุ
* รองรับการแจ้งเตือนผ่าน Arduino UNO R4 WiFi ด้วย LED และ Buzzer
* มีสคริปต์ช่วยติดตั้ง Python และ dependencies สำหรับ Windows
* สามารถตั้งค่าสภาพแวดล้อมและรันโปรเจกต์ผ่านขั้นตอนที่กำหนดไว้ใน README

---

# การเริ่มต้นใช้งาน (Getting Started)

ทำตามขั้นตอนต่อไปนี้เพื่อติดตั้งและใช้งานโปรเจกต์บนคอมพิวเตอร์ Windows

## 1. สิ่งที่ต้องเตรียม (Prerequisites)

* **Windows:** Windows 10 หรือ Windows 11 รุ่น 64-bit
* **Internet:** สำหรับดาวน์โหลด Python และ Dependencies ที่จำเป็น
* **Webcam:** สำหรับตรวจจับโทรศัพท์แบบเรียลไทม์
* **Arduino UNO R4 WiFi และสาย USB:** จำเป็นเฉพาะเมื่อใช้งานระบบแจ้งเตือนผ่าน Arduino

> หมายเหตุ: หากต้องการใช้ระบบแจ้งเตือนผ่าน Arduino ต้องติดตั้ง Arduino IDE และเตรียมบอร์ดให้พร้อมใช้งานด้วย

## 2. ดาวน์โหลดโปรเจกต์ (Clone Repository)

เปิด Terminal หรือ PowerShell แล้วรันคำสั่งต่อไปนี้

```bash
git clone https://github.com/meowyaknon/DoTheDamnWork.git
cd DoTheDamnWork
```

## 3. ติดตั้งโปรแกรมและ Dependencies (Setup)

แนะนำให้ใช้ Setup Script ที่เตรียมไว้เพื่อให้การติดตั้งมีขั้นตอนที่สม่ำเสมอ

1. ตรวจสอบว่าไฟล์ต่อไปนี้อยู่ในโฟลเดอร์โปรเจกต์:

   * `setupv3.bat`
   * `install_python.ps1`
   * `requirements.txt`
   * `camera.py`
   * `yolo26n.pt`

2. ดับเบิลคลิก `setupv3.bat` หรือเปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรัน:

   ```powershell
   .\setupv3.bat
   ```

3. รอให้สคริปต์ตรวจสอบ Python สร้าง Virtual Environment และติดตั้ง Dependencies จนเสร็จ

4. ตรวจสอบข้อความผลลัพธ์ว่าการติดตั้งและตรวจสอบแพ็กเกจสำเร็จ

Setup Script ถูกออกแบบให้ใช้ Python 3.13 และสามารถติดตั้ง Python 3.13.16 สำหรับผู้ใช้ปัจจุบันได้ หากไม่พบ Python เวอร์ชันที่รองรับ

> **สำคัญ:** ต้องเชื่อมต่ออินเทอร์เน็ตระหว่างการติดตั้ง และอาจต้องติดตั้ง Microsoft Visual C++ Redistributable x64 เพิ่ม หาก Windows แจ้งว่าขาด Runtime ที่จำเป็น

## 4. เริ่มใช้งานโปรแกรม (Run the Program)

หลังจาก Setup สำเร็จ ให้เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรัน:

```powershell
.\.venv\Scripts\python.exe camera.py
```

ก่อนเริ่มใช้งาน โปรดตรวจสอบว่า:

* Webcam เชื่อมต่อและสามารถใช้งานได้
* Windows อนุญาตให้แอปพลิเคชันเข้าถึงกล้อง
* ไฟล์โมเดล `yolo26n.pt` อยู่ในตำแหน่งที่โปรแกรมคาดหวัง
* ไม่มีโปรแกรมอื่นใช้งานกล้องอยู่ หากกล้องไม่สามารถเปิดได้

หากต้องการทดสอบบน Virtual Machine (VM) โปรดทราบว่า VM อาจไม่สามารถเข้าถึง Webcam ของเครื่องหลักได้โดยอัตโนมัติ

## 5. การตั้งค่า Arduino (Arduino Setup)

ขั้นตอนนี้จำเป็นเฉพาะเมื่อใช้งานระบบแจ้งเตือนผ่าน Arduino UNO R4 WiFi

1. ติดตั้ง [Arduino IDE](https://www.arduino.cc/en/software)

2. เปิด Arduino IDE และติดตั้งบอร์ดแพ็กเกจ **Arduino UNO R4 Boards** ผ่าน Boards Manager หากยังไม่ได้ติดตั้ง

3. เปิดไฟล์เฟิร์มแวร์:

   ```text
   arduino/adn_uno_r4/adn_uno_r4.ino
   ```

4. เชื่อมต่อ Arduino UNO R4 WiFi เข้ากับคอมพิวเตอร์ผ่านสาย USB

5. เลือกบอร์ด Arduino UNO R4 WiFi และ COM Port ที่ถูกต้อง

6. กด **Upload** เพื่ออัปโหลดเฟิร์มแวร์ลงบนบอร์ด

7. ตรวจสอบค่า COM Port และ Baud Rate ใน `camera.py` ให้ตรงกับการตั้งค่าของเฟิร์มแวร์

8. ตรวจสอบการต่อวงจร LED และ Buzzer ให้ตรงกับโค้ดก่อนใช้งาน

> **หมายเหตุ:** ต้องอัปโหลดเฟิร์มแวร์ลงบนบอร์ดก่อนใช้งานระบบแจ้งเตือน และควรปิด Serial Monitor หรือโปรแกรมอื่นที่กำลังใช้งาน COM Port ก่อนเริ่มโปรแกรม Python

---

## 6. การแก้ไขปัญหาเบื้องต้น (Troubleshooting)

| ปัญหา                                  | แนวทางแก้ไข                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ModuleNotFoundError`                  | ตรวจสอบว่า Setup สำเร็จ และรันโปรแกรมด้วย `.venv\Scripts\python.exe`                         |
| `WinError 126` หรือโหลด `torch` ไม่ได้ | ตรวจสอบ Microsoft Visual C++ Redistributable x64 และติดตั้ง Runtime ที่จำเป็น                |
| ไม่พบไฟล์โมเดล                         | ตรวจสอบว่า `yolo26n.pt` อยู่ในตำแหน่งที่ `camera.py` กำหนด                                   |
| `Cannot open webcam`                   | ตรวจสอบการเชื่อมต่อกล้อง สิทธิ์การเข้าถึง และโปรแกรมอื่นที่อาจกำลังใช้กล้อง                  |
| เชื่อมต่อ Arduino ไม่ได้               | ตรวจสอบสาย USB, COM Port, Baud Rate และสถานะการใช้งาน Serial Port                            |
| Setup ล้มเหลว                          | อ่านข้อความ Error ที่แสดง ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และรัน Setup ใหม่หลังแก้สาเหตุแล้ว |

หากพบปัญหา ให้ตรวจสอบข้อความ Error ที่แสดงใน Terminal ก่อนลบ `.venv` หรือเปลี่ยนเวอร์ชันแพ็กเกจ

---

# English Version

**DTDW (Do The Damn Work)** is a Physical Computing project that detects mobile phones in real time using YOLO and a webcam. It demonstrates the application of Computer Vision with hardware integration, with an optional Arduino UNO R4 WiFi system for alerts using an LED and buzzer.

## Features

* Detect mobile phones in real time using a webcam.
* Use YOLO for object detection.
* Support optional LED and buzzer alerts through Arduino UNO R4 WiFi.
* Provide a setup script for installing Python and project dependencies on Windows.
* Simplify environment setup and project execution with the documented instructions.

---

## Getting Started

Follow these instructions to install and run the project on a Windows computer.

### 1. Prerequisites

* **Windows:** Windows 10 or Windows 11, 64-bit
* **Internet connection:** Required to download Python and project dependencies
* **Webcam:** Required for real-time phone detection
* **Arduino UNO R4 WiFi and USB cable:** Required only for the optional Arduino alert system

### 2. Clone the Repository

Open a terminal or PowerShell and run:

```bash
git clone https://github.com/meowyaknon/DoTheDamnWork.git
cd DoTheDamnWork
```

### 3. Install Dependencies

Use the provided setup script to configure the Python environment.

1. Make sure the project contains `setupv3.bat`, `install_python.ps1`, and `requirements.txt`.

2. Run the setup script:

   ```powershell
   .\setupv3.bat
   ```

3. Wait for the script to check Python, create the virtual environment, install the dependencies, and verify the installed packages.

4. Confirm that the setup process finishes successfully.

The setup script targets Python 3.13 and can install Python 3.13.16 for the current user if a compatible Python installation is not found.

> **Note:** An internet connection is required during setup. Microsoft Visual C++ Redistributable x64 may also be required if Windows reports missing runtime libraries.

### 4. Run the Program

After setup completes, run:

```powershell
.\.venv\Scripts\python.exe camera.py
```

Before running the program, make sure that:

* The webcam is connected and available.
* Windows camera permissions are enabled.
* The `yolo26n.pt` model file is available at the path expected by the program.
* No other application is using the webcam.

When running inside a virtual machine, webcam access may require additional configuration.

### 5. Arduino Setup

This section is required only if you want to use the Arduino alert system.

1. Install [Arduino IDE](https://www.arduino.cc/en/software).

2. Install the **Arduino UNO R4 Boards** package through Boards Manager if needed.

3. Open the firmware file:

   ```text
   arduino/adn_uno_r4/adn_uno_r4.ino
   ```

4. Connect the Arduino UNO R4 WiFi to your computer using a USB cable.

5. Select the correct board and COM Port.

6. Click **Upload** to flash the firmware.

7. Make sure the COM Port and Baud Rate configured in `camera.py` match the firmware.

8. Verify that the LED and buzzer wiring matches the code.

> **Note:** Upload the firmware before using the alert system. Close Serial Monitor and other applications using the same COM Port before running the Python program.

### 6. Troubleshooting

| Issue                                | Suggested solution                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `ModuleNotFoundError`                | Confirm setup completed successfully and run the program using `.venv\Scripts\python.exe`.           |
| `WinError 126` or PyTorch DLL errors | Check whether Microsoft Visual C++ Redistributable x64 is installed.                                 |
| Model file not found                 | Verify the location of `yolo26n.pt` and the path configured in `camera.py`.                          |
| `Cannot open webcam`                 | Check camera connectivity, Windows permissions, and whether another application is using the webcam. |
| Arduino connection failure           | Check the USB cable, COM Port, Baud Rate, and whether another application is using the serial port.  |
| Setup failure                        | Review the error message, check your internet connection, and rerun setup after resolving the issue. |

---

## สมาชิก (Project Members)

| รหัสนักศึกษา (Student ID) | ชื่อ (First Name) | นามสกุล (Last Name) | รับผิดชอบหัวข้อ (Responsibilities) |
| ------------------------- | ----------------- | ------------------- | ---------------------------------- |
| 68070250                  | ณัฐชนนท์          | เหมือนเดช           |                                    |
| 68070265                  | ธนานนต์           | เจียจงเจริญชัย      |                                    |
| 68070286                  | ปรียาพร           | เอี่ยมประดิษฐ์ภัณ   |                                    |
| 68070316                  | ศิริเทพ           | บดิการ              |                                    |
| 68070328                  | เอมม่า            | เพียร์สัน           |                                    |

---

**Physical Computing Project 2026 — IT KMITL**
