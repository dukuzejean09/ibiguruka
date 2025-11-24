document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const views = document.querySelectorAll('.view');
    const navItems = document.querySelectorAll('.nav-item');
    const splashScreen = document.getElementById('splash-screen');
    const mainHeader = document.getElementById('main-header');
    const bottomNav = document.getElementById('bottom-nav');

    // Maps
    let citizenMap, alertsMap;

    // Mock Data
    const alerts = [
        { id: 1, type: 'Assault Report', location: 'Kigali City Market', time: '10m ago', color: '#ef4444' },
        { id: 2, type: 'Road Accident', location: 'Remera-Kisimenti', time: '45m ago', color: '#f59e0b' },
        { id: 3, type: 'Theft', location: 'Nyamirambo', time: '2h ago', color: '#ef4444' },
    ];

    // --- Initialization ---

    // Splash Screen Logic
    setTimeout(() => {
        splashScreen.classList.add('hidden');
    }, 2500);

    function initMaps() {
        // Citizen Home Map
        if (!citizenMap && document.getElementById('citizen-map')) {
            citizenMap = L.map('citizen-map').setView([-1.9441, 30.0619], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(citizenMap);

            // Add User Location Marker
            L.marker([-1.9441, 30.0619]).addTo(citizenMap)
                .bindPopup('Your Location')
                .openPopup();
        }

        // Alerts Map
        if (!alertsMap && document.getElementById('alerts-map')) {
            alertsMap = L.map('alerts-map').setView([-1.9441, 30.0619], 12);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {}).addTo(alertsMap);

            // Add Alert Markers
            alerts.forEach(alert => {
                // Randomize location slightly for demo
                const lat = -1.9441 + (Math.random() - 0.5) * 0.05;
                const lng = 30.0619 + (Math.random() - 0.5) * 0.05;
                L.circleMarker([lat, lng], {
                    color: alert.color,
                    fillColor: alert.color,
                    fillOpacity: 0.5,
                    radius: 8
                }).addTo(alertsMap).bindPopup(alert.type);
            });
        }
    }

    function renderAlerts() {
        const recentList = document.getElementById('recent-alerts-list');
        const allList = document.getElementById('all-alerts-list');

        const createAlertHTML = (alert) => `
            <div style="background: var(--bg-card); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; background: ${alert.color}20; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${alert.color}; font-size: 1.25rem;">
                    ⚠️
                </div>
                <div style="flex: 1;">
                    <h4 style="font-size: 0.875rem; margin-bottom: 0.25rem;">${alert.type}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${alert.location}</p>
                </div>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">${alert.time}</span>
            </div>
        `;

        if (recentList) {
            recentList.innerHTML = alerts.slice(0, 2).map(createAlertHTML).join('');
        }
        if (allList) {
            allList.innerHTML = alerts.map(createAlertHTML).join('');
        }
    }

    function switchView(viewId) {
        views.forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(`${viewId}-view`);
        if (targetView) {
            targetView.classList.add('active');

            // Map Resizing
            setTimeout(() => {
                if (viewId === 'home' && citizenMap) citizenMap.invalidateSize();
                if (viewId === 'alerts' && alertsMap) {
                    if (!alertsMap) initMaps();
                    alertsMap.invalidateSize();
                }
            }, 100);
        }
    }

    // --- Event Listeners ---

    // Login
    const handleLogin = () => {
        document.getElementById('login-view').classList.remove('active');
        mainHeader.style.display = 'flex';
        bottomNav.style.display = 'flex';
        switchView('home');
        setTimeout(() => { initMaps(); citizenMap.invalidateSize(); }, 100);
    };

    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('anon-btn').addEventListener('click', handleLogin);

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const page = item.getAttribute('data-page');
            switchView(page);
        });
    });

    // Report Flow
    document.getElementById('report-incident-fab').addEventListener('click', () => {
        switchView('report');
        // Hide nav temporarily for focus
        bottomNav.style.display = 'none';
    });

    document.getElementById('cancel-report-btn').addEventListener('click', () => {
        switchView('home');
        bottomNav.style.display = 'flex';
    });

    document.getElementById('submit-report-btn').addEventListener('click', () => {
        alert('Report Submitted Successfully!');
        switchView('home');
        bottomNav.style.display = 'flex';
    });

    // Chat
    document.getElementById('chat-send-btn').addEventListener('click', () => {
        const input = document.getElementById('chat-input-text');
        const text = input.value.trim();
        if (text) {
            const messagesArea = document.getElementById('citizen-chat-messages');
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message sent';
            msgDiv.innerHTML = `<p>${text}</p>`;
            messagesArea.appendChild(msgDiv);
            input.value = '';
            messagesArea.scrollTop = messagesArea.scrollHeight;

            // Mock Reply
            setTimeout(() => {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'message received';
                replyDiv.innerHTML = `<p>We have received your update. Stay safe.</p>`;
                messagesArea.appendChild(replyDiv);
                messagesArea.scrollTop = messagesArea.scrollHeight;
            }, 1500);
        }
    });

    // Logout
    document.getElementById('logout-citizen-btn').addEventListener('click', () => {
        location.reload();
    });

    // Initial Render
    renderAlerts();
});
