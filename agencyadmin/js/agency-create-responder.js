document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage('AgencyAdmin');
    if (!token) return;

    const profile = await loadAgencyAdminProfile(token);
    if (!profile || !profile.agencyId) {
        console.error("Could not determine agency ID.");
        document.body.innerHTML = `<div class="error-state"><p>Could not load agency details. Please log in again.</p></div>`;
        return;
    }
    const agencyId = profile.agencyId;
    await loadAgencyInfo(agencyId, token);

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const form = document.getElementById("responderForm");
    const formFeedback = document.getElementById("formFeedback");
    const submitBtn = document.getElementById("submitBtn");
    const passwordToggles = document.querySelectorAll(".toggle-password");
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
    let autocomplete;

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    async function loadAgencyInfo(agencyId, token) {
        const agencyNameEl = document.getElementById("agencyName");
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${agencyId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load agency');
            const result = await response.json();
            if (result.succeeded && result.data) {
                agencyNameEl.textContent = result.data.name;
            }
        } catch (error) {
            console.error('Error loading agency:', error);
            agencyNameEl.textContent = 'Agency';
        }
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
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) return resolve();
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${AppConfig.GOOGLE_MAPS_API_KEY}&libraries=places&callback=initAgencyCreateMap`;
            script.async = true;
            window.initAgencyCreateMap = () => {
                initializeAutocomplete();
                setupMap(6.5244, 3.3792); // Default to Lagos
                resolve();
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
        marker = new google.maps.Marker({ position: location, map: map, draggable: true });
        marker.addListener('dragend', () => updateLocationInputs(marker.getPosition().lat(), marker.getPosition().lng()));
    }

    function initializeAutocomplete() {
        autocomplete = new google.maps.places.Autocomplete(locationSearchInput);
        autocomplete.setFields(['geometry', 'name']);
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) updateMapAndMarker(place.geometry.location);
        });
    }

    useCurrentLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) return alert('Geolocation is not supported by your browser.');
        locationStatusEl.style.display = 'flex';
        statusTextEl.textContent = 'Detecting location...';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                updateMapAndMarker(location);
                locationStatusEl.style.display = 'none';
                showFeedback('formFeedback', 'Current location captured.', 'success');
            },
            () => {
                statusTextEl.textContent = 'Failed to get location.';
                setTimeout(() => locationStatusEl.style.display = 'none', 4000);
            }
        );
    });

    skipLocationBtn.addEventListener('click', () => {
        latInput.value = '';
        lonInput.value = '';
        setupMap(6.5244, 3.3792);
        showFeedback('formFeedback', 'Location assignment skipped.', 'info');
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

    // Initialize the map on page load
    loadGoogleMapsApi().catch(error => {
        console.error(error);
        locationMap.innerHTML = `<div class="map-placeholder error-state"><i class="ri-error-warning-line"></i><p>Could not load map.</p></div>`;
    });


    // Form Submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        formFeedback.textContent = '';
        formFeedback.className = 'form-feedback';

        const formData = new FormData(form);
        formData.append('agencyId', agencyId); // Automatically add the agency ID

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
                    window.location.href = 'agency-responders.html';
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
});