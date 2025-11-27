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
    const refreshBtn = document.getElementById("refreshBtn");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    const incidentsTableBody = document.getElementById("incidentsTableBody");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const currentPageEl = document.getElementById("currentPage");
    const totalPagesEl = document.getElementById("totalPages");
    const showingCountEl = document.getElementById("showingCount");
    const totalCountEl = document.getElementById("totalCount");

    // State
    let allIncidents = [];
    let filteredIncidents = [];
    let currentPage = 1;
    const pageSize = 10;
    let autoRefreshInterval = null;

    // Event Listeners
    menuToggle.addEventListener("click", () => {
        adminSidebar.classList.toggle("collapsed");
    });

    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    refreshBtn.addEventListener("click", () => {
        manualRefresh();
    });

    searchInput.addEventListener("input", debounce(() => {
        currentPage = 1;
        filterAndDisplay();
    }, 500));

    statusFilter.addEventListener("change", () => {
        currentPage = 1;
        filterAndDisplay();
    });

    clearFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        statusFilter.value = "";
        currentPage = 1;
        filterAndDisplay();
    });

    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayIncidents();
        }
    });

    nextBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredIncidents.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            displayIncidents();
        }
    });

    // ==================== LOAD INCIDENTS ====================
    async function loadIncidents(silent = false) {
        try {
            if (!silent) {
                showLoadingState();
            }

            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/all?pageNumber=1&pageSize=1000`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.status === 401 || response.status === 403) {
                showToast('Session expired. Please login again.', 'error');
                setTimeout(() => logoutUser(), 2000);
                return;
            }

            const data = await response.json();

            if (response.ok && data.succeeded) {
                allIncidents = data.data?.data || data.data || [];
                filteredIncidents = [...allIncidents];
                updateQuickStats();
                filterAndDisplay();
                updateLastRefreshedTime();
            } else {
                throw new Error(data.message || 'Failed to load incidents');
            }
        } catch (error) {
            console.error("Error loading incidents:", error);
            if (!silent) {
                showErrorState();
                showToast('Failed to load incidents', 'error');
            }
        }
    }

    // ==================== FILTER AND DISPLAY ====================
    function filterAndDisplay() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const statusValue = statusFilter.value;

        filteredIncidents = allIncidents.filter(incident => {
            // Search filter
            const matchesSearch = !searchTerm ||
                (incident.referenceNumber?.toLowerCase().includes(searchTerm)) ||
                (formatLocation(incident).toLowerCase().includes(searchTerm)) ||
                (incident.userName?.toLowerCase().includes(searchTerm));

            // Status filter
            const matchesStatus = !statusValue || incident.status === statusValue;

            return matchesSearch && matchesStatus;
        });

        currentPage = 1;
        displayIncidents();
    }

    // ==================== DISPLAY INCIDENTS ====================
    function displayIncidents() {
        if (filteredIncidents.length === 0) {
            incidentsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #999; padding: 2rem;">
                        <i class="ri-information-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                        No incidents found
                    </td>
                </tr>
            `;
            updatePagination(0, 0);
            return;
        }

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedIncidents = filteredIncidents.slice(startIndex, endIndex);

        incidentsTableBody.innerHTML = paginatedIncidents.map(incident => {
            const location = formatLocation(incident);
            const timeAgo = formatTimeAgo(incident.occurredAt || incident.createdAt);
            const status = incident.status || 'Pending';
            const type = incident.type || 'Emergency';
            const responderCount = incident.assignedResponders?.length || 0;

            return `
                <tr>
                    <td>
                        <strong class="reference-number">${incident.referenceNumber || 'N/A'}</strong>
                    </td>
                    <td>
                        <span class="incident-type-badge ${getTypeClass(type)}">
                            <i class="${getTypeIcon(type)}"></i>
                            ${type}
                        </span>
                    </td>
                    <td>
                        <i class="ri-map-pin-line" style="color: #e63946;"></i>
                        ${location}
                    </td>
                    <td>${incident.userName || 'Anonymous'}</td>
                    <td>
                        <span class="status-badge ${getStatusClass(status)}">
                            ${formatStatus(status)}
                        </span>
                    </td>
                    <td>
                        <span class="responder-count">
                            <i class="ri-user-star-line"></i>
                            ${responderCount}
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

        updatePagination(filteredIncidents.length, paginatedIncidents.length);
    }

    // ==================== UPDATE QUICK STATS ====================
    function updateQuickStats() {
        const total = allIncidents.length;
        const pending = allIncidents.filter(i => i.status === 'Pending' || i.status === 'Reported').length;
        const active = allIncidents.filter(i => i.status === 'InProgress').length;
        const resolved = allIncidents.filter(i => i.status === 'Resolved').length;

        document.getElementById('totalIncidents').textContent = total.toLocaleString();
        document.getElementById('pendingIncidents').textContent = pending.toLocaleString();
        document.getElementById('activeIncidents').textContent = active.toLocaleString();
        document.getElementById('resolvedIncidents').textContent = resolved.toLocaleString();
    }

    // ==================== PAGINATION ====================
    function updatePagination(totalItems, currentItems) {
        const totalPages = Math.ceil(totalItems / pageSize);

        currentPageEl.textContent = totalPages === 0 ? 0 : currentPage;
        totalPagesEl.textContent = totalPages;

        const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, totalItems);

        showingCountEl.textContent = `${startItem}-${endItem}`;
        totalCountEl.textContent = totalItems;

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    }

    // ==================== UTILITY FUNCTIONS ====================
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
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString();
    }

    function formatStatus(status) {
        const statusMap = {
            'Pending': 'Pending',
            'Reported': 'Reported',
            'InProgress': 'In Progress',
            'Resolved': 'Resolved',
            'Escalated': 'Escalated',
            'Cancelled': 'Cancelled',
            'Analyzed': 'Analyzed',
            'Invalid': 'Invalid'
        };
        return statusMap[status] || status;
    }

    function getStatusClass(status) {
        const statusMap = {
            'Pending': 'pending',
            'Reported': 'reported',
            'InProgress': 'inprogress',
            'Resolved': 'resolved',
            'Escalated': 'escalated',
            'Cancelled': 'cancelled',
            'Analyzed': 'analyzed',
            'Invalid': 'invalid'
        };
        return statusMap[status] || 'pending';
    }

    function getTypeClass(type) {
        return type.toLowerCase().replace(/\s+/g, '-');
    }

    function getTypeIcon(type) {
        const iconMap = {
            'Fire': 'ri-fire-fill',
            'Medical': 'ri-heart-pulse-fill',
            'Accident': 'ri-car-fill',
            'Crime': 'ri-shield-cross-fill',
            'Natural Disaster': 'ri-flood-fill',
            'Other': 'ri-alert-fill'
        };
        return iconMap[type] || 'ri-alarm-warning-fill';
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function showLoadingState() {
        incidentsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading-row">
                    <div class="spinner-small"></div>
                    <span>Loading incidents...</span>
                </td>
            </tr>
        `;
    }

    function showErrorState() {
        incidentsTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #e63946; padding: 2rem;">
                    <i class="ri-error-warning-line" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                    Failed to load incidents
                    <br>
                    <button class="btn-secondary" onclick="location.reload()" style="margin-top: 1rem;">
                        <i class="ri-refresh-line"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }

    function updateLastRefreshedTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastUpdated').innerHTML = `<i class="ri-time-line"></i> Updated ${timeString}`;
    }

    function manualRefresh() {
        refreshBtn.innerHTML = '<i class="ri-loader-4-line"></i> Refreshing...';
        refreshBtn.style.animation = 'spin 1s linear infinite';
        refreshBtn.disabled = true;

        loadIncidents(false);

        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> Refresh';
            refreshBtn.style.animation = '';
            refreshBtn.disabled = false;
            showToast('Incidents updated', 'success');
        }, 800);
    }

    function showToast(message, type = 'info') {
        let toast = document.getElementById('incidents-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'incidents-toast';
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

        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
        }, 4000);
    }

    // ==================== GLOBAL FUNCTIONS ====================
    window.viewIncident = function (id) {
        window.location.href = `incident-details.html?id=${id}`;
    };

    window.assignResponder = function (id) {
        window.location.href = `assign-responder.html?incident=${id}`;
    };

    // ==================== AUTO REFRESH ====================
    function startAutoRefresh() {
        autoRefreshInterval = setInterval(() => {
            loadIncidents(true);
        }, 30000); // Refresh every 30 seconds
    }

    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }

    // ==================== INITIALIZE ====================
    await loadIncidents();
    startAutoRefresh();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopAutoRefresh();
    });
});