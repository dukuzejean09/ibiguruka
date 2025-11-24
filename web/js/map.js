// Map Logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Map (Centered on Kigali, Rwanda)
    const map = L.map('map').setView([-1.9441, 30.0619], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Dummy Data for Reports
    const reports = [
        { lat: -1.95, lng: 30.06, title: "Theft Reported", desc: "Bag snatching near market" },
        { lat: -1.94, lng: 30.07, title: "Vandalism", desc: "Broken street light" }
    ];

    reports.forEach(report => {
        L.marker([report.lat, report.lng])
            .addTo(map)
            .bindPopup(`<b>${report.title}</b><br>${report.desc}`);
    });

    // Dummy Data for Clusters (Red Circles)
    const clusters = [
        { lat: -1.945, lng: 30.065, radius: 300 }
    ];

    clusters.forEach(cluster => {
        L.circle([cluster.lat, cluster.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.3,
            radius: cluster.radius
        }).addTo(map).bindPopup("High Activity Zone");
    });
});
