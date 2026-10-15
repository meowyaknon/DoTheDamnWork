import express from "express";
import healthRoutes from "./routes/health.routes.js";
import { errorHandler } from "./error.middleware.js";
import { notFoundHandler } from "./not-found.middleware.js";
import systemRoutes from "./routes/system.routes.js";
import focusRouters from "./routes/focus.routes.js"

const app = express();
const PORT = 3000;

app.use(express.json());

// กำหนด prefix /api ที่ server.ts แทน เพื่อให้จัดการ URL ของ API ทั้งระบบได้ง่ายขึ้น
app.use("/api", healthRoutes);
app.use("/api", systemRoutes);
app.use("/api", focusRouters);

// Not found handler should be registered after all other routes
app.use(notFoundHandler);

// Error handling middleware should be registered after all other middleware and routes
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
