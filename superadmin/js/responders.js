document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    // 🔴 TESTING: Allow page to load without token for testing
    // if (!token) return;

    if (token) {
        await window.notificationManager.initialize(token);
    }

    await loadAdminProfile(token);

    // ==================== DOM ELEMENTS ====================
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const createResponderBtn = document.getElementById("createResponderBtn");
    const responderModal = document.getElementById("responderModal");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const responderForm = document.getElementById("responderForm");
    const submitBtn = document.getElementById("submitBtn");
    const formFeedback = document.getElementById("formFeedback");
    const respondersContainer = document.getElementById("respondersContainer");
    const searchInput = document.getElementById("searchInput");
    const agencyFilter = document.getElementById("agencyFilter");
    const statusFilter = document.getElementById("statusFilter");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");

    // Form inputs
    const profilePictureInput = document.getElementById("profilePicture");
    const profileFileName = document.getElementById("profileFileName");
    const profilePreview = document.getElementById("profilePreview");
    const passwordToggles = document.querySelectorAll(".toggle-password");

    // Agency search
    const agencySearch = document.getElementById("agencySearch");
    const agencySearchResults = document.getElementById("agencySearchResults");
    const agencyIdInput = document.getElementById("agencyId");
    const selectedAgencyDisplay = document.getElementById("selectedAgencyDisplay");
    const removeAgencyBtn = document.getElementById("removeAgency");

    // Location
    const useCurrentLocationBtn = document.getElementById("useCurrentLocation");
    const skipLocationBtn = document.getElementById("skipLocation");
    const locationStatus = document.getElementById("locationStatus");
    const statusText = document.getElementById("statusText");
    const locationSearch = document.getElementById("locationSearch");
    const searchSuggestions = document.getElementById("searchSuggestions");
    const detectedAddressBox = document.getElementById("detectedAddressBox");
    const detectedAddress = document.getElementById("detectedAddress");
    const locationMap = document.getElementById("locationMap");
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");

    let allResponders = [];
    let allAgencies = [];
    let selectedAgency = null;
    let map = null;
    let marker = null;
    let currentLocation = null;
    let searchTimeout = null;

    // ==================== SIDEBAR TOGGLE ====================
    menuToggle.addEventListener("click", () => {
        adminSidebar.classList.toggle("collapsed");
    });

    // ==================== LOGOUT ====================
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // ==================== PASSWORD TOGGLE ====================
    passwordToggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.dataset.target;
            const input = document.getElementById(targetId);
            const icon = toggle.querySelector("i");

            if (input.type === "password") {
                input.type = "text";
                icon.className = "ri-eye-off-line";
            } else {
                input.type = "password";
                icon.className = "ri-eye-line";
            }
        });
    });

    // ==================== FILE UPLOAD HANDLING ====================
    profilePictureInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        profileFileName.textContent = file.name;

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePreview.innerHTML = `<img src="${e.target.result}" alt="profile">`;
                profilePreview.classList.add("show");
            };
            reader.readAsDataURL(file);
        }
    });

    // ==================== MODAL MANAGEMENT ====================
    createResponderBtn.addEventListener("click", () => {
        openModal();
    });

    closeModal.addEventListener("click", () => {
        closeModalHandler();
    });

    cancelBtn.addEventListener("click", () => {
        closeModalHandler();
    });

    responderModal.addEventListener("click", (e) => {
        if (e.target === responderModal) {
            closeModalHandler();
        }
    });

    function openModal() {
        responderForm.reset();
        profilePreview.classList.remove("show");
        profileFileName.textContent = "Choose profile picture";
        formFeedback.className = "form-feedback";
        selectedAgency = null;
        selectedAgencyDisplay.style.display = "none";
        agencyIdInput.value = "";
        currentLocation = null;
        detectedAddressBox.style.display = "none";
        locationStatus.style.display = "none";
        latitudeInput.value = "";
        longitudeInput.value = "";

        // Reset map
        if (map) {
            locationMap.innerHTML = `
                <div class="map-placeholder">
                    <i class="ri-map-2-line"></i>
                    <p>Map will load when needed</p>
                </div>
            `;
            map = null;
            marker = null;
        }

        responderModal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closeModalHandler() {
        responderModal.classList.remove("show");
        document.body.style.overflow = "";
    }

    // ==================== AGENCY SEARCH ====================
    agencySearch.addEventListener("input", (e) => {
        const query = e.target.value.trim();

        clearTimeout(searchTimeout);

        if (query.length < 2) {
            agencySearchResults.classList.remove("show");
            return;
        }

        searchTimeout = setTimeout(() => {
            searchAgencies(query);
        }, 300);
    });

    function searchAgencies(query) {
        const filtered = allAgencies.filter(agency =>
            agency.name.toLowerCase().includes(query.toLowerCase()) ||
            agency.email.toLowerCase().includes(query.toLowerCase())
        );

        displayAgencyResults(filtered);
    }

    function displayAgencyResults(agencies) {
        if (!agencies || agencies.length === 0) {
            agencySearchResults.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: #999;">
                    No agencies found
                </div>
            `;
            agencySearchResults.classList.add("show");
            return;
        }

        agencySearchResults.innerHTML = agencies.map(agency => `
            <div class="agency-result-item" data-agency-id="${agency.id}">
                <div class="agency-result-name">${agency.name}</div>
                <div class="agency-result-email">${agency.email}</div>
                <div class="agency-result-incidents">
                    ${agency.supportedIncidents.map(type => `
                        <span class="incident-badge ${type.toLowerCase().replace(/\s+/g, '-')}">
                            ${formatIncidentType(type)}
                        </span>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll(".agency-result-item").forEach(item => {
            item.addEventListener("click", () => {
                const agencyId = item.dataset.agencyId;
                selectAgency(agencyId);
            });
        });

        agencySearchResults.classList.add("show");
    }

    function selectAgency(agencyId) {
        selectedAgency = allAgencies.find(a => a.id === agencyId);
        if (!selectedAgency) return;

        agencyIdInput.value = agencyId;
        agencySearch.value = "";
        agencySearchResults.classList.remove("show");

        // Display selected agency
        document.getElementById("selectedAgencyName").textContent = selectedAgency.name;
        document.getElementById("selectedAgencyEmail").textContent = selectedAgency.email;
        document.getElementById("selectedAgencyIncidents").innerHTML = selectedAgency.supportedIncidents.map(type => `
            <span class="incident-badge ${type.toLowerCase().replace(/\s+/g, '-')}">
                ${getIncidentIcon(type)} ${formatIncidentType(type)}
            </span>
        `).join('');

        selectedAgencyDisplay.style.display = "flex";
    }

    removeAgencyBtn.addEventListener("click", () => {
        selectedAgency = null;
        agencyIdInput.value = "";
        selectedAgencyDisplay.style.display = "none";
    });

    // Close agency results when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".agency-search-wrapper")) {
            agencySearchResults.classList.remove("show");
        }
        if (!e.target.closest(".location-search-wrapper")) {
            searchSuggestions.classList.remove("show");
        }
    });

    // ==================== LOCATION HANDLING ====================
    useCurrentLocationBtn.addEventListener("click", async () => {
        await initializeMap();
        getUserLocation();
    });

    skipLocationBtn.addEventListener("click", () => {
        currentLocation = null;
        latitudeInput.value = "";
        longitudeInput.value = "";
        detectedAddressBox.style.display = "none";
        locationStatus.style.display = "none";
    });

    async function initializeMap() {
        if (map) return; // Already initialized

        await loadGoogleMapsAPI();
        const lat = 6.5244;
        const lng = 3.3792;

        locationMap.innerHTML = "";

        map = new google.maps.Map(locationMap, {
            center: { lat, lng },
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
        });

        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            draggable: true,
            title: "Drag to set location"
        });

        marker.addListener("dragend", () => {
            const position = marker.getPosition();
            updateLocation(position.lat(), position.lng(), true);
        });

        map.addListener("click", (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            marker.setPosition(e.latLng);
            updateLocation(lat, lng, true);
        });
    }

    function loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${AppConfig.GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function getUserLocation() {
        if (!navigator.geolocation) {
            updateLocationStatus("error", "Geolocation not supported by your browser");
            return;
        }

        updateLocationStatus("loading", "Detecting your location...");
        locationStatus.style.display = "flex";

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                updateLocation(lat, lng, true);
                map.setCenter({ lat, lng });
                map.setZoom(15);
                marker.setPosition({ lat, lng });
                updateLocationStatus("success", "Location detected successfully!");
            },
            (error) => {
                console.error("Geolocation error:", error);
                updateLocationStatus("error", "Unable to detect location");
            }
        );
    }

    function updateLocation(lat, lng, reverseGeocode = false) {
        currentLocation = { latitude: lat, longitude: lng };
        latitudeInput.value = lat;
        longitudeInput.value = lng;

        if (reverseGeocode) {
            getAddressFromCoordinates(lat, lng);
        }
    }

    function getAddressFromCoordinates(lat, lng) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
                const address = results[0].formatted_address;
                detectedAddress.textContent = address;
                detectedAddressBox.style.display = "flex";
            } else {
                detectedAddress.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                detectedAddressBox.style.display = "flex";
            }
        });
    }

    function updateLocationStatus(type, message) {
        let icon = "";
        if (type === "loading") icon = `<i class="ri-loader-4-line spinning"></i>`;
        else if (type === "success") icon = `<i class="ri-checkbox-circle-fill"></i>`;
        else if (type === "error") icon = `<i class="ri-error-warning-fill"></i>`;

        locationStatus.innerHTML = `${icon}<span id="statusText">${message}</span>`;
        locationStatus.className = `location-status ${type}`;
    }

    // Location search
    locationSearch.addEventListener("input", (e) => {
        const query = e.target.value.trim();

        clearTimeout(searchTimeout);

        if (query.length < 3) {
            searchSuggestions.classList.remove("show");
            return;
        }

        searchTimeout = setTimeout(() => {
            searchLocation(query);
        }, 500);
    });

    async function searchLocation(query) {
        await loadGoogleMapsAPI();
        await initializeMap();

        const service = new google.maps.places.AutocompleteService();
        service.getPlacePredictions(
            {
                input: query,
                componentRestrictions: { country: "ng" },
                types: ["geocode", "establishment"]
            },
            (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    displayLocationSuggestions(predictions);
                } else {
                    searchSuggestions.classList.remove("show");
                }
            }
        );
    }

    function displayLocationSuggestions(predictions) {
        searchSuggestions.innerHTML = "";

        predictions.slice(0, 5).forEach(prediction => {
            const item = document.createElement("div");
            item.className = "suggestion-item";

            const mainText = prediction.structured_formatting.main_text;
            const secondaryText = prediction.structured_formatting.secondary_text;

            item.innerHTML = `
                <i class="ri-map-pin-line"></i>
                <div>
                    <div class="suggestion-main">${mainText}</div>
                    <div class="suggestion-sub">${secondaryText}</div>
                </div>
            `;

            item.addEventListener("click", () => {
                selectLocation(prediction.place_id, prediction.description);
            });

            searchSuggestions.appendChild(item);
        });

        searchSuggestions.classList.add("show");
    }

    function selectLocation(placeId, description) {
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ placeId: placeId }, (results, status) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();

                map.setCenter(location);
                map.setZoom(16);
                marker.setPosition(location);

                updateLocation(lat, lng);
                detectedAddress.textContent = description;
                detectedAddressBox.style.display = "flex";
                updateLocationStatus("success", "Location selected!");
                locationStatus.style.display = "flex";

                locationSearch.value = "";
                searchSuggestions.classList.remove("show");
            }
        });
    }

    // ==================== FORM SUBMISSION ====================
    responderForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validate passwords
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            showFormFeedback("Passwords do not match!", "error");
            return;
        }

        // Validate agency selection
        if (!agencyIdInput.value) {
            showFormFeedback("Please select an agency!", "error");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.classList.add("loading");
        formFeedback.className = "form-feedback";

        // Create FormData
        const formData = new FormData();

        // User information
        formData.append("RegisterUserRequest.FirstName", document.getElementById("firstName").value.trim());
        formData.append("RegisterUserRequest.LastName", document.getElementById("lastName").value.trim());
        formData.append("RegisterUserRequest.Email", document.getElementById("email").value.trim());
        formData.append("RegisterUserRequest.Gender", document.getElementById("gender").value);
        formData.append("RegisterUserRequest.Password", password);
        formData.append("RegisterUserRequest.ConfirmPassword", confirmPassword);

        if (profilePictureInput.files[0]) {
            formData.append("RegisterUserRequest.ProfilePicture", profilePictureInput.files[0]);
        }

        // Agency ID
        formData.append("AgencyId", agencyIdInput.value);

        // Location (optional)
        if (currentLocation) {
            formData.append("AssignedLocation.Latitude", currentLocation.latitude);
            formData.append("AssignedLocation.Longitude", currentLocation.longitude);
        }

        // 🔴 TESTING: Mock submission
        setTimeout(() => {
            showFormFeedback("✅ Responder created successfully! Reloading...", "success");
            setTimeout(() => {
                closeModalHandler();
                loadResponders();
            }, 1500);
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
        }, 2000);

        /* 🟢 PRODUCTION: Uncomment for real API
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/register`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                showFormFeedback("✅ Responder created successfully!", "success");
                setTimeout(() => {
                    closeModalHandler();
                    loadResponders();
                }, 1500);
            } else {
                const errorMessage = data.message || data.errors?.join(", ") || "Failed to create responder.";
                showFormFeedback(`❌ ${errorMessage}`, "error");
            }
        } catch (error) {
            console.error("Responder creation error:", error);
            showFormFeedback("⚠️ Network error. Please try again.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
        }
        */
    });

    function showFormFeedback(message, type) {
        formFeedback.textContent = message;
        formFeedback.className = `form-feedback ${type}`;
        formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ==================== LOAD AGENCIES ====================
    async function loadAgencies() {
        try {
            // 🔴 TESTING: Mock data
            const mockAgencies = [
                { id: "1", name: "Lagos Fire Service", email: "contact@lagosfire.gov.ng", supportedIncidents: ["Fire", "Accident"] },
                { id: "2", name: "Nigeria Police Force", email: "info@npf.gov.ng", supportedIncidents: ["Security", "Accident"] },
                { id: "3", name: "Lagos Ambulance Service", email: "emergency@lasambulance.lg.gov.ng", supportedIncidents: ["Medical", "Accident"] },
                { id: "4", name: "NEMA", email: "info@nema.gov.ng", supportedIncidents: ["NaturalDisaster", "Other"] }
            ];

            allAgencies = mockAgencies;

            // Populate filter dropdown
            agencyFilter.innerHTML = '<option value="">All Agencies</option>' +
                mockAgencies.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

            /* 🟢 PRODUCTION: Uncomment for real API
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                allAgencies = data.data.items || data.data;
                agencyFilter.innerHTML = '<option value="">All Agencies</option>' +
                    allAgencies.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
            }
            */
        } catch (error) {
            console.error("Error loading agencies:", error);
        }
    }

    // ==================== LOAD RESPONDERS ====================
    async function loadResponders() {
        respondersContainer.innerHTML = `
            <div class="loading-container">
                <div class="spinner-large"></div>
                <p>Loading responders...</p>
            </div>
        `;

        try {
            // 🔴 TESTING: Mock data
            setTimeout(() => {
                const mockResponders = [
                    {
                        id: "1",
                        firstName: "John",
                        lastName: "Doe",
                        email: "john.doe@lagosfire.gov.ng",
                        gender: "Male",
                        profilePictureUrl: null,
                        agency: { id: "1", name: "Lagos Fire Service" },
                        assignedLocation: { latitude: 6.5244, longitude: 3.3792 },
                        status: "Active"
                    },
                    {
                        id: "2",
                        firstName: "Jane",
                        lastName: "Smith",
                        email: "jane.smith@npf.gov.ng",
                        gender: "Female",
                        profilePictureUrl: null,
                        agency: { id: "2", name: "Nigeria Police Force" },
                        assignedLocation: null,
                        status: "Active"
                    },
                    {
                        id: "3",
                        firstName: "Mike",
                        lastName: "Johnson",
                        email: "mike.j@lasambulance.lg.gov.ng",
                        gender: "Male",
                        profilePictureUrl: null,
                        agency: { id: "3", name: "Lagos Ambulance Service" },
                        assignedLocation: { latitude: 6.4541, longitude: 3.3947 },
                        status: "Active"
                    }
                ];

                allResponders = mockResponders;
                displayResponders(mockResponders);
            }, 1000);

            /* 🟢 PRODUCTION: Uncomment for real API
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                allResponders = data.data.items || data.data;
                displayResponders(allResponders);
            }
            */
        } catch (error) {
            console.error("Error loading responders:", error);
            respondersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="ri-error-warning-line"></i>
                    <h3>Failed to Load Responders</h3>
                    <p>Please try refreshing the page</p>
                </div>
            `;
        }
    }

    function displayResponders(responders) {
        if (!responders || responders.length === 0) {
            respondersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="ri-user-star-line"></i>
                    <h3>No Responders Found</h3>
                    <p>Add your first responder to get started</p>
                </div>
            `;
            return;
        }

        respondersContainer.innerHTML = responders.map(responder => {
            const fullName = `${responder.firstName} ${responder.lastName}`;
            const avatarSrc = responder.profilePictureUrl || generateInitialsAvatar(fullName);

            return `
                <div class="responder-card" data-responder-id="${responder.id}">
                    <div class="responder-header">
                        <div class="responder-avatar">
                            <img src="${avatarSrc}" alt="${fullName}">
                        </div>
                        <h3 class="responder-name">${fullName}</h3>
                        <span class="responder-status ${responder.status.toLowerCase()}">
                            <i class="ri-checkbox-circle-fill"></i> ${responder.status}
                        </span>
                    </div>
                    <div class="responder-body">
                        <div class="responder-info-item">
                            <i class="ri-mail-line"></i>
                            <span>${responder.email}</span>
                        </div>
                        <div class="responder-info-item">
                            <i class="ri-user-line"></i>
                            <span>${responder.gender}</span>
                        </div>
                        <div class="agency-badge">
                            <i class="ri-building-fill"></i>
                            <div class="agency-badge-info">
                                <h5>${responder.agency.name}</h5>
                                <p>Agency</p>
                            </div>
                        </div>
                    </div>
                    <div class="responder-footer">
                        ${responder.assignedLocation ?
                    `<div class="responder-location" onclick="viewLocation('${responder.id}')">
                                    <i class="ri-map-pin-line"></i>
                                    <span>View Location</span>
                                </div>` :
                    `<span style="color: #999; font-size: 0.85rem;">No location set</span>`
                }
                        <div class="responder-actions">
                            <button class="icon-btn" onclick="viewResponder('${responder.id}')" title="View Details">
                                <i class="ri-eye-line"></i>
                            </button>
                            <button class="icon-btn" onclick="editResponder('${responder.id}')" title="Edit">
                                <i class="ri-edit-line"></i>
                            </button>
                            <button class="icon-btn delete" onclick="deleteResponder('${responder.id}')" title="Delete">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== SEARCH AND FILTER ====================
    searchInput.addEventListener("input", filterResponders);
    agencyFilter.addEventListener("change", filterResponders);
    statusFilter.addEventListener("change", filterResponders);

    resetFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        agencyFilter.value = "";
        statusFilter.value = "";
        filterResponders();
    });

    function filterResponders() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedAgency = agencyFilter.value;
        const selectedStatus = statusFilter.value;

        const filtered = allResponders.filter(responder => {
            const fullName = `${responder.firstName} ${responder.lastName}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm) || responder.email.toLowerCase().includes(searchTerm);
            const matchesAgency = !selectedAgency || responder.agency.id === selectedAgency;
            const matchesStatus = !selectedStatus || responder.status.toLowerCase() === selectedStatus;

            return matchesSearch && matchesAgency && matchesStatus;
        });

        displayResponders(filtered);
    }

    // ==================== RESPONDER ACTIONS ====================
    window.viewResponder = function (id) {
        alert(`View responder: ${id}`);
    };

    window.editResponder = function (id) {
        alert(`Edit responder: ${id}`);
    };

    window.deleteResponder = async function (id) {
        if (!confirm("Are you sure you want to delete this responder?")) return;

        // Mock deletion
        alert("Responder deleted successfully!");
        loadResponders();
    };

    window.viewLocation = function (id) {
        const responder = allResponders.find(r => r.id === id);
        if (responder && responder.assignedLocation) {
            alert(`Location: ${responder.assignedLocation.latitude}, ${responder.assignedLocation.longitude}`);
        }
    };

    // ==================== HELPER FUNCTIONS ====================
    function getIncidentIcon(type) {
        const icons = {
            Fire: '<i class="ri-fire-line"></i>',
            Security: '<i class="ri-shield-line"></i>',
            Medical: '<i class="ri-heart-pulse-line"></i>',
            NaturalDisaster: '<i class="ri-typhoon-line"></i>',
            Accident: '<i class="ri-car-line"></i>',
            Other: '<i class="ri-more-line"></i>'
        };
        return icons[type] || '';
    }

    function formatIncidentType(type) {
        return type.replace(/([A-Z])/g, ' $1').trim();
    }

    // ==================== INITIALIZE ====================
    await loadAgencies();
    loadResponders();
});