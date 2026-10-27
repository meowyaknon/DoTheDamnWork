
import { Router } from "express";
import {
  getSystemStatus,
  updatePhoneDetection,
  updatePersonPresence,
  updateDeviceHeartbeat,
} from "../services/system.service.js";
import {
  publishPhoneDetection,
  publishPersonPresence,
} from "../services/mqtt.service.js";

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
  publishPhoneDetection(detected);

  res.status(200).json({
    status: "ok",
    data: { phoneDetection },
    message: "Phone detection status updated successfully",
  });
});

router.post("/status/person", (req, res) => {
  const present = req.body?.present;

  if (
    present !== true &&
    present !== false &&
    present !== null
  ) {
    res.status(400).json({
      status: "error",
      message: 'Request body must contain "present": true, false, or null',
    });
    return;
  }

  const personPresent = updatePersonPresence(present);
  publishPersonPresence(present);

  res.status(200).json({
    status: "ok",
    data: { personPresent },
    message: "Person detection status updated successfully",
  });
});

router.post("/status/device/heartbeat", (_req, res) => {
  updateDeviceHeartbeat();

  res.status(200).json({
    status: "ok",
    data: { device: "connected" },
    message: "Device heartbeat received successfully",
  });
});

export default router;
