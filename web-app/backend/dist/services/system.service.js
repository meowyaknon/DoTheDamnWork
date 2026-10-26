import { getFocusStatus } from "./focus.service.js";
const DEVICE_TIMEOUT_MS = 15_000;
let phoneDetection = "clear";
let lastDeviceHeartbeat = null;
export function updatePhoneDetection(detected) {
    phoneDetection = detected ? "detected" : "clear";
    return phoneDetection;
}
export function updateDeviceHeartbeat() {
    lastDeviceHeartbeat = Date.now();
}
export function getSystemStatus() {
    const deviceConnected = lastDeviceHeartbeat !== null &&
        Date.now() - lastDeviceHeartbeat <= DEVICE_TIMEOUT_MS;
    return {
        server: "online",
        focus: getFocusStatus().status,
        device: deviceConnected ? "connected" : "disconnected",
        phoneDetection,
    };
}
