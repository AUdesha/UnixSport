import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/RequestSchedule.css";

const STORAGE_KEY = "gym-schedule-requests";
const SLOT_CAPACITY = 30;

function getStoredRequests() {
  const storedRequests = localStorage.getItem(STORAGE_KEY);
  const requests = storedRequests === null ? [] : JSON.parse(storedRequests);

  if (!Array.isArray(requests)) {
    throw new Error(`Expected "${STORAGE_KEY}" to contain an array.`);
  }

  return requests;
}

function RequestSchedule() {
  const navigate = useNavigate();

  const [playSport, setPlaySport] = useState("Yes");
  const [injury, setInjury] = useState("No");
  const [selectedSlots, setSelectedSlots] = useState({});

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    
  ];

  const timeSlots = [
    "07-08",
    "08-09",
    "09-10",
    "10-11",
    "12-13",
    "14-15",
    "16-17",
    "17-18",
    "18-19",
    "19-20",
  ];

  const requests = getStoredRequests();

  const handleSlotClick = (day, slot) => {
    const current = selectedSlots[day] || [];

    if (current.includes(slot)) {
      setSelectedSlots((previousSlots) => ({
        ...previousSlots,
        [day]: current.filter((selectedSlot) => selectedSlot !== slot),
      }));
      return;
    }

    const slotCount = getStoredRequests().filter(
      (request) => request.day === day && request.slot === slot
    ).length;

    if (slotCount >= SLOT_CAPACITY) {
      alert("This time slot is full.");
      return;
    }

    if (current.length >= 2) {
      alert("You can only select two time slots for one day.");
      return;
    }

    setSelectedSlots((previousSlots) => ({
      ...previousSlots,
      [day]: [...(previousSlots[day] || []), slot],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedRequests = getStoredRequests();

    Object.entries(selectedSlots).forEach(([day, slots]) => {
      slots.forEach((slot) => {
        updatedRequests.push({
          id: Date.now() + Math.random(),
          day,
          slot,
          status: "pending",
        });
      });
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests));

    alert("Gym Schedule Request Submitted Successfully!");

    navigate("/gym");
  };

  return (
    <div className="request-container">
      <div className="request-card">

        <h2>Student Information</h2>

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

  <div className="form-group">
    <label>Name</label>
    <input type="text" required />
  </div>

  <div className="form-group">
    <label>Age</label>
    <input
      type="number"
      min="16"
      max="80"
      required
    />
  </div>

  <div className="form-group">
    <label>Weight (kg)</label>
    <input
      type="number"
      min="20"
      max="200"
      required
    />
  </div>

  <div className="form-group">
    <label>Height (cm)</label>
    <input
      type="number"
      min="100"
      max="250"
      required
    />
  </div>

</div>

          <label>Do you play any sport?</label>

          <div className="radio-group">

            <label>
              <input
                type="radio"
                value="Yes"
                checked={playSport === "Yes"}
                onChange={(e) => setPlaySport(e.target.value)}
              />
              Yes
            </label>

            <label>
              <input
                type="radio"
                value="No"
                checked={playSport === "No"}
                onChange={(e) => setPlaySport(e.target.value)}
              />
              No
            </label>

          </div>

          {playSport === "Yes" && (
            <>
              <label>What sport do you play?</label>
              <input type="text" required />
            </>
          )}

          <h3>Injury Information</h3>

          <label>Do you have any injury?</label>

          <div className="radio-group">

            <label>
              <input
                type="radio"
                value="Yes"
                checked={injury === "Yes"}
                onChange={(e) => setInjury(e.target.value)}
              />
              Yes
            </label>

            <label>
              <input
                type="radio"
                value="No"
                checked={injury === "No"}
                onChange={(e) => setInjury(e.target.value)}
              />
              No
            </label>

          </div>

          {injury === "Yes" && (
            <>
              <label>Provide Details</label>
              <textarea rows="4"></textarea>
            </>
          )}
<h3>Schedule Your Gym Time</h3>

<div className="legend">

  <span className="legend-item">
    <span className="legend-box available"></span>
    Available
  </span>

  <span className="legend-item">
    <span className="legend-box selected"></span>
    Selected
  </span>

  <span className="legend-item">
    <span className="legend-box booked"></span>
    Booked
  </span>

</div>

<table className="schedule-table">

            <thead>
              <tr>
                <th>Day</th>

                {timeSlots.map((slot) => (
                  <th key={slot}>{slot}</th>
                ))}

              </tr>
            </thead>

            <tbody>

              {days.map((day) => (

                <tr key={day}>

                  <td>{day}</td>

                  {timeSlots.map((slot) => {

                    const booked =
                      requests.filter(
                        (request) =>
                          request.day === day && request.slot === slot
                      ).length >= SLOT_CAPACITY;

                    const selected =
                      selectedSlots[day]?.includes(slot);

                    return (
                      <td
                        key={slot}
                        className={
                          booked
                            ? "booked"
                            : selected
                            ? "selected"
                            : "available"
                        }
                        onClick={() =>
                          handleSlotClick(day, slot)
                        }
                      >
                        {booked ? "X" : ""}
                      </td>
                    );
                  })}

                </tr>

              ))}

            </tbody>

          </table>

          <button
            type="submit"
            className="submit-btn"
          >
            Submit Request
          </button>

        </form>

      </div>
    </div>
  );
}

export default RequestSchedule;