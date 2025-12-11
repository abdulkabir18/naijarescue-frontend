// document.addEventListener("DOMContentLoaded", async () => {
//     const token = protectPage();
//     if (!token) return;

//     if (token) {
//         await window.notificationManager.initialize(token);
//     }
//     await loadAdminProfile(token);

//     const menuToggle = document.getElementById("menuToggle");
//     const adminSidebar = document.getElementById("adminSidebar");
//     const logoutBtn = document.getElementById("logoutBtn");
//     const refreshBtn = document.getElementById("refreshBtn");

//     const totalIncidentsEl = document.getElementById("totalIncidents");
//     const activeIncidentsEl = document.getElementById("activeIncidents");
//     const totalRespondersEl = document.getElementById("totalResponders");
//     const totalAgenciesEl = document.getElementById("totalAgencies");
//     const totalUsersEl = document.getElementById("totalUsers");
//     const avgResponseTimeEl = document.getElementById("avgResponseTime");

//     const incidentsTableBody = document.getElementById("incidentsTableBody");
//     const activityFeed = document.getElementById("activityFeed");

//     menuToggle.addEventListener("click", () => {
//         adminSidebar.classList.toggle("collapsed");
//     });

//     logoutBtn.addEventListener("click", (e) => {
//         e.preventDefault();
//         logoutUser();
//     });

//     refreshBtn.addEventListener("click", () => {
//         refreshBtn.innerHTML = '<i class="ri-loader-4-line"></i> Refreshing...';
//         refreshBtn.style.animation = 'spin 1s linear infinite';

//         loadDashboardData();

//         setTimeout(() => {
//             refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> Refresh';
//             refreshBtn.style.animation = '';
//         }, 1000);
//     });

//     async function loadDashboardData() {
//         await Promise.all([
//             loadStatistics(),
//             loadRecentIncidents(),
//             loadSystemActivity()
//         ]);
//     }

//     // ==================== LOAD STATISTICS ====================
//     async function loadStatistics() {
//         try {
//             // 🔴 TESTING: Mock data
//             setTimeout(() => {
//                 totalIncidentsEl.textContent = "1,247";
//                 activeIncidentsEl.textContent = "23";
//                 totalRespondersEl.textContent = "156";
//                 totalAgenciesEl.textContent = "12";
//                 totalUsersEl.textContent = "3,892";
//                 avgResponseTimeEl.textContent = "4.2m";

//                 document.getElementById("incidentsTrend").textContent = "+12% this month";
//                 document.getElementById("respondersTrend").textContent = "+8 this week";
//                 document.getElementById("usersTrend").textContent = "+45 this week";
//             }, 500);

//             /* 🟢 PRODUCTION: Uncomment for real API
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Admin/statistics`, {
//                 headers: {
//                     "Authorization": `Bearer ${token}`
//                 }
//             });

//             const data = await response.json();

//             if (response.ok && data.succeeded) {
//                 const stats = data.data;

//                 totalIncidentsEl.textContent = stats.totalIncidents.toLocaleString();
//                 activeIncidentsEl.textContent = stats.activeIncidents.toLocaleString();
//                 totalRespondersEl.textContent = stats.totalResponders.toLocaleString();
//                 totalAgenciesEl.textContent = stats.totalAgencies.toLocaleString();
//                 totalUsersEl.textContent = stats.totalUsers.toLocaleString();
//                 avgResponseTimeEl.textContent = stats.avgResponseTime || "N/A";

//                 // Update trends if available
//                 if (stats.trends) {
//                     document.getElementById("incidentsTrend").textContent = stats.trends.incidents || "--";
//                     document.getElementById("respondersTrend").textContent = stats.trends.responders || "--";
//                     document.getElementById("usersTrend").textContent = stats.trends.users || "--";
//                 }
//             }
//             */
//         } catch (error) {
//             console.error("Error loading statistics:", error);
//             showErrorInStats();
//         }
//     }

//     function showErrorInStats() {
//         const errorMsg = "Error";
//         totalIncidentsEl.textContent = errorMsg;
//         activeIncidentsEl.textContent = errorMsg;
//         totalRespondersEl.textContent = errorMsg;
//         totalAgenciesEl.textContent = errorMsg;
//         totalUsersEl.textContent = errorMsg;
//         avgResponseTimeEl.textContent = errorMsg;
//     }

//     // ==================== LOAD RECENT INCIDENTS ====================
//     async function loadRecentIncidents() {
//         try {
//             // 🔴 TESTING: Mock data
//             setTimeout(() => {
//                 const mockIncidents = [
//                     {
//                         id: "INC-2025-001",
//                         location: "Lekki Phase 1, Lagos",
//                         reporter: "John Doe",
//                         status: "Assigned",
//                         time: "5 mins ago"
//                     },
//                     {
//                         id: "INC-2025-002",
//                         location: "Victoria Island, Lagos",
//                         reporter: "Jane Smith",
//                         status: "Responding",
//                         time: "15 mins ago"
//                     },
//                     {
//                         id: "INC-2025-003",
//                         location: "Ikeja GRA, Lagos",
//                         reporter: "Mike Johnson",
//                         status: "Reported",
//                         time: "32 mins ago"
//                     },
//                     {
//                         id: "INC-2025-004",
//                         location: "Ajah, Lagos",
//                         reporter: "Sarah Williams",
//                         status: "Resolved",
//                         time: "1 hour ago"
//                     },
//                     {
//                         id: "INC-2025-005",
//                         location: "Maryland, Lagos",
//                         reporter: "David Brown",
//                         status: "Assigned",
//                         time: "2 hours ago"
//                     }
//                 ];

//                 displayIncidents(mockIncidents);
//             }, 700);

//             /* 🟢 PRODUCTION: Uncomment for real API
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident?pageSize=5&sortBy=CreatedAt&sortOrder=desc`, {
//                 headers: {
//                     "Authorization": `Bearer ${token}`
//                 }
//             });

//             const data = await response.json();

//             if (response.ok && data.succeeded) {
//                 displayIncidents(data.data.items);
//             }
//             */
//         } catch (error) {
//             console.error("Error loading incidents:", error);
//             incidentsTableBody.innerHTML = `
//                 <tr>
//                     <td colspan="6" style="text-align: center; color: #e63946; padding: 2rem;">
//                         <i class="ri-error-warning-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
//                         Failed to load incidents
//                     </td>
//                 </tr>
//             `;
//         }
//     }

//     function displayIncidents(incidents) {
//         if (!incidents || incidents.length === 0) {
//             incidentsTableBody.innerHTML = `
//                 <tr>
//                     <td colspan="6" style="text-align: center; color: #999; padding: 2rem;">
//                         No incidents found
//                     </td>
//                 </tr>
//             `;
//             return;
//         }

//         incidentsTableBody.innerHTML = incidents.map(incident => `
//             <tr>
//                 <td><strong>${incident.id}</strong></td>
//                 <td>
//                     <i class="ri-map-pin-line" style="color: #e63946;"></i>
//                     ${incident.location}
//                 </td>
//                 <td>${incident.reporter}</td>
//                 <td>
//                     <span class="status-badge ${incident.status.toLowerCase()}">
//                         ${incident.status}
//                     </span>
//                 </td>
//                 <td>${incident.time}</td>
//                 <td>
//                     <div class="table-actions">
//                         <button class="action-btn" onclick="viewIncident('${incident.id}')" title="View Details">
//                             <i class="ri-eye-line"></i>
//                         </button>
//                         <button class="action-btn" onclick="assignResponder('${incident.id}')" title="Assign Responder">
//                             <i class="ri-user-add-line"></i>
//                         </button>
//                     </div>
//                 </td>
//             </tr>
//         `).join('');
//     }

//     // Make functions available globally for onclick handlers
//     window.viewIncident = function (id) {
//         window.location.href = `incident-details.html?id=${id}`;
//     };

//     window.assignResponder = function (id) {
//         window.location.href = `assign-responder.html?incident=${id}`;
//     };

//     // ==================== LOAD SYSTEM ACTIVITY ====================
//     async function loadSystemActivity() {
//         try {
//             // 🔴 TESTING: Mock data
//             setTimeout(() => {
//                 const mockActivities = [
//                     {
//                         type: "incident",
//                         title: "New Emergency Reported",
//                         description: "Fire incident reported at Lekki Phase 1",
//                         time: "2 mins ago"
//                     },
//                     {
//                         type: "responder",
//                         title: "Responder Assigned",
//                         description: "Fire Service Unit 3 assigned to INC-2025-001",
//                         time: "8 mins ago"
//                     },
//                     {
//                         type: "agency",
//                         title: "New Agency Created",
//                         description: "Lagos State Ambulance Service added to system",
//                         time: "1 hour ago"
//                     },
//                     {
//                         type: "user",
//                         title: "New User Registered",
//                         description: "15 new users registered today",
//                         time: "2 hours ago"
//                     },
//                     {
//                         type: "incident",
//                         title: "Incident Resolved",
//                         description: "Medical emergency at Victoria Island successfully resolved",
//                         time: "3 hours ago"
//                     }
//                 ];

//                 displayActivity(mockActivities);
//             }, 900);

//             /* 🟢 PRODUCTION: Uncomment for real API
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Admin/activity?limit=5`, {
//                 headers: {
//                     "Authorization": `Bearer ${token}`
//                 }
//             });

//             const data = await response.json();

//             if (response.ok && data.succeeded) {
//                 displayActivity(data.data);
//             }
//             */
//         } catch (error) {
//             console.error("Error loading activity:", error);
//             activityFeed.innerHTML = `
//                 <div style="text-align: center; color: #e63946; padding: 2rem;">
//                     <i class="ri-error-warning-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
//                     Failed to load activity
//                 </div>
//             `;
//         }
//     }

//     function displayActivity(activities) {
//         if (!activities || activities.length === 0) {
//             activityFeed.innerHTML = `
//                 <div style="text-align: center; color: #999; padding: 2rem;">
//                     No recent activity
//                 </div>
//             `;
//             return;
//         }

//         activityFeed.innerHTML = activities.map(activity => `
//             <div class="activity-item">
//                 <div class="activity-icon ${activity.type}">
//                     <i class="${getActivityIcon(activity.type)}"></i>
//                 </div>
//                 <div class="activity-content">
//                     <h4>${activity.title}</h4>
//                     <p>${activity.description}</p>
//                     <span class="activity-time">
//                         <i class="ri-time-line"></i> ${activity.time}
//                     </span>
//                 </div>
//             </div>
//         `).join('');
//     }

//     function getActivityIcon(type) {
//         const icons = {
//             incident: "ri-alarm-warning-fill",
//             responder: "ri-user-star-fill",
//             agency: "ri-building-fill",
//             user: "ri-group-fill"
//         };
//         return icons[type] || "ri-information-fill";
//     }

//     // ==================== INITIALIZE ====================
//     loadDashboardData();

// });

document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    if (!token) return;

    if (token) {
        await window.notificationManager.initialize(token);
    }
    await loadAdminProfile(token);

    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const refreshBtn = document.getElementById("refreshBtn");

    const totalIncidentsEl = document.getElementById("totalIncidents");
    const activeIncidentsEl = document.getElementById("activeIncidents");
    const totalRespondersEl = document.getElementById("totalResponders");
    const totalAgenciesEl = document.getElementById("totalAgencies");
    const totalUsersEl = document.getElementById("totalUsers");
    const avgResponseTimeEl = document.getElementById("avgResponseTime");

    const incidentsTableBody = document.getElementById("incidentsTableBody");
    const activityFeed = document.getElementById("activityFeed");

    // Cache and refresh management
    let statisticsCache = null;
    let lastStatisticsFetch = 0;
    const CACHE_DURATION = 30000; // 30 seconds
    let isRefreshing = false;

    menuToggle.addEventListener("click", () => {
        adminSidebar.classList.toggle("collapsed");
    });

    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Debounced refresh with visual feedback
    let refreshTimeout;
    refreshBtn.addEventListener("click", () => {
        if (isRefreshing) return;

        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
            manualRefresh();
        }, 300);
    });

    async function manualRefresh() {
        isRefreshing = true;
        refreshBtn.innerHTML = '<i class="ri-loader-4-line"></i> Refreshing...';
        refreshBtn.style.animation = 'spin 1s linear infinite';
        refreshBtn.disabled = true;

        // Clear cache to force fresh data
        statisticsCache = null;

        await loadDashboardData();

        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> Refresh';
            refreshBtn.style.animation = '';
            refreshBtn.disabled = false;
            isRefreshing = false;
            showToast('Dashboard updated', 'success');
        }, 800);
    }

    async function loadDashboardData() {
        await Promise.all([
            loadStatistics(),
            loadRecentIncidents(),
            loadSystemActivity()
        ]);
        updateLastRefreshedTime();
    }

    function updateLastRefreshedTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Add or update timestamp in page header
        let timestampEl = document.getElementById('lastUpdated');
        if (!timestampEl) {
            const headerRight = document.querySelector('.page-actions');
            timestampEl = document.createElement('span');
            timestampEl.id = 'lastUpdated';
            timestampEl.style.cssText = 'color: #999; font-size: 0.875rem; margin-right: 1rem;';
            headerRight.insertBefore(timestampEl, headerRight.firstChild);
        }
        timestampEl.innerHTML = `<i class="ri-time-line"></i> Updated ${timeString}`;
    }



    // ==================== LOAD STATISTICS ====================
    async function loadStatistics(silent = false) {
        try {
            // Check cache
            const now = Date.now();
            if (statisticsCache && (now - lastStatisticsFetch) < CACHE_DURATION) {
                displayStatistics(statisticsCache);
                return;
            }

            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/AdminDashboard/dashboard-statistics`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            // Handle authentication errors
            if (response.status === 401 || response.status === 403) {
                showToast('Session expired. Please login again.', 'error');
                setTimeout(() => logoutUser(), 2000);
                return;
            }

            const data = await response.json();

            if (response.ok && data.succeeded) {
                statisticsCache = data.data;
                lastStatisticsFetch = now;
                displayStatistics(data.data);
            } else {
                throw new Error(data.message || 'Failed to load statistics');
            }
        } catch (error) {
            console.error("Error loading statistics:", error);

            // Retry once after 2 seconds
            if (!silent) {
                setTimeout(async () => {
                    try {
                        await loadStatistics(true);
                    } catch (retryError) {
                        showErrorInStats();
                        showToast('Failed to load statistics. Click refresh to try again.', 'error');
                    }
                }, 2000);
            } else {
                showErrorInStats();
            }
        }
    }

    function displayStatistics(stats) {
        // Animate number changes - handle "---" as 0
        const getCurrentValue = (element) => {
            const text = element.textContent?.trim();
            if (!text || text === '---' || text === 'NaN') return 0;
            return parseInt(text.replace(/,/g, '')) || 0;
        };

        animateValue(totalIncidentsEl, getCurrentValue(totalIncidentsEl), stats.totalIncidents);
        animateValue(activeIncidentsEl, getCurrentValue(activeIncidentsEl), stats.activeIncidents);
        animateValue(totalRespondersEl, getCurrentValue(totalRespondersEl), stats.totalResponders);
        animateValue(totalAgenciesEl, getCurrentValue(totalAgenciesEl), stats.totalAgencies);
        animateValue(totalUsersEl, getCurrentValue(totalUsersEl), stats.totalUsers);

        // Show "Coming Soon" for average response time
        avgResponseTimeEl.innerHTML = `
            <span style="font-size: 0.875rem; color: #999;">
                Coming Soon
            </span>
        `;

        // Update trends with proper formatting
        const incidentsTrendEl = document.getElementById("incidentsTrend");
        const respondersTrendEl = document.getElementById("respondersTrend");
        const usersTrendEl = document.getElementById("usersTrend");

        if (stats.trends) {
            incidentsTrendEl.textContent = formatTrend(stats.trends.incidentsChangePercent);
            respondersTrendEl.textContent = formatTrend(stats.trends.respondersChangePercent);
            usersTrendEl.textContent = formatTrend(stats.trends.usersChangePercent);

            // Update trend colors
            updateTrendColor(incidentsTrendEl.parentElement, stats.trends.incidentsChangePercent);
            updateTrendColor(respondersTrendEl.parentElement, stats.trends.respondersChangePercent);
            updateTrendColor(usersTrendEl.parentElement, stats.trends.usersChangePercent);
        }
    }

    function animateValue(element, start, end, duration = 800) {
        // Ensure we have valid numbers
        start = isNaN(start) ? 0 : start;
        end = isNaN(end) ? 0 : end;

        if (start === end) {
            element.textContent = end.toLocaleString();
            return;
        }

        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.textContent = end.toLocaleString();
                element.style.animation = 'pulse 0.3s ease';
                setTimeout(() => {
                    element.style.animation = '';
                }, 300);
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }

    function formatTrend(value) {
        if (value === 0) return 'No change';
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}% this month`;
    }

    function updateTrendColor(element, value) {
        element.classList.remove('positive', 'negative', 'neutral');
        if (value > 0) {
            element.classList.add('positive');
            element.querySelector('i').className = 'ri-arrow-up-line';
        } else if (value < 0) {
            element.classList.add('negative');
            element.querySelector('i').className = 'ri-arrow-down-line';
        } else {
            element.classList.add('neutral');
            element.querySelector('i').className = 'ri-subtract-line';
        }
    }

    function showErrorInStats() {
        const errorMsg = "---";
        totalIncidentsEl.textContent = errorMsg;
        activeIncidentsEl.textContent = errorMsg;
        totalRespondersEl.textContent = errorMsg;
        totalAgenciesEl.textContent = errorMsg;
        totalUsersEl.textContent = errorMsg;
        avgResponseTimeEl.innerHTML = '<span style="color: #e63946;">Error</span>';
    }

    // ==================== LOAD RECENT INCIDENTS ====================
    async function loadRecentIncidents(silent = false) {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/all?pageNumber=1&pageSize=5`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.status === 401 || response.status === 403) {
                if (!silent) {
                    showToast('Authentication failed', 'error');
                    setTimeout(() => logoutUser(), 2000);
                }
                return;
            }

            const data = await response.json();

            if (response.ok) {
                displayIncidents(data);
            } else {
                throw new Error(data.message || 'Failed to load incidents');
            }
        } catch (error) {
            console.error("Error loading incidents:", error);

            if (!silent) {
                setTimeout(async () => {
                    try {
                        await loadRecentIncidents(true);
                    } catch (retryError) {
                        showIncidentsError();
                        showToast('Failed to load incidents', 'error');
                    }
                }, 2000);
            } else {
                showIncidentsError();
            }
        }
    }

    function displayIncidents(paginatedData) {
        const loadingRow = document.querySelector('#incidentsTableBody .loading-row');
        const noIncidentsRow = document.getElementById('noIncidentsRow');

        if (loadingRow) loadingRow.style.display = 'none';

        const incidents = paginatedData.data;

        console.log('Recent Incidents:', incidents);

        if (!incidents || incidents.length === 0) {
            // Clear the table while preserving noIncidentsRow
            while (incidentsTableBody.firstChild) {
                incidentsTableBody.removeChild(incidentsTableBody.firstChild);
            }
            // Re-query to ensure we have the element in the DOM
            const noIncidentsRowRefresh = document.getElementById('noIncidentsRow');
            if (noIncidentsRowRefresh) {
                noIncidentsRowRefresh.style.display = 'table-row';
            }
            return;
        }

        // Hide noIncidentsRow if it exists
        if (noIncidentsRow) {
            noIncidentsRow.style.display = 'none';
        }

        // Create and append new incident rows
        incidentsTableBody.innerHTML = incidents.map(incident => {
            const location = formatLocation(incident);
            const timeAgo = formatTimeAgo(incident.occurredAt || incident.createdAt);
            const status = incident.status || 'Pending';

            return `
                <tr>
                    <td><strong>${incident.referenceNumber || 'N/A'}</strong></td>
                    <td>
                        <i class="ri-map-pin-line" style="color: #e63946;"></i>
                        ${location}
                    </td>
                    <td>${incident.userName || 'Anonymous'}</td>
                    <td>
                        <span class="status-badge ${getStatusClass(status)}">
                            ${status}
                        </span>
                    </td>
                    <td>${timeAgo}</td>
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
            `;
        }).join('');
    }

    function formatLocation(incident) {
        if (incident.address) {
            const parts = [];
            if (incident.address.city) parts.push(incident.address.city);
            if (incident.address.state) parts.push(incident.address.state);
            return parts.join(', ') || 'Location unavailable';
        }
        if (incident.coordinates) {
            return `${incident.coordinates.latitude.toFixed(4)}, ${incident.coordinates.longitude.toFixed(4)}`;
        }
        return 'Location unavailable';
    }

    function formatTimeAgo(dateString) {
        if (!dateString) return 'Just now';

        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    }

    function getStatusClass(status) {
        const statusMap = {
            'Pending': 'reported',
            'Reported': 'reported',
            'Assigned': 'assigned',
            'Responding': 'responding',
            'InProgress': 'responding',
            'Resolved': 'resolved',
            'Cancelled': 'cancelled'
        };
        return statusMap[status] || 'reported';
    }

    function showIncidentsError() {
        const loadingRow = document.querySelector('#incidentsTableBody .loading-row');

        if (loadingRow) loadingRow.style.display = 'none';

        // Clear table by removing all children
        while (incidentsTableBody.firstChild) {
            incidentsTableBody.removeChild(incidentsTableBody.firstChild);
        }

        // Re-query noIncidentsRow to ensure it's in the DOM
        const noIncidentsRow = document.getElementById('noIncidentsRow');
        if (noIncidentsRow) {
            // Clone and append to ensure it's properly attached
            const errorRow = noIncidentsRow.cloneNode(true);
            const span = errorRow.querySelector('span');
            if (span) {
                span.innerHTML = `<i class="ri-error-warning-line"></i> Failed to load incidents.`;
            }
            incidentsTableBody.appendChild(errorRow);
            errorRow.style.display = 'table-row';
        }
    }

    // ==================== LOAD SYSTEM ACTIVITY ====================
    async function loadSystemActivity() {
        try {
            // Use recent incidents as activity for now
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/all?pageNumber=1&pageSize=5`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                const incidents = data.data?.data || data.data;
                displayActivityFromIncidents(incidents);
            } else {
                throw new Error('Failed to load activity');
            }
        } catch (error) {
            console.error("Error loading activity:", error);
            activityFeed.innerHTML = `
                <div style="text-align: center; color: #999; padding: 2rem;">
                    <i class="ri-calendar-event-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                    <p>Full activity log coming soon</p>
                    <small>Recent incidents are shown below</small>
                </div>
            `;
        }
    }

    function displayActivityFromIncidents(incidents) {
        if (!incidents || incidents.length === 0) {
            activityFeed.innerHTML = `
                <div style="text-align: center; color: #999; padding: 2rem;">
                    <i class="ri-information-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                    No recent activity
                </div>
            `;
            return;
        }

        activityFeed.innerHTML = incidents.map(incident => {
            const location = formatLocation(incident);
            const timeAgo = formatTimeAgo(incident.occurredAt || incident.createdAt);
            const type = incident.type || incident.incidentType || 'Emergency';

            return `
                <div class="activity-item">
                    <div class="activity-icon incident">
                        <i class="ri-alarm-warning-fill"></i>
                    </div>
                    <div class="activity-content">
                        <h4>New ${type} Reported</h4>
                        <p>Incident at ${location}</p>
                        <span class="activity-time">
                            <i class="ri-time-line"></i> ${timeAgo}
                        </span>
                    </div>
                </div>
            `;
        }).join('') + `
            <div class="activity-item" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; opacity: 0.9;">
                <div class="activity-icon" style="background: rgba(255,255,255,0.2);">
                    <i class="ri-roadmap-line"></i>
                </div>
                <div class="activity-content">
                    <h4 style="color: white;">Full Activity Log Coming Soon</h4>
                    <p style="color: rgba(255,255,255,0.9);">We're working on comprehensive system activity tracking</p>
                    <span class="activity-time" style="color: rgba(255,255,255,0.8);">
                        <i class="ri-information-line"></i> Stay tuned for updates
                    </span>
                </div>
            </div>
        `;
    }

    // ==================== UTILITY FUNCTIONS ====================
    function showToast(message, type = 'info') {
        // Create toast if it doesn't exist
        let toast = document.getElementById('dashboard-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'dashboard-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                padding: 1rem 1.5rem;
                border-radius: 0.5rem;
                background: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                z-index: 10000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(toast);
        }

        const icons = {
            success: 'ri-checkbox-circle-fill',
            error: 'ri-error-warning-fill',
            info: 'ri-information-fill'
        };

        const colors = {
            success: '#10b981',
            error: '#e63946',
            info: '#3b82f6'
        };

        toast.innerHTML = `
            <i class="${icons[type]}" style="font-size: 1.5rem; color: ${colors[type]};"></i>
            <span style="color: #333;">${message}</span>
        `;

        // Show toast
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);

        // Hide toast after 4 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
        }, 4000);
    }

    // ==================== GLOBAL ONCLICK HANDLERS ====================
    window.viewIncident = function (id) {
        window.location.href = `incident-details.html?id=${id}`;
    };

    window.assignResponder = function (id) {
        window.location.href = `assign-responder.html?incident=${id}`;
    };

    // ==================== INITIALIZE ====================
    loadDashboardData();

});