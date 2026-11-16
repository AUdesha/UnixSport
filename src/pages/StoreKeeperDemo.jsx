import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildMonthlyReportPdf } from "../monthlyReportPdf.js";
import "../css/StoreKeeperDemo.css";

const dateOffset = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const initialLoans = [
  { id: 1, studentId: 1, student: "Nethmi Perera", regNo: "US2024-0119", equipmentId: 1, item: "Badminton racket", borrowedAt: dateOffset(-2), dueAt: dateOffset(0), returnedAt: "" },
  { id: 2, studentId: 2, student: "Ravindu Silva", regNo: "US2023-0874", equipmentId: 3, item: "Basketball", borrowedAt: dateOffset(-6), dueAt: dateOffset(-2), returnedAt: "" },
  { id: 3, studentId: 3, student: "Amaya Fernando", regNo: "US2024-0231", equipmentId: 2, item: "Tennis racket", borrowedAt: dateOffset(-1), dueAt: dateOffset(3), returnedAt: "" },
  { id: 4, studentId: 4, student: "Kavindu Jayasuriya", regNo: "US2022-0416", equipmentId: 4, item: "Football", borrowedAt: dateOffset(-12), dueAt: dateOffset(-5), returnedAt: dateOffset(-6) },
  { id: 5, studentId: 5, student: "Dinithi Wickramasinghe", regNo: "US2023-0528", equipmentId: 5, item: "Volleyball", borrowedAt: dateOffset(-3), dueAt: dateOffset(1), returnedAt: "" },
];

const initialInventoryCategories = ["Rackets", "Balls", "Fitness equipment"];
const initialStudents = [
  { id: 1, fullName: "Nethmi Perera", regNo: "US2024-0119", faculty: "Computing", rfidTag: "STU-0119" },
  { id: 2, fullName: "Ravindu Silva", regNo: "US2023-0874", faculty: "Engineering", rfidTag: "STU-0874" },
  { id: 3, fullName: "Amaya Fernando", regNo: "US2024-0231", faculty: "Management", rfidTag: "STU-0231" },
  { id: 4, fullName: "Kavindu Jayasuriya", regNo: "US2022-0416", faculty: "Science", rfidTag: "STU-0416" },
  { id: 5, fullName: "Dinithi Wickramasinghe", regNo: "US2023-0528", faculty: "Computing", rfidTag: "STU-0528" },
];
const initialInventoryItems = [
  { id: 1, itemCode: "EQ-001", name: "Badminton racket", category: "Rackets", rfidTag: "ITEM-001", status: "borrowed" },
  { id: 2, itemCode: "EQ-002", name: "Tennis racket", category: "Rackets", rfidTag: "ITEM-002", status: "borrowed" },
  { id: 3, itemCode: "EQ-003", name: "Basketball", category: "Balls", rfidTag: "ITEM-003", status: "borrowed" },
  { id: 4, itemCode: "EQ-004", name: "Football", category: "Balls", rfidTag: "ITEM-004", status: "available" },
  { id: 5, itemCode: "EQ-005", name: "Volleyball", category: "Balls", rfidTag: "ITEM-005", status: "borrowed" },
  { id: 6, itemCode: "EQ-006", name: "Yoga mat", category: "Fitness equipment", rfidTag: "ITEM-006", status: "available" },
];

const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString("en", {
  month: "short",
  day: "numeric",
});

const sections = ["Dashboard", "Inventory", "Borrow & return", "RFID", "History", "Notices", "Reports"];
const initialNotices = [
  { id: 1, title: "Equipment return reminder", message: "Please return borrowed equipment by the due date so it is available for other students.", sender: "Gym Coach", sentAt: dateOffset(-1) },
  { id: 2, title: "Sports hall schedule", message: "The indoor court is reserved for university team practice this Friday afternoon.", sender: "Administrator", sentAt: dateOffset(-3) },
];

const getStatus = (loan) => {
  if (loan.returnedAt) return "Returned";
  return loan.dueAt < dateOffset(0) ? "Overdue" : "On loan";
};

function StoreKeeperDemo() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [loans, setLoans] = useState(initialLoans);
  const [inventoryCategories, setInventoryCategories] = useState(initialInventoryCategories);
  const [inventoryItems, setInventoryItems] = useState(initialInventoryItems);
  const [nextInventoryId, setNextInventoryId] = useState(initialInventoryItems.length + 1);
  const [students, setStudents] = useState(initialStudents);
  const [categoryName, setCategoryName] = useState("");
  const [inventoryForm, setInventoryForm] = useState({ category: "", name: "", quantity: "1" });
  const [inventorySearch, setInventorySearch] = useState("");
  const [filter, setFilter] = useState("All loans");
  const [search, setSearch] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentMatches, setStudentMatches] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rfidStudentQuery, setRfidStudentQuery] = useState("");
  const [borrowCategory, setBorrowCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [dueAt, setDueAt] = useState(dateOffset(7));
  const [scanValue, setScanValue] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [rfidStudentId, setRfidStudentId] = useState("");
  const [rfidEquipmentId, setRfidEquipmentId] = useState("");
  const [rfidTag, setRfidTag] = useState("");
  const [reportMonth, setReportMonth] = useState(dateOffset(0).slice(0, 7));
  const [editItem, setEditItem] = useState(null);
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
  const visibleInventoryItems = inventoryItems.filter((item) => `${item.itemCode} ${item.name} ${item.category}`.toLowerCase().includes(inventorySearch.trim().toLowerCase()));
  const availableItems = inventoryItems.filter((item) => item.status === "available");
  const borrowableItems = availableItems.filter((item) => !borrowCategory || item.category === borrowCategory);
  const monthlyLoans = loans.filter((loan) => loan.borrowedAt.slice(0, 7) === reportMonth);

  const searchStudents = (event, searchValue = studentQuery) => {
    event.preventDefault();
    const query = searchValue.trim().toLowerCase();
    const matches = query ? students.filter((student) => student.regNo.toLowerCase().includes(query)) : [];
    setStudentMatches(matches);
    setNotice(matches.length ? "" : "No student found for that university ID.");
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentQuery(student.regNo);
    setStudentMatches([]);
  };

  const confirmBorrow = () => {
    if (!selectedStudent || !cart.length || !dueAt) {
      setNotice("Select a student, equipment, and a return due date.");
      return;
    }
    const availableCart = cart.filter((cartItem) => inventoryItems.some((item) => item.id === cartItem.id && item.status === "available"));
    if (availableCart.length !== cart.length) {
      setCart(availableCart);
      setNotice("Some selected equipment is no longer available. Review the cart and try again.");
      return;
    }
    const borrowedAt = dateOffset(0);
    const newLoans = availableCart.map((item, index) => ({
      id: Date.now() + index,
      studentId: selectedStudent.id,
      student: selectedStudent.fullName,
      regNo: selectedStudent.regNo,
      equipmentId: item.id,
      item: item.name,
      borrowedAt,
      dueAt,
      returnedAt: "",
    }));
    setLoans((current) => [...newLoans, ...current]);
    setInventoryItems((current) => current.map((item) => availableCart.some((cartItem) => cartItem.id === item.id) ? { ...item, status: "borrowed" } : item));
    setCart([]);
    setSelectedStudent(null);
    setStudentQuery("");
    setNotice("Equipment borrowed in the demo.");
  };

  const handleReturn = (loanId) => {
    const loan = loans.find((item) => item.id === loanId);
    setLoans((current) => current.map((item) => item.id === loanId ? { ...item, returnedAt: dateOffset(0) } : item));
    if (loan?.equipmentId) {
      setInventoryItems((current) => current.map((item) => item.id === loan.equipmentId && item.status === "borrowed" ? { ...item, status: "available" } : item));
    }
    setNotice("Equipment marked as returned.");
  };

  const handleScan = (event) => {
    event.preventDefault();
    const tag = scanValue.trim().toLowerCase();
    const student = students.find((item) => item.rfidTag && item.rfidTag.toLowerCase() === tag);
    const item = inventoryItems.find((equipment) => equipment.rfidTag && equipment.rfidTag.toLowerCase() === tag);
    if (student) {
      setScanResult({ type: "student", student });
      setSelectedStudent(student);
      setStudentQuery(student.regNo);
      setNotice(`Student found: ${student.fullName}.`);
    } else if (item) {
      setScanResult({ type: "equipment", equipment: item });
      if (item.status === "available") {
        setCart((current) => current.some((entry) => entry.id === item.id) ? current : [...current, item]);
        setNotice(`${item.name} added to the borrow cart.`);
      } else {
        setNotice(`${item.name} is ${item.status} and cannot be borrowed.`);
      }
    } else {
      setScanResult(null);
      setNotice("No student or equipment matches that RFID tag.");
    }
    setScanValue("");
  };

  const assignTag = (event) => {
    event.preventDefault();
    const tag = rfidTag.trim();
    if (!tag || (!rfidStudentId && !rfidEquipmentId)) {
      setNotice("Select a student or equipment item and enter an RFID tag.");
      return;
    }
    const duplicateStudent = students.some((student) => student.rfidTag?.toLowerCase() === tag.toLowerCase() && String(student.id) !== rfidStudentId);
    const duplicateEquipment = inventoryItems.some((item) => item.rfidTag?.toLowerCase() === tag.toLowerCase() && String(item.id) !== rfidEquipmentId);
    if (duplicateStudent || duplicateEquipment) {
      setNotice("That RFID tag is already assigned.");
      return;
    }
    if (rfidStudentId) {
      setStudents((current) => current.map((student) => String(student.id) === rfidStudentId ? { ...student, rfidTag: tag } : student));
      setNotice("RFID tag assigned to the student.");
    } else {
      setInventoryItems((current) => current.map((item) => String(item.id) === rfidEquipmentId ? { ...item, rfidTag: tag } : item));
      setNotice("RFID tag assigned to the equipment.");
    }
    setRfidTag("");
  };

  const addInventoryCategory = (event) => {
    event.preventDefault();
    const newCategory = categoryName.trim();
    if (!newCategory) return;
    if (inventoryCategories.some((category) => category.toLowerCase() === newCategory.toLowerCase())) {
      setNotice("That category already exists.");
      return;
    }
    setInventoryCategories((current) => [...current, newCategory]);
    setCategoryName("");
    setNotice("Equipment category added.");
  };

  const addInventoryItems = (event) => {
    event.preventDefault();
    const quantity = Number(inventoryForm.quantity);
    if (!inventoryForm.category || !inventoryForm.name.trim()) {
      setNotice("Select a category and enter an item name.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
      setNotice("Enter a quantity from 1 to 500.");
      return;
    }

    const createdItems = Array.from({ length: quantity }, (_, index) => {
      const id = nextInventoryId + index;
      return {
        id,
        itemCode: `EQ-${String(id).padStart(3, "0")}`,
        name: inventoryForm.name.trim(),
        category: inventoryForm.category,
        rfidTag: "",
        status: "available",
      };
    });
    setInventoryItems((current) => [...createdItems, ...current]);
    setNextInventoryId((current) => current + quantity);
    setInventoryForm({ category: "", name: "", quantity: "1" });
    setNotice(`${quantity} ${quantity === 1 ? "item" : "items"} added to demo inventory.`);
  };

  const removeInventoryItem = (itemId) => {
    setInventoryItems((current) => current.map((item) => item.id === itemId ? { ...item, status: "removed" } : item));
    setNotice("Item removed from active demo inventory; its history is retained.");
  };

  const updateItemStatus = (itemId, status) => {
    setInventoryItems((current) => current.map((item) => item.id === itemId ? { ...item, status } : item));
    setNotice(`Equipment marked ${status}.`);
  };

  const saveItemEdit = (event) => {
    event.preventDefault();
    const itemCode = editItem.itemCode.trim();
    const name = editItem.name.trim();
    if (!itemCode || !name) {
      setNotice("Enter an equipment ID and name.");
      return;
    }
    if (inventoryItems.some((item) => item.id !== editItem.id && item.itemCode.toLowerCase() === itemCode.toLowerCase())) {
      setNotice("That equipment ID is already in use.");
      return;
    }
    setInventoryItems((current) => current.map((item) => item.id === editItem.id ? { ...item, itemCode, name, category: editItem.category } : item));
    setEditItem(null);
    setNotice("Equipment details updated in the demo.");
  };

  const downloadReport = () => {
    const rows = monthlyLoans.map((loan) => ({ studentName: loan.student, regNo: loan.regNo, itemName: loan.item, borrowedAt: loan.borrowedAt, dueAt: loan.dueAt, returnedAt: loan.returnedAt }));
    const file = new Blob([buildMonthlyReportPdf(reportMonth, rows)], { type: "application/pdf" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `demo-equipment-report-${reportMonth}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const shareReport = async () => {
    const text = monthlyLoans.map((loan) => `${loan.student} · ${loan.regNo} · ${loan.item} · ${loan.borrowedAt} · due ${loan.dueAt}`).join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "Demo equipment report", text });
      else {
        await navigator.clipboard.writeText(text || `Equipment report · ${reportMonth}: no loans recorded.`);
        setNotice("Demo report copied to clipboard.");
      }
    } catch (error) {
      if (error.name !== "AbortError") setNotice("Unable to share the demo report.");
    }
  };

  const printReport = () => window.print();

  return (
    <main className="store-demo-page" data-theme={darkMode ? "dark" : "light"}>
      <aside className="store-demo-sidebar">
        <Link className="store-demo-brand" to="/">Uni<span>X</span>Sport</Link>
        <p className="store-demo-side-label">WORKSPACE</p>
        <nav className="store-demo-nav" aria-label="Store keeper navigation">
          {sections.map((section) => (
            <button key={section} className={activeSection === section ? "is-current" : ""} type="button" onClick={() => { setActiveSection(section); setNotice(""); setStudentMatches([]); }}>
              <span aria-hidden="true">{({ Dashboard: "▦", Inventory: "▤", "Borrow & return": "↔", RFID: "⌁", History: "◷", Notices: "♧", Reports: "▧" })[section]}</span>
              {section}{section === "Inventory" && <small>{inventoryItems.filter((item) => item.status !== "removed").length}</small>}
            </button>
          ))}
        </nav>
        <div className="store-demo-sidebar-foot">
          <div className="store-demo-avatar">SK</div>
          <div><strong>Store Keeper</strong><span>Demo account</span></div>
        </div>
      </aside>

      <section className="store-demo-main" id="overview">
        <header className="store-demo-topbar">
          <span>Store operations <span className="store-demo-divider">/</span> {activeSection}</span>
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
                {(overdueLoans.length > 0 || initialNotices.length > 0) && <span className="store-demo-notification-dot" />}
              </button>
              {showNotifications && (
                <div className="store-demo-notification-panel" role="dialog" aria-label="Notifications">
                  <strong>Notifications</strong>
                  {overdueLoans.length > 0 ? (
                    <p><span>{overdueLoans.length} overdue {overdueLoans.length === 1 ? "return" : "returns"}</span><small>{overdueLoans.map((loan) => loan.item).join(", ")} need follow-up.</small></p>
                  ) : <p><span>All caught up</span><small>No overdue equipment returns.</small></p>}
                  <p><span>{initialNotices.length} notices and announcements</span><small>Published by the Gym Coach and Administrator.</small></p>
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
              <p className="store-demo-eyebrow">{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</p>
              <h1>{({
                Dashboard: "Equipment dashboard",
                Inventory: "Equipment inventory",
                "Borrow & return": "Borrow & return equipment",
                RFID: "RFID assignments",
                History: "Equipment history",
                Notices: "Notices and announcements",
                Reports: "Monthly equipment report",
              })[activeSection]}</h1>
              <p className="store-demo-subtitle">{({
                Dashboard: "Monitor inventory, borrowing activity, and returns.",
                Inventory: "Add categories and equipment, then manage inventory and item condition.",
                "Borrow & return": "Find a student, select available equipment, and record a return date.",
                RFID: "Assign RFID tags to students or equipment and identify scanned tags.",
                History: "Review borrowing and return records.",
                Notices: "View announcements from the Gym Coach and Administrator.",
                Reports: "Download, print, or share a monthly equipment report.",
              })[activeSection]}</p>
            </div>
            {activeSection === "Dashboard" && <button className="store-demo-primary" type="button" onClick={() => setActiveSection("Borrow & return")}>
              <span aria-hidden="true">+</span> Borrow equipment
            </button>}
          </div>

          {activeSection === "Dashboard" && <div className="store-demo-stats" aria-label="Loan summary">
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
              <p>Available items</p><strong>{availableItems.length.toString().padStart(2, "0")}</strong><small>Ready to borrow</small>
            </article>
            <article className="store-demo-stat">
              <span className="store-demo-stat-icon yellow" aria-hidden="true">▤</span>
              <p>Categories</p><strong>{inventoryCategories.length.toString().padStart(2, "0")}</strong><small>Equipment categories</small>
            </article>
          </div>}

          {notice && <p className="store-demo-notice" role="status">{notice}</p>}

          {(activeSection === "Dashboard" || activeSection === "History") && <section className="store-demo-loans" id="loans">
            <div className="store-demo-loans-head">
              <div><h2>{activeSection === "Dashboard" ? "Recent borrowing" : "Borrowing and return records"}</h2><p>Manage issued equipment and returns.</p></div>
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
          </section>}

          {activeSection === "Inventory" && <section className="store-demo-inventory">
            <div className="store-demo-inventory-forms">
              <form className="store-demo-inventory-card store-demo-inventory-form" onSubmit={addInventoryCategory}>
                <h2>Add category</h2>
                <label>Category name<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required maxLength={80} placeholder="e.g. Rackets" /></label>
                <button className="store-demo-primary" type="submit">Add category</button>
              </form>
              <form className="store-demo-inventory-card store-demo-inventory-form" onSubmit={addInventoryItems}>
                <h2>Add equipment</h2>
                <label>Category<select value={inventoryForm.category} onChange={(event) => setInventoryForm({ ...inventoryForm, category: event.target.value })} required><option value="">Select category</option>{inventoryCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                <label>Item name<input value={inventoryForm.name} onChange={(event) => setInventoryForm({ ...inventoryForm, name: event.target.value })} required maxLength={120} placeholder="Equipment name" /></label>
                <label>Quantity<input type="number" min="1" max="500" step="1" value={inventoryForm.quantity} onChange={(event) => setInventoryForm({ ...inventoryForm, quantity: event.target.value })} required /></label>
                <p>Each unit gets a generated ID and can be removed separately.</p>
                <button className="store-demo-primary" type="submit">Add to inventory</button>
              </form>
            </div>

            <section className="store-demo-inventory-card store-demo-inventory-list">
              <div className="store-demo-loans-head">
                <div><h2>Inventory list</h2><p>{inventoryItems.filter((item) => item.status !== "removed").length} individual equipment units · {inventoryCategories.length} categories</p></div>
                <label className="store-demo-search"><span aria-hidden="true">⌕</span><input aria-label="Search inventory" placeholder="Search ID or item name" value={inventorySearch} onChange={(event) => setInventorySearch(event.target.value)} /></label>
              </div>
              <div className="store-demo-table-wrap">
                <table className="store-demo-table store-demo-inventory-table">
                  <thead><tr><th>EQUIPMENT ID</th><th>ITEM NAME</th><th>CATEGORY</th><th>RFID</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                  <tbody>
                    {visibleInventoryItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.itemCode}</td><td>{item.name}</td><td>{item.category}</td><td>{item.rfidTag || "Not assigned"}</td>
                        <td><span className={`store-demo-inventory-status ${item.status}`}>{item.status}</span></td>
                        <td className="store-demo-inventory-actions">
                          <button className="store-demo-action" type="button" disabled={item.status === "removed"} onClick={() => setEditItem({ id: item.id, itemCode: item.itemCode, name: item.name, category: item.category })}>Edit</button>
                          {item.status !== "borrowed" && item.status !== "removed" && <>
                            <button className="store-demo-action" type="button" onClick={() => updateItemStatus(item.id, item.status === "damaged" ? "available" : "damaged")}>{item.status === "damaged" ? "Mark repaired" : "Mark damaged"}</button>
                            <button className="store-demo-remove" type="button" aria-label={`Remove ${item.name} (${item.itemCode})`} onClick={() => removeInventoryItem(item.id)}>Remove</button>
                          </>}
                        </td>
                      </tr>
                    ))}
                    {!visibleInventoryItems.length && <tr><td className="store-demo-empty" colSpan="6">{inventoryItems.length ? "No inventory items match this search." : "No inventory items. Add a category and equipment to get started."}</td></tr>}
                  </tbody>
                </table>
              </div>
              <footer className="store-demo-table-foot"><span>Demo inventory · Changes are temporary</span></footer>
            </section>
          </section>}

          {activeSection === "Borrow & return" && <>
            <section className="store-demo-feature-card store-demo-scan">
              <form onSubmit={handleScan}>
                <label>Scan RFID or USB barcode<input autoComplete="off" value={scanValue} onChange={(event) => setScanValue(event.target.value)} placeholder="Try STU-0119 or ITEM-006" /></label>
                <button className="store-demo-primary" type="submit">Scan RFID</button>
              </form>
              <p>USB keyboard-emulation scanners can enter a tag here. Scanning is simulated with the demo sample tags.</p>
              {scanResult && <div className="store-demo-scan-result" role="status">{scanResult.type === "student"
                ? `Student: ${scanResult.student.fullName} · ${scanResult.student.regNo}`
                : `Equipment: ${scanResult.equipment.name} · ${scanResult.equipment.itemCode} · ${scanResult.equipment.status}`}</div>}
            </section>
            <div className="store-demo-borrow-layout">
              <section className="store-demo-feature-card">
                <h2>Student</h2>
                <form className="store-demo-inline-form" onSubmit={searchStudents}>
                  <label>University identification number<input value={studentQuery} onChange={(event) => { setStudentQuery(event.target.value); setSelectedStudent(null); }} placeholder="e.g. US2024-0119" /></label>
                  <button className="store-demo-secondary" type="submit">Search student</button>
                </form>
                <div className="store-demo-result-list">{studentMatches.map((student) => (
                  <button key={student.id} type="button" onClick={() => selectStudent(student)}><strong>{student.fullName}</strong><span>{student.regNo} · {student.faculty}</span></button>
                ))}</div>
                {selectedStudent && <p className="store-demo-selected">Selected: <strong>{selectedStudent.fullName}</strong> · {selectedStudent.regNo}</p>}
                <h2 className="store-demo-subheading">Available equipment</h2>
                <label className="store-demo-category-filter">Category<select value={borrowCategory} onChange={(event) => setBorrowCategory(event.target.value)}><option value="">All categories</option>{inventoryCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                <div className="store-demo-available-list">
                  {borrowableItems.map((item) => (
                    <div key={item.id}><span><strong>{item.name}</strong><small>{item.itemCode} · {item.category}</small></span><button type="button" disabled={cart.some((entry) => entry.id === item.id)} onClick={() => setCart((current) => [...current, item])}>{cart.some((entry) => entry.id === item.id) ? "Added" : "Add"}</button></div>
                  ))}
                  {!borrowableItems.length && <p>{availableItems.length ? "No available equipment in this category." : "No available equipment. Return or add an item first."}</p>}
                </div>
              </section>
              <section className="store-demo-feature-card store-demo-cart">
                <h2>Borrow cart <span>{cart.length}</span></h2>
                {cart.map((item) => <div className="store-demo-cart-item" key={item.id}><span><strong>{item.name}</strong><small>{item.itemCode}</small></span><button type="button" onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))}>Remove</button></div>)}
                {!cart.length && <p className="store-demo-empty">Scan or select available equipment to add it here.</p>}
                <label>Return due date<input type="date" min={dateOffset(0)} value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
                <button className="store-demo-primary store-demo-confirm" type="button" disabled={!selectedStudent || !cart.length} onClick={confirmBorrow}>Confirm borrow</button>
              </section>
            </div>
          </>}

          {activeSection === "RFID" && <>
            <section className="store-demo-feature-card store-demo-rfid-scan">
              <form onSubmit={handleScan}>
                <label>Scan and identify an RFID tag<input autoComplete="off" value={scanValue} onChange={(event) => setScanValue(event.target.value)} placeholder="Try STU-0119 or ITEM-001" /></label>
                <button className="store-demo-secondary" type="submit">Scan tag</button>
              </form>
              <p>Sample tags: student <strong>STU-0119</strong>, equipment <strong>ITEM-001</strong>. USB keyboard readers can type into the field.</p>
              {scanResult && <div className="store-demo-scan-result" role="status">{scanResult.type === "student"
                ? `Student: ${scanResult.student.fullName} · ${scanResult.student.regNo}`
                : `Equipment: ${scanResult.equipment.name} · ${scanResult.equipment.itemCode} · ${scanResult.equipment.status}`}</div>}
            </section>
            <div className="store-demo-rfid-layout">
              <section className="store-demo-feature-card">
                <h2>Assign an RFID tag</h2>
                <form className="store-demo-rfid-search" onSubmit={(event) => searchStudents(event, rfidStudentQuery)}>
                  <label>Find student by university ID<input value={rfidStudentQuery} onChange={(event) => setRfidStudentQuery(event.target.value)} placeholder="US2024-0119" /></label>
                  <button className="store-demo-secondary" type="submit">Search</button>
                </form>
                <div className="store-demo-result-list">{studentMatches.map((student) => (
                  <button key={student.id} type="button" onClick={() => { setRfidStudentId(String(student.id)); setRfidEquipmentId(""); setRfidStudentQuery(student.regNo); setStudentMatches([]); }}><strong>{student.fullName}</strong><span>{student.regNo} · {student.faculty}</span></button>
                ))}</div>
                {rfidStudentId && <p className="store-demo-selected">Selected student: <strong>{students.find((student) => String(student.id) === rfidStudentId)?.fullName}</strong></p>}
                <label>Or select equipment<select value={rfidEquipmentId} onChange={(event) => { setRfidEquipmentId(event.target.value); setRfidStudentId(""); }}><option value="">Select equipment</option>{inventoryItems.filter((item) => item.status !== "removed").map((item) => <option key={item.id} value={item.id}>{item.itemCode} · {item.name}</option>)}</select></label>
                {rfidEquipmentId && <p className="store-demo-selected">Selected equipment: <strong>{inventoryItems.find((item) => String(item.id) === rfidEquipmentId)?.name}</strong></p>}
                <form className="store-demo-rfid-tag-form" onSubmit={assignTag}>
                  <label>RFID tag value<input value={rfidTag} onChange={(event) => setRfidTag(event.target.value)} required placeholder="Scan or enter tag value" /></label>
                  <button className="store-demo-primary" type="submit">Assign tag</button>
                </form>
                <p className="store-demo-help">Tags assigned here are only saved in this temporary demo.</p>
              </section>
              <section className="store-demo-feature-card store-demo-tag-list">
                <h2>Assigned tags</h2>
                <h3>Students</h3>
                {students.map((student) => <p key={student.id}><span>{student.fullName} · {student.regNo}</span><strong>{student.rfidTag || "Not assigned"}</strong></p>)}
                <h3>Equipment</h3>
                {inventoryItems.filter((item) => item.status !== "removed").map((item) => <p key={item.id}><span>{item.itemCode} · {item.name}</span><strong>{item.rfidTag || "Not assigned"}</strong></p>)}
              </section>
            </div>
          </>}

          {activeSection === "Notices" && <section className="store-demo-notices">
            {initialNotices.map((item) => <article className="store-demo-feature-card" key={item.id}><div className="store-demo-notice-meta"><span>{item.sender}</span><time>{formatDate(item.sentAt)}</time></div><h2>{item.title}</h2><p>{item.message}</p></article>)}
          </section>}

          {activeSection === "Reports" && <>
            <section className="store-demo-feature-card store-demo-report-controls">
              <label>Report month<input type="month" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} /></label>
              <div><button className="store-demo-primary" type="button" onClick={downloadReport}>Download PDF</button><button className="store-demo-secondary" type="button" onClick={printReport}>Print report</button><button className="store-demo-secondary" type="button" onClick={shareReport}>Share report</button></div>
            </section>
            <section className="store-demo-feature-card store-demo-report-preview">
              <h2>Equipment management report · {reportMonth}</h2>
              <p>{monthlyLoans.length} loans · {monthlyLoans.filter((loan) => loan.returnedAt).length} returned · {monthlyLoans.filter((loan) => !loan.returnedAt).length} outstanding</p>
              <div className="store-demo-table-wrap"><table className="store-demo-table"><thead><tr><th>STUDENT</th><th>UNIVERSITY ID</th><th>EQUIPMENT</th><th>BORROWED</th><th>DUE</th><th>RETURNED</th></tr></thead><tbody>
                {monthlyLoans.map((loan) => <tr key={loan.id}><td>{loan.student}</td><td>{loan.regNo}</td><td>{loan.item}</td><td>{formatDate(loan.borrowedAt)}</td><td>{formatDate(loan.dueAt)}</td><td>{loan.returnedAt ? formatDate(loan.returnedAt) : "—"}</td></tr>)}
                {!monthlyLoans.length && <tr><td className="store-demo-empty" colSpan="6">No loans were recorded in this month.</td></tr>}
              </tbody></table></div>
            </section>
          </>}
          <p className="store-demo-disclaimer">Demo workspace · Changes are temporary and won’t be saved.</p>
        </div>
      </section>
      {editItem && <div className="store-demo-modal-backdrop" role="presentation"><form className="store-demo-modal" role="dialog" aria-modal="true" aria-labelledby="store-demo-edit-title" onSubmit={saveItemEdit}>
        <h2 id="store-demo-edit-title">Edit equipment</h2>
        <label>Equipment ID<input value={editItem.itemCode} onChange={(event) => setEditItem({ ...editItem, itemCode: event.target.value })} required /></label>
        <label>Equipment name<input value={editItem.name} onChange={(event) => setEditItem({ ...editItem, name: event.target.value })} required /></label>
        <label>Category<select value={editItem.category} onChange={(event) => setEditItem({ ...editItem, category: event.target.value })}>{inventoryCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <div><button className="store-demo-secondary" type="button" onClick={() => setEditItem(null)}>Cancel</button><button className="store-demo-primary" type="submit">Save changes</button></div>
      </form></div>}
    </main>
  );
}

export default StoreKeeperDemo;