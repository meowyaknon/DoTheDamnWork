
export type FocusStatus =
  | "idle"
  | "focusing"
  | "paused"
  | "completed";

export type FocusState = {
  status: FocusStatus;
  durationSeconds: number;
  remainingSeconds: number;
};

const DEFAULT_DURATION_SECONDS = 25 * 60;

let status: FocusStatus = "idle";
let remainingSeconds = DEFAULT_DURATION_SECONDS;
let startedAt: number | null = null;

function updateRemainingTime(): void {
  if (status !== "focusing" || startedAt === null) {
    return;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - startedAt) / 1000,
  );

  remainingSeconds = Math.max(
    0,
    remainingSeconds - elapsedSeconds,
  );

  startedAt = Date.now();

  if (remainingSeconds === 0) {
    status = "completed";
    startedAt = null;
  }
}

export function getFocusStatus(): FocusState {
  updateRemainingTime();

  return {
    status,
    durationSeconds: DEFAULT_DURATION_SECONDS,
    remainingSeconds,
  };
}


export function startFocus(): FocusState {
  updateRemainingTime();

  if (status === "completed" || status === "focusing") {
    return getFocusStatus();
  }

  status = "focusing";
  startedAt = Date.now();

  return getFocusStatus();
}


export function pauseFocus(): FocusState {
  updateRemainingTime();

  if (status === "focusing") {
    status = "paused";
    startedAt = null;
  }

  return getFocusStatus();
}


export function resetFocus(): FocusState {
  status = "idle";
  remainingSeconds = DEFAULT_DURATION_SECONDS;
  startedAt = null;

  return getFocusStatus();
}
