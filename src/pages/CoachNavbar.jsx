import { useEffect, useState } from "react";
import "./CoachDashboard.css";

function CoachNavbar() {
  const [time, setTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <header className="coach-navbar">
      <div className="coach-brand">
        <div className="brand-logo">🏅</div>

        <div>
          <h2>UniXport Coach</h2>
          <span>RAJARATA UNIVERSITY OF SRI LANKA</span>
        </div>
      </div>

      <div className="navbar-actions">
        <div className="clock">
          🕘
          <span>{formattedTime}</span>
        </div>

        <button
          className="nav-icon theme-button"
          onClick={() => setDarkMode(!darkMode)}
          title="Change theme"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <div className="notification-wrapper">
          <button
            className="nav-icon notification-button"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            🔔
          </button>

          {showNotifications && (
            <div className="notification-popup">
              <div className="notification-title">
                <h3>Notifications</h3>
                <span>2</span>
              </div>

              <div className="notification-item">
                <div className="notification-icon">📅</div>

                <div>
                  <strong>New Schedule Request</strong>
                  <p>A student requested a gym session.</p>
                  <small>Just now</small>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-icon">📢</div>

                <div>
                  <strong>University Notice</strong>
                  <p>Check the latest gym announcements.</p>
                  <small>Today</small>
                </div>
              </div>

              <button className="view-all-notifications">
                View all notifications
              </button>
            </div>
          )}
        </div>

        <button className="logout-btn">↪ Logout</button>
      </div>
    </header>
  );
}

export default CoachNavbar;
