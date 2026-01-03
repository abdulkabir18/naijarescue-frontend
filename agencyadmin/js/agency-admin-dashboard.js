document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    if (!token) return;

    if (token) {
        await window.notificationManager.initialize(token);
    }

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const welcomeName = document.getElementById("welcomeName");
    const agencyNameEl = document.getElementById("agencyName");

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Load profile and agency info
    const profile = await loadAgencyAdminProfile(token);
    if (!profile || !profile.agencyId) {
        console.error('No profile or agencyId found');
        return;
    }

    // Load all dashboard data
    await Promise.all([
        loadDashboardStats(profile.agencyId, token),
        loadRecentIncidents(profile.agencyId, token),
        loadActiveResponders(profile.agencyId, token),
        loadPerformanceMetrics(profile.agencyId, token)
    ]);

    async function loadAgencyAdminProfile(token) {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load profile');
            const result = await response.json();

            if (result.succeeded && result.data) {
                const profile = result.data;
                document.getElementById("adminName").textContent = profile.fullName;
                welcomeName.textContent = profile.fullName.split(' ')[0];

                if (profile.profilePictureUrl) {
                    document.getElementById("adminAvatar").src = `${profile.profilePictureUrl}`;
                } else {
                    document.getElementById("adminAvatar").src = generateInitialsAvatar(profile.fullName);
                }

                // Load agency name
                if (profile.agencyId) {
                    await loadAgencyInfo(profile.agencyId, token);
                }

                return profile;
            }
            return null;
        } catch (error) {
            console.error('Error loading profile:', error);
            return null;
        }
    }

    async function loadAgencyInfo(agencyId, token) {
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

    async function loadDashboardStats(agencyId, token) {
        try {
            // Load responders stats
            const respondersResponse = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/agency/${agencyId}?pageSize=1000`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const respondersResult = await respondersResponse.json();

            if (respondersResult.succeeded && respondersResult.data) {
                const responders = respondersResult.data;
                document.getElementById("totalResponders").textContent = responders.length;

                const availableCount = responders.filter(r => r.status.toLowerCase() === 'available').length;
                document.getElementById("availableResponders").textContent = availableCount;
            }

            // Load incidents stats
            const incidentsResponse = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/agency/${agencyId}/incidents`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const incidentsResult = await incidentsResponse.json();

            if (incidentsResult.succeeded && incidentsResult.data) {
                const incidents = incidentsResult.data;
                const activeCount = incidents.filter(i =>
                    i.status.toLowerCase() !== 'resolved' && i.status.toLowerCase() !== 'closed'
                ).length;
                document.getElementById("activeIncidents").textContent = activeCount;

                // Calculate resolved this month
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const resolvedThisMonth = incidents.filter(i =>
                    i.status.toLowerCase() === 'resolved' && new Date(i.occurredAt) >= startOfMonth
                ).length;
                document.getElementById("resolvedIncidents").textContent = resolvedThisMonth;
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            document.getElementById("totalResponders").textContent = '0';
            document.getElementById("availableResponders").textContent = '0';
            document.getElementById("activeIncidents").textContent = '0';
            document.getElementById("resolvedIncidents").textContent = '0';
        }
    }

    async function loadRecentIncidents(agencyId, token) {
        const container = document.getElementById("recentIncidents");

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/agency/${agencyId}/incidents`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.succeeded && result.data && result.data.length > 0) {
                // Show only the 5 most recent incidents
                const recentIncidents = result.data.slice(0, 5);

                container.innerHTML = recentIncidents.map(incident => {
                    const location = formatAddress(incident.address) || 'Location unavailable';
                    return `
                        <div class="incident-item" onclick="window.location.href='agency-incident-details.html?id=${incident.id}'">
                            <div class="incident-header">
                                <div>
                                    <div class="incident-ref">${escapeHtml(incident.referenceNumber)}</div>
                                    <div class="incident-type">${formatIncidentType(incident.type)}</div>
                                </div>
                                <span class="status-badge ${getStatusClass(incident.status)}">${getStatusDisplay(incident.status)}</span>
                            </div>
                            <div class="incident-location">
                                <i class="ri-map-pin-line"></i>
                                ${escapeHtml(location)}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="ri-alarm-warning-line"></i>
                        <p>No incidents assigned yet</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading recent incidents:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="ri-error-warning-line"></i>
                    <p>Failed to load incidents</p>
                </div>
            `;
        }
    }

    async function loadActiveResponders(agencyId, token) {
        const container = document.getElementById("activeResponders");

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/agency/${agencyId}?pageNumber=1&pageSize=5`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.succeeded && result.data && result.data.length > 0) {
                // Filter for active responders (Available or Busy)
                const activeResponders = result.data.filter(r =>
                    r.status === 'Available' || r.status === 'Busy'
                );

                if (activeResponders.length > 0) {
                    container.innerHTML = activeResponders.map(responder => {
                        const avatarSrc = responder.profilePictureUrl
                            ? `${responder.profilePictureUrl}`
                            : generateInitialsAvatar(responder.userFullName);

                        const statusClass = responder.status.toLowerCase();

                        return `
                            <div class="responder-item">
                                <img src="${avatarSrc}" alt="${escapeHtml(responder.userFullName)}" class="responder-avatar">
                                <div class="responder-info">
                                    <div class="responder-name">${escapeHtml(responder.userFullName)}</div>
                                    <div class="responder-status">
                                        <span class="status-indicator ${statusClass}"></span>
                                        ${responder.status}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="ri-user-unfollow-line"></i>
                            <p>No active responders</p>
                        </div>
                    `;
                }
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="ri-user-star-line"></i>
                        <p>No responders yet</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading active responders:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="ri-error-warning-line"></i>
                    <p>Failed to load responders</p>
                </div>
            `;
        }
    }

    async function loadPerformanceMetrics(agencyId, token) {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/agency/${agencyId}/incidents`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.succeeded && result.data) {
                const incidents = result.data;

                // Calculate average response time (placeholder - would need actual timestamps)
                document.getElementById("avgResponseTime").textContent = "N/A";

                // Calculate completion rate
                const resolved = incidents.filter(i => i.status === 'Resolved').length;
                const completionRate = incidents.length > 0
                    ? Math.round((resolved / incidents.length) * 100)
                    : 0;
                document.getElementById("completionRate").textContent = `${completionRate}%`;

                // Responder efficiency (placeholder)
                document.getElementById("responderEfficiency").textContent = "N/A";

                // Total handled
                document.getElementById("totalHandled").textContent = incidents.length;
            }
        } catch (error) {
            console.error('Error loading performance metrics:', error);
            document.getElementById("avgResponseTime").textContent = "N/A";
            document.getElementById("completionRate").textContent = "N/A";
            document.getElementById("responderEfficiency").textContent = "N/A";
            document.getElementById("totalHandled").textContent = "0";
        }
    }
});