document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentUser = null; // 'officer' or 'admin'

    // Views
    const views = document.querySelectorAll('.view');
    const loginView = document.getElementById('login-view');
    const adminLoginView = document.getElementById('admin-login-view');

    // Sidebars
    const mainSidebar = document.getElementById('main-sidebar');
    const adminSidebar = document.getElementById('admin-sidebar');

    // Content Area
    const mainContent = document.getElementById('main-content');

    // Maps
    let mainMap, clusterMap, broadcastMap;

    // Mock Data
    const reports = [
        { id: 'TR52', category: 'Theft', desc: 'Heard glass breaking', location: 'Kicukiro', time: '10m ago', credibility: 'Verified', status: 'New' },
        { id: 'TR55', category: 'Vandalism', desc: 'Suspicious person', location: 'Gasabo', time: '25m ago', credibility: 'Unverified', status: 'Under Review' },
        { id: 'AC01', category: 'Accident', desc: 'Vehicle collision', location: 'Nyarugenge', time: '1h ago', credibility: 'Verified', status: 'Resolved' },
        { id: 'AS03', category: 'Assault', desc: 'Fight in bar', location: 'Remera', time: '2h ago', credibility: 'Verified', status: 'New' },
        { id: 'TR58', category: 'Theft', desc: 'Stolen motorbike', location: 'Kicukiro', time: '3h ago', credibility: 'Verified', status: 'Under Investigation' },
    ];

    const users = [
        { id: 'U-908412', name: 'Aline Umuhoza', email: 'a.umuhoza@rnp.gov.rw', role: 'Community Patrol', status: 'Active', lastActive: '2024-05-22 10:30 AM' },
        { id: 'U-908413', name: 'Jean Bosco', email: 'j.bosco@rnp.gov.rw', role: 'Dispatch', status: 'Active', lastActive: '2024-05-22 09:15 AM' },
        { id: 'U-908414', name: 'Eric Manzi', email: 'e.manzi@police.rw', role: 'Officer', status: 'Blocked', lastActive: '2024-05-20 04:45 PM' },
        { id: 'U-908415', name: 'Sarah Keza', email: 's.keza@rnp.gov.rw', role: 'Admin', status: 'Active', lastActive: 'Now' },
    ];

    // --- Initialization ---

    function initMaps() {
        // Main Map
        if (!mainMap && document.getElementById('map')) {
            mainMap = L.map('map').setView([-1.9441, 30.0619], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(mainMap);
            L.marker([-1.95, 30.06]).addTo(mainMap).bindPopup('Theft Reported');
            L.marker([-1.94, 30.07]).addTo(mainMap).bindPopup('Vandalism');
            L.circle([-1.945, 30.065], { color: 'red', fillColor: '#f03', fillOpacity: 0.3, radius: 500 }).addTo(mainMap);
        }

        // Cluster Map
        if (!clusterMap && document.getElementById('cluster-map')) {
            clusterMap = L.map('cluster-map').setView([-1.945, 30.065], 14);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {}).addTo(clusterMap);
            L.circle([-1.945, 30.065], { color: 'red', fillColor: '#f03', fillOpacity: 0.3, radius: 500 }).addTo(clusterMap);
        }

        // Broadcast Map
        if (!broadcastMap && document.getElementById('broadcast-map')) {
            broadcastMap = L.map('broadcast-map').setView([-1.9441, 30.0619], 12);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {}).addTo(broadcastMap);
        }
    }

    function renderReports() {
        const tbody = document.getElementById('reports-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        reports.forEach(report => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span style="font-weight: 600;">${report.category}</span></td>
                <td>${report.desc}</td>
                <td>${report.location}</td>
                <td>${report.time}</td>
                <td>${report.credibility === 'Verified' ? '✅ Verified' : '⚠️ Unverified'}</td>
                <td><span class="status-badge status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span></td>
                <td><button class="btn-secondary btn-sm">View</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderUsers() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="avatar" style="width: 32px; height: 32px; font-size: 0.75rem;">${user.name.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                            <div style="font-weight: 500;">${user.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${user.role}</td>
                <td><span class="status-badge status-${user.status.toLowerCase()}">${user.status}</span></td>
                <td>${user.lastActive}</td>
                <td>
                    <button class="btn-secondary btn-sm edit-user-btn" data-id="${user.id}">Edit</button>
                    <button class="btn-secondary btn-sm" style="color: var(--danger-color); border-color: var(--danger-color);">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add Listeners for Edit Buttons
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchView('user-details');
            });
        });
    }

    function switchView(viewId) {
        views.forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(`${viewId}-view`);
        if (targetView) {
            targetView.classList.add('active');

            // Map Resizing
            setTimeout(() => {
                if (viewId === 'dashboard' && mainMap) mainMap.invalidateSize();
                if (viewId === 'clusters' && clusterMap) {
                    if (!clusterMap) initMaps();
                    clusterMap.invalidateSize();
                }
                if (viewId === 'broadcast' && broadcastMap) {
                    if (!broadcastMap) initMaps();
                    broadcastMap.invalidateSize();
                }
            }, 100);
        }
    }

    // --- Event Listeners ---

    // 1. Navigation Logic (Delegation)
    document.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-links li');
        if (navItem) {
            // Handle Active State
            const parentNav = navItem.closest('.nav-links');
            parentNav.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            navItem.classList.add('active');

            // Switch View
            const page = navItem.getAttribute('data-page');
            switchView(page);

            // Render Data
            if (page === 'reports') renderReports();
            if (page === 'users-list') renderUsers();
        }
    });

    // 2. Login Flow
    // Officer Login
    document.getElementById('login-submit-btn').addEventListener('click', () => {
        currentUser = 'officer';
        loginView.classList.remove('active');
        mainSidebar.style.display = 'flex';
        adminSidebar.style.display = 'none';
        mainContent.style.display = 'block';
        switchView('dashboard');
        setTimeout(() => { initMaps(); mainMap.invalidateSize(); }, 100);
    });

    // Go to Admin Login
    document.getElementById('go-to-admin-login').addEventListener('click', () => {
        loginView.classList.remove('active');
        adminLoginView.classList.add('active');
    });

    // Back to Officer Login
    document.getElementById('back-to-officer-login').addEventListener('click', () => {
        adminLoginView.classList.remove('active');
        loginView.classList.add('active');
    });

    // Admin Login
    document.getElementById('admin-login-submit-btn').addEventListener('click', () => {
        currentUser = 'admin';
        adminLoginView.classList.remove('active');
        mainSidebar.style.display = 'none';
        adminSidebar.style.display = 'flex';
        mainContent.style.display = 'block';
        switchView('admin-dashboard');
    });

    // Logout
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            location.reload(); // Simple reload to reset state
        });
    });

    // 3. Specific View Actions
    const backToUsersBtn = document.getElementById('back-to-users');
    if (backToUsersBtn) {
        backToUsersBtn.addEventListener('click', () => {
            switchView('users-list');
        });
    }

    // Initial Render
    renderReports();
});
