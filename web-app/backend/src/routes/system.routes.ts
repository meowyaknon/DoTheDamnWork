import { Router } from "express";
import {
  getSystemStatus,
  updatePhoneDetection,
} from "../services/system.service.js";

const router = Router();

router.get("/status", (_req, res) => {
  const systemStatus = getSystemStatus();

  res.status(200).json({
    status: "ok",
    data: systemStatus,
    message: "System status retrieved successfully",
  });
});

router.post("/status/phone", (req, res) => {
  const detected = req.body?.detected;

  if (typeof detected !== "boolean") {
    res.status(400).json({
      status: "error",
      message: 'Request body must contain a boolean "detected"',
    });
    return;
  }

  const phoneDetection = updatePhoneDetection(detected);

  res.status(200).json({
    status: "ok",
    data: { phoneDetection },
    message: "Phone detection status update successfully",
  });
});

export default router;