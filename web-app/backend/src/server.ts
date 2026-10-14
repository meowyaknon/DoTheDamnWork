import express from "express";
import healthRoutes from "./routes/health.routes.js";
import { errorHandler } from "./error.middleware.js";
import { notFoundHandler } from "./not-found.middleware.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Not found handler should be registered after all other routes
app.use(notFoundHandler);

// Error handling middleware should be registered after all other middleware and routes
app.use(errorHandler);

// กำหนด prefix /api ที่ server.ts แทน เพื่อให้จัดการ URL ของ API ทั้งระบบได้ง่ายขึ้น
app.use("/api", healthRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
