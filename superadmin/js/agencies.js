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
    const createAgencyBtn = document.getElementById("createAgencyBtn");
    const agencyModal = document.getElementById("agencyModal");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const agencyForm = document.getElementById("agencyForm");
    const submitBtn = document.getElementById("submitBtn");
    const formFeedback = document.getElementById("formFeedback");
    const agenciesContainer = document.getElementById("agenciesContainer");
    const searchInput = document.getElementById("searchInput");
    const incidentTypeFilter = document.getElementById("incidentTypeFilter");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");

    // File inputs
    const agencyLogoInput = document.getElementById("agencyLogo");
    const profilePictureInput = document.getElementById("profilePicture");
    const logoFileName = document.getElementById("logoFileName");
    const profileFileName = document.getElementById("profileFileName");
    const logoPreview = document.getElementById("logoPreview");
    const profilePreview = document.getElementById("profilePreview");

    // Password toggles
    const passwordToggles = document.querySelectorAll(".toggle-password");

    let allAgencies = [];
    let currentAgencyId = null;

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
    agencyLogoInput.addEventListener("change", (e) => {
        handleFilePreview(e.target.files[0], logoFileName, logoPreview, "logo");
    });

    profilePictureInput.addEventListener("change", (e) => {
        handleFilePreview(e.target.files[0], profileFileName, profilePreview, "profile");
    });

    function handleFilePreview(file, fileNameEl, previewEl, type) {
        if (!file) return;

        fileNameEl.textContent = file.name;

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewEl.innerHTML = `<img src="${e.target.result}" alt="${type}">`;
                previewEl.classList.add("show");
            };
            reader.readAsDataURL(file);
        }
    }

    // ==================== MODAL MANAGEMENT ====================
    createAgencyBtn.addEventListener("click", () => {
        openModal();
    });

    closeModal.addEventListener("click", () => {
        closeModalHandler();
    });

    cancelBtn.addEventListener("click", () => {
        closeModalHandler();
    });

    // Close modal when clicking outside
    agencyModal.addEventListener("click", (e) => {
        if (e.target === agencyModal) {
            closeModalHandler();
        }
    });

    function openModal(agencyId = null) {
        currentAgencyId = agencyId;
        agencyForm.reset();
        logoPreview.classList.remove("show");
        profilePreview.classList.remove("show");
        logoFileName.textContent = "Choose logo image";
        profileFileName.textContent = "Choose profile picture";
        formFeedback.className = "form-feedback";

        if (agencyId) {
            document.getElementById("modalTitle").innerHTML = '<i class="ri-edit-line"></i> Edit Agency';
            submitBtn.querySelector(".btn-text").innerHTML = '<i class="ri-save-line"></i> Update Agency';
            // Load agency data here if editing
        } else {
            document.getElementById("modalTitle").innerHTML = '<i class="ri-building-line"></i> Create New Agency';
            submitBtn.querySelector(".btn-text").innerHTML = '<i class="ri-save-line"></i> Create Agency';
        }

        agencyModal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closeModalHandler() {
        agencyModal.classList.remove("show");
        document.body.style.overflow = "";
        currentAgencyId = null;
    }

    // ==================== FORM SUBMISSION ====================
    agencyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validate passwords match
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            showFormFeedback("Passwords do not match!", "error");
            return;
        }

        // Validate at least one incident type is selected
        const supportedIncidents = Array.from(document.querySelectorAll('input[name="supportedIncidents"]:checked'))
            .map(cb => cb.value);

        if (supportedIncidents.length === 0) {
            showFormFeedback("Please select at least one incident type!", "error");
            return;
        }

        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.classList.add("loading");
        formFeedback.className = "form-feedback";

        // Create FormData
        const formData = new FormData();

        // Agency Information
        formData.append("AgencyName", document.getElementById("agencyName").value.trim());
        formData.append("AgencyEmail", document.getElementById("agencyEmail").value.trim());
        formData.append("AgencyPhoneNumber", document.getElementById("agencyPhoneNumber").value.trim());

        // Agency Logo
        if (agencyLogoInput.files[0]) {
            formData.append("AgencyLogo", agencyLogoInput.files[0]);
        }

        // Agency Address
        const street = document.getElementById("street").value.trim();
        const city = document.getElementById("city").value.trim();
        const state = document.getElementById("state").value.trim();
        const country = document.getElementById("country").value.trim();

        if (street || city || state || country) {
            formData.append("AgencyAddress.Street", street);
            formData.append("AgencyAddress.City", city);
            formData.append("AgencyAddress.State", state);
            formData.append("AgencyAddress.Country", country);
        }

        // Supported Incidents
        supportedIncidents.forEach(incident => {
            formData.append("SupportedIncidents", incident);
        });

        // Admin User Information
        formData.append("RegisterUserRequest.FirstName", document.getElementById("firstName").value.trim());
        formData.append("RegisterUserRequest.LastName", document.getElementById("lastName").value.trim());
        formData.append("RegisterUserRequest.Email", document.getElementById("adminEmail").value.trim());
        formData.append("RegisterUserRequest.Gender", document.getElementById("gender").value);
        formData.append("RegisterUserRequest.Password", password);
        formData.append("RegisterUserRequest.ConfirmPassword", confirmPassword);

        // Profile Picture
        if (profilePictureInput.files[0]) {
            formData.append("RegisterUserRequest.ProfilePicture", profilePictureInput.files[0]);
        }

        // 🔴 TESTING: Mock successful submission
        setTimeout(() => {
            showFormFeedback("✅ Agency created successfully! Reloading...", "success");
            setTimeout(() => {
                closeModalHandler();
                loadAgencies();
            }, 1500);
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
        }, 2000);

        /* 🟢 PRODUCTION: Uncomment for real API
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/register-agency`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                    // Don't set Content-Type - browser sets it with boundary
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                showFormFeedback("✅ Agency created successfully!", "success");
                setTimeout(() => {
                    closeModalHandler();
                    loadAgencies();
                }, 1500);
            } else {
                const errorMessage = data.message || data.errors?.join(", ") || "Failed to create agency. Please try again.";
                showFormFeedback(`❌ ${errorMessage}`, "error");
            }
        } catch (error) {
            console.error("Agency creation error:", error);
            showFormFeedback("⚠️ Network error. Please check your connection and try again.", "error");
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
        agenciesContainer.innerHTML = `
            <div class="loading-container">
                <div class="spinner-large"></div>
                <p>Loading agencies...</p>
            </div>
        `;

        try {
            // 🔴 TESTING: Mock data
            setTimeout(() => {
                const mockAgencies = [
                    {
                        id: "1",
                        name: "Lagos Fire Service",
                        email: "contact@lagosfire.gov.ng",
                        phoneNumber: "+234 803 123 4567",
                        address: "Alausa, Ikeja, Lagos",
                        supportedIncidents: ["Fire", "Accident"],
                        respondersCount: 45,
                        status: "Active"
                    },
                    {
                        id: "2",
                        name: "Nigeria Police Force",
                        email: "info@npf.gov.ng",
                        phoneNumber: "+234 806 456 7890",
                        address: "Force Headquarters, Abuja",
                        supportedIncidents: ["Security", "Accident"],
                        respondersCount: 120,
                        status: "Active"
                    },
                    {
                        id: "3",
                        name: "Lagos State Ambulance Service",
                        email: "emergency@lasambulance.lg.gov.ng",
                        phoneNumber: "+234 809 789 0123",
                        address: "Maryland, Lagos",
                        supportedIncidents: ["Medical", "Accident"],
                        respondersCount: 67,
                        status: "Active"
                    },
                    {
                        id: "4",
                        name: "National Emergency Management Agency",
                        email: "info@nema.gov.ng",
                        phoneNumber: "+234 802 345 6789",
                        address: "Central Area, Abuja",
                        supportedIncidents: ["NaturalDisaster", "Other"],
                        respondersCount: 89,
                        status: "Active"
                    }
                ];

                allAgencies = mockAgencies;
                displayAgencies(mockAgencies);
            }, 1000);

            /* 🟢 PRODUCTION: Uncomment for real API
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                allAgencies = data.data.items || data.data;
                displayAgencies(allAgencies);
            } else {
                throw new Error("Failed to load agencies");
            }
            */
        } catch (error) {
            console.error("Error loading agencies:", error);
            agenciesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="ri-error-warning-line"></i>
                    <h3>Failed to Load Agencies</h3>
                    <p>Please try refreshing the page</p>
                </div>
            `;
        }
    }

    function displayAgencies(agencies) {
        if (!agencies || agencies.length === 0) {
            agenciesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="ri-building-line"></i>
                    <h3>No Agencies Found</h3>
                    <p>Create your first agency to get started</p>
                </div>
            `;
            return;
        }

        agenciesContainer.innerHTML = agencies.map(agency => `
            <div class="agency-card" data-agency-id="${agency.id}">
                <div class="agency-header">
                    <div class="agency-logo">
                        ${agency.logoUrl ?
                `<img src="${agency.logoUrl}" alt="${agency.name}">` :
                `<i class="ri-building-fill"></i>`
            }
                    </div>
                    <div class="agency-header-info">
                        <h3>${agency.name}</h3>
                        <span class="agency-status">
                            <i class="ri-checkbox-circle-fill"></i> ${agency.status}
                        </span>
                    </div>
                </div>
                <div class="agency-body">
                    <div class="agency-info-item">
                        <i class="ri-mail-line"></i>
                        <span>${agency.email}</span>
                    </div>
                    <div class="agency-info-item">
                        <i class="ri-phone-line"></i>
                        <span>${agency.phoneNumber}</span>
                    </div>
                    <div class="agency-info-item">
                        <i class="ri-map-pin-line"></i>
                        <span>${agency.address || "No address provided"}</span>
                    </div>
                    <div class="incident-types">
                        <h4>Supported Incidents</h4>
                        <div class="incident-badges">
                            ${agency.supportedIncidents.map(type => `
                                <span class="incident-badge ${type.toLowerCase().replace(/\s+/g, '-')}">
                                    ${getIncidentIcon(type)} ${formatIncidentType(type)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="agency-footer">
                    <div class="agency-stats">
                        <i class="ri-user-star-line"></i>
                        <span>${agency.respondersCount} Responders</span>
                    </div>
                    <div class="agency-actions">
                        <button class="icon-btn" onclick="viewAgency('${agency.id}')" title="View Details">
                            <i class="ri-eye-line"></i>
                        </button>
                        <button class="icon-btn" onclick="editAgency('${agency.id}')" title="Edit Agency">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button class="icon-btn delete" onclick="deleteAgency('${agency.id}')" title="Delete Agency">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function getIncidentIcon(type) {
        const icons = {
            Fire: '<i class="ri-fire-line"></i>',
            Security: '<i class="ri-shield-line"></i>',
            Medical: '<i class="ri-heart-pulse-line"></i>',
            NaturalDisaster: '<i class="ri-typhoon-line"></i>',
            Accident: '<i class="ri-car-line"></i>',
            Other: '<i class="ri-more-line"></i>'
        };
        return icons[type] || '<i class="ri-information-line"></i>';
    }

    function formatIncidentType(type) {
        return type.replace(/([A-Z])/g, ' $1').trim();
    }

    // ==================== SEARCH AND FILTER ====================
    searchInput.addEventListener("input", filterAgencies);
    incidentTypeFilter.addEventListener("change", filterAgencies);

    resetFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        incidentTypeFilter.value = "";
        filterAgencies();
    });

    function filterAgencies() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedType = incidentTypeFilter.value;

        const filtered = allAgencies.filter(agency => {
            const matchesSearch =
                agency.name.toLowerCase().includes(searchTerm) ||
                agency.email.toLowerCase().includes(searchTerm) ||
                agency.phoneNumber.includes(searchTerm);

            const matchesType = !selectedType || agency.supportedIncidents.includes(selectedType);

            return matchesSearch && matchesType;
        });

        displayAgencies(filtered);
    }

    // ==================== AGENCY ACTIONS ====================
    window.viewAgency = function (id) {
        window.location.href = `agency-details.html?id=${id}`;
    };

    window.editAgency = function (id) {
        openModal(id);
    };

    window.deleteAgency = async function (id) {
        if (!confirm("Are you sure you want to delete this agency? This action cannot be undone.")) {
            return;
        }

        try {
            // 🔴 TESTING: Mock deletion
            setTimeout(() => {
                alert("Agency deleted successfully!");
                loadAgencies();
            }, 500);

            /* 🟢 PRODUCTION: Uncomment for real API
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                alert("Agency deleted successfully!");
                loadAgencies();
            } else {
                alert("Failed to delete agency. Please try again.");
            }
            */
        } catch (error) {
            console.error("Delete error:", error);
            alert("Network error. Please try again.");
        }
    };

    // ==================== INITIALIZE ====================
    loadAgencies();
});