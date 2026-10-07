import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Notifications.css";
import "../css/StudentDashboard.css";

const formatDate = (value) => {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function Notifications() {
  const navigate = useNavigate();
  const [student] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("student") || "null");
    } catch {
      return null;
    }
  });
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingNotice, setUpdatingNotice] = useState(null);

  useEffect(() => {
    if (!student) {
      navigate("/login", { replace: true, state: { userType: "Student" } });
      return undefined;
    }

    let isCurrent = true;
    fetch("/api/students/notices")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to load notifications.");
        if (isCurrent) setNotices(data.notices || []);
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError.message || "Unable to load notifications.");
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [navigate, student]);

  const unreadCount = notices.filter((notice) => !notice.readAt).length;
  const visibleNotices = filter === "unread" ? notices.filter((notice) => !notice.readAt) : notices;

  const markAsRead = async (noticeId) => {
    setUpdatingNotice(noticeId);
    setError("");

    try {
      const response = await fetch(`/api/students/notices/${noticeId}/read`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to update notification.");
      setNotices((current) => current.map((notice) =>
        notice.id === noticeId ? { ...notice, readAt: new Date().toISOString() } : notice
      ));
    } catch (readError) {
      setError(readError.message || "Unable to update notification.");
    } finally {
      setUpdatingNotice(null);
    }
  };

  return (
    <main className="notifications-page">
      <header className="dashboard-header">
        <div className="logo">UniXSport</div>
        <nav aria-label="Student navigation">
          <ul className="nav-menu">
            <li><Link to="/student-dashboard">Dashboard</Link></li>
            <li><Link to="/gym">Gym</Link></li>
            <li><Link to="/equipment">Equipment</Link></li>
            <li>
              <Link to="/notifications" aria-current="page" aria-label={`Notifications, ${unreadCount} unread`}>
                <span aria-hidden="true">🔔</span>
                {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
              </Link>
            </li>
            <li><Link to="/profile">👤</Link></li>
          </ul>
        </nav>
      </header>

      <section className="notifications-content">
        <div className="notifications-title-row">
          <div>
            <h1>Notifications</h1>
            <p>Notices from your Coach and university Admin.</p>
          </div>
          <span className="notifications-unread">{unreadCount} unread</span>
        </div>

        <div className="notifications-filters" role="group" aria-label="Filter notifications">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            All notices
          </button>
          <button type="button" aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>
            Unread
          </button>
        </div>

        {error && <p className="notifications-error" role="alert">{error}</p>}

        {loading ? (
          <p className="notifications-empty">Loading notifications...</p>
        ) : visibleNotices.length === 0 ? (
          <p className="notifications-empty">
            {filter === "unread" ? "You have no unread notices." : "No notices have been sent yet."}
          </p>
        ) : (
          <div className="notice-list">
            {visibleNotices.map((notice) => (
              <article className={`notice-item${notice.readAt ? " is-read" : " is-unread"}`} key={notice.id}>
                <div className="notice-item-heading">
                  <div>
                    <h2>{notice.title}</h2>
                    <p className="notice-meta">{notice.senderRole} · {formatDate(notice.sentAt)}</p>
                  </div>
                  {!notice.readAt && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notice.id)}
                      disabled={updatingNotice === notice.id}
                    >
                      {updatingNotice === notice.id ? "Saving..." : "Mark as read"}
                    </button>
                  )}
                </div>
                <p className="notice-message">{notice.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Notifications;