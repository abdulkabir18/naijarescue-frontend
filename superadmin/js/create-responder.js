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
    const form = document.getElementById("responderForm");
    const formFeedback = document.getElementById("formFeedback");
    const submitBtn = document.getElementById("submitBtn");
    const passwordToggles = document.querySelectorAll(".toggle-password");
    const agencySearchInput = document.getElementById("agencySearch");
    const agencySearchResults = document.getElementById("agencySearchResults");
    const selectedAgencyDisplay = document.getElementById("selectedAgencyDisplay");
    const removeAgencyBtn = document.getElementById("removeAgency");
    const agencyIdInput = document.getElementById("agencyId");
    const useCurrentLocationBtn = document.getElementById("useCurrentLocation");
    const locationSearchInput = document.getElementById("locationSearch");
    const skipLocationBtn = document.getElementById("skipLocation");
    const locationStatusEl = document.getElementById("locationStatus");
    const statusTextEl = document.getElementById("statusText");
    const latInput = document.getElementById("latitude");
    const lonInput = document.getElementById("longitude");
    const locationMap = document.getElementById("locationMap");

    // Map state
    let map;
    let marker;
    let geocoder;
    let autocomplete;

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // --- Utility Functions ---
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- Form Logic ---

    // Password visibility toggle
    passwordToggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.dataset.target;
            const input = document.getElementById(targetId);
            const icon = toggle.querySelector("i");
            input.type = input.type === "password" ? "text" : "password";
            icon.className = input.type === "password" ? "ri-eye-line" : "ri-eye-off-line";
        });
    });

    // Agency Search
    agencySearchInput.addEventListener('input', debounce(async () => {
        const keyword = agencySearchInput.value.trim();
        if (keyword.length < 2) {
            agencySearchResults.innerHTML = '';
            agencySearchResults.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/search?keyword=${keyword}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.succeeded && result.data.length > 0) {
                agencySearchResults.innerHTML = result.data.map(agency =>
                    `<div class="search-result-item" data-id="${agency.id}" data-name="${escapeHtml(agency.name)}" data-email="${escapeHtml(agency.email)}">${escapeHtml(agency.name)}</div>`
                ).join('');
                agencySearchResults.style.display = 'block';
            } else {
                agencySearchResults.innerHTML = '<div class="no-results">No agencies found</div>';
                agencySearchResults.style.display = 'block';
            }
        } catch (error) {
            console.error('Agency search failed:', error);
            agencySearchResults.innerHTML = '<div class="no-results">Search failed</div>';
        }
    }, 300));

    agencySearchResults.addEventListener('click', (e) => {
        if (e.target.classList.contains('search-result-item')) {
            const agencyId = e.target.dataset.id;
            const agencyName = e.target.dataset.name;
            const agencyEmail = e.target.dataset.email;

            agencyIdInput.value = agencyId;
            document.getElementById('selectedAgencyName').textContent = agencyName;
            document.getElementById('selectedAgencyEmail').textContent = agencyEmail;

            agencySearchInput.value = '';
            agencySearchResults.style.display = 'none';
            agencySearchInput.parentElement.style.display = 'none';
            selectedAgencyDisplay.style.display = 'flex';
        }
    });

    removeAgencyBtn.addEventListener('click', () => {
        agencyIdInput.value = '';
        selectedAgencyDisplay.style.display = 'none';
        agencySearchInput.parentElement.style.display = 'block';
    });

    // Handle file input display
    const profilePicInput = document.getElementById('profilePicture');
    const profileFileName = document.getElementById('profileFileName');
    const profilePreview = document.getElementById('profilePreview');
    profilePicInput.addEventListener('change', () => {
        if (profilePicInput.files.length > 0) {
            profileFileName.textContent = profilePicInput.files[0].name;
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePreview.innerHTML = `<img src="${e.target.result}" alt="Profile Preview">`;
            };
            reader.readAsDataURL(profilePicInput.files[0]);
        }
    });

    // --- Google Maps Integration ---
    function loadGoogleMapsApi() {
        if (window.google && window.google.maps) {
            return Promise.resolve(window.google.maps);
        }
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${AppConfig.GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
            script.async = true;
            script.defer = true;
            window.initMap = () => {
                geocoder = new google.maps.Geocoder();
                initializeAutocomplete();
                // Initialize with a default location (e.g., Lagos, Nigeria)
                setupMap(6.5244, 3.3792);
                resolve(window.google.maps);
            };
            script.onerror = () => reject(new Error("Failed to load Google Maps script."));
            document.head.appendChild(script);
        });
    }

    function setupMap(lat, lng) {
        const location = { lat, lng };
        map = new google.maps.Map(locationMap, {
            center: location,
            zoom: 10,
            disableDefaultUI: true,
            zoomControl: true,
        });

        marker = new google.maps.Marker({
            position: location,
            map: map,
            draggable: true,
            title: "Drag to set location"
        });

        marker.addListener('dragend', () => {
            const newPosition = marker.getPosition();
            updateLocationInputs(newPosition.lat(), newPosition.lng());
        });
    }

    function initializeAutocomplete() {
        autocomplete = new google.maps.places.Autocomplete(locationSearchInput);
        autocomplete.setFields(['geometry', 'name']);
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;
            updateMapAndMarker(place.geometry.location);
        });
    }

    // --- Location Picker Logic ---
    useCurrentLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        locationStatusEl.style.display = 'flex';
        statusTextEl.textContent = 'Detecting location...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const location = new google.maps.LatLng(latitude, longitude);
                updateMapAndMarker(location);
                locationStatusEl.style.display = 'none';
                showFeedback('formFeedback', 'Current location captured successfully.', 'success');
            },
            (error) => {
                console.error('Geolocation error:', error);
                statusTextEl.textContent = `Failed to get location: ${error.message}`;
                setTimeout(() => locationStatusEl.style.display = 'none', 4000);
            }
        );
    });

    skipLocationBtn.addEventListener('click', () => {
        latInput.value = '';
        lonInput.value = '';
        // Reset map to default view
        setupMap(6.5244, 3.3792);
        showFeedback('formFeedback', 'Location assignment skipped. You can set it later.', 'info');
    });

    function updateMapAndMarker(location) {
        map.setCenter(location);
        map.setZoom(15);
        marker.setPosition(location);
        updateLocationInputs(location.lat(), location.lng());
    }

    function updateLocationInputs(lat, lng) {
        latInput.value = lat;
        lonInput.value = lng;
    }


    // Form Submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        formFeedback.textContent = '';
        formFeedback.className = 'form-feedback';

        const formData = new FormData(form);

        if (!formData.get('agencyId')) {
            showFeedback('formFeedback', 'Error: Please select an agency for the responder.', 'error', 0);
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            return;
        }

        // Rename form fields to match API expectation
        const fieldMappings = {
            'firstName': 'RegisterUserRequest.FirstName',
            'lastName': 'RegisterUserRequest.LastName',
            'email': 'RegisterUserRequest.Email',
            'gender': 'RegisterUserRequest.Gender',
            'password': 'RegisterUserRequest.Password',
            'confirmPassword': 'RegisterUserRequest.ConfirmPassword',
            'profilePicture': 'RegisterUserRequest.ProfilePicture',
            'agencyId': 'AgencyId',
            'latitude': 'AssignedLocation.Latitude',
            'longitude': 'AssignedLocation.Longitude'
        };

        const apiFormData = new FormData();
        for (const [key, value] of formData.entries()) {
            if (fieldMappings[key]) {
                apiFormData.append(fieldMappings[key], value);
            }
        }

        if (!apiFormData.get('AssignedLocation.Latitude') || !apiFormData.get('AssignedLocation.Longitude')) {
            apiFormData.delete('AssignedLocation.Latitude');
            apiFormData.delete('AssignedLocation.Longitude');
        }

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/register-responder`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: apiFormData
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                showFeedback('formFeedback', 'Responder created successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'responders.html';
                }, 2000);
            } else {
                const errorMessage = result.message || (result.errors ? Object.values(result.errors).flat().join(' ') : 'An unknown error occurred.');
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Responder creation error:', error);
            showFeedback('formFeedback', `Error: ${error.message}`, 'error', 0);
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    });

    // Initialize the map on page load
    loadGoogleMapsApi().catch(error => {
        console.error(error);
        locationMap.innerHTML = `<div class="map-placeholder"><i class="ri-error-warning-line" style="color: var(--danger-color);"></i><p>Could not load the map. Please check your API key and internet connection.</p></div>`;
    });
});