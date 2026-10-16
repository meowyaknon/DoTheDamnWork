import { getFocusStatus } from "./focus.service.js";
let phoneDetection = "clear";
export function updatePhoneDetection(detected) {
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
