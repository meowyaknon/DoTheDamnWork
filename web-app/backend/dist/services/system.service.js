import { getFocusStatus } from "./focus.service.js";
const DEVICE_TIMEOUT_MS = 15_000;
let phoneDetection = "clear";
let personPresent = null;
let lastDeviceHeartbeat = null;
export function updatePhoneDetection(detected) {
    phoneDetection = detected ? "detected" : "clear";
    return phoneDetection;
}
export function updatePersonPresence(present) {
    personPresent = present;
    return personPresent;
}
export function updateDeviceHeartbeat() {
    lastDeviceHeartbeat = Date.now();
}
export function getSystemStatus() {
    const deviceConnected = lastDeviceHeartbeat !== null &&
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
