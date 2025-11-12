document.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("authToken");

    // 🔴 TESTING: Comment out redirect for testing
    // if (!token) {
    //     window.location.href = "/login.html";
    //     return;
    // }

    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem("authToken");
        window.location.href = "/login.html";
    });

    await initializeReportsPage(token);
});

let allReports = [];
let filteredReports = [];
let currentPage = 1;
const reportsPerPage = 10;

async function initializeReportsPage(token) {
    await loadReports(token);

    initializeFilters();

    initializePagination();
}

async function loadReports(token) {
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");

    // 🔴 TESTING: Mock data with more reports
    const mockData = {
        succeeded: true,
        data: [
            {
                id: "550e8400-e29b-41d4-a716-446655440001",
                type: "Fire",
                status: "InProgress",
                location: "Victoria Island, Lagos",
                coordinate: { latitude: 6.4281, longitude: 3.4219 },
                occurredAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440002",
                type: "Medical",
                status: "Resolved",
                location: "Ikeja, Lagos",
                coordinate: { latitude: 6.6018, longitude: 3.3515 },
                occurredAt: new Date(Date.now() - 86400000).toISOString(),
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440003",
                type: "Accident",
                status: "Resolved",
                location: "Lekki, Lagos",
                coordinate: { latitude: 6.4474, longitude: 3.5405 },
                occurredAt: new Date(Date.now() - 172800000).toISOString(),
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440004",
                type: "Crime",
                status: "Pending",
                location: "Yaba, Lagos",
                coordinate: { latitude: 6.5054, longitude: 3.3751 },
                occurredAt: new Date(Date.now() - 259200000).toISOString(),
                createdAt: new Date(Date.now() - 259200000).toISOString()
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440005",
                type: "Fire",
                status: "Pending",
                location: "Surulere, Lagos",
                coordinate: { latitude: 6.4969, longitude: 3.3614 },
                occurredAt: new Date(Date.now() - 345600000).toISOString(),
                createdAt: new Date(Date.now() - 345600000).toISOString()
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440006",
                type: "Medical",
                status: "InProgress",
                location: "Ajah, Lagos",
                coordinate: { latitude: 6.4698, longitude: 3.5852 },
                occurredAt: new Date(Date.now() - 432000000).toISOString(),
                createdAt: new Date(Date.now() - 432000000).toISOString()
            }
        ]
    };

    setTimeout(() => {
        loadingState.style.display = "none";

        if (!mockData.data || mockData.data.length === 0) {
            emptyState.style.display = "block";
            return;
        }

        allReports = mockData.data;
        filteredReports = [...allReports];

        updateStats();
        displayReports();
    }, 1000);

    /* 🟢 PRODUCTION: Uncomment for real API
    try {
        const response = await fetch("https://localhost:7288/api/v1/Incident/my-reports", {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        
        loadingState.style.display = "none";

        if (!data.data || data.data.length === 0) {
            emptyState.style.display = "block";
            return;
        }

        allReports = data.data;
        filteredReports = [...allReports];
        
        updateStats();
        displayReports();
    } catch (error) {
        console.error("Failed to load reports:", error);
        loadingState.innerHTML = `
            <i class="ri-error-warning-line"></i>
            <p>Failed to load reports. Please refresh the page.</p>
        `;
    }
    */
}

function updateStats() {
    const pending = allReports.filter(r => r.status === "Pending").length;
    const inProgress = allReports.filter(r => r.status === "InProgress" || r.status === "Responding").length;
    const resolved = allReports.filter(r => r.status === "Resolved" || r.status === "Closed").length;
    const total = allReports.length;

    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("progressCount").textContent = inProgress;
    document.getElementById("resolvedCount").textContent = resolved;
    document.getElementById("totalCount").textContent = total;
}

function displayReports() {
    const container = document.getElementById("reportsListContainer");
    const noResultsState = document.getElementById("noResultsState");
    const paginationContainer = document.getElementById("paginationContainer");

    container.innerHTML = "";

    if (filteredReports.length === 0) {
        noResultsState.style.display = "block";
        paginationContainer.style.display = "none";
        return;
    }

    noResultsState.style.display = "none";

    const startIndex = (currentPage - 1) * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    paginatedReports.forEach(report => {
        const reportCard = createReportCard(report);
        container.appendChild(reportCard);
    });

    updatePagination();
    paginationContainer.style.display = "flex";
}

function createReportCard(report) {
    const card = document.createElement("div");
    card.className = "report-card";
    card.onclick = () => viewReportDetails(report.id);

    const typeIcons = {
        "Fire": "ri-fire-fill",
        "Medical": "ri-health-book-fill",
        "Accident": "ri-car-fill",
        "Crime": "ri-police-car-fill",
        "Flood": "ri-flood-fill",
        "Other": "ri-alert-fill"
    };

    const statusClass = report.status === "Resolved" ? "status-resolved" :
        report.status === "InProgress" ? "status-inprogress" : "status-pending";

    const statusText = report.status === "Resolved" ? "Resolved" :
        report.status === "InProgress" ? "In Progress" : "Pending";

    const icon = typeIcons[report.type] || "ri-alert-fill";
    const reportDate = new Date(report.occurredAt || report.createdAt).toLocaleDateString();
    const reportTime = new Date(report.occurredAt || report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = report.id;

    card.innerHTML = `
        <div class="report-main">
            <div class="report-header-row">
                <span hidden class="report-id">#${id}</span>
                <div class="report-type">
                    <i class="${icon}"></i>
                    <h3>${report.type} Emergency</h3>
                </div>
            </div>
            <div class="report-meta">
                <span><i class="ri-calendar-line"></i> ${reportDate}</span>
                <span><i class="ri-time-line"></i> ${reportTime}</span>
            </div>
            <div class="report-location">
                <i class="ri-map-pin-line"></i>
                <span>${report.location || 'Location recorded'}</span>
            </div>
        </div>
        <div class="report-actions">
            <span class="report-status ${statusClass}">${statusText}</span>
            <button class="view-details-btn" onclick="event.stopPropagation(); viewReportDetails('${report.id}')">
                View Details <i class="ri-arrow-right-line"></i>
            </button>
        </div>
    `;

    return card;
}

function initializeFilters() {
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const sortFilter = document.getElementById("sortFilter");

    searchInput.addEventListener("input", applyFilters);
    statusFilter.addEventListener("change", applyFilters);
    sortFilter.addEventListener("change", applyFilters);
}

function applyFilters() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    const sortFilter = document.getElementById("sortFilter").value;

    filteredReports = allReports.filter(report => {
        const matchesSearch = report.location?.toLowerCase().includes(searchTerm) ||
            report.type?.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === "all" || report.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (sortFilter === "newest") {
        filteredReports.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    } else {
        filteredReports.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
    }

    currentPage = 1;
    displayReports();
}

function initializePagination() {
    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayReports();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayReports();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

function updatePagination() {
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    const paginationContainer = document.getElementById("paginationContainer");

    if (totalPages === 0) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    if (!paginationContainer) return;
    if (totalPages <= 1) {
        paginationContainer.style.display = "none";
    } else {
        paginationContainer.style.display = "flex";
    }

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    let pageInfo = document.getElementById("pageInfo");
    if (!pageInfo) {
        pageInfo = document.createElement("div");
        pageInfo.id = "pageInfo";
        pageInfo.style.display = "flex";
        pageInfo.style.alignItems = "center";
        pageInfo.style.gap = "8px";
        if (prevBtn && nextBtn && prevBtn.parentNode) {
            prevBtn.parentNode.insertBefore(pageInfo, nextBtn);
        } else {
            paginationContainer.appendChild(pageInfo);
        }
    }
    pageInfo.textContent = `Page ${currentPage} of ${Math.max(totalPages, 1)}`;

    const smallListId = "paginationPages";
    let pagesWrap = document.getElementById(smallListId);
    if (pagesWrap) pagesWrap.remove();

    if (totalPages > 1 && totalPages <= 7) {
        pagesWrap = document.createElement("div");
        pagesWrap.id = smallListId;
        pagesWrap.style.display = "flex";
        pagesWrap.style.gap = "6px";
        pagesWrap.style.marginLeft = "8px";

        for (let p = 1; p <= totalPages; p++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "page-btn";
            btn.textContent = p;
            btn.style.padding = "6px 8px";
            btn.style.borderRadius = "6px";
            btn.style.border = "1px solid #ddd";
            btn.style.background = p === currentPage ? "#e63946" : "#fff";
            btn.style.color = p === currentPage ? "#fff" : "#333";
            btn.addEventListener("click", () => {
                gotoPage(p);
            });
            pagesWrap.appendChild(btn);
        }

        pageInfo.appendChild(pagesWrap);
    }
}

function gotoPage(page) {
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage) || 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;
    displayReports();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

window.viewReportDetails = function (reportId) {
    try {
        // keep a reference for the details page to fetch if needed
        sessionStorage.setItem("selectedReportId", reportId);
    } catch (e) {
        // ignore storage errors
    }
    // Navigate to a details page with query param. Adjust path if your project uses a different route.
    window.location.href = `report-details.html?id=${encodeURIComponent(reportId)}`;
};