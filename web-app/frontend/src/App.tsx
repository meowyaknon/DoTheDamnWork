import { useEffect, useState } from "react";

type SystemStatus = {
  server: string;
  focus: string;
  device: string;
  phoneDetection: "clear" | "detected";
  personPresent: boolean | null;
};

type StatusResponse = {
  status: string;
  data: SystemStatus;
};

type FocusStatus = {
  status: "idle" | "focusing" | "paused" | "completed";
  durationSeconds: number;
  remainingSeconds: number;
};

type FocusResponse = {
  status: string;
  data: FocusStatus;
};

type FocusAction = "start" | "pause" | "reset";
type Theme = "dark" | "light";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem("ddtw-theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });

  const [systemStatus, setSystemStatus] =
    useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [focusStatus, setFocusStatus] =
    useState<FocusStatus | null>(null);
  const [focusError, setFocusError] = useState<string | null>(null);
  const [focusLoading, setFocusLoading] = useState(true);

  const [controlLoading, setControlLoading] = useState(false);
  const [controlError, setControlError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("ddtw-theme", theme);
    } catch {
      // The dashboard still works if browser storage is unavailable.
    }
  }, [theme]);

  async function handleFocusControl(action: FocusAction) {
    setControlLoading(true);
    setControlError(null);

    try {
      const response = await fetch(`/api/focus/${action}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to control focus session");
      }

      const result: FocusResponse = await response.json();
      setFocusStatus(result.data);
      setFocusError(null);
    } catch {
      setControlError(`Unable to ${action} focus session.`);
    } finally {
      setControlLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function fetchSystemStatus() {
      try {
        const response = await fetch("/api/status");

        if (!response.ok) {
          throw new Error("Failed to fetch system status");
        }

        const result: StatusResponse = await response.json();

        if (active) {
          setSystemStatus(result.data);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Unable to connect to the backend.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchSystemStatus();
    const intervalId = window.setInterval(fetchSystemStatus, 750);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchFocusStatus() {
      try {
        const response = await fetch("/api/focus");

        if (!response.ok) {
          throw new Error("Failed to fetch focus status");
        }

        const result: FocusResponse = await response.json();

        if (active) {
          setFocusStatus(result.data);
          setFocusError(null);
        }
      } catch {
        if (active) {
          setFocusError("Unable to load focus status.");
        }
      } finally {
        if (active) {
          setFocusLoading(false);
        }
      }
    }

    fetchFocusStatus();
    const intervalId = window.setInterval(fetchFocusStatus, 1000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const isDark = theme === "dark";

  const cardClass =
    "rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 sm:p-6";

  const buttonBase =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  if (loading) {
    return (
      <div className={`${isDark ? "theme-dark" : "theme-light"} min-h-screen`}>
        <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-6 text-[var(--text-secondary)]">
          <p className="animate-pulse">Connecting to DoTheDamnWork...</p>
        </main>
      </div>
    );
  }

  if (error && !systemStatus) {
    return (
      <div className={`${isDark ? "theme-dark" : "theme-light"} min-h-screen`}>
        <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-6 text-red-500">
          <p role="alert">{error}</p>
        </main>
      </div>
    );
  }

  if (!systemStatus) {
    return (
      <div className={`${isDark ? "theme-dark" : "theme-light"} min-h-screen`}>
        <main className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] p-6 text-[var(--text-secondary)]">
          <p>No status data available.</p>
        </main>
      </div>
    );
  }

  const remainingSeconds = focusStatus?.remainingSeconds ?? 0;
  const durationSeconds = focusStatus?.durationSeconds ?? 1500;

  const progress =
    durationSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((durationSeconds - remainingSeconds) / durationSeconds) * 100,
          ),
        )
      : 0;

  const isFocusing = focusStatus?.status === "focusing";
  const isPaused = focusStatus?.status === "paused";
  const isCompleted = focusStatus?.status === "completed";

  const statusLabels: Record<FocusStatus["status"], string> = {
    idle: "READY TO FOCUS",
    focusing: "FOCUSING",
    paused: "PAUSED",
    completed: "SESSION COMPLETED",
  };

  const serverConnected =
    !error && systemStatus.server.toLowerCase() === "online";

  const deviceConnected =
    systemStatus.device.toLowerCase() === "connected";

  const phoneDetected =
    systemStatus.phoneDetection === "detected";

const personPresent = systemStatus.personPresent;

  return (
    <div className={`${isDark ? "theme-dark" : "theme-light"} min-h-screen`}>
      <main className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] transition-colors duration-200">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-8 lg:px-10 2xl:px-14">
          {/* Header */}
          <header className="flex flex-col gap-4 border-b border-[var(--border-color)] pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-xl text-violet-500">
                ◉
              </div>
              <div>
                <p className="text-base font-bold tracking-tight">
                  DoTheDamnWork
                </p>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)]">
                  FOCUS SYSTEM
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    serverConnected ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {serverConnected ? "SYSTEM ONLINE" : "CHECK CONNECTION"}
              </div>

              <button
                type="button"
                onClick={() =>
                  setTheme((current) =>
                    current === "dark" ? "light" : "dark",
                  )
                }
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                aria-pressed={!isDark}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:opacity-80"
              >
                <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
                <span>{isDark ? "Light mode" : "Dark mode"}</span>
              </button>
            </div>
          </header>

          {/* Introduction */}
          <section className="py-8 sm:py-10 lg:py-12">
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-violet-500">
              YOUR WORKSPACE
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Stay in your zone.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              One session at a time. Keep distractions out and focus on what matters.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200"
              >
                {error} Showing the last available status.
              </p>
            )}
          </section>

          {/* Focus Timer */}
          <section className="overflow-hidden rounded-2xl border border-violet-500/25 bg-[var(--timer-bg)] shadow-[0_0_50px_var(--shadow-color)]">
            <div className="flex flex-col gap-2 border-b border-[var(--border-color)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <h2 className="text-xs font-bold tracking-[0.18em]">
                  FOCUS SESSION
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Time reserved for deep work
                </p>
              </div>
              <span className="w-fit rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-500">
                {Math.floor(durationSeconds / 60)} MINUTES
              </span>
            </div>

            <div className="flex flex-col items-center px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
              <div
                className="relative flex h-52 w-52 items-center justify-center rounded-full sm:h-60 sm:w-60 lg:h-72 lg:w-72 2xl:h-80 2xl:w-80"
                style={{
                  background: `conic-gradient(var(--accent) ${progress * 3.6}deg, var(--ring-track) ${progress * 3.6}deg)`,
                }}
                role="progressbar"
                aria-label="Focus session progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <div className="absolute inset-[5px] flex flex-col items-center justify-center rounded-full bg-[var(--timer-bg)]">
                  <span className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)]">
                    TIME REMAINING
                  </span>

                  <span className="font-mono text-5xl font-medium tracking-tight sm:text-6xl 2xl:text-7xl">
                    {formatTime(remainingSeconds)}
                  </span>

                  <span
                    className={`mt-4 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.12em] ${
                      isFocusing
                        ? "bg-emerald-500/10 text-emerald-600"
                        : isPaused
                          ? "bg-amber-500/10 text-amber-600"
                          : isCompleted
                            ? "bg-sky-500/10 text-sky-600"
                            : "bg-[var(--subtle-bg)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {focusStatus
                      ? statusLabels[focusStatus.status]
                      : "LOADING"}
                  </span>
                </div>
              </div>

              {focusLoading && (
                <p className="mt-4 text-xs text-[var(--text-muted)]">
                  Syncing focus status...
                </p>
              )}

              {focusError && (
                <p role="alert" className="mt-4 text-sm text-red-500">
                  {focusError}
                </p>
              )}

              <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-3 min-[380px]:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleFocusControl("start")}
                  disabled={
                    controlLoading ||
                    focusLoading ||
                    !focusStatus ||
                    isFocusing ||
                    isCompleted
                  }
                  className={`${buttonBase} bg-violet-600 text-white hover:bg-violet-500`}
                >
                  <span aria-hidden="true">▶</span>
                  Start
                </button>

                <button
                  type="button"
                  onClick={() => handleFocusControl("pause")}
                  disabled={controlLoading || focusLoading || !isFocusing}
                  className={`${buttonBase} border border-[var(--border-color)] bg-[var(--subtle-bg)] text-[var(--text-primary)] hover:opacity-80`}
                >
                  <span aria-hidden="true">Ⅱ</span>
                  Pause
                </button>

                <button
                  type="button"
                  onClick={() => handleFocusControl("reset")}
                  disabled={controlLoading || focusLoading || !focusStatus}
                  className={`${buttonBase} border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--subtle-bg)]`}
                >
                  <span aria-hidden="true">↻</span>
                  Reset
                </button>
              </div>

              {controlLoading && (
                <p className="mt-4 text-xs text-[var(--text-muted)]">
                  Sending command...
                </p>
              )}

              {controlError && (
                <p role="alert" className="mt-4 text-sm text-red-500">
                  {controlError}
                </p>
              )}
            </div>
          </section>

          {/* System Status */}
          <section className="mt-8 sm:mt-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold">System Overview</h2>
              <span className="text-xs text-[var(--text-muted)]">
                Live status
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3 2xl:gap-6">
              <article className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold tracking-[0.14em] text-[var(--text-muted)]">
                    BACKEND SERVER
                  </p>
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      serverConnected ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </div>

                <p className="mt-4 break-words text-lg font-semibold sm:text-xl">
                  {systemStatus.server}
                </p>
                <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">
                  {error
                    ? "Connection needs attention"
                    : "Server status reported by API"}
                </p>
              </article>

              <article className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold tracking-[0.14em] text-[var(--text-muted)]">
                    ARDUINO DEVICE
                  </p>
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      deviceConnected ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </div>

                <p className="mt-4 break-words text-lg font-semibold sm:text-xl">
                  {systemStatus.device}
                </p>
                <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">
                  Hardware status reported by API
                </p>
              </article>

              <article className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold tracking-[0.14em] text-[var(--text-muted)]">
                    PHONE DETECTION
                  </p>
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      phoneDetected ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                </div>

                <p className="mt-4 break-words text-lg font-semibold sm:text-xl">
                  {phoneDetected ? "PHONE DETECTED" : "CLEAR"}
                </p>

                <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">
                  {phoneDetected
                    ? "A phone has been detected by the camera."
                    : "No phone is currently detected."}
                </p>
              </article>

              
              <article className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold tracking-[0.14em] text-[var(--text-muted)]">
                    PERSON DETECTION
                  </p>
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      !isFocusing
                        ? "bg-gray-400"
                        : personPresent === true
                          ? "bg-emerald-500"
                          : personPresent === false
                            ? "bg-amber-500"
                            : "bg-gray-400"
                    }`}
                  />
                </div>

                <p className="mt-4 break-words text-lg font-semibold sm:text-xl">
                  {!isFocusing
                    ? "MONITORING INACTIVE"
                    : personPresent === true
                      ? "PERSON DETECTED"
                      : personPresent === false
                        ? "NO PERSON"
                        : "WAITING FOR CAMERA"}
                </p>

                <p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">
                  {!isFocusing
                    ? "Person detection is inactive outside a focus session."
                    : personPresent === true
                      ? "A person is visible in the camera frame."
                      : personPresent === false
                        ? "No person is currently visible in the camera frame."
                        : "Waiting for person detection data."}
                </p>
              </article>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 flex flex-col gap-2 border-t border-[var(--border-color)] py-5 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
            <p>DoTheDamnWork · Physical Computing Project 2026</p>
            <p>LOCAL DASHBOARD</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
