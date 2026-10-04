import { useEffect, useState } from "react";
import "./CoachDashboard.css";
import "./src/pages/ScheduleCalendar.css";
import CoachNavbar from "./CoachNavbar";
import CoachSidebar from "./CoachSidebar";

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

function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState(getStoredRequests);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("coach-theme") !== "light"
  );

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

  const toggleTheme = () => {
    setDarkMode((isDarkMode) => {
      const nextDarkMode = !isDarkMode;
      localStorage.setItem("coach-theme", nextDarkMode ? "dark" : "light");
      return nextDarkMode;
    });
  };

  useEffect(() => {
    const syncRequests = (event) => {
      if (event.type !== "storage" || event.key === STORAGE_KEY || event.key === null) {
        setRequests(getStoredRequests());
      }
    };

    window.addEventListener("storage", syncRequests);
    window.addEventListener("pageshow", syncRequests);
    window.addEventListener("focus", syncRequests);

    return () => {
      window.removeEventListener("storage", syncRequests);
      window.removeEventListener("pageshow", syncRequests);
      window.removeEventListener("focus", syncRequests);
    };
  }, []);

  const getWeekStart = (date) => {
    const d = new Date(date);
    const daysSinceMonday = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - daysSinceMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = getWeekStart(currentDate);

  const weekDays = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const goPreviousWeek = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 7);
    setCurrentDate(date);
  };

  const goNextWeek = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 7);
    setCurrentDate(date);
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className={`coach-app ${darkMode ? "dark-mode" : "light-mode"}`}>
      <CoachNavbar darkMode={darkMode} onToggleTheme={toggleTheme} />
      <div className="coach-body">
        <CoachSidebar />
        <main className="coach-main schedule-calendar-main">
          <div className="schedule-page">
            <div className="schedule-main">

        <h1>Schedule Calendar</h1>

        <div className="calendar-navigation">

          <button onClick={goPreviousWeek}>
            ‹ Previous Week
          </button>

          <div className="week-title">
            <strong>
              {formatDate(weekDays[0])} - {formatDate(weekDays[4])}
            </strong>

            <button className="today-button" onClick={goToday}>
              📅 Today
            </button>
          </div>

          <button onClick={goNextWeek}>
            Next Week ›
          </button>

        </div>

        <div className="calendar-grid">

          {weekDays.map((date) => {
            const dayName = date.toLocaleDateString("en-US", {
              weekday: "long",
            });

            return (
              <div
                className={`day-column ${isToday(date) ? "today-column" : ""}`}
                key={date.toISOString()}
              >

                <div className="day-header">
                  <div className="day-name">
                    {date.toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </div>

                  <div className="day-number">
                    {date.getDate()}

                    {isToday(date) && (
                      <span className="today-label">Today</span>
                    )}
                  </div>
                </div>

                <div className="slots">
                  {timeSlots.map((slot) => {
                    const count = requests.filter(
                      (request) =>
                        request?.day === dayName && request?.slot === slot
                    ).length;
                    const isFull = count >= SLOT_CAPACITY;

                    return (
                      <div
                        className={`calendar-slot${isFull ? " calendar-slot-full" : ""}`}
                        key={slot}
                      >
                        <strong>{slot}</strong>
                        <span>
                          {count}/{SLOT_CAPACITY} students
                        </span>
                        {isFull && <span className="full-label">FULL</span>}
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}

        </div>

            </div>
        </div>
      </main>
      </div>
    </div>
  );
}

export default ScheduleCalendar;