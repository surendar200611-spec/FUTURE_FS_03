// ===== BACKEND CONFIGURATION =====
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:1232/api/reservations' 
    : '/api/reservations';

// ===== UI ELEMENTS =====
const tableBody = document.getElementById('res-table-body');
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statConfirmed = document.getElementById('stat-confirmed');

let allReservations = [];
let searchQuery = ''; // For filtering

// ===== TABS LOGIC =====
let currentTab = 'reservations'; // 'reservations', 'menu', 'customers', 'settings'

function switchTab(tab) {
    currentTab = tab;
    // Update active class
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + tab).classList.add('active');
    
    // Update header
    const headerTitle = document.querySelector('.header-title h1');
    const headerDesc = document.querySelector('.header-title p');
    if (tab === 'reservations') {
        headerTitle.textContent = 'Pending Reservations';
        headerDesc.textContent = 'Manage your upcoming cafe bookings';
    } else if (tab === 'customers') {
        headerTitle.textContent = 'Confirmed Customers';
        headerDesc.textContent = 'View your confirmed table guests';
    } else if (tab === 'menu') {
        headerTitle.textContent = 'Menu Items';
        headerDesc.textContent = 'Manage your catalog';
    } else if (tab === 'settings') {
        headerTitle.textContent = 'Settings';
        headerDesc.textContent = 'Configure your cafe platform';
    }
    
    renderDashboard();
}

// ===== FETCH DATA (Polled from API) =====
async function fetchReservations(silent = false) {
    if (!silent && allReservations.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Loading reservations...</td></tr>`;
    }
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('API error');
        allReservations = await response.json();
        renderDashboard();
    } catch (error) {
        console.error("Error fetching reservations: ", error);
        if (!silent) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color:red;">Error loading data from server.</td></tr>`;
        }
    }
}

function startPolling() {
    fetchReservations(false);
    setInterval(() => {
        fetchReservations(true);
    }, 3000); // Poll every 3 seconds for real-time updates
}

// ===== RENDER =====
function renderDashboard() {
    // Update Stats (Always show global stats)
    statTotal.textContent = allReservations.length;
    statPending.textContent = allReservations.filter(r => r.status === 'Pending').length;
    statConfirmed.textContent = allReservations.filter(r => r.status === 'Confirmed').length;

    if (currentTab === 'menu' || currentTab === 'settings') {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 3rem;">This feature is currently under development.</td></tr>`;
        return;
    }

    // Filter based on tab
    let displayList = [];
    if (currentTab === 'reservations') {
        displayList = allReservations.filter(r => r.status !== 'Confirmed');
    } else if (currentTab === 'customers') {
        displayList = allReservations.filter(r => r.status === 'Confirmed');
    }

    // Apply Search Filter
    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        displayList = displayList.filter(r => 
            (r.name && r.name.toLowerCase().includes(lowerQ)) ||
            (r.phone && r.phone.toLowerCase().includes(lowerQ))
        );
    }

    if (displayList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 3rem;">No records found for this view.</td></tr>`;
        return;
    }

    // Update Table
    tableBody.innerHTML = displayList.map(res => `
        <tr>
            <td>
                <div style="font-weight:600; color:var(--dark-brown);">${res.name || 'N/A'}</div>
            </td>
            <td>${res.phone || 'N/A'}</td>
            <td>
                <div style="font-weight:500;">${res.date || 'N/A'}</div>
                <div style="font-size: 0.8rem; color: #666;">${res.time || 'N/A'}</div>
            </td>
            <td>${res.guests || 'N/A'}</td>
            <td>
                <div style="font-size: 0.8rem; color: #666; max-width: 200px; line-height: 1.4;">
                    ${res.preOrderedItems && res.preOrderedItems !== 'None' ? res.preOrderedItems + `<br><strong style="color:var(--dark-brown);">Total: ₹${res.preOrderTotal}</strong>` : '<em>No pre-orders</em>'}
                </div>
            </td>
            <td>
                <span class="badge badge-${res.status ? res.status.toLowerCase() : 'pending'}">${res.status || 'Pending'}</span>
            </td>
            <td>
                ${res.status !== 'Confirmed' ? `<button class="action-btn approve" onclick="updateStatus('${res.id}', 'Confirmed')" title="Confirm Booking"><i class="fas fa-check"></i></button>` : ''}
                <button class="action-btn cancel" onclick="deleteReservation('${res.id}')" title="Remove Permanently"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// ===== ACTIONS =====
function handleSearch() {
    searchQuery = document.getElementById('admin-search').value;
    renderDashboard();
}

async function updateStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) throw new Error('API error');
        showToast(`Moved to Confirmed Customers!`);
        fetchReservations(true);
    } catch (error) {
        console.error("Error updating status: ", error);
        showToast("Error updating reservation status.");
    }
}

async function deleteReservation(id) {
    if (!confirm("Are you sure you want to permanently remove this customer?")) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('API error');
        showToast("Customer removed permanently.");
        fetchReservations(true);
    } catch (error) {
        console.error("Error deleting reservation: ", error);
        showToast("Error removing customer.");
    }
}

// ===== TOAST =====
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => { t.classList.remove('show'); }, 3000);
}

// INIT
window.onload = startPolling;
