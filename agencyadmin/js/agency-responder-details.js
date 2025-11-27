document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage('AgencyAdmin');
    if (!token) return;

    const profile = await loadAgencyAdminProfile(token);
    if (!profile || !profile.agencyId) return;
    await loadAgencyInfo(profile.agencyId, token);

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const detailsContainer = document.getElementById("detailsContainer");
    const responderContent = document.getElementById("responderContent");
    const responderRefNameEl = document.getElementById("responderRefName");
    const statusForm = document.getElementById("statusForm");
    const locationForm = document.getElementById("locationForm");
    const saveStatusBtn = document.getElementById("saveStatusBtn");
    const saveLocationBtn = document.getElementById("saveLocationBtn");
    const locationMapEl = document.getElementById("locationMap");
    const locationSearchInput = document.getElementById("locationSearch");
    const latInput = document.getElementById("latitude");
    const lonInput = document.getElementById("longitude");
    const detectedAddressBox = document.getElementById("detectedAddressBox");
    const detectedAddressEl = document.getElementById("detectedAddress");

    let map, marker, geocoder;

    const urlParams = new URLSearchParams(window.location.search);
    const responderId = urlParams.get('id');

    if (!responderId) {
        detailsContainer.innerHTML = `<div class="error-state"><p>No responder ID provided.</p><a href="agency-responders.html" class="btn-primary">Back</a></div>`;
        return;
    }

    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => { e.preventDefault(); logoutUser(); });

    async function loadAgencyInfo(agencyId, token) {
        const agencyNameEl = document.getElementById("agencyName");
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${agencyId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to load agency');
            const result = await response.json();
            if (result.succeeded && result.data) agencyNameEl.textContent = result.data.name;
        } catch (error) {
            agencyNameEl.textContent = 'Agency';
        }
    }

    async function loadResponderDetails() {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/${responderId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch responder details');
            const result = await response.json();

            if (result.succeeded && result.data) {
                if (result.data.agencyId !== profile.agencyId) {
                    throw new Error("You do not have permission to view this responder.");
                }
                displayResponderDetails(result.data);
                await loadGoogleMapsApi();
                setupMap(result.data.coordinates);
            } else {
                throw new Error(result.message || 'Could not load responder data');
            }
        } catch (error) {
            detailsContainer.innerHTML = `<div class="error-state"><p>${error.message}</p><a href="agency-responders.html" class="btn-primary">Back</a></div>`;
        }
    }

    function displayResponderDetails(responder) {
        detailsContainer.style.display = 'none';
        responderContent.style.display = 'grid';
        responderRefNameEl.textContent = responder.userFullName;

        const profileCard = document.getElementById('profileCard');
        const avatarSrc = responder.profilePictureUrl ? `${AppConfig.API_BASE_URL}${responder.profilePictureUrl}` : generateInitialsAvatar(responder.userFullName);
        profileCard.innerHTML = `
            <div class="card-body profile-card-content">
                <img src="${avatarSrc}" alt="${responder.userFullName}" class="profile-avatar">
                <h2 class="profile-name">${escapeHtml(responder.userFullName)}</h2>
                <p class="profile-email">${escapeHtml(responder.email)}</p>
            </div>`;
        document.getElementById('responderStatus').value = responder.status;
    }

    function loadGoogleMapsApi() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) return resolve();
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${AppConfig.GOOGLE_MAPS_API_KEY}&libraries=places&callback=initAgencyDetailsMap`;
            script.async = true;
            window.initAgencyDetailsMap = () => {
                geocoder = new google.maps.Geocoder();
                resolve();
            };
            script.onerror = () => reject(new Error("Failed to load Google Maps script."));
            document.head.appendChild(script);
        });
    }

    function setupMap(coords) {
        const initialLocation = (coords && coords.latitude) ? { lat: coords.latitude, lng: coords.longitude } : { lat: 6.5244, lng: 3.3792 };
        map = new google.maps.Map(locationMapEl, { center: initialLocation, zoom: 15, disableDefaultUI: true, zoomControl: true });
        marker = new google.maps.Marker({ position: initialLocation, map: map, draggable: true });
        marker.addListener('dragend', () => updateLocation(marker.getPosition().lat(), marker.getPosition().lng()));

        const autocomplete = new google.maps.places.Autocomplete(locationSearchInput);
        autocomplete.setFields(['geometry', 'name']);
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                map.setCenter(place.geometry.location);
                marker.setPosition(place.geometry.location);
                updateLocation(place.geometry.location.lat(), place.geometry.location.lng(), place.name);
            }
        });
        if (coords && coords.latitude) updateLocation(coords.latitude, coords.longitude);
    }

    function updateLocation(lat, lng, name) {
        latInput.value = lat;
        lonInput.value = lng;
        detectedAddressEl.textContent = name || `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`;
        detectedAddressBox.style.display = 'flex';
    }

    statusForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveStatusBtn.disabled = true;
        saveStatusBtn.classList.add('loading');
        const responderStatusEnum = { 'Available': 1, 'OnDuty': 2, 'OffDuty': 3, 'Busy': 4, 'Unreachable': 5 };
        const newStatusInt = responderStatusEnum[document.getElementById('responderStatus').value];
        const payload = { status: newStatusInt };

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/${responderId}/status`, {
                method: 'PATCH',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to update status');
            showFeedback('statusFormFeedback', 'Status updated successfully!', 'success');
        } catch (error) {
            showFeedback('statusFormFeedback', `Error: ${error.message}`, 'error', 0);
        } finally {
            saveStatusBtn.disabled = false;
            saveStatusBtn.classList.remove('loading');
        }
    });

    locationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveLocationBtn.disabled = true;
        saveLocationBtn.classList.add('loading');
        const payload = { latitude: parseFloat(latInput.value), longitude: parseFloat(lonInput.value) };

        if (isNaN(payload.latitude) || isNaN(payload.longitude)) {
            showFeedback('locationFormFeedback', 'Error: Invalid coordinates.', 'error', 0);
            saveLocationBtn.disabled = false;
            saveLocationBtn.classList.remove('loading');
            return;
        }

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/${responderId}/location`, {
                method: 'PATCH',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to update location');
            showFeedback('locationFormFeedback', 'Location updated successfully!', 'success');
        } catch (error) {
            showFeedback('locationFormFeedback', `Error: ${error.message}`, 'error', 0);
        } finally {
            saveLocationBtn.disabled = false;
            saveLocationBtn.classList.remove('loading');
        }
    });

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    loadResponderDetails();
});