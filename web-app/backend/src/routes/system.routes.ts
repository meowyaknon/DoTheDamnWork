import { Router } from "express";
import { getSystemStatus } from "../services/system.service.js";

const router = Router();

router.get("/status", (_req, res) => {
  const systemStatus = getSystemStatus();

  res.status(200).json({
    status: "ok",
    data: systemStatus,
    message: "System status retrieved successfully",
  });
});

export default router;