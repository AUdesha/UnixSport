import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/EquipmentHistory.css";

const formatDate = (value) => {
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function StoreKeeperDashboard() {
  const navigate = useNavigate();
  const [storekeeper] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("storekeeper") || "null");
    } catch {
      return null;
    }
  });
  const [loans, setLoans] = useState([]);
  const [formData, setFormData] = useState({ regNo: "", itemName: "", dueAt: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [updatingLoan, setUpdatingLoan] = useState(null);

  useEffect(() => {
    if (!storekeeper) {
      navigate("/login", { replace: true, state: { userType: "Store Keeper" } });
      return undefined;
    }

    let isCurrent = true;
    fetch("/api/storekeeper/equipment-loans")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to load equipment loans.");
        if (isCurrent) setLoans(data.loans || []);
      })
      .catch((loadError) => {
        if (isCurrent) setError(loadError.message || "Unable to load equipment loans.");
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [navigate, refresh, storekeeper]);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/storekeeper/equipment-loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to record equipment loan.");

      setFormData({ regNo: "", itemName: "", dueAt: "" });
      setRefresh((current) => current + 1);
    } catch (submitError) {
      setError(submitError.message || "Unable to record equipment loan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async (loanId) => {
    setError("");
    setUpdatingLoan(loanId);

    try {
      const response = await fetch(`/api/storekeeper/equipment-loans/${loanId}/return`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to record equipment return.");
      setRefresh((current) => current + 1);
    } catch (returnError) {
      setError(returnError.message || "Unable to record equipment return.");
    } finally {
      setUpdatingLoan(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("storekeeper");
      localStorage.removeItem("student");
      localStorage.removeItem("staff");
      navigate("/login", { replace: true, state: { userType: "Store Keeper" } });
    }
  };

  return (
    <main className="equipment-page">
      <header className="equipment-header">
        <strong>UniXSport · Store Keeper</strong>
        <nav aria-label="Store Keeper navigation">
          <Link to="/storekeeper-dashboard">Equipment loans</Link>
          <button type="button" onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <section className="equipment-content">
        <h1>Equipment loans</h1>
        <p className="equipment-student">Record a loan by student registration number, then mark it returned when received.</p>

        <form className="equipment-loan-form" onSubmit={handleSubmit}>
          <label>
            Student registration number
            <input name="regNo" value={formData.regNo} onChange={handleChange} required maxLength={50} />
          </label>
          <label>
            Equipment
            <input name="itemName" value={formData.itemName} onChange={handleChange} required maxLength={120} />
          </label>
          <label>
            Due date
            <input type="date" name="dueAt" value={formData.dueAt} onChange={handleChange} />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Recording..." : "Record borrowing"}
          </button>
        </form>

        {error && <p className="equipment-message equipment-error" role="alert">{error}</p>}

        <div className="equipment-table-wrap">
          <table className="equipment-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Registration number</th>
                <th scope="col">Equipment</th>
                <th scope="col">Borrowed</th>
                <th scope="col">Due</th>
                <th scope="col">Returned</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7">Loading loans...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan="7">No equipment loans have been recorded.</td></tr>
              ) : loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.studentName}</td>
                  <td>{loan.regNo}</td>
                  <td>{loan.itemName}</td>
                  <td>{formatDate(loan.borrowedAt)}</td>
                  <td>{formatDate(loan.dueAt)}</td>
                  <td>{formatDate(loan.returnedAt)}</td>
                  <td>
                    {loan.returnedAt ? "Complete" : (
                      <button
                        type="button"
                        onClick={() => handleReturn(loan.id)}
                        disabled={updatingLoan === loan.id}
                      >
                        {updatingLoan === loan.id ? "Saving..." : "Mark returned"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default StoreKeeperDashboard;