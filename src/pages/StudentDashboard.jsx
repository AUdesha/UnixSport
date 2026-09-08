import { Link } from "react-router-dom";
import "../css/StudentDashboard.css";

function StudentDashboard() {
  const userName = "Udesha"; // Later get from database

  return (
    <div className="dashboard-container">

      {/* Header */}

      <header className="dashboard-header">

        <div className="logo">
          UniXSport
        </div>

        <nav>
          <ul className="nav-menu">

            <li>
              <Link to="/student-dashboard">Dashboard</Link>
            </li>

            <li>
              <Link to="/gym">Gym</Link>
            </li>

            <li>
              <Link to="/equipment">Equipment</Link>
            </li>

            <li>
              <Link to="/notifications">🔔</Link>
            </li>

            <li>
              <Link to="/profile">👤</Link>
            </li>

          </ul>
        </nav>

      </header>

      {/* Welcome Section */}

      <div className="welcome-card">
        <h2>Welcome, {userName}</h2>
        <p>
          Manage your gym activities, sports equipment,
          and university events.
        </p>
      </div>

      {/* Calendar Section */}

      <div className="calendar-card">

        <div className="calendar-header">
          <h3>Event Calendar</h3>

          <Link to="/add-event">
            <button className="add-event-btn">
              + Add Event
            </button>
          </Link>

        </div>

        <input
          type="date"
          className="calendar-input"
        />

      </div>

    </div>
  );
}

export default StudentDashboard;