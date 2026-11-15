
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/StoreKeeper.css";

const initialEquipment = [
  { id: "EQ001", name: "Football", category: "Football", quantity: 20, available: 15, status: "Available", rfid: "RFID001" },
  { id: "EQ002", name: "Netball", category: "Netball", quantity: 15, available: 12, status: "Available", rfid: "RFID002" },
  { id: "EQ003", name: "Cricket Bat", category: "Cricket", quantity: 10, available: 8, status: "Available", rfid: "RFID003" },
  { id: "EQ004", name: "Volleyball", category: "Volleyball", quantity: 12, available: 0, status: "Damaged", rfid: "RFID004" },
];

function StoreKeeperDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [equipment, setEquipment] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("storeEquipment")) || initialEquipment;
    } catch {
      return initialEquipment;
    }
  });
  const [history, setHistory] = useState([]);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState(["Football", "Netball", "Cricket", "Volleyball"]);
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [notice, setNotice] = useState("Please return borrowed equipment on time.");
  const [newItem, setNewItem] = useState({ name: "", category: "", quantity: "" });
  const [newCategory, setNewCategory] = useState("");
  const [message, setMessage] = useState("");

  const saveEquipment = (data) => {
    setEquipment(data);
    localStorage.setItem("storeEquipment", JSON.stringify(data));
  };

  const totalItems = equipment.reduce((sum, item) => sum + item.quantity, 0);
  const availableItems = equipment.reduce((sum, item) => sum + item.available, 0);
  const damagedItems = equipment.filter((item) => item.status === "Damaged").length;

  const addEquipment = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category || Number(newItem.quantity) <= 0) {
      setMessage("Please enter valid equipment details.");
      return;
    }

    const item = {
      id: `EQ${Date.now()}`,
      name: newItem.name,
      category: newItem.category,
      quantity: Number(newItem.quantity),
      available: Number(newItem.quantity),
      status: "Available",
      rfid: "Not assigned",
    };

    saveEquipment([...equipment, item]);
    setNewItem({ name: "", category: "", quantity: "" });
    setMessage("Equipment added successfully.");
  };

  const addCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      setMessage("Category already exists.");
      return;
    }
    setCategories([...categories, newCategory.trim()]);
    setNewCategory("");
    setMessage("Category added successfully.");
  };

  const addToCart = (item) => {
    if (item.available <= 0) {
      setMessage("This equipment is not available.");
      return;
    }
    if (cart.some((entry) => entry.id === item.id)) {
      setMessage("This item is already in the issue cart.");
      return;
    }
    setCart([...cart, item]);
    setMessage(`${item.name} added to issue cart.`);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const confirmIssue = () => {
    if (!studentId.trim() || cart.length === 0) {
      setMessage("Enter a student ID and add equipment to the cart.");
      return;
    }

    const updated = equipment.map((item) =>
      cart.some((entry) => entry.id === item.id)
        ? { ...item, available: item.available - 1 }
        : item
    );

    saveEquipment(updated);
    setHistory([
      ...cart.map((item) => ({
        id: Date.now() + Math.random(),
        student: studentId,
        equipment: item.name,
        equipmentId: item.id,
        action: "Issued",
        date: new Date().toLocaleString(),
      })),
      ...history,
    ]);

    setCart([]);
    setStudentId("");
    setMessage("Equipment issued successfully.");
  };

  const returnEquipment = (record) => {
    const updated = equipment.map((item) =>
      item.id === record.equipmentId
        ? { ...item, available: Math.min(item.quantity, item.available + 1) }
        : item
    );

    saveEquipment(updated);
    setHistory(history.map((entry) =>
      entry.id === record.id ? { ...entry, action: "Returned" } : entry
    ));
    setMessage("Equipment return recorded.");
  };

  const assignRFID = (id, tag) => {
    if (!tag.trim()) return;
    saveEquipment(equipment.map((item) =>
      item.id === id ? { ...item, rfid: tag.trim() } : item
    ));
    setMessage("RFID tag assigned successfully.");
  };

  const updateStatus = (id, status) => {
    saveEquipment(equipment.map((item) =>
      item.id === id ? { ...item, status } : item
    ));
    setMessage("Equipment status updated.");
  };

  const handleScan = (e) => {
    e.preventDefault();
    const found = equipment.find((item) =>
      item.id.toLowerCase() === scanValue.toLowerCase() ||
      item.rfid.toLowerCase() === scanValue.toLowerCase()
    );
    setMessage(found
      ? `Equipment found: ${found.name} | ID: ${found.id} | Available: ${found.available}`
      : "No matching equipment found.");
    setScanValue("");
  };

  const downloadReport = () => {
    const rows = [
      ["Equipment ID", "Name", "Category", "Quantity", "Available", "Status"],
      ...equipment.map((item) => [
        item.id, item.name, item.category, item.quantity, item.available, item.status
      ]),
    ];
    const csv = rows.map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "StoreKeeper-Equipment-Report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Continue with local logout if the server is unavailable.
    }
    localStorage.removeItem("storekeeper");
    navigate("/login", { replace: true, state: { userType: "Store Keeper" } });
  };

  const tabs = [
    "Dashboard",
    "Equipment",
    "Categories",
    "Issue Equipment",
    "RFID Scanner",
    "History",
    "Reports",
    "Notices",
  ];

  const filteredEquipment = equipment.filter((item) =>
    `${item.id} ${item.name} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className={`sk-app ${darkMode ? "sk-dark" : "sk-light"}`}>
      <aside className="sk-sidebar">
        <div className="sk-brand">
          <div className="sk-logo">U</div>
          <div>
            <h2>UniXSport</h2>
            <span>STORE MANAGEMENT</span>
          </div>
        </div>

        <div className="sk-profile">
          <div className="sk-avatar">SK</div>
          <div>
            <strong>Store Keeper</strong>
            <small>Administrator</small>
          </div>
        </div>

        <p className="sk-menu-title">MAIN MENU</p>
        <nav className="sk-nav">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              <span>{{
                Dashboard: "▦",
                Equipment: "⚽",
                Categories: "▤",
                "Issue Equipment": "↗",
                "RFID Scanner": "▣",
                History: "◷",
                Reports: "▥",
                Notices: "♢",
              }[tab]}</span>
              {tab}
            </button>
          ))}
        </nav>

        <div className="sk-sidebar-bottom">
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀ Light Mode" : "☾ Dark Mode"}
          </button>
          <button className="sk-logout" onClick={handleLogout}>↪ Logout</button>
        </div>
      </aside>

      <main className="sk-main">
        <header className="sk-topbar">
          <div>
            <small>UniXSport / Store Keeper</small>
            <h1>{activeTab}</h1>
          </div>
          <div className="sk-top-actions">
            <span className="sk-status-dot" /> System Dashboard
          </div>
        </header>

        {message && (
          <div className="sk-message">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {activeTab === "Dashboard" && (
          <>
            <section className="sk-welcome">
              <div>
                <span>STORE MANAGEMENT SYSTEM</span>
                <h2>Welcome back, Store Keeper!</h2>
                <p>Manage sports equipment, borrowing and returns from one place.</p>
              </div>
              <div className="sk-welcome-icon">🏆</div>
            </section>

            <section className="sk-stat-grid">
              <div className="sk-stat-card">
                <span>Total Equipment</span>
                <strong>{totalItems}</strong>
                <small>Units registered</small>
              </div>
              <div className="sk-stat-card">
                <span>Available Equipment</span>
                <strong>{availableItems}</strong>
                <small>Ready for issue</small>
              </div>
              <div className="sk-stat-card">
                <span>Categories</span>
                <strong>{categories.length}</strong>
                <small>Equipment categories</small>
              </div>
              <div className="sk-stat-card">
                <span>Damaged Equipment</span>
                <strong>{damagedItems}</strong>
                <small>Needs attention</small>
              </div>
            </section>

            <section className="sk-panel">
              <div className="sk-panel-heading">
                <h3>Equipment Overview</h3>
                <button onClick={() => setActiveTab("Equipment")}>View all →</button>
              </div>
              <EquipmentTable
                items={equipment.slice(0, 5)}
                updateStatus={updateStatus}
              />
            </section>

            <section className="sk-panel">
              <h3>University Sports Events</h3>
              <p>University sports event information will appear here when connected to the university events system.</p>
            </section>
          </>
        )}

        {activeTab === "Equipment" && (
          <>
            <section className="sk-panel">
              <h3>Add New Equipment</h3>
              <form className="sk-form" onSubmit={addEquipment}>
                <input
                  placeholder="Equipment name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                />
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat}>{cat}</option>)}
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  required
                />
                <button type="submit">+ Add Equipment</button>
              </form>
            </section>

            <section className="sk-panel">
              <div className="sk-panel-heading">
                <h3>Equipment Inventory</h3>
                <input
                  className="sk-search"
                  placeholder="Search by ID or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <EquipmentTable items={filteredEquipment} updateStatus={updateStatus} />
            </section>
          </>
        )}

        {activeTab === "Categories" && (
          <section className="sk-panel">
            <h3>Equipment Categories</h3>
            <form className="sk-form" onSubmit={addCategory}>
              <input
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
              />
              <button type="submit">+ Add Category</button>
            </form>
            <div className="sk-category-grid">
              {categories.map((cat) => (
                <div className="sk-category-card" key={cat}>
                  <span>⚽</span>
                  <strong>{cat}</strong>
                  <small>{equipment.filter((item) => item.category === cat).length} equipment types</small>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Issue Equipment" && (
          <>
            <section className="sk-panel">
              <h3>Issue Equipment</h3>
              <label className="sk-label">Student University ID</label>
              <input
                className="sk-input"
                placeholder="Enter student registration number"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
              <h3 className="sk-subheading">Select Equipment</h3>
              <div className="sk-equipment-grid">
                {equipment.map((item) => (
                  <div className="sk-item-card" key={item.id}>
                    <strong>{item.name}</strong>
                    <small>{item.category} · {item.id}</small>
                    <span>{item.available} available</span>
                    <button disabled={item.available <= 0} onClick={() => addToCart(item)}>
                      Add to cart
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="sk-panel">
              <h3>Issue Cart ({cart.length})</h3>
              {cart.length === 0 && <p>No equipment selected.</p>}
              {cart.map((item) => (
                <div className="sk-cart-row" key={item.id}>
                  <span>{item.name}</span>
                  <button onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              ))}
              <button className="sk-primary" onClick={confirmIssue} disabled={!cart.length}>
                Confirm Issue
              </button>
            </section>
          </>
        )}

        {activeTab === "RFID Scanner" && (
          <section className="sk-panel">
            <h3>RFID / USB Scanner</h3>
            <p>Connect a compatible USB scanner and scan an equipment RFID tag or equipment ID into the field below.</p>
            <form className="sk-form" onSubmit={handleScan}>
              <input
                placeholder="Scan or enter RFID / Equipment ID"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                autoFocus
              />
              <button type="submit">Search Scan</button>
            </form>
            <div className="sk-info-note">
              Note: This screen accepts keyboard input from compatible USB scanners. Direct RFID hardware integration requires device and backend configuration.
            </div>
            <h3 className="sk-subheading">Assign RFID Tags</h3>
            {equipment.map((item) => (
              <div className="sk-cart-row" key={item.id}>
                <span>{item.name} ({item.id}) · {item.rfid}</span>
                <button onClick={() => {
                  const tag = window.prompt("Enter RFID tag number:");
                  if (tag) assignRFID(item.id, tag);
                }}>Assign Tag</button>
              </div>
            ))}
          </section>
        )}

        {activeTab === "History" && (
          <section className="sk-panel">
            <h3>Borrowing & Returning History</h3>
            <div className="sk-table-wrap">
              <table className="sk-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Equipment</th>
                    <th>Action</th>
                    <th>Date</th>
                    <th>Return</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan="5">No transactions recorded in this session.</td></tr>
                  ) : history.map((record) => (
                    <tr key={record.id}>
                      <td>{record.student}</td>
                      <td>{record.equipment}</td>
                      <td>{record.action}</td>
                      <td>{record.date}</td>
                      <td>
                        {record.action === "Issued" ? (
                          <button onClick={() => returnEquipment(record)}>Mark Returned</button>
                        ) : "Complete"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "Reports" && (
          <section className="sk-panel">
            <h3>Equipment Management Reports</h3>
            <p>Generate an inventory report using the current equipment records.</p>
            <div className="sk-report-summary">
              <div><span>Total items</span><strong>{totalItems}</strong></div>
              <div><span>Available</span><strong>{availableItems}</strong></div>
              <div><span>Damaged</span><strong>{damagedItems}</strong></div>
            </div>
            <button className="sk-primary" onClick={downloadReport}>Download Inventory CSV</button>
            <button className="sk-secondary" onClick={() => window.print()}>Print Report</button>
            <p className="sk-info-note">PDF generation and monthly report scheduling require backend integration.</p>
          </section>
        )}

        {activeTab === "Notices" && (
          <section className="sk-panel">
            <h3>Coach & Admin Notices</h3>
            <div className="sk-notice">
              <span>📢</span>
              <div>
                <strong>Store Notice</strong>
                <p>{notice}</p>
              </div>
            </div>
            <p className="sk-info-note">Live notices will appear here after connecting the university notice system.</p>
          </section>
        )}

        <footer className="sk-footer">
          UniXSport Store Management System · Store Keeper Portal
        </footer>
      </main>
    </div>
  );
}

function EquipmentTable({ items, updateStatus }) {
  return (
    <div className="sk-table-wrap">
      <table className="sk-table">
        <thead>
          <tr>
            <th>Equipment ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Total</th>
            <th>Available</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan="6">No equipment found.</td></tr>
          ) : items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.quantity}</td>
              <td>{item.available}</td>
              <td>
                <select
                  value={item.status}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                >
                  <option>Available</option>
                  <option>Damaged</option>
                  <option>Under Maintenance</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StoreKeeperDashboard;
