/* ==========================================================================
   UNIXSPORT ADMIN CONTROL CENTER - APPLICATION LOGIC
   ========================================================================== */

// --- INITIAL IN-MEMORY DATA STORAGE ---
let users = [
  { id: '1', name: 'Andriw Perera', email: 'andriw@rajarata.ac.lk', role: 'Student', rfid: '2992001505' },
  { id: '2', name: 'Rayan Kariyawasam', email: 'rayan@rajarata.ac.lk', role: 'Student', rfid: '2992002001' },
  { id: '3', name: 'Janith Silva', email: 'janith@sports.rajarata.ac.lk', role: 'Coach', rfid: '2992003603' },
  { id: '4', name: 'Kasun Fernando', email: 'kasun@rajarata.ac.lk', role: 'Student', rfid: '2992004112' }
];

let equipment = [
  { id: '1', name: 'Treadmill Pro T80', room: 'Main Gym Hall', qty: 12, status: 'Available' },
  { id: '2', name: 'Badminton Racket Set', room: 'Badminton Court', qty: 20, status: 'Borrowed' },
  { id: '3', name: 'Cricket Leather Balls', room: 'Cricket Pavilion', qty: 45, status: 'Available' },
  { id: '4', name: 'Stationary Spin Bike', room: 'Main Gym Hall', qty: 3, status: 'Damaged' }
];

let notices = [
  { id: '1', title: 'Gym Equipment Maintenance', message: 'Main Gym Hall will be closed this Friday 10 AM - 12 PM for routine servicing.', audience: 'All', priority: 'High', date: '2026-10-24' },
  { id: '2', title: 'Inter-Faculty Tournament', message: 'All coaches must submit final player rosters by Monday afternoon.', audience: 'Coaches', priority: 'Urgent', date: '2026-10-22' }
];

let adminProfile = {
  name: 'Admin User',
  email: 'admin@rajarata.ac.lk',
  avatar: 'https://via.placeholder.com/120/00d2ff/0a0f24?text=Admin'
};

let currentRoleFilter = 'ALL';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  setupNavigation();
  renderAll();
});

// Live Clock
function initClock() {
  const update = () => {
    const now = new Date();
    document.getElementById('liveClock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  update();
  setInterval(update, 1000);
}

// Navigation & Tab Switching
function setupNavigation() {
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Dark / Light Theme Toggle
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const icon = document.querySelector('#themeToggleBtn i');
    icon.className = document.body.classList.contains('light-theme') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to log out of UniXsport Admin Portal?')) {
      alert('Logged out successfully.');
    }
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));
}

// Global Render Trigger
function renderAll() {
  renderDashboard();
  renderUsers();
  renderEquipment();
  renderNotices();
  renderProfile();
}

// --- DASHBOARD RENDER ---
function renderDashboard() {
  const studentCount = users.filter(u => u.role === 'Student').length;
  const coachCount = users.filter(u => u.role === 'Coach').length;
  const totalEquip = equipment.reduce((sum, item) => sum + Number(item.qty), 0);
  const damagedCount = equipment.filter(item => item.status === 'Damaged').reduce((sum, item) => sum + Number(item.qty), 0);

  document.getElementById('statStudents').textContent = studentCount;
  document.getElementById('statCoaches').textContent = coachCount;
  document.getElementById('statEquipment').textContent = totalEquip;
  document.getElementById('statDamaged').textContent = damagedCount;

  // Breakdown Widget
  const breakdownContainer = document.getElementById('equipmentBreakdown');
  const availableCount = equipment.filter(e => e.status === 'Available').reduce((s, i) => s + Number(i.qty), 0);
  const borrowedCount = equipment.filter(e => e.status === 'Borrowed').reduce((s, i) => s + Number(i.qty), 0);

  breakdownContainer.innerHTML = `
    <div class="breakdown-item"><span><i class="fa-solid fa-circle" style="color:var(--status-available)"></i> Available</span> <strong>${availableCount} Units</strong></div>
    <div class="breakdown-item"><span><i class="fa-solid fa-circle" style="color:var(--status-borrowed)"></i> Borrowed</span> <strong>${borrowedCount} Units</strong></div>
    <div class="breakdown-item"><span><i class="fa-solid fa-circle" style="color:var(--status-damaged)"></i> Needs Repair</span> <strong>${damagedCount} Units</strong></div>
  `;

  // Recent Notices
  const recentList = document.getElementById('recentNoticesList');
  recentList.innerHTML = notices.slice(0, 3).map(n => `
    <div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05)">
      <strong style="font-size:0.9rem;">${n.title}</strong>
      <p style="font-size:0.8rem; color:var(--text-muted);">${n.message}</p>
    </div>
  `).join('') || '<p style="font-size:0.85rem; color:var(--text-muted)">No notices posted yet.</p>';
}

// --- USER MANAGEMENT ---
function filterUserRole(role, btnElement) {
  currentRoleFilter = role;
  document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
  renderUsers();
}

function renderUsers() {
  const searchQuery = document.getElementById('userSearchInput').value.toLowerCase();
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  const filtered = users.filter(u => {
    const matchesRole = currentRoleFilter === 'ALL' || u.role === currentRoleFilter;
    const matchesSearch = u.name.toLowerCase().includes(searchQuery) || u.email.toLowerCase().includes(searchQuery);
    return matchesRole && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No users found.</td></tr>`;
    return;
  }

  filtered.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${user.name}</strong></td>
      <td>${user.email}</td>
      <td><span class="badge ${user.role === 'Student' ? 'badge-student' : 'badge-coach'}">${user.role}</span></td>
      <td><span class="badge badge-rfid">${user.rfid}</span></td>
      <td>
        <button class="btn-icon" onclick="editUser('${user.id}')" title="Edit User"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn-icon" onclick="deleteUser('${user.id}')" title="Delete User"><i class="fa-solid fa-trash" style="color:var(--status-damaged)"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openUserModal(editId = null) {
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('userModalTitle').textContent = editId ? 'Edit User' : 'Add New User';

  if (editId) {
    const user = users.find(u => u.id === editId);
    if (user) {
      document.getElementById('userId').value = user.id;
      document.getElementById('userName').value = user.name;
      document.getElementById('userEmail').value = user.email;
      document.getElementById('userRole').value = user.role;
      document.getElementById('userRfid').value = user.rfid;
    }
  }

  document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('active');
}

function saveUser(e) {
  e.preventDefault();
  const id = document.getElementById('userId').value;
  const name = document.getElementById('userName').value;
  const email = document.getElementById('userEmail').value;
  const role = document.getElementById('userRole').value;
  const rfid = document.getElementById('userRfid').value;

  if (id) {
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) users[idx] = { id, name, email, role, rfid };
  } else {
    users.push({ id: Date.now().toString(), name, email, role, rfid });
  }

  closeUserModal();
  renderAll();
}

function editUser(id) { openUserModal(id); }

function deleteUser(id) {
  if (confirm('Are you sure you want to delete this user profile?')) {
    users = users.filter(u => u.id !== id);
    renderAll();
  }
}

// --- EQUIPMENT MANAGEMENT ---
function renderEquipment() {
  const searchQuery = document.getElementById('equipSearchInput').value.toLowerCase();
  const statusFilter = document.getElementById('equipStatusFilter').value;
  const roomFilter = document.getElementById('equipRoomFilter').value;
  const tbody = document.getElementById('equipTableBody');
  tbody.innerHTML = '';

  const filtered = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesRoom = roomFilter === 'ALL' || item.room === roomFilter;
    return matchesSearch && matchesStatus && matchesRoom;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No equipment found matching criteria.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    let statusBadgeClass = 'badge-available';
    if (item.status === 'Borrowed') statusBadgeClass = 'badge-borrowed';
    if (item.status === 'Damaged') statusBadgeClass = 'badge-damaged';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td>${item.room}</td>
      <td>${item.qty}</td>
      <td><span class="badge ${statusBadgeClass}">${item.status}</span></td>
      <td>
        <button class="btn-icon" onclick="editEquip('${item.id}')" title="Edit Item"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn-icon" onclick="deleteEquip('${item.id}')" title="Delete Item"><i class="fa-solid fa-trash" style="color:var(--status-damaged)"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openEquipModal(editId = null) {
  document.getElementById('equipForm').reset();
  document.getElementById('equipId').value = '';
  document.getElementById('equipModalTitle').textContent = editId ? 'Edit Equipment Item' : 'Add New Equipment Item';

  if (editId) {
    const item = equipment.find(e => e.id === editId);
    if (item) {
      document.getElementById('equipId').value = item.id;
      document.getElementById('equipName').value = item.name;
      document.getElementById('equipRoom').value = item.room;
      document.getElementById('equipQty').value = item.qty;
      document.getElementById('equipStatus').value = item.status;
    }
  }

  document.getElementById('equipModal').classList.add('active');
}

function closeEquipModal() {
  document.getElementById('equipModal').classList.remove('active');
}

function saveEquip(e) {
  e.preventDefault();
  const id = document.getElementById('equipId').value;
  const name = document.getElementById('equipName').value;
  const room = document.getElementById('equipRoom').value;
  const qty = document.getElementById('equipQty').value;
  const status = document.getElementById('equipStatus').value;

  if (id) {
    const idx = equipment.findIndex(e => e.id === id);
    if (idx !== -1) equipment[idx] = { id, name, room, qty, status };
  } else {
    equipment.push({ id: Date.now().toString(), name, room, qty, status });
  }

  closeEquipModal();
  renderAll();
}

function editEquip(id) { openEquipModal(id); }

function deleteEquip(id) {
  if (confirm('Are you sure you want to remove this item from inventory?')) {
    equipment = equipment.filter(e => e.id !== id);
    renderAll();
  }
}

// --- NOTICES MANAGEMENT ---
function renderNotices() {
  const grid = document.getElementById('noticesGrid');
  grid.innerHTML = '';

  if (notices.length === 0) {
    grid.innerHTML = `<p style="color:var(--text-muted); text-align:center; grid-column: 1/-1;">No active notices published.</p>`;
    return;
  }

  notices.forEach(notice => {
    let priorityClass = 'badge-priority-normal';
    if (notice.priority === 'High') priorityClass = 'badge-priority-high';
    if (notice.priority === 'Urgent') priorityClass = 'badge-priority-urgent';

    const card = document.createElement('div');
    card.className = 'notice-card';
    card.innerHTML = `
      <div>
        <div class="notice-header">
          <span class="badge ${priorityClass}">${notice.priority}</span>
          <button class="btn-icon" onclick="deleteNotice('${notice.id}')" title="Delete Notice"><i class="fa-solid fa-trash" style="color:var(--status-damaged)"></i></button>
        </div>
        <h4 style="margin-bottom:6px;">${notice.title}</h4>
        <p style="font-size:0.85rem; color:var(--text-muted);">${notice.message}</p>
      </div>
      <div class="notice-footer">
        <span><i class="fa-solid fa-eye"></i> Audience: <strong>${notice.audience}</strong></span>
        <span>${notice.date}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openNoticeModal() {
  document.getElementById('noticeForm').reset();
  document.getElementById('noticeModal').classList.add('active');
}

function closeNoticeModal() {
  document.getElementById('noticeModal').classList.remove('active');
}

function saveNotice(e) {
  e.preventDefault();
  const title = document.getElementById('noticeTitle').value;
  const audience = document.getElementById('noticeAudience').value;
  const priority = document.getElementById('noticePriority').value;
  const message = document.getElementById('noticeMessage').value;
  const date = new Date().toISOString().split('T')[0];

  notices.unshift({ id: Date.now().toString(), title, audience, priority, message, date });
  closeNoticeModal();
  renderAll();
}

function deleteNotice(id) {
  if (confirm('Delete this notice?')) {
    notices = notices.filter(n => n.id !== id);
    renderAll();
  }
}

// --- ADMIN PROFILE MANAGEMENT ---
function renderProfile() {
  document.getElementById('sidebarName').textContent = adminProfile.name;
  document.getElementById('sidebarAvatar').src = adminProfile.avatar;
  
  document.getElementById('profileCardName').textContent = adminProfile.name;
  document.getElementById('profileCardEmail').textContent = adminProfile.email;
  document.getElementById('profileAvatarPreview').src = adminProfile.avatar;
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      adminProfile.avatar = e.target.result;
      renderProfile();
    };
    reader.readAsDataURL(file);
  }
}

function handleSaveProfile(e) {
  e.preventDefault();
  adminProfile.name = document.getElementById('adminFullName').value;
  adminProfile.email = document.getElementById('adminEmail').value;
  renderProfile();
  alert('Profile information updated successfully!');
}

function handleChangePassword(e) {
  e.preventDefault();
  const currentPass = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;

  if (newPass !== confirmPass) {
    alert('New passwords do not match!');
    return;
  }

  alert('Password changed successfully!');
  document.getElementById('profilePasswordForm').reset();
}