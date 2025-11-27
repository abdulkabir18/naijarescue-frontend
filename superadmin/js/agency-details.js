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
    const detailsContainer = document.getElementById("detailsContainer");
    const agencyContent = document.getElementById("agencyContent");
    const agencyRefNameEl = document.getElementById("agencyRefName");

    // Modal Elements
    const incidentTypesModal = document.getElementById("incidentTypesModal");
    const manageIncidentsBtn = document.getElementById("manageIncidentsBtn");
    const closeIncidentModalBtn = document.getElementById("closeIncidentModal");
    const cancelIncidentUpdateBtn = document.getElementById("cancelIncidentUpdate");
    const saveIncidentTypesBtn = document.getElementById("saveIncidentTypes");
    const incidentTypesCheckboxesContainer = document.getElementById("incidentTypesCheckboxes");
    const incidentFormFeedback = document.getElementById("incidentFormFeedback");

    // Get Agency ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const agencyId = urlParams.get('id');

    if (!agencyId) {
        detailsContainer.innerHTML = `<div class="error-state"><i class="ri-error-warning-line"></i><p>No agency ID provided.</p><a href="agencies.html" class="btn-primary">Back to Agencies</a></div>`;
        return;
    }

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Modal Listeners
    manageIncidentsBtn.addEventListener("click", () => incidentTypesModal.style.display = "flex");
    closeIncidentModalBtn.addEventListener("click", () => incidentTypesModal.style.display = "none");
    cancelIncidentUpdateBtn.addEventListener("click", () => incidentTypesModal.style.display = "none");
    window.addEventListener("click", (e) => {
        if (e.target === incidentTypesModal) {
            incidentTypesModal.style.display = "none";
        }
    });
    saveIncidentTypesBtn.addEventListener("click", handleSaveIncidentTypes);

    async function loadAllAgencyData() {
        try {
            const [agencyRes, respondersRes, supportedIncidentsRes] = await Promise.all([
                fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${agencyId}`, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/agency/${agencyId}`, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${agencyId}/supported-incidents`, { headers: { "Authorization": `Bearer ${token}` } })
            ]);

            const agencyResult = await agencyRes.json();
            const respondersResult = await respondersRes.json();
            const supportedIncidentsResult = await supportedIncidentsRes.json();

            if (!agencyResult.succeeded) throw new Error(agencyResult.message || 'Failed to load agency data');

            const agency = agencyResult.data;
            agency.responders = respondersResult.succeeded ? respondersResult.data : [];
            agency.supportedIncidents = supportedIncidentsResult.succeeded ? supportedIncidentsResult.data : [];

            // Fetch admin details separately
            if (agency.agencyAdminId) {
                const adminRes = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/${agency.agencyAdminId}`, { headers: { "Authorization": `Bearer ${token}` } });
                const adminResult = await adminRes.json();
                agency.admin = adminResult.succeeded ? adminResult.data : null;
            }

            displayAgencyDetails(agency);

        } catch (error) {
            console.error("Error loading agency details:", error);
            detailsContainer.innerHTML = `<div class="error-state"><i class="ri-error-warning-line"></i><p>Failed to load agency details.</p><button onclick="location.reload()" class="btn-secondary">Retry</button></div>`;
        }
    }

    function displayAgencyDetails(agency) {
        detailsContainer.style.display = 'none';
        agencyContent.style.display = 'grid';

        agencyRefNameEl.textContent = agency.name || 'N/A';

        renderAgencyHeader(agency);
        renderAgencySummary(agency);
        renderLocation(agency);
        renderSupportedIncidents(agency.supportedIncidents);
        renderAdminInfo(agency.admin);
        renderResponders(agency.responders);
        populateIncidentTypesModal(agency.supportedIncidents);
    }

    function renderAgencyHeader(agency) {
        const logoUrl = agency.logoUrl ? `${AppConfig.API_BASE_URL}${agency.logoUrl}` : generateInitialsAvatar(agency.name);
        document.getElementById('agencyHeader').innerHTML = `
            <img src="${logoUrl}" alt="${agency.name} Logo" class="agency-logo-large">
            <div class="agency-title-main">
                <h1>${escapeHtml(agency.name)}</h1>
                <p><i class="ri-mail-line"></i> ${escapeHtml(agency.email)} | <i class="ri-phone-line"></i> ${escapeHtml(agency.phoneNumber)}</p>
            </div>
        `;
    }

    function renderAgencySummary(agency) {
        document.getElementById('agencySummary').innerHTML = `
            <div class="summary-item">
                <span class="label"><i class="ri-group-line"></i> Responders</span>
                <span class="value">${agency.responders?.length || 0}</span>
            </div>
            <div class="summary-item">
                <span class="label"><i class="ri-shield-check-line"></i> Capabilities</span>
                <span class="value">${agency.supportedIncidents?.length || 0}</span>
            </div>
        `;
    }

    function renderLocation(agency) {
        // const mapContainer = document.getElementById('map');
        const addressContainer = document.getElementById('address');

        // For now, we'll just show the address text as map isn't set up for agencies yet.
        // mapContainer.innerHTML = '<p class="text-center">Map view coming soon.</p>';
        addressContainer.innerHTML = `<i class="ri-map-pin-2-line"></i> ${formatAddress(agency.address) || 'Address not available'}`;
    }

    function renderSupportedIncidents(incidents) {
        const container = document.getElementById('supportedIncidents');
        if (!incidents || incidents.length === 0) {
            container.innerHTML = `<div class="empty-state-small"><p>No capabilities defined.</p></div>`;
            return;
        }
        container.innerHTML = incidents.map(type => `
            <div class="incident-item">
                <i class="${getIncidentTypeIcon(type)}"></i>
                <span>${formatIncidentType(type)}</span>
            </div>
        `).join('');
    }

    function renderAdminInfo(admin) {
        const container = document.getElementById('adminInfo');
        if (!admin) {
            container.innerHTML = `<div class="empty-state-small"><p>No administrator assigned.</p></div>`;
            return;
        }
        const avatarSrc = admin.profilePictureUrl ? `${AppConfig.API_BASE_URL}${admin.profilePictureUrl}` : generateInitialsAvatar(admin.fullName);
        container.innerHTML = `
            <img src="${avatarSrc}" alt="${admin.fullName}" class="admin-avatar">
            <div class="admin-details">
                <strong>${escapeHtml(admin.fullName)}</strong>
                <p>${escapeHtml(admin.email)}</p>
            </div>
        `;
    }

    function renderResponders(responders) {
        const container = document.getElementById('respondersList');
        if (!responders || responders.length === 0) {
            container.innerHTML = `<div class="empty-state-small"><p>This agency has no responders.</p></div>`;
            return;
        }

        const table = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${responders.map(r => `
                        <tr>
                            <td>${escapeHtml(r.userFullName)}</td>
                            <td>${escapeHtml(r.email)}</td>
                            <td><span class="status-badge-small ${r.status.toLowerCase()}">${r.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.innerHTML = table;
    }

    function populateIncidentTypesModal(currentIncidents = []) {
        const allIncidentTypes = ["Fire", "Security", "Medical", "NaturalDisaster", "Accident", "Other"];
        incidentTypesCheckboxesContainer.innerHTML = allIncidentTypes.map(type => {
            const isChecked = currentIncidents.includes(type);
            return `
                <label class="checkbox-card">
                    <input type="checkbox" name="supportedIncidents" value="${type}" ${isChecked ? 'checked' : ''}>
                    <div class="checkbox-content">
                        <i class="${getIncidentTypeIcon(type)}"></i>
                        <span>${formatIncidentType(type)}</span>
                    </div>
                </label>
            `;
        }).join('');
    }

    async function handleSaveIncidentTypes() {
        saveIncidentTypesBtn.disabled = true;
        saveIncidentTypesBtn.classList.add('loading');
        showFeedback('incidentFormFeedback', '', 'info');

        // Map string incident types to their integer enum values
        const incidentTypeEnum = {
            "Fire": 1,
            "Security": 2,
            "Medical": 3,
            "NaturalDisaster": 4,
            "Accident": 5,
            "Other": 6 // Assuming 'Other' is 6 based on typical enum progression
        };

        const form = document.getElementById('incidentTypesForm');
        const selectedTypes = Array.from(form.querySelectorAll('input:checked')).map(cb => cb.value);
        const originalTypes = Array.from(form.querySelectorAll('input')).filter(cb => cb.defaultChecked).map(cb => cb.value);

        const typesToAdd = selectedTypes.filter(t => !originalTypes.includes(t));
        const typesToRemove = originalTypes.filter(t => !selectedTypes.includes(t));

        const promises = [];

        // Add new types
        typesToAdd.forEach(type => {
            const promise = fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${agencyId}/add-supported-incident`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ acceptedIncidentType: incidentTypeEnum[type] })
            });
            promises.push(promise);
        });

        // Remove old types
        typesToRemove.forEach(type => {
            const promise = fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${agencyId}/remove-supported-incident`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ acceptedIncidentType: incidentTypeEnum[type] })
            });
            promises.push(promise);
        });

        try {
            const results = await Promise.all(promises);
            const failed = results.filter(res => !res.ok);

            if (failed.length > 0) {
                throw new Error('Some updates failed. Please try again.');
            }

            showFeedback('incidentFormFeedback', 'Capabilities updated successfully!', 'success');
            setTimeout(() => {
                incidentTypesModal.style.display = "none";
                loadAllAgencyData(); // Reload all data to reflect changes
            }, 1500);

        } catch (error) {
            console.error("Error updating incident types:", error);
            showFeedback('incidentFormFeedback', error.message, 'error', 0);
        } finally {
            saveIncidentTypesBtn.disabled = false;
            saveIncidentTypesBtn.classList.remove('loading');
        }
    }

    // Initial Load
    loadAllAgencyData();
});