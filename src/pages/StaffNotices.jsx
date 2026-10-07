import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Notifications.css";

const formatDate = (value) => {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function StaffNotices() {
  const navigate = useNavigate();
  const [staff] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("staff") || "null");
    } catch {
      return null;
    }
  });
  const [notices, setNotices] = useState([]);
  const [formData, setFormData] = useState({ title: "", message: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!staff) {
      navigate("/login", { replace: true, state: { userType: "Gym Coach" } });
      return undefined;
    }

    let isCurrent = true;
    fetch("/api/staff/notices")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to load notices.");
        if (isCurrent) setNotices(data.notices || []);
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError.message || "Unable to load notices.");
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [navigate, staff]);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/staff/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to send notice.");

      setNotices((current) => [data.notice, ...current]);
      setFormData({ title: "", message: "" });
      setSuccess("Notice sent to all students.");
    } catch (submitError) {
      setError(submitError.message || "Unable to send notice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      setError("Could not contact the server to end this session.");
    } finally {
      localStorage.removeItem("staff");
      localStorage.removeItem("student");
      localStorage.removeItem("storekeeper");
      navigate("/login", { replace: true, state: { userType: staff?.role || "Gym Coach" } });
    }
  };

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <strong>UniXSport · {staff?.role || "Staff"}</strong>
        <nav aria-label="Staff navigation">
          <Link to="/staff-notices">Notices</Link>
          <button type="button" onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <section className="notifications-content">
        <h1>Student notices</h1>
        <p className="staff-notices-intro">Publish a notice for all students. Students will see it in their Notifications tab.</p>

        <form className="notice-compose" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={120}
              required
            />
          </label>
          <label>
            Message
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={5}
              maxLength={4000}
              required
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send to all students"}
          </button>
        </form>

        {error && <p className="notifications-error" role="alert">{error}</p>}
        {success && <p className="notifications-success" role="status">{success}</p>}

        <h2 className="staff-notices-subheading">Published notices</h2>
        {loading ? (
          <p className="notifications-empty">Loading notices...</p>
        ) : notices.length === 0 ? (
          <p className="notifications-empty">No notices have been sent.</p>
        ) : (
          <div className="notice-list">
            {notices.map((notice) => (
              <article className="notice-item" key={notice.id}>
                <h3>{notice.title}</h3>
                <p className="notice-meta">{notice.senderRole} · {formatDate(notice.sentAt)}</p>
                <p className="notice-message">{notice.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default StaffNotices;