const DEFAULT_DURATION_SECONDS = 25 * 60;
let status = "idle";
let durationSeconds = DEFAULT_DURATION_SECONDS;
let remainingSeconds = DEFAULT_DURATION_SECONDS;
let startedAt = null;
function updateRemainingTime() {
    if (status !== "focusing" || startedAt === null) {
        return;
    }
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startedAt) / 1000);
    if (elapsedSeconds <= 0) {
        return;
    }
    remainingSeconds = Math.max(0, remainingSeconds - elapsedSeconds);
    // Advance by the elapsed time to avoid countdown drift.
    startedAt += elapsedSeconds * 1000;
    if (remainingSeconds === 0) {
        status = "completed";
        startedAt = null;
    }
}
export function getFocusStatus() {
    updateRemainingTime();
    return {
        status,
        durationSeconds,
        remainingSeconds,
    };
}
export function setFocusDuration(minutes) {
    if (!Number.isInteger(minutes) ||
        minutes < 5 ||
        minutes > 60 ||
        minutes % 5 !== 0) {
        throw new Error("Focus duration must be a multiple of 5 between 5 and 60 minutes");
    }
    // Update the current countdown before changing the duration.
    updateRemainingTime();
    // Only change the duration while not actively focusing.
    if (status === "focusing") {
        throw new Error("Cannot change focus duration while the timer is running");
    }
    durationSeconds = minutes * 60;
    remainingSeconds = durationSeconds;
    status = "idle";
    startedAt = null;
    return getFocusStatus();
}
export function startFocus() {
    updateRemainingTime();
    if (status === "completed" || status === "focusing") {
        return getFocusStatus();
    }
    status = "focusing";
    startedAt = Date.now();
    return getFocusStatus();
}
export function pauseFocus() {
    updateRemainingTime();
    if (status === "focusing") {
        status = "paused";
        startedAt = null;
    }
    return getFocusStatus();
}
export function resetFocus() {
    status = "idle";
    remainingSeconds = durationSeconds;
    startedAt = null;
    return getFocusStatus();
}
