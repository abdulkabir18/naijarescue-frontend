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
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    const usersTableBody = document.getElementById("usersTableBody");

    // Pagination Elements
    const paginationContainer = document.getElementById("pagination");
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

    searchInput.addEventListener("input", debounce(() => { currentPage = 1; loadUsers(); }, 500));
    statusFilter.addEventListener("change", () => { currentPage = 1; loadUsers(); });
    clearFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        statusFilter.value = "";
        currentPage = 1;
        loadUsers();
    });

    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadUsers();
        }
    });

    nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadUsers();
        }
    });

    // Action listeners using event delegation
    usersTableBody.addEventListener('click', (event) => {
        const target = event.target;

        // Handle view button click
        if (target.closest('.view-btn')) {
            event.preventDefault();
            const userId = target.closest('.view-btn').dataset.userId;
            window.location.href = `view-user.html?id=${userId}`;
        }
    });

    // Close action menus when clicking elsewhere
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.actions-menu-container')) {
            document.querySelectorAll('.actions-dropdown.visible').forEach(menu => {
                menu.classList.remove('visible');
            });
        }
    });

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

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function loadUsers() {
        showLoadingState();

        const searchTerm = searchInput.value.trim();
        const status = statusFilter.value;

        let url = `${AppConfig.API_BASE_URL}/api/v1/User/all?pageNumber=${currentPage}&pageSize=${pageSize}`;
        if (searchTerm) url += `&keyword=${encodeURIComponent(searchTerm)}`;
        if (status !== "") url += `&isActive=${status}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch users.');

            const result = await response.json();

            if (result.succeeded && result.data) {
                updatePagination(result);
                displayUsers(result.data);
            } else {
                showErrorState(result.message || 'Could not load users.');
            }
        } catch (error) {
            console.error("Error loading users:", error);
            showErrorState(error.message);
        }
    }

    function displayUsers(users) {
        const loadingRow = usersTableBody.querySelector('.loading-row');
        const noUsersRow = document.getElementById('noUsersRow');
        if (loadingRow) loadingRow.style.display = 'none';

        if (!users || !Array.isArray(users) || users.length === 0) {
            usersTableBody.innerHTML = '';
            usersTableBody.appendChild(noUsersRow);
            noUsersRow.style.display = 'table-row';
            return;
        }

        noUsersRow.style.display = 'none';
        usersTableBody.innerHTML = users.map(user => {
            const statusClass = user.isActive ? 'resolved' : 'cancelled';
            const statusText = user.isActive ? 'Active' : 'Inactive';
            const avatarSrc = user.profilePictureUrl ? `${AppConfig.API_BASE_URL}${user.profilePictureUrl}` : generateInitialsAvatar(user.fullName);

            return `
                <tr>
                    <td>
                        <div class="user-cell">
                            <img src="${avatarSrc}" alt="${user.fullName}" class="user-avatar">
                            <div>
                                <strong>${escapeHtml(user.fullName)}</strong>
                                <small>${escapeHtml(user.email)}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(user.email) || 'Not Provided'}</td>
                    <td>${escapeHtml(user.role || 'User')}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <a href="#" class="action-btn view-btn" data-user-id="${user.id}" title="View Details">
                            <i class="ri-eye-line"></i>
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function updatePagination(paginationData) {
        currentPage = paginationData.pageNumber;
        totalPages = paginationData.totalPages;

        paginationContainer.style.display = totalPages > 0 ? 'flex' : 'none';
        currentPageEl.textContent = paginationData.pageNumber;
        totalPagesEl.textContent = paginationData.totalPages;

        showingCountEl.textContent = paginationData.data.length;
        totalCountEl.textContent = paginationData.totalCount || 0;

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage >= totalPages;
    }

    function showLoadingState() {
        const loadingRow = usersTableBody.querySelector('.loading-row');
        const noUsersRow = document.getElementById('noUsersRow');
        usersTableBody.innerHTML = '';
        usersTableBody.appendChild(loadingRow);
        usersTableBody.appendChild(noUsersRow);
        loadingRow.style.display = 'table-row';
        noUsersRow.style.display = 'none';
        paginationContainer.style.display = 'none';
    }

    function showErrorState(message) {
        const noUsersRow = document.getElementById('noUsersRow');
        usersTableBody.innerHTML = '';
        usersTableBody.appendChild(noUsersRow);
        noUsersRow.querySelector('span').innerHTML = `<i class="ri-error-warning-line"></i> ${message}`;
        noUsersRow.style.display = 'table-row';
        paginationContainer.style.display = 'none';
    }

    // Initial Load
    loadUsers();
});