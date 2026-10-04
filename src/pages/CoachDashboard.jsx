import { useState } from "react";
import "./CoachDashboard.css";
import CoachNavbar from "./CoachNavbar";
import CoachSidebar from "./CoachSidebar";

function CoachDashboard() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("coach-theme") !== "light"
  );

  const toggleTheme = () => {
    setDarkMode((isDarkMode) => {
      const nextDarkMode = !isDarkMode;
      localStorage.setItem("coach-theme", nextDarkMode ? "dark" : "light");
      return nextDarkMode;
    });
  };

  return (
    <div className={`coach-app ${darkMode ? "dark-mode" : "light-mode"}`}>
      <CoachNavbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* ================= BODY ================= */}
      <div className="coach-body">
        <CoachSidebar />

        {/* ================= MAIN ================= */}
        <main className="coach-main">

          <h1>Coach Dashboard</h1>

          {/* ================= STAT CARDS ================= */}
          <section className="stats-grid">

            <div className="stat-card">
              <div className="stat-icon pending-icon">◷</div>

              <div className="stat-content">
                <h3>Pending Requests</h3>
                <strong>0</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon approved-icon">✓</div>

              <div className="stat-content">
                <h3>Approved Today</h3>
                <strong>0</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon students-icon">♟</div>

              <div className="stat-content">
                <h3>Total Students</h3>
                <strong>1</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon sessions-icon">▣</div>

              <div className="stat-content">
                <h3>Upcoming Sessions</h3>
                <strong>0</strong>
              </div>
            </div>

          </section>

          {/* ================= RECENT ACTIVITY ================= */}
          <section className="activity-card">

            <div className="activity-header">
              <span>🔔</span>
              <h2>Recent Activity</h2>
            </div>

            <div className="empty-activity">
              <p>No recent activity</p>
            </div>

          </section>

        </main>

      </div>
    </div>
  );
}

export default CoachDashboard;