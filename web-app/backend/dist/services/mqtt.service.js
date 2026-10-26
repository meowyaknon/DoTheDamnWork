import mqtt from "mqtt";
import { updateDeviceHeartbeat, updatePhoneDetection, } from "./system.service.js";
const BROKER_URL = "mqtt://broker.hivemq.com:1883";
// ใช้ prefix เฉพาะโปรเจกต์ของเรา
// เปลี่ยนคำท้ายให้เป็นสตริงที่ไม่ซ้ำกับโปรเจกต์อื่น
const TOPIC_PREFIX = "dotheDamnWork/demo-2026-x7k9";
const TOPICS = {
    deviceStatus: `${TOPIC_PREFIX}/device/status`,
    phoneDetection: `${TOPIC_PREFIX}/phone`,
    focusCommand: `${TOPIC_PREFIX}/focus/command`,
};
console.log("[MQTT] Starting connection...");
const client = mqtt.connect(BROKER_URL, {
    clientId: `ddtw_backend_${Math.random().toString(16).slice(2, 10)}`,
    clean: true,
    connectTimeout: 10_000,
    reconnectPeriod: 3_000,
});
client.on("connect", () => {
    console.log("[MQTT] Connected to public broker");
    client.subscribe([TOPICS.deviceStatus, TOPICS.phoneDetection], (error) => {
        if (error) {
            console.error("[MQTT] Subscribe failed:", error.message);
            return;
        }
        console.log("[MQTT] Subscribed to device status and phone detection");
    });
});
client.on("message", (topic, payload) => {
    const message = payload.toString();
    if (topic === TOPICS.deviceStatus && message === "online") {
        updateDeviceHeartbeat();
        console.log("[MQTT] Arduino heartbeat received");
        return;
    }
    if (topic === TOPICS.phoneDetection) {
        if (message === "detected") {
            updatePhoneDetection(true);
        }
        else if (message === "clear") {
            updatePhoneDetection(false);
        }
    }
});
client.on("error", (error) => {
    console.error("[MQTT] Error:", error.message);
});
client.on("reconnect", () => {
    console.log("[MQTT] Reconnecting...");
});
client.on("offline", () => {
    console.log("[MQTT] Offline");
});
client.on("close", () => {
    console.log("[MQTT] Connection closed");
});
export function publishFocusCommand(command) {
    if (!client.connected) {
        console.warn("[MQTT] Not connected; command not published");
        return;
    }
    client.publish(TOPICS.focusCommand, command, (error) => {
        if (error) {
            console.error("[MQTT] Publish failed:", error.message);
        }
        else {
            console.log(`[MQTT] Focus command published: ${command}`);
        }
    });
}
export function getMqttConnectionStatus() {
    return client.connected;
}
