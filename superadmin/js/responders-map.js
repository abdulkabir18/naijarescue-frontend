document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    if (!token) return;

    if (token) {
        await window.notificationManager.initialize(token);
    }
    await loadAdminProfile(token);

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const mapContainer = document.getElementById("map");
    const responderListContainer = document.getElementById("responderList");
    const statusFilter = document.getElementById("mapStatusFilter");
    const agencyFilter = document.getElementById("mapAgencyFilter");

    // Map State
    let map;
    let allResponders = [];
    let markers = [];
    let activeInfoWindow = null;

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });
    statusFilter.addEventListener("change", filterAndDisplayResponders);
    agencyFilter.addEventListener("change", filterAndDisplayResponders);

    // --- Google Maps Integration ---
    function loadGoogleMapsApi() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) return resolve();
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${AppConfig.GOOGLE_MAPS_API_KEY}&callback=initAppMap`;
            script.async = true;
            window.initAppMap = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Google Maps script."));
            document.head.appendChild(script);
        });
    }

    function initMap() {
        const nigeriaCenter = { lat: 9.0820, lng: 8.6753 };
        map = new google.maps.Map(mapContainer, {
            center: nigeriaCenter,
            zoom: 6,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: true,
        });
    }

    // --- Data Loading ---
    async function loadAllResponders() {
        try {
            // Fetch a large number to get all responders
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/all?pageSize=1000`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch responders');
            const result = await response.json();

            if (result.succeeded && result.data) {
                allResponders = result.data;
                filterAndDisplayResponders();
            } else {
                throw new Error(result.message || 'Could not load responder data');
            }
        } catch (error) {
            console.error("Error loading responders:", error);
            responderListContainer.innerHTML = `<div class="empty-state"><p>${error.message}</p></div>`;
        }
    }

    async function loadAgencies() {
        const agenciesRes = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/all?pageSize=1000`, { headers: { "Authorization": `Bearer ${token}` } });
        const agenciesResult = await agenciesRes.json();
        if (agenciesResult.succeeded && agenciesResult.data) {
            populateAgencyFilter(agenciesResult.data);
        }
    }

    function populateAgencyFilter(agencies) {
        agencies.forEach(agency => {
            const option = document.createElement('option');
            option.value = agency.id;
            option.textContent = agency.name;
            agencyFilter.appendChild(option);
        });
    }

    // --- Display and Filtering Logic ---
    function filterAndDisplayResponders() {
        const selectedStatus = statusFilter.value;
        const selectedAgency = agencyFilter.value;

        const filteredResponders = allResponders.filter(r => {
            const statusMatch = !selectedStatus || r.status === selectedStatus;
            const agencyMatch = !selectedAgency || r.agencyId === selectedAgency;
            return statusMatch && agencyMatch && r.coordinates && r.coordinates.latitude;
        });

        displayRespondersOnMap(filteredResponders);
        displayRespondersInList(filteredResponders);
    }

    function displayRespondersOnMap(responders) {
        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));
        markers = [];
        if (activeInfoWindow) activeInfoWindow.close();

        responders.forEach(responder => {
            const position = { lat: responder.coordinates.latitude, lng: responder.coordinates.longitude };
            const avatarSrc = responder.profilePictureUrl ? `${AppConfig.API_BASE_URL}${responder.profilePictureUrl}` : generateInitialsAvatar(responder.userFullName);

            const marker = new google.maps.Marker({
                position,
                map,
                title: responder.userFullName,
                icon: {
                    url: avatarSrc,
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 20),
                },
                responderId: responder.id
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="info-window-content">
                        <img src="${avatarSrc}" alt="${responder.userFullName}">
                        <div>
                            <h5>${escapeHtml(responder.userFullName)}</h5>
                            <p>${escapeHtml(responder.agencyName)}</p>
                            <p>Status: <strong>${responder.status}</strong></p>
                        </div>
                    </div>
                `
            });

            marker.addListener('click', () => {
                if (activeInfoWindow) activeInfoWindow.close();
                infoWindow.open(map, marker);
                activeInfoWindow = infoWindow;
                highlightListItem(responder.id);
            });

            markers.push(marker);
        });
    }

    function displayRespondersInList(responders) {
        if (responders.length === 0) {
            responderListContainer.innerHTML = `<div class="empty-state"><p>No responders found with active locations.</p></div>`;
            return;
        }

        responderListContainer.innerHTML = responders.map(responder => {
            const avatarSrc = responder.profilePictureUrl ? `${AppConfig.API_BASE_URL}${responder.profilePictureUrl}` : generateInitialsAvatar(responder.userFullName);
            return `
                <div class="responder-list-item" data-responder-id="${responder.id}">
                    <img src="${avatarSrc}" alt="${responder.userFullName}" class="responder-list-avatar">
                    <div class="responder-list-info">
                        <h4>${escapeHtml(responder.userFullName)}</h4>
                        <p>${escapeHtml(responder.status)}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Add click listeners to list items
        document.querySelectorAll('.responder-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const responderId = item.dataset.responderId;
                const targetMarker = markers.find(m => m.responderId === responderId);
                if (targetMarker) {
                    map.panTo(targetMarker.getPosition());
                    map.setZoom(15);
                    // Trigger the marker click to open its info window
                    new google.maps.event.trigger(targetMarker, 'click');
                }
            });
        });
    }

    function highlightListItem(responderId) {
        document.querySelectorAll('.responder-list-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.responderId === responderId) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // --- Initial Load ---
    async function initializePage() {
        try {
            await loadGoogleMapsApi();
            initMap();
            await loadAgencies();
            await loadAllResponders();
        } catch (error) {
            console.error("Initialization failed:", error);
            mapContainer.innerHTML = `<div class="map-placeholder error-state"><i class="ri-error-warning-line"></i><p>Could not initialize the map page.</p></div>`;
        }
    }

    initializePage();
});