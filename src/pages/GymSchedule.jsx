import { Link } from "react-router-dom";
import "../css/GymSchedule.css";

function GymSchedule() {

  const schedules = [
    {
      date: "2026-07-15",
      time: "08:00 AM",
      status: "Approved"
    },
    {
      date: "2026-07-18",
      time: "10:00 AM",
      status: "Pending"
    },
    {
      date: "2026-07-20",
      time: "02:00 PM",
      status: "Rejected"
    }
  ];

  return (
    <div className="gym-page">

      {/* Header */}

      <header className="gym-header">

        <div className="logo">
          UniXSport
        </div>

        <nav>
          <ul className="nav-menu">

            <li>
              <Link to="/student-dashboard">
                Dashboard
              </Link>
            </li>

            <li>
              <Link to="/gym">
                Gym
              </Link>
            </li>

            <li>
              <Link to="/equipment">
                Equipment
              </Link>
            </li>

            <li>
              <Link to="/notifications">
                🔔
              </Link>
            </li>

            <li>
              <Link to="/profile">
                👤
              </Link>
            </li>

          </ul>
        </nav>

      </header>

      {/* Body */}

      <div className="gym-container">

        <h2>Student Gym Schedule</h2>

        <div className="status-cards">

          <div className="card approved">
            Approved : 1
          </div>

          <div className="card pending">
            Pending : 1
          </div>

          <div className="card rejected">
            Rejected : 1
          </div>

        </div>

        <table>

          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>View</th>
            </tr>
          </thead>

          <tbody>

            {schedules.map((schedule, index) => (
              <tr key={index}>

                <td>{schedule.date}</td>

                <td>{schedule.time}</td>

                <td>{schedule.status}</td>

                <td>
                  <Link to="/approved-schedule">
                    View
                  </Link>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

        <div className="button-group">

          <Link to="/workout-plan">
            <button>
              Current Approved Schedule
            </button>
          </Link>

        <Link to="/request-schedule">
    <button className="request-btn">
        Request Schedule
    </button>
</Link>

        </div>

      </div>

    </div>
  );
}

export default GymSchedule;