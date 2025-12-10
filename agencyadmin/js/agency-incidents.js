// document.addEventListener("DOMContentLoaded", async () => {
//     const token = protectPage("AgencyAdmin");
//     if (!token) return;

//     const userProfile = await loadAgencyAdminProfile(token);
//     if (!userProfile || !userProfile.agencyId) {
//         document.querySelector('.admin-main').innerHTML = `<div class="error-state"><p>Could not determine your agency. Please log in again.</p></div>`;
//         return;
//     }

//     if (token) {
//         await window.notificationManager.initialize(token);
//     }

//     // DOM Elements
//     const menuToggle = document.getElementById("menuToggle");
//     const adminSidebar = document.getElementById("adminSidebar");
//     const logoutBtn = document.getElementById("logoutBtn");
//     const searchInput = document.getElementById("searchInput");
//     const statusFilter = document.getElementById("statusFilter");
//     const clearFiltersBtn = document.getElementById("clearFiltersBtn");
//     const refreshBtn = document.getElementById("refreshBtn");
//     const incidentsTableBody = document.getElementById("incidentsTableBody");

//     // Pagination Elements
//     const paginationContainer = document.getElementById("pagination");
//     const prevBtn = document.getElementById("prevBtn");
//     const nextBtn = document.getElementById("nextBtn");
//     const currentPageEl = document.getElementById("currentPage");
//     const totalPagesEl = document.getElementById("totalPages");
//     const showingCountEl = document.getElementById("showingCount");
//     const totalCountEl = document.getElementById("totalCount");

//     // State
//     let currentPage = 1;
//     let totalPages = 1;
//     const pageSize = 10;

//     // Event Listeners
//     menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
//     logoutBtn.addEventListener("click", (e) => {
//         e.preventDefault();
//         logoutUser();
//     });

//     searchInput.addEventListener("input", debounce(() => { currentPage = 1; loadIncidents(); }, 300));
//     statusFilter.addEventListener("change", () => { currentPage = 1; loadIncidents(); });
//     refreshBtn.addEventListener("click", loadIncidents);
//     clearFiltersBtn.addEventListener("click", () => {
//         searchInput.value = "";
//         statusFilter.value = "";
//         currentPage = 1;
//         loadIncidents();
//     });

//     prevBtn.addEventListener("click", () => {
//         if (currentPage > 1) {
//             currentPage--;
//             loadIncidents();
//         }
//     });

//     nextBtn.addEventListener("click", () => {
//         if (currentPage < totalPages) {
//             currentPage++;
//             loadIncidents();
//         }
//     });

//     async function loadIncidents() {
//         incidentsTableBody.innerHTML = `<tr><td colspan="8" class="loading-row"><div class="spinner-small"></div><span>Loading incidents...</span></td></tr>`;
//         paginationContainer.style.display = 'none';

//         const searchTerm = searchInput.value.trim();
//         const status = statusFilter.value;

//         // Note: The OpenAPI spec doesn't show pagination/filtering for this endpoint,
//         // but we assume it works like other endpoints in the app.
//         let url = `${AppConfig.API_BASE_URL}/api/v1/Incident/agency/${userProfile.agencyId}/incidents?pageNumber=${currentPage}&pageSize=${pageSize}`;
//         if (searchTerm) url += `&keyword=${encodeURIComponent(searchTerm)}`;
//         if (status) url += `&status=${status}`;

//         try {
//             const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
//             const result = await response.json();

//             if (result.succeeded && result.data) {
//                 // The API might return a simple list or a paginated object. We handle both.
//                 const incidents = result.data.data || result.data;
//                 totalPages = result.data.totalPages || 1;
//                 const totalCount = result.data.totalCount || incidents.length;

//                 displayIncidents(incidents);
//                 updatePagination(incidents.length, totalCount);
//             } else {
//                 throw new Error(result.message || 'Failed to load incidents.');
//             }
//         } catch (error) {
//             console.error("Error loading incidents:", error);
//             incidentsTableBody.innerHTML = `<tr><td colspan="8" class="error-row"><p>${error.message}</p></td></tr>`;
//         }
//     }

//     function displayIncidents(incidents) {
//         if (incidents.length === 0) {
//             incidentsTableBody.innerHTML = `<tr><td colspan="8" class="empty-row"><p>No incidents found matching your criteria.</p></td></tr>`;
//             return;
//         }

//         incidentsTableBody.innerHTML = incidents.map(incident => {
//             const respondersText = incident.assignedResponders && incident.assignedResponders.length > 0
//                 ? incident.assignedResponders.map(r => escapeHtml(r.responderName)).join(', ')
//                 : 'None';

//             return `
//                 <tr>
//                     <td>${escapeHtml(incident.referenceNumber)}</td>
//                     <td>
//                         <div class="incident-type-cell">
//                             <i class="${getIncidentTypeIcon(incident.type)}"></i>
//                             <span>${formatIncidentType(incident.type)}</span>
//                         </div>
//                     </td>
//                     <td title="${escapeHtml(formatAddress(incident.address))}">
//                         ${escapeHtml(incident.address?.city || 'N/A')}, ${escapeHtml(incident.address?.state || 'N/A')}
//                     </td>
//                     <td>${escapeHtml(incident.userName)}</td>
//                     <td><span class="status-badge ${incident.status.toLowerCase()}">${escapeHtml(incident.status)}</span></td>
//                     <td class="responders-cell" title="${respondersText}">${respondersText}</td>
//                     <td>${new Date(incident.occurredAt).toLocaleString()}</td>
//                     <td>
//                         <a href="agency-incident-details.html?id=${incident.id}" class="btn-icon" title="View Details">
//                             <i class="ri-eye-line"></i>
//                         </a>
//                     </td>
//                 </tr>
//             `;
//         }).join('');
//     }

//     function updatePagination(showingCount, totalCount) {
//         paginationContainer.style.display = totalPages > 1 ? 'flex' : 'none';
//         currentPageEl.textContent = currentPage;
//         totalPagesEl.textContent = totalPages;
//         showingCountEl.textContent = showingCount;
//         totalCountEl.textContent = totalCount;

//         prevBtn.disabled = currentPage === 1;
//         nextBtn.disabled = currentPage === totalPages;
//     }

//     function debounce(func, delay) {
//         let timeout;
//         return function (...args) {
//             clearTimeout(timeout);
//             timeout = setTimeout(() => func.apply(this, args), delay);
//         };
//     }

//     // Initial Load
//     loadIncidents();
// });

// function getIncidentTypeIcon(type) {
//     const icons = {
//         Fire: 'ri-fire-fill',
//         Security: 'ri-shield-star-fill',
//         Medical: 'ri-first-aid-kit-fill',
//         NaturalDisaster: 'ri-flood-fill',
//         Accident: 'ri-road-map-fill',
//         Other: 'ri-question-mark',
//     };
//     return icons[type] || 'ri-question-mark';
// }

// function formatIncidentType(type) {
//     if (!type) return 'Unknown';
//     return type.replace(/([A-Z])/g, ' $1').trim();
// }


document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage('AgencyAdmin');
    if (!token) return;

    const profile = await loadAgencyAdminProfile(token);
    if (!profile || !profile.agencyId) {
        console.error("Could not determine agency ID.");
        return;
    }
    const agencyId = profile.agencyId;
    await loadAgencyInfo(agencyId, token);

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const tableBody = document.getElementById("incidentsTableBody");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const currentPageEl = document.getElementById("currentPage");
    const totalPagesEl = document.getElementById("totalPages");
    const showingCountEl = document.getElementById("showingCount");
    const totalCountEl = document.getElementById("totalCount");

    // State
    let currentPage = 1;
    let totalPages = 1;
    const pageSize = 10;

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => { e.preventDefault(); logoutUser(); });
    refreshBtn.addEventListener("click", () => loadIncidents());
    prevBtn.addEventListener("click", () => { if (currentPage > 1) { currentPage--; loadIncidents(); } });
    nextBtn.addEventListener("click", () => { if (currentPage < totalPages) { currentPage++; loadIncidents(); } });
    searchInput.addEventListener("input", debounce(() => { currentPage = 1; loadIncidents(); }, 300));
    statusFilter.addEventListener("change", () => { currentPage = 1; loadIncidents(); });
    clearFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        statusFilter.value = "";
        currentPage = 1;
        loadIncidents();
    });

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    async function loadAgencyInfo(agencyId, token) {
        const agencyNameEl = document.getElementById("agencyName");
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${agencyId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to load agency');
            const result = await response.json();
            if (result.succeeded && result.data) agencyNameEl.textContent = result.data.name;
        } catch (error) {
            agencyNameEl.textContent = 'Agency';
        }
    }

    async function loadIncidents() {
        tableBody.innerHTML = `<tr><td colspan="8" class="loading-row"><div class="spinner-small"></div><span>Loading incidents...</span></td></tr>`;

        const searchTerm = searchInput.value.trim();
        const selectedStatus = statusFilter.value;

        // Assuming the backend filters incidents for the authenticated agency admin
        let url = `${AppConfig.API_BASE_URL}/api/v1/Incident/agency/${agencyId}/incidents`;

        try {
            const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
            const result = await response.json();

            if (result.succeeded && result.data) {
                displayIncidents(result.data);
                updatePagination(result.data);
            } else {
                throw new Error(result.message || 'Failed to load incidents');
            }
        } catch (error) {
            console.error("Error loading incidents:", error);
            tableBody.innerHTML = `<tr><td colspan="8" class="error-state"><p>Could not load incidents.</p></td></tr>`;
        }
    }

    function displayIncidents(incidents) {
        if (!incidents || incidents.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="empty-state"><p>No incidents found.</p></td></tr>`;
            return;
        }

        tableBody.innerHTML = incidents.map(incident => {
            const location = formatAddress(incident.address) || 'N/A';
            const reporter = incident.userName || 'System';
            const time = getTimeAgo(incident.occurredAt);

            const responderPills = incident.assignedResponders && incident.assignedResponders.length > 0
                ? incident.assignedResponders.map(res =>
                    `<span class="responder-pill">${escapeHtml(res.responderName)}</span>`
                ).join('')
                : '<span class="no-responders">None</span>';

            return `
                <tr>
                    <td><strong>${escapeHtml(incident.referenceNumber)}</strong></td>
                    <td>${formatIncidentType(incident.type)}</td>
                    <td title="${escapeHtml(location)}">${escapeHtml(location)}</td>
                    <td>${escapeHtml(reporter)}</td>
                    <td><span class="status-badge ${getStatusClass(incident.status)}">${getStatusDisplay(incident.status)}</span></td>
                    <td><div class="responder-pills">${responderPills}</div></td>
                    <td>${time}</td>
                    <td class="table-actions">
                        <a href="agency-incident-details.html?id=${incident.id}" class="action-btn" title="View Details"><i class="ri-eye-line"></i></a>
                        <a href="agency-assign-responder.html?id=${incident.id}" class="action-btn" title="Assign Responder"><i class="ri-user-add-line"></i></a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function updatePagination(paginationData) {
        currentPage = paginationData.pageNumber;
        totalPages = paginationData.totalPages;

        currentPageEl.textContent = currentPage;
        totalPagesEl.textContent = totalPages;

        showingCountEl.textContent = paginationData.length;
        totalCountEl.textContent = paginationData.totalCount;

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;

        document.getElementById('pagination').style.display = totalPages > 0 ? 'flex' : 'none';
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Initial Load
    loadIncidents();
});