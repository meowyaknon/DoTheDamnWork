
import { getFocusStatus } from "./focus.service.js";

export type PhoneDetectionStatus = "clear" | "detected";
export type PersonPresenceStatus = boolean | null;

const DEVICE_TIMEOUT_MS = 15_000;

let phoneDetection: PhoneDetectionStatus = "clear";
let personPresent: PersonPresenceStatus = null;
let lastDeviceHeartbeat: number | null = null;

export function updatePhoneDetection(
  detected: boolean,
): PhoneDetectionStatus {
  phoneDetection = detected ? "detected" : "clear";
  return phoneDetection;
}

export function updatePersonPresence(
  present: PersonPresenceStatus,
): PersonPresenceStatus {
  personPresent = present;
  return personPresent;
}

export function updateDeviceHeartbeat(): void {
  lastDeviceHeartbeat = Date.now();
}

export function getSystemStatus() {
  const deviceConnected =
    lastDeviceHeartbeat !== null &&
    Date.now() - lastDeviceHeartbeat <= DEVICE_TIMEOUT_MS;

  const focusStatus = getFocusStatus().status;

  return {
    server: "online",
    focus: focusStatus,
    device: deviceConnected ? "connected" : "disconnected",
    phoneDetection,
    personPresent: focusStatus === "focusing" ? personPresent : null,
  };
}
