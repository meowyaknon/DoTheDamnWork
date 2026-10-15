import { getFocusStatus } from "./focus.service.js";

export type PhoneDetectionStatus = "clear" | "detected";

let phoneDetection: PhoneDetectionStatus = "clear";

export function updatePhoneDetection(
  detected: boolean,
): PhoneDetectionStatus {
  phoneDetection = detected ? "detected" : "clear";

  return phoneDetection;
}

export function getSystemStatus() {
  return {
    server: "online",
    focus: getFocusStatus().status,
    device: "disconnected",
    phoneDetection,
  };
}
