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
    const respondersContainer = document.getElementById("respondersContainer");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const paginationContainer = document.getElementById("paginationContainer");

    // State
    let currentPage = 1;
    let totalPages = 1;
    const itemsPerPage = 12;

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    searchInput.addEventListener("input", debounce(() => { currentPage = 1; loadResponders(); }, 300));
    statusFilter.addEventListener("change", () => { currentPage = 1; loadResponders(); });
    resetFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        statusFilter.value = "";
        currentPage = 1;
        loadResponders();
    });

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

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

    async function loadResponders() {
        respondersContainer.innerHTML = `<div class="loading-container"><div class="spinner-large"></div><p>Loading responders...</p></div>`;
        paginationContainer.innerHTML = '';

        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedStatus = statusFilter.value;

        let url = `${AppConfig.API_BASE_URL}/api/v1/Responder/agency/${agencyId}?pageNumber=${currentPage}&pageSize=${itemsPerPage}`;
        if (searchTerm) url += `&keyword=${encodeURIComponent(searchTerm)}`;
        if (selectedStatus) url += `&status=${selectedStatus}`;

        try {
            const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
            const result = await response.json();

            if (result.succeeded && result.data) {
                totalPages = result.data.totalPages;
                displayResponders(result.data);
                renderPagination();
            } else {
                throw new Error(result.message || 'Failed to load responders');
            }
        } catch (error) {
            console.error("Error loading responders:", error);
            respondersContainer.innerHTML = `<div class="error-state"><p>Could not load responder data.</p></div>`;
        }
    }

    function displayResponders(responders) {
        if (!responders || responders.length === 0) {
            respondersContainer.innerHTML = `<div class="empty-state"><p>No responders found in your agency.</p></div>`;
            return;
        }

        respondersContainer.innerHTML = responders.map(responder => {
            const statusClass = responder.status.toLowerCase().replace(/ /g, '');
            const avatarSrc = responder.profilePictureUrl ? `${AppConfig.API_BASE_URL}${responder.profilePictureUrl}` : generateInitialsAvatar(responder.userFullName);
            return `
                <div class="responder-card" data-responder-id="${responder.id}">
                    <div class="responder-card-header">
                        <img src="${avatarSrc}" alt="${escapeHtml(responder.userFullName)}" class="responder-avatar">
                        <div class="responder-info">
                            <h3 title="${escapeHtml(responder.userFullName)}">${escapeHtml(responder.userFullName)}</h3>
                            <p>${escapeHtml(responder.email)}</p>
                        </div>
                        <span class="status-badge ${statusClass}">${responder.status}</span>
                    </div>
                    <div class="responder-card-footer">
                        <a href="agency-responder-details.html?id=${responder.id}" class="btn-secondary">View Details</a>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderPagination() {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = '';
        const maxVisibleButtons = 5;

        paginationHtml += `<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>`;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

        if (endPage - startPage + 1 < maxVisibleButtons) {
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }

        if (startPage > 1) {
            paginationHtml += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHtml += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        paginationHtml += `<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;

        paginationContainer.innerHTML = paginationHtml;
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.matches('.pagination-btn') && !e.target.disabled) {
                currentPage = parseInt(e.target.dataset.page);
                loadResponders();
            }
        });
    }

    // Initial Load
    loadResponders();
});