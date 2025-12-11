document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage('AgencyAdmin');
    if (!token) return;

    const profile = await loadAgencyAdminProfile(token);
    if (!profile) {
        console.error("Could not load profile.");
        return;
    }

    if (token) {
        await window.notificationManager.initialize(token);
    }

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const detailsContainer = document.getElementById("detailsContainer");
    const incidentContent = document.getElementById("incidentContent");
    const incidentRefEl = document.getElementById("incidentRef");

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Get Incident ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const incidentId = urlParams.get('id');

    if (!incidentId) {
        detailsContainer.innerHTML = `<div class="error-state"><i class="ri-error-warning-line"></i><p>No incident ID provided.</p><a href="agency-incidents.html" class="btn-primary">Back to Incidents</a></div>`;
        return;
    }

    async function loadIncidentDetails() {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.succeeded && result.data) {
                displayIncidentDetails(result.data);
            } else {
                throw new Error(result.message || 'Failed to load incident data.');
            }

        } catch (error) {
            console.error("Error loading incident details:", error);
            detailsContainer.innerHTML = `<div class="error-state"><i class="ri-error-warning-line"></i><p>Failed to load incident details.</p><button onclick="location.reload()" class="btn-secondary">Retry</button></div>`;
            detailsContainer.classList.remove('details-loading');
        }
    }

    function displayIncidentDetails(incident) {
        detailsContainer.style.display = 'none';
        incidentContent.style.display = 'grid';

        incidentRefEl.textContent = incident.referenceNumber || 'N/A';

        renderSummary(incident);
        renderDescription(incident);
        renderReporterInfo(incident);
        renderMapAndLocation(incident);
        renderAssignedResponders(incident);
        renderMediaGallery(incident.media);
        renderActivityLog(incident.logs);
    }

    function renderSummary(incident) {
        const summaryContainer = document.getElementById('incidentSummary');
        const occurredAt = new Date(incident.occurredAt || incident.createdAt).toLocaleString();

        summaryContainer.innerHTML = `
            <div class="summary-item">
                <span class="label"><i class="ri-shield-cross-line"></i> Type</span>
                <span class="value">${formatIncidentType(incident.type || 'Unknown')}</span>
            </div>
            <div class="summary-item">
                <span class="label"><i class="ri-loader-4-line"></i> Status</span>
                <span class="value status-badge ${getStatusClass(incident.status)}">${getStatusDisplay(incident.status)}</span>
            </div>
            <div class="summary-item">
                <span class="label"><i class="ri-time-line"></i> Time Reported</span>
                <span class="value">${occurredAt}</span>
            </div>
            <div class="summary-item">
                <span class="label"><i class="ri-user-star-line"></i> Responders</span>
                <span class="value">${incident.assignedResponders?.length || 0}</span>
            </div>
        `;
    }

    function renderDescription(incident) {
        document.getElementById('incidentDescription').textContent = incident.title || 'No description provided.';
    }

    function renderReporterInfo(incident) {
        const reporterInfoContainer = document.getElementById('reporterInfo');
        if (incident.userName) {
            reporterInfoContainer.innerHTML = `
                <div class="info-item">
                    <span class="label">Name:</span>
                    <span class="value">${escapeHtml(incident.userName)}</span>
                </div>
                <div class="info-item">
                    <span class="label">Contact:</span>
                    <span class="value">${escapeHtml(incident.userContact) || 'Not provided'}</span>
                </div>
            `;
        } else {
            reporterInfoContainer.innerHTML = `<p>Reported anonymously.</p>`;
        }
    }

    function loadGoogleMapsApi(apiKey) {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) return resolve(window.google.maps);
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.google && window.google.maps) resolve(window.google.maps);
                else reject(new Error("Google maps loaded but window.google.maps is missing"));
            };
            script.onerror = () => reject(new Error("Failed to load Google Maps script"));
            document.head.appendChild(script);
        });
    }

    function initMap(coords, mapElId = "map") {
        if (!coords || !coords.latitude || !coords.longitude) return;
        const lat = parseFloat(coords.latitude);
        const lng = parseFloat(coords.longitude);
        const mapEl = document.getElementById(mapElId);
        if (!mapEl) return;
        const map = new google.maps.Map(mapEl, {
            center: { lat, lng },
            zoom: 15,
            disableDefaultUI: false
        });
        new google.maps.Marker({
            position: { lat, lng },
            map,
            title: "Incident Location"
        });
    }

    function renderMapAndLocation(incident) {
        const mapContainer = document.getElementById('map');
        const addressContainer = document.getElementById('address');

        if (incident.coordinates && incident.coordinates.latitude && incident.coordinates.longitude) {
            loadGoogleMapsApi(AppConfig.GOOGLE_MAPS_API_KEY)
                .then(() => initMap(incident.coordinates, "map"))
                .catch(err => {
                    console.warn("Google Maps not loaded:", err);
                    mapContainer.innerHTML = '<p class="text-center">Failed to load map.</p>';
                });
        } else {
            mapContainer.innerHTML = '<p class="text-center">Coordinates not available.</p>';
        }

        addressContainer.innerHTML = `<i class="ri-map-pin-2-line"></i> ${formatAddress(incident.address) || 'Address not available'}`;
    }

    function renderAssignedResponders(incident) {
        const responderContainer = document.getElementById('assignedResponders');
        const assignLink = document.getElementById('assignResponderLink');
        assignLink.href = `agency-assign-responder.html?id=${incident.id}`;

        if (!incident.assignedResponders || incident.assignedResponders.length === 0) {
            responderContainer.innerHTML = `<div class="empty-state-small"><i class="ri-user-unfollow-line"></i><p>No responders assigned yet.</p></div>`;
            return;
        }

        responderContainer.innerHTML = incident.assignedResponders.map(responder => `
            <div class="responder-item">
                <i class="${getResponderRoleIcon(responder.role)}"></i>
                <div class="responder-info">
                    <strong>${escapeHtml(responder.responderName)}</strong>
                    <span>${escapeHtml(responder.agencyName) || 'Your Agency'}</span>
                </div>
            </div>
        `).join('');
    }

    function renderMediaGallery(media) {
        const galleryContainer = document.getElementById('mediaGallery');
        if (!media || !media.url) {
            galleryContainer.innerHTML = `<div class="empty-state-small"><i class="ri-gallery-line"></i><p>No media was uploaded for this incident.</p></div>`;
            return;
        }

        let mediaHTML = '';
        if (media.type === 'Image') {
            mediaHTML = `<a href="${media.url}" target="_blank" class="media-item"><img src="${media.url}" alt="Incident media"></a>`;
        } else if (media.type === 'Video') {
            mediaHTML = `<a href="${media.url}" target="_blank" class="media-item video"><i class="ri-play-circle-line"></i><span>Video</span></a>`;
        }
        
        galleryContainer.innerHTML = mediaHTML || `<div class="empty-state-small"><i class="ri-gallery-line"></i><p>Unsupported media type.</p></div>`;
    }

    function renderActivityLog(logs) {
        const logContainer = document.getElementById('activityLog');
        if (!logs || logs.length === 0) {
            logContainer.innerHTML = `<div class="empty-state-small"><i class="ri-history-line"></i><p>No activity recorded yet.</p></div>`;
            return;
        }

        logContainer.innerHTML = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(log => `
            <div class="log-item">
                <div class="log-icon"><i class="ri-arrow-right-s-fill"></i></div>
                <div class="log-content">
                    <p>${escapeHtml(log.description)}</p>
                    <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    }

    // Initial Load
    loadIncidentDetails();
});
