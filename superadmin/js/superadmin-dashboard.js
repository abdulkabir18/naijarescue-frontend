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
    const refreshBtn = document.getElementById("refreshBtn");

    // Stats elements
    const totalIncidentsEl = document.getElementById("totalIncidents");
    const activeIncidentsEl = document.getElementById("activeIncidents");
    const totalRespondersEl = document.getElementById("totalResponders");
    const totalAgenciesEl = document.getElementById("totalAgencies");
    const totalUsersEl = document.getElementById("totalUsers");
    const avgResponseTimeEl = document.getElementById("avgResponseTime");

    const incidentsTableBody = document.getElementById("incidentsTableBody");
    const activityFeed = document.getElementById("activityFeed");

    // ==================== SIDEBAR TOGGLE ====================
    menuToggle.addEventListener("click", () => {
        adminSidebar.classList.toggle("collapsed");
    });

    // ==================== LOGOUT ====================
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // ==================== REFRESH BUTTON ====================
    refreshBtn.addEventListener("click", () => {
        refreshBtn.innerHTML = '<i class="ri-loader-4-line"></i> Refreshing...';
        refreshBtn.style.animation = 'spin 1s linear infinite';

        loadDashboardData();

        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> Refresh';
            refreshBtn.style.animation = '';
        }, 1000);
    });

    // ==================== LOAD DASHBOARD DATA ====================
    async function loadDashboardData() {
        await Promise.all([
            loadStatistics(),
            loadRecentIncidents(),
            loadSystemActivity()
        ]);
    }

    // ==================== LOAD STATISTICS ====================
    async function loadStatistics() {
        try {
            // 🔴 TESTING: Mock data
            setTimeout(() => {
                totalIncidentsEl.textContent = "1,247";
                activeIncidentsEl.textContent = "23";
                totalRespondersEl.textContent = "156";
                totalAgenciesEl.textContent = "12";
                totalUsersEl.textContent = "3,892";
                avgResponseTimeEl.textContent = "4.2m";

                document.getElementById("incidentsTrend").textContent = "+12% this month";
                document.getElementById("respondersTrend").textContent = "+8 this week";
                document.getElementById("usersTrend").textContent = "+45 this week";
            }, 500);

            /* 🟢 PRODUCTION: Uncomment for real API
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Admin/statistics`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                const stats = data.data;
                
                totalIncidentsEl.textContent = stats.totalIncidents.toLocaleString();
                activeIncidentsEl.textContent = stats.activeIncidents.toLocaleString();
                totalRespondersEl.textContent = stats.totalResponders.toLocaleString();
                totalAgenciesEl.textContent = stats.totalAgencies.toLocaleString();
                totalUsersEl.textContent = stats.totalUsers.toLocaleString();
                avgResponseTimeEl.textContent = stats.avgResponseTime || "N/A";

                // Update trends if available
                if (stats.trends) {
                    document.getElementById("incidentsTrend").textContent = stats.trends.incidents || "--";
                    document.getElementById("respondersTrend").textContent = stats.trends.responders || "--";
                    document.getElementById("usersTrend").textContent = stats.trends.users || "--";
                }
            }
            */
        } catch (error) {
            console.error("Error loading statistics:", error);
            showErrorInStats();
        }
    }

    function showErrorInStats() {
        const errorMsg = "Error";
        totalIncidentsEl.textContent = errorMsg;
        activeIncidentsEl.textContent = errorMsg;
        totalRespondersEl.textContent = errorMsg;
        totalAgenciesEl.textContent = errorMsg;
        totalUsersEl.textContent = errorMsg;
        avgResponseTimeEl.textContent = errorMsg;
    }

    // ==================== LOAD RECENT INCIDENTS ====================
    async function loadRecentIncidents() {
        try {
            // 🔴 TESTING: Mock data
            setTimeout(() => {
                const mockIncidents = [
                    {
                        id: "INC-2025-001",
                        location: "Lekki Phase 1, Lagos",
                        reporter: "John Doe",
                        status: "Assigned",
                        time: "5 mins ago"
                    },
                    {
                        id: "INC-2025-002",
                        location: "Victoria Island, Lagos",
                        reporter: "Jane Smith",
                        status: "Responding",
                        time: "15 mins ago"
                    },
                    {
                        id: "INC-2025-003",
                        location: "Ikeja GRA, Lagos",
                        reporter: "Mike Johnson",
                        status: "Reported",
                        time: "32 mins ago"
                    },
                    {
                        id: "INC-2025-004",
                        location: "Ajah, Lagos",
                        reporter: "Sarah Williams",
                        status: "Resolved",
                        time: "1 hour ago"
                    },
                    {
                        id: "INC-2025-005",
                        location: "Maryland, Lagos",
                        reporter: "David Brown",
                        status: "Assigned",
                        time: "2 hours ago"
                    }
                ];

                displayIncidents(mockIncidents);
            }, 700);

            /* 🟢 PRODUCTION: Uncomment for real API
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident?pageSize=5&sortBy=CreatedAt&sortOrder=desc`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                displayIncidents(data.data.items);
            }
            */
        } catch (error) {
            console.error("Error loading incidents:", error);
            incidentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #e63946; padding: 2rem;">
                        <i class="ri-error-warning-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                        Failed to load incidents
                    </td>
                </tr>
            `;
        }
    }

    function displayIncidents(incidents) {
        if (!incidents || incidents.length === 0) {
            incidentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #999; padding: 2rem;">
                        No incidents found
                    </td>
                </tr>
            `;
            return;
        }

        incidentsTableBody.innerHTML = incidents.map(incident => `
            <tr>
                <td><strong>${incident.id}</strong></td>
                <td>
                    <i class="ri-map-pin-line" style="color: #e63946;"></i>
                    ${incident.location}
                </td>
                <td>${incident.reporter}</td>
                <td>
                    <span class="status-badge ${incident.status.toLowerCase()}">
                        ${incident.status}
                    </span>
                </td>
                <td>${incident.time}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="viewIncident('${incident.id}')" title="View Details">
                            <i class="ri-eye-line"></i>
                        </button>
                        <button class="action-btn" onclick="assignResponder('${incident.id}')" title="Assign Responder">
                            <i class="ri-user-add-line"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Make functions available globally for onclick handlers
    window.viewIncident = function (id) {
        window.location.href = `incident-details.html?id=${id}`;
    };

    window.assignResponder = function (id) {
        window.location.href = `assign-responder.html?incident=${id}`;
    };

    // ==================== LOAD SYSTEM ACTIVITY ====================
    async function loadSystemActivity() {
        try {
            // 🔴 TESTING: Mock data
            setTimeout(() => {
                const mockActivities = [
                    {
                        type: "incident",
                        title: "New Emergency Reported",
                        description: "Fire incident reported at Lekki Phase 1",
                        time: "2 mins ago"
                    },
                    {
                        type: "responder",
                        title: "Responder Assigned",
                        description: "Fire Service Unit 3 assigned to INC-2025-001",
                        time: "8 mins ago"
                    },
                    {
                        type: "agency",
                        title: "New Agency Created",
                        description: "Lagos State Ambulance Service added to system",
                        time: "1 hour ago"
                    },
                    {
                        type: "user",
                        title: "New User Registered",
                        description: "15 new users registered today",
                        time: "2 hours ago"
                    },
                    {
                        type: "incident",
                        title: "Incident Resolved",
                        description: "Medical emergency at Victoria Island successfully resolved",
                        time: "3 hours ago"
                    }
                ];

                displayActivity(mockActivities);
            }, 900);

            /* 🟢 PRODUCTION: Uncomment for real API
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Admin/activity?limit=5`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                displayActivity(data.data);
            }
            */
        } catch (error) {
            console.error("Error loading activity:", error);
            activityFeed.innerHTML = `
                <div style="text-align: center; color: #e63946; padding: 2rem;">
                    <i class="ri-error-warning-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                    Failed to load activity
                </div>
            `;
        }
    }

    function displayActivity(activities) {
        if (!activities || activities.length === 0) {
            activityFeed.innerHTML = `
                <div style="text-align: center; color: #999; padding: 2rem;">
                    No recent activity
                </div>
            `;
            return;
        }

        activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <span class="activity-time">
                        <i class="ri-time-line"></i> ${activity.time}
                    </span>
                </div>
            </div>
        `).join('');
    }

    function getActivityIcon(type) {
        const icons = {
            incident: "ri-alarm-warning-fill",
            responder: "ri-user-star-fill",
            agency: "ri-building-fill",
            user: "ri-group-fill"
        };
        return icons[type] || "ri-information-fill";
    }

    // ==================== INITIALIZE ====================
    loadDashboardData();

});