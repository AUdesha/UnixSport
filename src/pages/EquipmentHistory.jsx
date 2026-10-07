import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/EquipmentHistory.css";
import "../css/StudentDashboard.css";

const formatDate = (value) => {
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function EquipmentHistory() {
  const navigate = useNavigate();
  const [student] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("student") || "null");
    } catch {
      return null;
    }
  });
  const [loans, setLoans] = useState([]);
  const [activeTab, setActiveTab] = useState("borrowed");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) {
      navigate("/login", { replace: true, state: { userType: "Student" } });
      return undefined;
    }

    let isCurrent = true;
    fetch("/api/students/equipment-history")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to load equipment history.");
        if (isCurrent) setLoans(data.loans || []);
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError.message || "Unable to load equipment history.");
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [navigate, student]);

  const returnedLoans = loans.filter((loan) => loan.returnedAt);
  const visibleLoans = activeTab === "returned" ? returnedLoans : loans;

  return (
    <main className="equipment-page">
      <header className="dashboard-header">
        <div className="logo">UniXSport</div>
        <nav aria-label="Student navigation">
          <ul className="nav-menu">
            <li><Link to="/student-dashboard">Dashboard</Link></li>
            <li><Link to="/gym">Gym</Link></li>
            <li><Link to="/equipment" aria-current="page">Equipment</Link></li>
            <li><Link to="/notifications">🔔</Link></li>
            <li><Link to="/profile">👤</Link></li>
          </ul>
        </nav>
      </header>

      <section className="equipment-content">
        <h1>Equipment History</h1>
        <p className="equipment-student">{student?.fullName} · {student?.regNo}</p>

        <div className="equipment-tabs" role="tablist" aria-label="Equipment history type">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "borrowed"}
            onClick={() => setActiveTab("borrowed")}
          >
            Borrowing history ({loans.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "returned"}
            onClick={() => setActiveTab("returned")}
          >
            Return history ({returnedLoans.length})
          </button>
        </div>

        {error && <p className="equipment-message equipment-error" role="alert">{error}</p>}

        <div className="equipment-table-wrap">
          <table className="equipment-table">
            <thead>
              <tr>
                <th scope="col">Equipment</th>
                <th scope="col">Borrowed</th>
                {activeTab === "returned" ? (
                  <th scope="col">Returned</th>
                ) : (
                  <>
                    <th scope="col">Due</th>
                    <th scope="col">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={activeTab === "returned" ? 3 : 4}>Loading equipment history...</td></tr>
              ) : visibleLoans.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "returned" ? 3 : 4}>
                    {activeTab === "returned" ? "No returned equipment yet." : "No equipment borrowing history yet."}
                  </td>
                </tr>
              ) : visibleLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.itemName}</td>
                  <td>{formatDate(loan.borrowedAt)}</td>
                  {activeTab === "returned" ? (
                    <td>{formatDate(loan.returnedAt)}</td>
                  ) : (
                    <>
                      <td>{formatDate(loan.dueAt)}</td>
                      <td>{loan.returnedAt ? "Returned" : "Borrowed"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default EquipmentHistory;