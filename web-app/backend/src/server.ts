
import express from "express";

const app = express();
const PORT = 3000;

// ให้ Express อ่าน Request body ที่เป็น JSON ได้
app.use(express.json());

// API สำหรับตรวจสอบว่า Server ทำงานอยู่หรือไม่
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "DoTheDamnWork API is running",
  });
});

// เริ่มเปิด HTTP Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
