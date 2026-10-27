import mqtt from "mqtt";
import { updateDeviceHeartbeat, updatePhoneDetection, updatePersonPresence, } from "./system.service.js";
import { startFocus, pauseFocus, resetFocus, setFocusDuration, } from "./focus.service.js";
const BROKER_URL = "mqtt://broker.hivemq.com:1883";
// ใช้ prefix เฉพาะโปรเจกต์ของเรา
// เปลี่ยนคำท้ายให้เป็นสตริงที่ไม่ซ้ำกับโปรเจกต์อื่น
const TOPIC_PREFIX = "dotheDamnWork/demo-2026-x7k9";
const TOPICS = {
    deviceStatus: `${TOPIC_PREFIX}/device/status`,
    phoneDetection: `${TOPIC_PREFIX}/phone`,
    focusCommand: `${TOPIC_PREFIX}/focus/command`,
    boardFocusMinutes: `${TOPIC_PREFIX}/board/focus/minutes`,
    boardFocusButton: `${TOPIC_PREFIX}/board/focus/button`,
    personPresence: `${TOPIC_PREFIX}/person`,
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
    client.subscribe([
        TOPICS.deviceStatus,
        TOPICS.phoneDetection,
        TOPICS.boardFocusMinutes,
        TOPICS.boardFocusButton,
    ], (error) => {
        if (error) {
            console.error("[MQTT] Subscribe failed:", error.message);
            return;
        }
        console.log("[MQTT] Subscribed to device status, phone detection, person detection, and board controls");
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
    if (topic === TOPICS.personPresence) {
        if (message === "present") {
            updatePersonPresence(true);
        }
        else if (message === "absent") {
            updatePersonPresence(false);
        }
        else if (message === "inactive") {
            updatePersonPresence(null);
        }
        return;
    }
    if (topic === TOPICS.boardFocusMinutes) {
        const minutes = Number(message);
        try {
            const focus = setFocusDuration(minutes);
            console.log(`[MQTT] Focus duration updated from board: ${minutes} minutes`);
        }
        catch (error) {
            console.warn("[MQTT] Ignored board focus duration:", error instanceof Error ? error.message : error);
        }
        return;
    }
    if (topic === TOPICS.boardFocusButton) {
        switch (message) {
            case "start":
                startFocus();
                console.log("[MQTT] Focus started from board");
                break;
            case "pause":
                pauseFocus();
                console.log("[MQTT] Focus paused from board");
                break;
            case "reset":
                resetFocus();
                console.log("[MQTT] Focus reset from board");
                break;
            default:
                console.warn("[MQTT] Unknown board button command:", message);
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
export function publishPhoneDetection(detected) {
    if (!client.connected) {
        console.warn("[MQTT] Not connected; phone status not published");
        return;
    }
    const message = detected ? "detected" : "clear";
    client.publish(TOPICS.phoneDetection, message, (error) => {
        if (error) {
            console.error("[MQTT] Failed to publish phone status:", error.message);
            return;
        }
        console.log(`[MQTT] Phone status published: ${message}`);
    });
}
export function publishPersonPresence(present) {
    if (!client.connected) {
        console.warn("[MQTT] Not connected; person status not published");
        return;
    }
    const message = present === true
        ? "present"
        : present === false
            ? "absent"
            : "inactive";
    client.publish(TOPICS.personPresence, message, (error) => {
        if (error) {
            console.error("[MQTT] Failed to publish person status:", error.message);
            return;
        }
        console.log(`[MQTT] Person status published: ${message}`);
    });
}
