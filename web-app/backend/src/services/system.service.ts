
import { getFocusStatus } from "./focus.service.js";

export type PhoneDetectionStatus = "clear" | "detected";

const DEVICE_TIMEOUT_MS = 15_000;

let phoneDetection: PhoneDetectionStatus = "clear";
let lastDeviceHeartbeat: number | null = null;

export function updatePhoneDetection(
  detected: boolean,
): PhoneDetectionStatus {
  phoneDetection = detected ? "detected" : "clear";
  return phoneDetection;
}

export function updateDeviceHeartbeat(): void {
  lastDeviceHeartbeat = Date.now();
}

export function getSystemStatus() {
  const deviceConnected =
    lastDeviceHeartbeat !== null &&
    Date.now() - lastDeviceHeartbeat <= DEVICE_TIMEOUT_MS;

  return {
    server: "online",
    focus: getFocusStatus().status,
    device: deviceConnected ? "connected" : "disconnected",
    phoneDetection,
  };
}
