import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/StoreKeeperDashboard.css";
import { buildMonthlyReportPdf } from "../monthlyReportPdf.js";

const api = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request could not be completed.");
  return data;
};

const today = () => new Date().toISOString().slice(0, 10);
const monthNow = () => today().slice(0, 7);
const formatDate = (value) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString() : "-";
const sections = ["Dashboard", "Inventory", "Issue / return", "RFID", "History", "Notices", "Reports"];

function StoreKeeperDashboard() {
  const navigate = useNavigate();
  const [storekeeper] = useState(() => {
    try { return JSON.parse(localStorage.getItem("storekeeper") || "null"); } catch { return null; }
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [section, setSection] = useState("Dashboard");
  const [categories, setCategories] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loans, setLoans] = useState([]);
  const [notices, setNotices] = useState([]);
  const [report, setReport] = useState([]);
  const [reportMonth, setReportMonth] = useState(monthNow());
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [equipmentForm, setEquipmentForm] = useState({ categoryId: "", itemCode: "", name: "" });
  const [editItem, setEditItem] = useState(null);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentMatches, setStudentMatches] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState([]);
  const [dueAt, setDueAt] = useState(today());
  const [scanValue, setScanValue] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [rfidStudentId, setRfidStudentId] = useState("");
  const [rfidEquipmentId, setRfidEquipmentId] = useState("");
  const [rfidTag, setRfidTag] = useState("");
  const [serialSupported] = useState(() => typeof navigator !== "undefined" && "serial" in navigator);
  const [scannerStatus, setScannerStatus] = useState("Disconnected");
  const [scannerBaudRate, setScannerBaudRate] = useState("9600");
  const scannerRef = useRef(null);

  const activeLoans = loans.filter((loan) => !loan.returnedAt);
  const overdueLoans = activeLoans.filter((loan) => loan.dueAt && loan.dueAt.slice(0, 10) < today());
  const availableEquipment = useMemo(() => equipment.filter((item) => item.status === "available"
    && (categoryFilter === "all" || item.categoryId === Number(categoryFilter))
    && `${item.name} ${item.itemCode} ${item.category}`.toLowerCase().includes(equipmentSearch.trim().toLowerCase())),
  [categoryFilter, equipment, equipmentSearch]);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => () => {
    const activeReader = scannerRef.current?.reader;
    if (activeReader) void activeReader.cancel().catch(() => {});
  }, []);

  useEffect(() => {
    if (!storekeeper) {
      navigate("/login", { replace: true, state: { userType: "Store Keeper" } });
      return undefined;
    }
    let current = true;
    Promise.all([
      api("/api/storekeeper/categories"),
      api("/api/storekeeper/equipment"),
      api("/api/storekeeper/equipment-loans"),
      api("/api/storekeeper/notices"),
    ]).then(([categoryData, equipmentData, loanData, noticeData]) => {
      if (!current) return;
      setCategories(categoryData.categories || []);
      setEquipment(equipmentData.equipment || []);
      setLoans(loanData.loans || []);
      setNotices(noticeData.notices || []);
      setError("");
    }).catch((loadError) => {
      if (current) setError(loadError.message);
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [navigate, refresh, storekeeper]);

  useEffect(() => {
    if (section !== "Reports") return;
    api(`/api/storekeeper/reports/monthly?month=${encodeURIComponent(reportMonth)}`)
      .then((data) => setReport(data.loans || []))
      .catch((reportError) => setError(reportError.message));
  }, [refresh, reportMonth, section]);

  const runAction = async (action) => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await action();
      setRefresh((value) => value + 1);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy(false);
    }
  };

  const searchStudents = async (event) => {
    event.preventDefault();
    if (!studentQuery.trim()) return;
    try {
      const data = await api(`/api/storekeeper/students?regNo=${encodeURIComponent(studentQuery.trim())}`);
      setStudentMatches(data.students || []);
      if (!data.students?.length) setMessage("No matching student found.");
    } catch (searchError) { setError(searchError.message); }
  };

  const addCategory = (event) => {
    event.preventDefault();
    runAction(async () => {
      await api("/api/storekeeper/categories", { method: "POST", body: JSON.stringify({ name: categoryName }) });
      setCategoryName("");
      setMessage("Equipment category added.");
    });
  };

  const saveEquipment = (event) => {
    event.preventDefault();
    runAction(async () => {
      await api("/api/storekeeper/equipment", { method: "POST", body: JSON.stringify({ ...equipmentForm, categoryId: Number(equipmentForm.categoryId) }) });
      setEquipmentForm({ categoryId: "", itemCode: "", name: "" });
      setMessage("Equipment item added.");
    });
  };

  const saveEdit = (event) => {
    event.preventDefault();
    runAction(async () => {
      await api(`/api/storekeeper/equipment/${editItem.id}`, {
        method: "PATCH",
        body: JSON.stringify({ itemCode: editItem.itemCode, name: editItem.name, categoryId: Number(editItem.categoryId) }),
      });
      setEditItem(null);
      setMessage("Equipment details updated.");
    });
  };

  const confirmIssue = () => {
    if (!selectedStudent || !cart.length || !dueAt) {
      setError("Select a student, at least one equipment item, and a due date.");
      return;
    }
    runAction(async () => {
      await api("/api/storekeeper/equipment-loans/issue", {
        method: "POST",
        body: JSON.stringify({ regNo: selectedStudent.regNo, equipmentIds: cart.map((item) => item.id), dueAt }),
      });
      setCart([]);
      setSelectedStudent(null);
      setStudentQuery("");
      setMessage("Equipment issued successfully.");
    });
  };

  const markReturned = (loanId) => runAction(async () => {
    await api(`/api/storekeeper/equipment-loans/${loanId}/return`, { method: "POST" });
    setMessage("Equipment return recorded.");
  });

  const processScannedTag = async (tag) => {
    const data = await api(`/api/storekeeper/scan/${encodeURIComponent(tag)}`);
    setScanResult(data);
    if (data.type === "student") {
      setSelectedStudent(data.student);
      setStudentQuery(data.student.regNo);
      setRfidStudentId(String(data.student.id));
    } else if (data.type === "equipment" && data.equipment.status === "available") {
      setCart((current) => current.some((item) => item.id === data.equipment.id) ? current : [...current, data.equipment]);
    } else if (data.type === "equipment") {
      setMessage(`Equipment is ${data.equipment.status} and cannot be added to the issue cart.`);
    }
    setScanValue("");
  };

  const handleScan = (event) => {
    event.preventDefault();
    const tag = scanValue.trim();
    if (tag) runAction(() => processScannedTag(tag));
  };

  const connectSerialScanner = async () => {
    if (!serialSupported) {
      setError("This browser does not support Web Serial. Use a keyboard-emulation USB scanner instead.");
      return;
    }
    setError("");
    let port;
    let reader;
    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: Number(scannerBaudRate) });
      reader = port.readable.getReader();
      scannerRef.current = { port, reader };
      setScannerStatus("Connected");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const values = buffer.split(/\r\n|\n|\r/);
        buffer = values.pop() || "";
        for (const valueText of values) {
          if (valueText.trim()) await runAction(() => processScannedTag(valueText.trim()));
        }
      }
      if (buffer.trim()) await runAction(() => processScannedTag(buffer.trim()));
    } catch (scannerError) {
      if (scannerError.name !== "AbortError") setError(scannerError.message || "Unable to read from the USB scanner.");
    } finally {
      if (reader) {
        try { reader.releaseLock(); } catch { /* The reader may already be released. */ }
      }
      if (port) {
        try { await port.close(); } catch { /* The device may already be disconnected. */ }
      }
      scannerRef.current = null;
      setScannerStatus("Disconnected");
    }
  };

  const disconnectSerialScanner = async () => {
    try { await scannerRef.current?.reader.cancel(); } catch { /* The port may already be closed. */ }
  };

  const assignTag = (event) => {
    event.preventDefault();
    if (!rfidTag.trim()) return;
    runAction(async () => {
      if (rfidStudentId) {
        await api(`/api/storekeeper/students/${rfidStudentId}/rfid`, { method: "POST", body: JSON.stringify({ tag: rfidTag }) });
      } else if (rfidEquipmentId) {
        await api(`/api/storekeeper/equipment/${rfidEquipmentId}/rfid`, { method: "POST", body: JSON.stringify({ tag: rfidTag }) });
      } else {
        throw new Error("Select a student or equipment item to assign this tag.");
      }
      setRfidTag("");
      setMessage("RFID tag assigned.");
    });
  };

  const updateStatus = (itemId, status) => runAction(async () => {
    await api(`/api/storekeeper/equipment/${itemId}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setMessage(`Equipment marked ${status}.`);
  });

  const logout = async () => {
    try { await api("/api/logout", { method: "POST" }); } catch { /* Clear the local role even if the server is unavailable. */ }
    localStorage.removeItem("storekeeper");
    localStorage.removeItem("student");
    localStorage.removeItem("staff");
    navigate("/login", { replace: true, state: { userType: "Store Keeper" } });
  };

  const downloadReport = () => {
    const file = new Blob([buildMonthlyReportPdf(reportMonth, report)], { type: "application/pdf" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `equipment-report-${reportMonth}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const printReport = () => window.print();
  const shareReport = async () => {
    const reportText = [
      `Equipment management report · ${reportMonth}`,
      "Student,University ID,Equipment,Issued,Due,Returned",
      ...report.map((loan) => [loan.studentName, loan.regNo, loan.itemName, loan.borrowedAt, loan.dueAt || "", loan.returnedAt || ""].join(",")),
    ].join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "Monthly equipment report", text: reportText });
      else {
        await navigator.clipboard.writeText(reportText);
        setMessage("Monthly report copied to clipboard.");
      }
    } catch (shareError) {
      if (shareError.name !== "AbortError") setError("Unable to share this report.");
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentQuery(student.regNo);
    setStudentMatches([]);
  };

  const nav = (name) => <button key={name} type="button" className={section === name ? "is-active" : ""} onClick={() => { setSection(name); setError(""); setMessage(""); }}>
    <span aria-hidden="true">{({ Dashboard: "▦", Inventory: "▤", "Issue / return": "↔", RFID: "⌁", History: "◷", Notices: "♧", Reports: "▧" })[name]}</span>{name}
  </button>;
  const serialScannerControls = <div className="store-dashboard-serial-controls">
    {serialSupported ? <>
      {scannerStatus === "Disconnected" && <label>Serial speed<select aria-label="USB scanner serial speed" value={scannerBaudRate} onChange={(event) => setScannerBaudRate(event.target.value)}><option value="9600">9600 baud</option><option value="19200">19200 baud</option><option value="38400">38400 baud</option><option value="57600">57600 baud</option><option value="115200">115200 baud</option></select></label>}
      <button className="store-dashboard-secondary" type="button" onClick={scannerStatus === "Connected" ? disconnectSerialScanner : connectSerialScanner}>
        {scannerStatus === "Connected" ? "Disconnect USB scanner" : "Connect USB serial scanner"}
      </button>
      <span className={scannerStatus === "Connected" ? "is-connected" : ""}>{scannerStatus}</span>
    </> : <span>Web Serial is unavailable in this browser; keyboard-emulation scanners still work.</span>}
  </div>;

  return (
    <main className={`store-dashboard${darkMode ? " is-dark" : ""}`}>
      <aside className="store-dashboard-sidebar">
        <div className="store-dashboard-brand">Uni<span>X</span>Sport</div>
        <p className="store-dashboard-label">STORE WORKSPACE</p>
        <nav aria-label="Store Keeper navigation">{sections.map(nav)}</nav>
        <div className="store-dashboard-account"><span>SK</span><div><strong>Store Keeper</strong><small>{storekeeper?.email}</small></div></div>
        <button className="store-dashboard-logout" type="button" onClick={logout}>↪ <span>Log out</span></button>
      </aside>

      <section className="store-dashboard-main">
        <header className="store-dashboard-header">
          <div>Store operations <span>/</span> {section}</div>
          <div className="store-dashboard-header-actions">
            <div className="store-dashboard-notice-wrap">
              <button className="store-dashboard-icon" type="button" aria-label="Notifications" title="Notifications" aria-expanded={showNotifications} onClick={() => setShowNotifications((value) => !value)}>
                <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
                {(notices.length + overdueLoans.length) > 0 && <i />}
              </button>
              {showNotifications && <div className="store-dashboard-popover"><strong>Notifications</strong><p>{overdueLoans.length} overdue equipment returns</p><p>{notices.length} notices and announcements</p></div>}
            </div>
            <button className="store-dashboard-icon" type="button" aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} title={darkMode ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDarkMode((value) => !value)}>
              {darkMode ? <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z" /></svg>}
            </button>
          </div>
        </header>

        <div className="store-dashboard-content">
          {error && <p className="store-dashboard-alert" role="alert">{error}</p>}
          {message && <p className="store-dashboard-success" role="status">{message}</p>}

          {section === "Dashboard" && <>
            <div className="store-dashboard-title"><div><p>TODAY, {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</p><h1>Equipment dashboard</h1><span>Monitor inventory, borrowing activity, and returns.</span></div><button type="button" className="store-dashboard-primary" onClick={() => setSection("Issue / return")}>Issue equipment</button></div>
            <div className="store-dashboard-metrics"><article><span>Available items</span><strong>{equipment.filter((item) => item.status === "available").length}</strong></article><article><span>Currently borrowed</span><strong>{activeLoans.length}</strong></article><article><span>Overdue returns</span><strong>{overdueLoans.length}</strong></article><article><span>Categories</span><strong>{categories.length}</strong></article></div>
            <section className="store-dashboard-panel"><div className="store-dashboard-panel-heading"><div><h2>Recent borrowing</h2><p>Latest equipment issue and return activity.</p></div><button type="button" onClick={() => setSection("History")}>Full history</button></div>
              <LoanTable loans={loans.slice(0, 8)} busy={busy} onReturn={markReturned} />
            </section>
          </>}

          {section === "Inventory" && <>
            <PageTitle title="Equipment inventory" detail="Manage equipment categories, individual items, and condition." />
            <div className="store-dashboard-forms">
              <form className="store-dashboard-panel store-dashboard-form" onSubmit={addCategory}><h2>Add category</h2><label>Category name<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required maxLength={80} placeholder="e.g. Rackets" /></label><button className="store-dashboard-primary" disabled={busy}>Add category</button></form>
              <form className="store-dashboard-panel store-dashboard-form" onSubmit={saveEquipment}><h2>Add equipment</h2><label>Category<select value={equipmentForm.categoryId} onChange={(event) => setEquipmentForm({ ...equipmentForm, categoryId: event.target.value })} required><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Equipment ID<input value={equipmentForm.itemCode} onChange={(event) => setEquipmentForm({ ...equipmentForm, itemCode: event.target.value })} required maxLength={50} /></label><label>Equipment name<input value={equipmentForm.name} onChange={(event) => setEquipmentForm({ ...equipmentForm, name: event.target.value })} required maxLength={120} /></label><button className="store-dashboard-primary" disabled={busy}>Add item</button></form>
            </div>
            <section className="store-dashboard-panel"><div className="store-dashboard-panel-heading"><div><h2>Equipment</h2><p>{categories.map((category) => `${category.name} (${category.itemCount})`).join(" · ") || "Add a category to start the inventory."}</p></div><input aria-label="Search equipment" placeholder="Search ID or name" value={equipmentSearch} onChange={(event) => setEquipmentSearch(event.target.value)} /></div>
              <div className="store-dashboard-table-wrap"><table className="store-dashboard-table"><thead><tr><th>ID</th><th>Equipment</th><th>Category</th><th>RFID</th><th>Status</th><th>Actions</th></tr></thead><tbody>{equipment.filter((item) => `${item.itemCode} ${item.name} ${item.category}`.toLowerCase().includes(equipmentSearch.toLowerCase())).map((item) => <tr key={item.id}><td>{item.itemCode}</td><td>{item.name}</td><td>{item.category}</td><td>{item.rfidTag || "Not assigned"}</td><td><Status status={item.status} /></td><td className="store-dashboard-actions"><button type="button" onClick={() => setEditItem({ id: item.id, itemCode: item.itemCode, name: item.name, categoryId: item.categoryId })}>Edit</button>{item.status !== "borrowed" && item.status !== "removed" && <button type="button" onClick={() => updateStatus(item.id, item.status === "damaged" ? "available" : "damaged")}>{item.status === "damaged" ? "Mark repaired" : "Mark damaged"}</button>}</td></tr>)}</tbody></table></div>
            </section>
          </>}

          {section === "Issue / return" && <>
            <PageTitle title="Issue equipment" detail="Find a student, add equipment to the cart, and confirm the issue." />
            <section className="store-dashboard-panel store-dashboard-scan"><form onSubmit={handleScan}><label>Scan RFID or USB barcode<input autoComplete="off" value={scanValue} onChange={(event) => setScanValue(event.target.value)} placeholder="Focus here, scan tag, then press Enter" /></label><button className="store-dashboard-secondary" disabled={busy}>Scan RFID</button></form><small>Keyboard scanners can type into the field. Serial readers should send each tag followed by a line break.</small>{serialScannerControls}{scanResult && <p role="status">{scanResult.type === "student" ? `Student: ${scanResult.student.fullName} · ${scanResult.student.regNo}` : `Equipment: ${scanResult.equipment.name} · ${scanResult.equipment.itemCode} · ${scanResult.equipment.status}`}</p>}</section>
            <div className="store-dashboard-issue-layout"><section className="store-dashboard-panel"><h2>Student</h2><form className="store-dashboard-search-form" onSubmit={searchStudents}><input aria-label="University ID" value={studentQuery} onChange={(event) => { setStudentQuery(event.target.value); setSelectedStudent(null); }} placeholder="University identification number" /><button className="store-dashboard-secondary">Search student</button></form>{studentMatches.map((student) => <button className="store-dashboard-result" key={student.id} type="button" onClick={() => selectStudent(student)}><strong>{student.fullName}</strong><span>{student.regNo} · {student.faculty}</span></button>)}{selectedStudent && <p className="store-dashboard-selected">Selected: <strong>{selectedStudent.fullName}</strong> · {selectedStudent.regNo}</p>}
              <h2 className="store-dashboard-subheading">Available equipment</h2><div className="store-dashboard-filter-row"><select aria-label="Equipment category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><input aria-label="Find equipment" value={equipmentSearch} onChange={(event) => setEquipmentSearch(event.target.value)} placeholder="Search ID or name" /></div><div className="store-dashboard-available-list">{availableEquipment.map((item) => <div key={item.id}><span><strong>{item.name}</strong><small>{item.itemCode} · {item.category}</small></span><button type="button" disabled={cart.some((cartItem) => cartItem.id === item.id)} onClick={() => setCart((current) => [...current, item])}>{cart.some((cartItem) => cartItem.id === item.id) ? "Added" : "Add"}</button></div>)}{!availableEquipment.length && <p>No available equipment found.</p>}</div>
            </section><section className="store-dashboard-panel store-dashboard-cart"><h2>Issue cart <span>{cart.length}</span></h2>{cart.map((item) => <div className="store-dashboard-cart-item" key={item.id}><span><strong>{item.name}</strong><small>{item.itemCode}</small></span><button type="button" aria-label={`Remove ${item.name} from cart`} onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))}>Remove</button></div>)}{!cart.length && <p className="store-dashboard-empty">Equipment added for this transaction appears here.</p>}<label>Return due date<input type="date" min={today()} value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label><button className="store-dashboard-primary store-dashboard-confirm" type="button" disabled={busy || !cart.length || !selectedStudent} onClick={confirmIssue}>Confirm issue</button></section></div>
          </>}

          {section === "RFID" && <>
            <PageTitle title="RFID assignments" detail="Assign tags to student accounts or equipment cards, and resolve scans." />
            <section className="store-dashboard-panel store-dashboard-form store-dashboard-rfid"><h2>Assign an RFID tag</h2><form onSubmit={searchStudents}><label>Find student by university ID<input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="University identification number" /></label><button className="store-dashboard-secondary">Search</button></form>{studentMatches.map((student) => <button className="store-dashboard-result" key={student.id} type="button" onClick={() => { setRfidStudentId(String(student.id)); setRfidEquipmentId(""); selectStudent(student); }}>{student.fullName} · {student.regNo}</button>)}<label>Equipment item<select value={rfidEquipmentId} onChange={(event) => { setRfidEquipmentId(event.target.value); setRfidStudentId(""); }}><option value="">Select equipment instead</option>{equipment.map((item) => <option key={item.id} value={item.id}>{item.itemCode} · {item.name}</option>)}</select></label><form onSubmit={assignTag}><label>RFID tag value<input value={rfidTag} onChange={(event) => setRfidTag(event.target.value)} required placeholder="Scan tag or enter its value" /></label><button className="store-dashboard-primary" disabled={busy}>Assign tag</button></form><p className="store-dashboard-hint">Compatible USB RFID readers that emulate keyboard input can enter the tag value above. Direct reader protocols need device-specific integration.</p></section>
            <section className="store-dashboard-panel store-dashboard-scan"><form onSubmit={handleScan}><label>Scan and identify a tag<input value={scanValue} onChange={(event) => setScanValue(event.target.value)} placeholder="Scan an assigned student or equipment tag" /></label><button className="store-dashboard-secondary" disabled={busy}>Scan RFID</button></form>{serialScannerControls}{scanResult && <pre>{JSON.stringify(scanResult, null, 2)}</pre>}</section>
          </>}

          {section === "History" && <><PageTitle title="Equipment history" detail="Borrowing and return records for all students." /><section className="store-dashboard-panel"><LoanTable loans={loans} busy={busy} onReturn={markReturned} /></section></>}

          {section === "Notices" && <><PageTitle title="Notices and announcements" detail="Updates published by the Gym Coach and Administrator." /><div className="store-dashboard-notices">{notices.map((notice) => <article className="store-dashboard-panel" key={notice.id}><div><span>{notice.senderRole}</span><time>{formatDate(notice.sentAt)}</time></div><h2>{notice.title}</h2><p>{notice.message}</p></article>)}{!notices.length && <p className="store-dashboard-empty">No notices have been published yet.</p>}</div></>}

          {section === "Reports" && <><PageTitle title="Monthly equipment report" detail="Download, print, or share a monthly equipment report." /><section className="store-dashboard-panel store-dashboard-report-controls"><label>Report month<input type="month" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} /></label><div><button className="store-dashboard-primary" type="button" onClick={downloadReport}>Download PDF</button><button className="store-dashboard-secondary" type="button" onClick={printReport}>Print report</button><button className="store-dashboard-secondary" type="button" onClick={shareReport}>Share report</button></div></section><section className="store-dashboard-panel store-dashboard-print-area"><h2>Equipment management report · {reportMonth}</h2><p>{report.length} equipment loans · {report.filter((loan) => loan.returnedAt).length} returned · {report.filter((loan) => !loan.returnedAt).length} outstanding</p><LoanTable loans={report} busy={busy} onReturn={markReturned} report /></section></>}
        </div>
      </section>

      {editItem && <div className="store-dashboard-modal-backdrop" role="presentation"><form className="store-dashboard-modal" onSubmit={saveEdit}><h2>Edit equipment</h2><label>Equipment ID<input value={editItem.itemCode} onChange={(event) => setEditItem({ ...editItem, itemCode: event.target.value })} required /></label><label>Equipment name<input value={editItem.name} onChange={(event) => setEditItem({ ...editItem, name: event.target.value })} required /></label><label>Category<select value={editItem.categoryId} onChange={(event) => setEditItem({ ...editItem, categoryId: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><div><button className="store-dashboard-secondary" type="button" onClick={() => setEditItem(null)}>Cancel</button><button className="store-dashboard-primary" disabled={busy}>Save changes</button></div></form></div>}
      {loading && <div className="store-dashboard-loading" role="status">Loading store data...</div>}
    </main>
  );
}

function PageTitle({ title, detail }) {
  return <div className="store-dashboard-title"><div><h1>{title}</h1><span>{detail}</span></div></div>;
}

function Status({ status }) {
  return <span className={`store-dashboard-status ${status}`}>{status}</span>;
}

function LoanTable({ loans, busy, onReturn, report = false }) {
  return <div className="store-dashboard-table-wrap"><table className="store-dashboard-table"><thead><tr><th>Student</th><th>University ID</th><th>Equipment</th><th>Issued</th><th>Due</th><th>Status</th>{!report && <th>Action</th>}</tr></thead><tbody>{loans.map((loan) => <tr key={loan.id}><td>{loan.studentName}</td><td>{loan.regNo}</td><td>{loan.itemName}</td><td>{formatDate(loan.borrowedAt)}</td><td>{formatDate(loan.dueAt)}</td><td><Status status={loan.returnedAt ? "returned" : loan.dueAt && loan.dueAt.slice(0, 10) < today() ? "overdue" : "borrowed"} /></td>{!report && <td>{loan.returnedAt ? "Complete" : <button type="button" disabled={busy} onClick={() => onReturn(loan.id)}>Mark returned</button>}</td>}</tr>)}{!loans.length && <tr><td className="store-dashboard-empty-cell" colSpan={report ? 6 : 7}>No equipment history to show.</td></tr>}</tbody></table></div>;
}

export default StoreKeeperDashboard;