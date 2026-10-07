import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../css/StudentDashboard.css";

const formatEventDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem("student") || "null");
  const userName = student?.fullName?.split(" ")[0] || "Student";
  const [unreadCount, setUnreadCount] = useState(0);
  const [events, setEvents] = useState([]);
  const [equipmentLoans, setEquipmentLoans] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!location.state?.successMessage) return undefined;

    const timeout = window.setTimeout(() => {
      navigate(location.pathname, { replace: true, state: null });
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [location.pathname, location.state?.successMessage, navigate]);

  useEffect(() => {
    let isCurrent = true;
    const refreshUnreadCount = () => {
      fetch("/api/students/notices")
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          if (isCurrent && data) setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    };

    refreshUnreadCount();
    const interval = window.setInterval(refreshUnreadCount, 30000);

    return () => {
      isCurrent = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    fetch("/api/students/events")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          navigate("/login", {
            replace: true,
            state: { userType: "Student", errorMessage: "Please log in again to view your events." },
          });
          return;
        }
        if (!response.ok) throw new Error(data.message || "Unable to load your events.");
        if (isCurrent) setEvents(data.events || []);
      })
      .catch((loadError) => {
        if (isCurrent) setEventsError(loadError.message || "Unable to load your events.");
      })
      .finally(() => {
        if (isCurrent) setEventsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [navigate]);

  useEffect(() => {
    let isCurrent = true;
    fetch("/api/students/equipment-history")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          navigate("/login", {
            replace: true,
            state: { userType: "Student", errorMessage: "Please log in again to view equipment return dates." },
          });
          return;
        }
        if (!response.ok) throw new Error(data.message || "Unable to load equipment return dates.");
        if (isCurrent) setEquipmentLoans(data.loans || []);
      })
      .catch((loadError) => {
        if (isCurrent) setEventsError(loadError.message || "Unable to load equipment return dates.");
      })
      .finally(() => {
        if (isCurrent) setEquipmentLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [navigate]);

  const loansWithDueDate = equipmentLoans.filter((loan) => loan.dueAt);
  const calendarItems = [
    ...events.map((event) => ({
      id: `event-${event.id}`,
      date: event.eventDate,
      kind: "Event",
      title: event.title,
      description: event.description,
      status: event.eventDate < new Date().toISOString().slice(0, 10) ? "Past" : "Upcoming",
    })),
    ...loansWithDueDate.map((loan) => ({
      id: `equipment-${loan.id}`,
      date: (loan.returnedAt || loan.dueAt).slice(0, 10),
      kind: "Equipment return",
      title: loan.itemName,
      description: loan.returnedAt
        ? `Returned on ${formatEventDate(loan.returnedAt.slice(0, 10))}`
        : "Please return this equipment by the due date.",
      status: loan.returnedAt
        ? "Returned"
        : loan.dueAt.slice(0, 10) < new Date().toISOString().slice(0, 10) ? "Overdue" : "Return due",
    })),
  ].sort((first, second) => first.date.localeCompare(second.date));
  const visibleItems = selectedDate
    ? calendarItems.filter((item) => item.date === selectedDate)
    : calendarItems;
  const calendarLoading = eventsLoading || equipmentLoading;

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
              <Link
                to="/notifications"
                className="notification-link"
                aria-label={`Notifications, ${unreadCount} unread`}
              >
                <span aria-hidden="true">🔔</span>
                {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
              </Link>
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
          <div>
            <h3>Event Calendar</h3>
            <p className="event-calendar-caption">
              {events.length} {events.length === 1 ? "event" : "events"} · {loansWithDueDate.length} {loansWithDueDate.length === 1 ? "equipment return date" : "equipment return dates"}
            </p>
          </div>

          <Link to="/add-event">
            <button className="add-event-btn">
              + Add Event
            </button>
          </Link>

        </div>

        {location.state?.successMessage && (
          <p className="event-feedback" role="status">{location.state.successMessage}</p>
        )}

        <label className="event-date-filter">
          Filter by date
          <input
            type="date"
            className="calendar-input"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>

        {eventsError && <p className="event-load-error" role="alert">{eventsError}</p>}

        <div className="dashboard-event-list">
          {calendarLoading ? (
            <p className="dashboard-events-empty">Loading events...</p>
          ) : visibleItems.length === 0 ? (
            <p className="dashboard-events-empty">
              {selectedDate ? "No events or equipment returns on this date." : "No events or equipment return dates yet."}
            </p>
          ) : visibleItems.map((item) => (
            <article className={`dashboard-event${item.kind === "Equipment return" ? " is-equipment-return" : ""}`} key={item.id}>
              <time className="dashboard-event-date" dateTime={item.date}>
                {formatEventDate(item.date)}
              </time>
              <div className="dashboard-event-details">
                <span className="dashboard-event-kind">{item.kind}</span>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
              <span className={`dashboard-event-status${item.status === "Past" || item.status === "Returned" ? " is-past" : ""}${item.status === "Overdue" ? " is-overdue" : ""}`}>
                {item.status}
              </span>
            </article>
          ))}
        </div>

      </div>

    </div>
  );
}

export default StudentDashboard;