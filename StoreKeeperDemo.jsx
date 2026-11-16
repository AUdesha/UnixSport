import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../css/StoreKeeperDemo.css";

const dateOffset = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const initialLoans = [
  { id: 1, student: "Nethmi Perera", regNo: "US2024-0119", item: "Badminton racket", borrowedAt: dateOffset(-2), dueAt: dateOffset(0), returnedAt: "" },
  { id: 2, student: "Ravindu Silva", regNo: "US2023-0874", item: "Basketball", borrowedAt: dateOffset(-6), dueAt: dateOffset(-2), returnedAt: "" },
  { id: 3, student: "Amaya Fernando", regNo: "US2024-0231", item: "Tennis racket", borrowedAt: dateOffset(-1), dueAt: dateOffset(3), returnedAt: "" },
  { id: 4, student: "Kavindu Jayasuriya", regNo: "US2022-0416", item: "Football", borrowedAt: dateOffset(-12), dueAt: dateOffset(-5), returnedAt: dateOffset(-6) },
  { id: 5, student: "Dinithi Wickramasinghe", regNo: "US2023-0528", item: "Volleyball", borrowedAt: dateOffset(-3), dueAt: dateOffset(1), returnedAt: "" },
];

const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString("en", {
  month: "short",
  day: "numeric",
});

const getStatus = (loan) => {
  if (loan.returnedAt) return "Returned";
  return loan.dueAt < dateOffset(0) ? "Overdue" : "On loan";
};

function StoreKeeperDemo() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [loans, setLoans] = useState(initialLoans);
  const [filter, setFilter] = useState("All loans");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ student: "", regNo: "", item: "", dueAt: "" });
  const [notice, setNotice] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const activeLoans = loans.filter((loan) => !loan.returnedAt);
  const overdueLoans = activeLoans.filter((loan) => getStatus(loan) === "Overdue");
  const visibleLoans = useMemo(() => loans.filter((loan) => {
    const matchesFilter = filter === "All loans"
      || (filter === "On loan" && getStatus(loan) === "On loan")
      || getStatus(loan) === filter;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${loan.student} ${loan.regNo} ${loan.item}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  }), [filter, loans, search]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoans((current) => [{ ...formData, id: Date.now(), borrowedAt: dateOffset(0), returnedAt: "" }, ...current]);
    setFormData({ student: "", regNo: "", item: "", dueAt: "" });
    setShowForm(false);
    setNotice("Loan recorded in this demo.");
  };

  const handleReturn = (loanId) => {
    setLoans((current) => current.map((loan) => loan.id === loanId ? { ...loan, returnedAt: dateOffset(0) } : loan));
    setNotice("Equipment marked as returned.");
  };

  return (
    <main className="store-demo-page" data-theme={darkMode ? "dark" : "light"}>
      <aside className="store-demo-sidebar">
        <Link className="store-demo-brand" to="/">Uni<span>X</span>Sport</Link>
        <p className="store-demo-side-label">WORKSPACE</p>
        <nav className="store-demo-nav" aria-label="Store keeper navigation">
          <a className="is-current" href="#overview"><span aria-hidden="true">▦</span> Dashboard</a>
          <a href="#loans"><span aria-hidden="true">↗</span> Equipment loans</a>
          <a href="#inventory"><span aria-hidden="true">▤</span> Inventory <small>24</small></a>
        </nav>
        <div className="store-demo-sidebar-foot">
          <div className="store-demo-avatar">SK</div>
          <div><strong>Store Keeper</strong><span>Demo account</span></div>
        </div>
      </aside>

      <section className="store-demo-main" id="overview">
        <header className="store-demo-topbar">
          <span>Store operations <span className="store-demo-divider">/</span> Dashboard</span>
          <div className="store-demo-top-actions">
            <div className="store-demo-notification-wrap">
              <button
                className="store-demo-icon-button"
                type="button"
                aria-label="Notifications"
                aria-expanded={showNotifications}
                title="Notifications"
                onClick={() => setShowNotifications((current) => !current)}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
                {overdueLoans.length > 0 && <span className="store-demo-notification-dot" />}
              </button>
              {showNotifications && (
                <div className="store-demo-notification-panel" role="dialog" aria-label="Notifications">
                  <strong>Notifications</strong>
                  {overdueLoans.length > 0 ? (
                    <p><span>{overdueLoans.length} overdue {overdueLoans.length === 1 ? "return" : "returns"}</span><small>{overdueLoans.map((loan) => loan.item).join(", ")} need follow-up.</small></p>
                  ) : <p><span>All caught up</span><small>No overdue equipment returns.</small></p>}
                </div>
              )}
            </div>
            <button
              className="store-demo-icon-button"
              type="button"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setDarkMode((current) => !current)}
            >
              {darkMode ? (
                <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z" /></svg>
              )}
            </button>
          </div>
        </header>

        <div className="store-demo-content">
          <div className="store-demo-title-row">
            <div>
              <p className="store-demo-eyebrow">SUNDAY, {new Date().toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</p>
              <h1>Equipment overview</h1>
              <p className="store-demo-subtitle">Track borrowed gear and keep every return on schedule.</p>
            </div>
            <button className="store-demo-primary" type="button" onClick={() => { setShowForm(!showForm); setNotice(""); }}>
              <span aria-hidden="true">+</span> Record a loan
            </button>
          </div>

          <div className="store-demo-stats" aria-label="Loan summary">
            <article className="store-demo-stat">
              <span className="store-demo-stat-icon green" aria-hidden="true">↗</span>
              <p>Currently borrowed</p><strong>{activeLoans.length.toString().padStart(2, "0")}</strong><small>Active equipment loans</small>
            </article>
            <article className="store-demo-stat">
              <span className="store-demo-stat-icon coral" aria-hidden="true">!</span>
              <p>Overdue returns</p><strong>{overdueLoans.length.toString().padStart(2, "0")}</strong><small>Needs follow-up</small>
            </article>
            <article className="store-demo-stat">
              <span className="store-demo-stat-icon blue" aria-hidden="true">✓</span>
              <p>Returned today</p><strong>{loans.filter((loan) => loan.returnedAt === dateOffset(0)).length.toString().padStart(2, "0")}</strong><small>Items checked in</small>
            </article>
            <article className="store-demo-stat">
              <span className="store-demo-stat-icon yellow" aria-hidden="true">▤</span>
              <p>Equipment items</p><strong>24</strong><small>Across 6 categories</small>
            </article>
          </div>

          {showForm && (
            <form className="store-demo-form" onSubmit={handleSubmit}>
              <div className="store-demo-form-heading"><div><strong>New equipment loan</strong><span>Enter the student and item details.</span></div><button type="button" aria-label="Close form" onClick={() => setShowForm(false)}>×</button></div>
              <label>Student name<input value={formData.student} onChange={(event) => setFormData({ ...formData, student: event.target.value })} required placeholder="Student full name" /></label>
              <label>Registration no.<input value={formData.regNo} onChange={(event) => setFormData({ ...formData, regNo: event.target.value })} required placeholder="US2024-0000" /></label>
              <label>Equipment<input value={formData.item} onChange={(event) => setFormData({ ...formData, item: event.target.value })} required placeholder="Equipment name" /></label>
              <label>Due date<input type="date" value={formData.dueAt} onChange={(event) => setFormData({ ...formData, dueAt: event.target.value })} required /></label>
              <button className="store-demo-primary" type="submit">Save loan</button>
            </form>
          )}

          {notice && <p className="store-demo-notice" role="status">{notice}</p>}

          <section className="store-demo-loans" id="loans">
            <div className="store-demo-loans-head">
              <div><h2>Recent loans</h2><p>Manage equipment currently in circulation.</p></div>
              <label className="store-demo-search"><span aria-hidden="true">⌕</span><input aria-label="Search loans" placeholder="Search student or equipment" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            </div>
            <div className="store-demo-filters" role="tablist" aria-label="Filter loans">
              {["All loans", "On loan", "Overdue", "Returned"].map((name) => (
                <button key={name} type="button" role="tab" aria-selected={filter === name} onClick={() => setFilter(name)}>{name}<span>{name === "All loans" ? loans.length : name === "On loan" ? activeLoans.length - overdueLoans.length : name === "Overdue" ? overdueLoans.length : loans.length - activeLoans.length}</span></button>
              ))}
            </div>
            <div className="store-demo-table-wrap">
              <table className="store-demo-table">
                <thead><tr><th>STUDENT</th><th>EQUIPMENT</th><th>DATE BORROWED</th><th>DUE DATE</th><th>STATUS</th><th><span className="store-demo-sr-only">Action</span></th></tr></thead>
                <tbody>
                  {visibleLoans.length ? visibleLoans.map((loan) => {
                    const status = getStatus(loan);
                    return <tr key={loan.id}>
                      <td><div className="store-demo-student"><span>{loan.student.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div><strong>{loan.student}</strong><small>{loan.regNo}</small></div></div></td>
                      <td>{loan.item}</td><td>{formatDate(loan.borrowedAt)}</td><td>{formatDate(loan.dueAt)}</td>
                      <td><span className={`store-demo-status ${status.toLowerCase().replace(" ", "-")}`}><i />{status}</span></td>
                      <td>{loan.returnedAt ? <span className="store-demo-dash">—</span> : <button className="store-demo-return" type="button" onClick={() => handleReturn(loan.id)}>Mark returned</button>}</td>
                    </tr>;
                  }) : <tr><td className="store-demo-empty" colSpan="6">No loans match this view.</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="store-demo-table-foot">Showing <strong>{visibleLoans.length}</strong> of <strong>{loans.length}</strong> loans <span>Sample data for preview</span></footer>
          </section>
          <p className="store-demo-disclaimer">Demo workspace · Changes are temporary and won’t be saved.</p>
        </div>
      </section>
    </main>
  );
}

export default StoreKeeperDemo;