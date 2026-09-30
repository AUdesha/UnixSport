import "./PendingRequests.css";
import "./CoachDashboard.css";
import CoachNavbar from "./CoachNavbar";
import CoachSidebar from "./CoachSidebar";

function PendingRequests() {
  return (
    <div className="coach-app dark-mode">
      <CoachNavbar />

      <div className="coach-body">
        <CoachSidebar />

        <main className="coach-main pending-page">

      <h1>Pending Requests</h1>

      {/* Search and Filter */}
      <div className="request-controls">

        <div className="search-box">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search by student name or ID..."
          />
        </div>

        <select className="time-filter">
          <option>All Time Slots</option>
          <option>Morning</option>
          <option>Afternoon</option>
          <option>Evening</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="requests-table">

        <div className="table-header">
          <span>Student Name</span>
          <span>Student ID</span>
          <span>Preferred Time</span>
          <span>Preferred Coach</span>
          <span>Slot Availability</span>
          <span>Submitted At</span>
          <span>Actions</span>
        </div>

        {/* Empty state */}
        <div className="empty-request">

          <div className="empty-icon">
            ▱
          </div>

          <h3>No pending requests</h3>

        </div>

      </div>

        </main>
      </div>
    </div>
  );
}

export default PendingRequests;