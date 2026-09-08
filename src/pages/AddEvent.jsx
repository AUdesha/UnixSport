import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/AddEvent.css";

function AddEvent() {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!eventTitle || !eventDate || !description) {
      alert("Please fill all fields.");
      return;
    }

    alert("Event Saved Successfully!");

    setEventTitle("");
    setEventDate("");
    setDescription("");
  };

  return (
    <div className="event-container">

      <div className="event-card">

        <h2>Add Event</h2>

        <form onSubmit={handleSubmit}>

          <label></label>
          <input
            type="text"
            placeholder="Enter Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            required
          />

          <label></label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />

          <label></label>
          <textarea
            rows="5"
            placeholder="Enter Event Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>

          <button type="submit" className="save-btn">
            Save Event
          </button>

        </form>

        <Link to="/student-dashboard">
          <button className="back-btn">
            Back to Dashboard
          </button>
        </Link>

      </div>

    </div>
  );
}

export default AddEvent;