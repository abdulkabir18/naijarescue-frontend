document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage('AgencyAdmin');
    if (!token) return;

    const profile = await loadAgencyAdminProfile(token);
    if (!profile || !profile.agencyId) {
        console.error("Could not determine agency ID.");
        return;
    }

    if (token) {
        await window.notificationManager.initialize(token);
    }

    const agencyId = profile.agencyId;

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const backLink = document.getElementById("backLink");
    const incidentSummaryContainer = document.getElementById("incidentSummary");
    const respondersListContainer = document.getElementById("respondersList");
    const searchInput = document.getElementById("searchResponders");

    // State
    let incidentId = null;
    let allResponders = [];

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });
    searchInput.addEventListener("input", () => filterAndDisplayResponders());

    function getIncidentId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async function loadIncidentSummary() {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch incident details');
            const result = await response.json();
            if (result.succeeded && result.data) {
                displayIncidentSummary(result.data);
                loadAvailableResponders(result.data); // Load responders after getting incident details
            } else {
                throw new Error(result.message || 'Could not load incident data');
            }
        } catch (error) {
            console.error("Error loading incident summary:", error);
            incidentSummaryContainer.innerHTML = `<div class="error-state-small"><p>Could not load incident summary.</p></div>`;
        }
    }

    function displayIncidentSummary(incident) {
        const location = formatAddress(incident.address) || 'Not specified';
        incidentSummaryContainer.innerHTML = `
            <h3>Incident: ${escapeHtml(incident.referenceNumber)}</h3>
            <div class="summary-details">
                <span class="summary-item"><i class="ri-shield-cross-line"></i> Type: <strong>${formatIncidentType(incident.type)}</strong></span>
                <span class="summary-item"><i class="ri-map-pin-line"></i> Location: <strong>${escapeHtml(location)}</strong></span>
            </div>
        `;
    }

    async function loadAvailableResponders(incident) {
        try {
            // Fetch responders from the agency
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/agency/${agencyId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch responders');
            const result = await response.json();

            if (result.succeeded && result.data) {
                // Filter responders to only include truly available responders.
                // Exclude any "OnDuty" (case-insensitive) responders.
                allResponders = result.data.filter(r => {
                    if (!r || !r.status) return false;
                    const s = String(r.status).toLowerCase();
                    return s === 'available';
                });

                // If none are available, show an empty state and skip listing on-duty responders
                if (!allResponders || allResponders.length === 0) {
                    respondersListContainer.innerHTML = `<div class="empty-state"><i class="ri-user-search-line"></i><p>No available responders at the moment.</p></div>`;
                    return;
                }

                filterAndDisplayResponders();
            } else {
                throw new Error(result.message || 'Could not load responders');
            }
        } catch (error) {
            console.error("Error loading responders:", error);
            respondersListContainer.innerHTML = `<div class="empty-state"><i class="ri-error-warning-line"></i><p>Could not load available responders.</p></div>`;
        }
    }

    function filterAndDisplayResponders() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredResponders = allResponders.filter(responder => {
            const fullName = `${responder.userFullName || ''}`.toLowerCase();
            return fullName.includes(searchTerm);
        });
        displayResponders(filteredResponders);
    }

    function displayResponders(responders) {
        if (responders.length === 0) {
            respondersListContainer.innerHTML = `<div class="empty-state"><i class="ri-user-search-line"></i><p>No available responders match your criteria.</p></div>`;
            return;
        }

        respondersListContainer.innerHTML = responders.map(responder => {
            const status = responder.status || 'Available';
            const statusClass = status.toLowerCase() === 'available' ? 'available' : (status.toLowerCase() === 'busy' ? 'busy' : 'offline');
            const avatarInitials = generateInitials(responder.userFullName);
            
            return `
                <div class="responder-card">
                    <div class="responder-info">
                        <div class="responder-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${avatarInitials}
                        </div>
                        <div class="responder-details">
                            <div class="responder-name">${escapeHtml(responder.userFullName)}</div>
                            <div class="responder-agency">Your Agency</div>
                        </div>
                    </div>
                    <div class="responder-status">
                        <span class="status-badge-small ${statusClass}">${status}</span>
                    </div>
                    <button class="btn-primary assign-btn" data-responder-id="${responder.id}">
                        <i class="ri-user-add-line"></i> Assign
                    </button>
                </div>
            `;
        }).join('');

        // Add event listeners to the new buttons
        document.querySelectorAll('.assign-btn').forEach(button => {
            button.addEventListener('click', handleAssignResponder);
        });
    }

    async function handleAssignResponder(event) {
        const button = event.currentTarget;
        const responderId = button.dataset.responderId;

        if (!responderId || !incidentId) {
            alert('Error: Missing responder or incident ID.');
            return;
        }

        // Using a more modern confirmation dialog is recommended over confirm()
        // For example, using a library like SweetAlert2:
        // const result = await Swal.fire({ title: 'Are you sure?', text: "Assign this responder to the incident?", icon: 'warning', showCancelButton: true });
        // if (!result.isConfirmed) return;
        if (!confirm('Are you sure you want to assign this responder to the incident?')) return;

        button.disabled = true;
        button.innerHTML = '<div class="spinner-small"></div> Assigning...';

        try {
            const payload = {
                responderId: responderId,
                incidentId: incidentId
            };

            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/assign-responder`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                // Using a non-blocking notification is better than alert()
                // For example: showToast('Responder assigned successfully!', 'success');
                alert('Responder assigned successfully!'); // Replace with a better notification
                window.location.href = `agency-incident-details.html?id=${incidentId}`;
            } else {
                throw new Error(result.message || 'Failed to assign responder.');
            }
        } catch (error) {
            // Using a non-blocking notification is better than alert()
            // For example: showToast(`Error: ${error.message}`, 'error');
            console.error('Assignment error:', error);
            alert(`Error: ${error.message}`);
            button.disabled = false;
            button.innerHTML = '<i class="ri-user-add-line"></i> Assign';
        }
    }

    function generateInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    // Initial Load
    function initialize() {
        incidentId = getIncidentId();
        if (!incidentId) {
            document.querySelector('.admin-main').innerHTML = `
                <div class="error-state">
                    <i class="ri-error-warning-line"></i>
                    <p>No incident specified.</p>
                    <a href="agency-incidents.html" class="btn-primary">Go to Incidents</a>
                </div>
            `;
            return;
        }

        backLink.href = `agency-incident-details.html?id=${incidentId}`;
        loadIncidentSummary();
    }

    initialize();
});
