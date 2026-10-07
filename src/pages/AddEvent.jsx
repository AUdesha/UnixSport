import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/AddEvent.css";

function AddEvent() {
  const navigate = useNavigate();
  const [student] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("student") || "null");
    } catch {
      return null;
    }
  });
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!student) navigate("/login", { replace: true, state: { userType: "Student" } });
  }, [navigate, student]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/students/events", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: eventTitle, eventDate, description }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        navigate("/login", {
          replace: true,
          state: { userType: "Student", errorMessage: "Please log in again before saving an event." },
        });
        return;
      }
      if (!response.ok) throw new Error(data.message || "Unable to save event.");

      navigate("/student-dashboard", {
        state: { successMessage: "Event saved successfully." },
      });
    } catch (saveError) {
      setError(saveError.message || "Unable to save event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="event-container">

      <div className="event-card">

        <h2>Add Event</h2>

        {error && <p role="alert">{error}</p>}

        <form onSubmit={handleSubmit}>

          <label htmlFor="event-title">Event title</label>
          <input
            id="event-title"
            type="text"
            placeholder="Enter Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            maxLength={120}
            required
          />

          <label htmlFor="event-date">Event date</label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />

          <label htmlFor="event-description">Description</label>
          <textarea
            id="event-description"
            rows="5"
            placeholder="Enter Event Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={4000}
            required
          ></textarea>

          <button type="submit" className="save-btn" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Event"}
          </button>

        </form>

        <Link to="/student-dashboard" className="back-btn">
          Back to Dashboard
        </Link>

      </div>

    </div>
  );
}

export default AddEvent;