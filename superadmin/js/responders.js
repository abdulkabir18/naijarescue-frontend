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
    const respondersContainer = document.getElementById("respondersContainer");
    const searchInput = document.getElementById("searchInput");
    const agencyFilter = document.getElementById("agencyFilter");
    const statusFilter = document.getElementById("statusFilter");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const paginationContainer = document.getElementById("paginationContainer");

    // State
    let allResponders = [];
    let allAgencies = [];
    let currentPage = 1;
    let totalPages = 1;
    const itemsPerPage = 12; // Or any number you prefer

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Filter Listeners
    searchInput.addEventListener("input", debounce(() => { currentPage = 1; loadResponders(); }, 300));
    agencyFilter.addEventListener("change", () => { currentPage = 1; loadResponders(); });
    statusFilter.addEventListener("change", () => { currentPage = 1; loadResponders(); });
    resetFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        agencyFilter.value = "";
        statusFilter.value = "";
        currentPage = 1;
        loadResponders();
    });

    // Debounce function
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // --- Utility Functions ---
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- Data Loading ---
    async function loadResponders() {
        respondersContainer.innerHTML = `<div class="loading-container"><div class="spinner-large"></div><p>Loading responders...</p></div>`;
        paginationContainer.innerHTML = '';

        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedAgencyId = agencyFilter.value;
        const selectedStatus = statusFilter.value;

        let url = `${AppConfig.API_BASE_URL}/api/v1/Responder/all?pageNumber=${currentPage}&pageSize=${itemsPerPage}`;
        if (searchTerm) url += `&keyword=${encodeURIComponent(searchTerm)}`;
        if (selectedAgencyId) url += `&agencyId=${selectedAgencyId}`;
        if (selectedStatus) url += `&status=${selectedStatus}`;

        try {
            const respondersRes = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
            const respondersResult = await respondersRes.json();

            if (respondersResult.succeeded) {
                allResponders = respondersResult.data || []; // Safely access the nested data array
                totalPages = respondersResult.data.totalPages || 1; // Safely access totalPages, default to 1
                displayResponders(allResponders);
                renderPagination();
            } else {
                throw new Error('Failed to load responders');
            }
        } catch (error) {
            console.error("Error loading responders:", error);
            respondersContainer.innerHTML = `<div class="error-state"><p>Could not load responder data.</p></div>`;
        }
    }

    async function loadAgencies() {
        const agenciesRes = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/all?pageSize=1000`, { headers: { "Authorization": `Bearer ${token}` } });
        const agenciesResult = await agenciesRes.json();
        if (agenciesResult.succeeded) {
            allAgencies = agenciesResult.data || [];
            populateAgencyFilter();
        }
    }

    function populateAgencyFilter() {
        agencyFilter.innerHTML = '<option value="">All Agencies</option>';
        allAgencies.forEach(agency => {
            const option = document.createElement('option');
            option.value = agency.id;
            option.textContent = agency.name;
            agencyFilter.appendChild(option);
        });
    }

    function displayResponders(responders) {
        if (responders.length === 0) {
            respondersContainer.innerHTML = `<div class="empty-state"><p>No responders found matching your criteria.</p></div>`;
            return;
        }

        respondersContainer.innerHTML = responders.map(responder => {
            const statusClass = responder.status.toLowerCase().replace(/ /g, '');
            const avatarSrc = responder.profilePictureUrl ? `${AppConfig.API_BASE_URL}${responder.profilePictureUrl}` : generateInitialsAvatar(responder.userFullName);
            return `
                <div class="responder-card" data-responder-id="${responder.id}">
                    <div class="responder-card-header">
                        <img src="${avatarSrc}" alt="${responder.userFullName}" class="responder-avatar">
                        <div class="responder-info">
                            <h3 title="${escapeHtml(responder.userFullName)}">${escapeHtml(responder.userFullName)}</h3>
                            <p>${escapeHtml(responder.email)}</p>
                        </div>
                        <span class="status-badge ${responder.status.toLowerCase()}">${responder.status}</span>
                    </div>
                    <div class="responder-card-body">
                        <p class="agency-info"><i class="ri-building-line"></i> ${escapeHtml(responder.agencyName)}</p>
                    </div>
                    <div class="responder-card-footer">
                        <a href="responder-details.html?id=${responder.id}" class="btn-secondary">View Details</a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- Pagination Logic ---
    function renderPagination() {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = '';
        const maxVisibleButtons = 5;

        // Previous button
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

        // Next button
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
    async function initializePage() {
        await loadAgencies();
        await loadResponders();
    }

    initializePage();
});