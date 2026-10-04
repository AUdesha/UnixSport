import { NavLink } from "react-router-dom";
import "./CoachDashboard.css";

function CoachSidebar() {
  const sidebarLinkClass = ({ isActive }) =>
    `sidebar-item${isActive ? " active" : ""}`;

  return (
    <aside className="coach-sidebar">
      <nav className="sidebar-menu">
        <NavLink to="/coach-dashboard" className={sidebarLinkClass}>
          <span>⌂</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/pending-requests" className={sidebarLinkClass}>
          <span>◷</span>
          <span>Pending Requests</span>
        </NavLink>

        <button className="sidebar-item">
          <span>↶</span>
          <span>Request History</span>
        </button>

        <NavLink to="/schedule-calendar" className={sidebarLinkClass}>
          <span>▦</span>
          <span>Schedule Calendar</span>
        </NavLink>

        <button className="sidebar-item">
          <span>⚑</span>
          <span>Notices & Broadcasts</span>
        </button>
      </nav>

      <button className="sidebar-logout">↪ Logout</button>
    </aside>
  );
}

export default CoachSidebar;
