
import { useEffect, useState } from "react";
import "./App.css";

type SystemStatus = {
  server: string;
  focus: string;
  device: string;
};

type StatusResponse = {
  status: string;
  data: SystemStatus;
};

function App() {
  const [systemStatus, setSystemStatus] =
    useState<SystemStatus | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

    // เรียก API ทันทีเมื่อ Component เริ่มทำงาน
    fetchSystemStatus();

    // เรียก API ซ้ำทุก 3 วินาที
    const intervalId = window.setInterval(() => {
      fetchSystemStatus();
    }, 3000);

    // หยุดการทำงานเมื่อ Component ถูกถอดออก
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return <p>Loading system status...</p>;
  }

  if (error && !systemStatus) {
    return <p role="alert">{error}</p>;
  }

  if (!systemStatus) {
    return <p>No status data available.</p>;
  }

  return (
    <main>
      <h1>DoTheDamnWork</h1>
      <p>System Dashboard</p>

      {error && (
        <p role="alert">
          {error} Showing the last available status.
        </p>
      )}

      <section>
        <h2>Backend Server</h2>
        <p>{systemStatus.server}</p>
      </section>

      <section>
        <h2>Focus Status</h2>
        <p>{systemStatus.focus}</p>
      </section>

      <section>
        <h2>Arduino Device</h2>
        <p>{systemStatus.device}</p>
      </section>
    </main>
  );
}

export default App;
