// document.addEventListener("DOMContentLoaded", async () => {
//     // const token = sessionStorage.getItem("authToken");

//     // if (!token) {
//     //     window.location.href = "login.html";
//     //     return;
//     // }

//     loadUserInfo(token);

//     await loadReports(token);

//     document.getElementById("logoutBtn").addEventListener("click", (e) => {
//         e.preventDefault();
//         sessionStorage.removeItem("authToken");
//         window.location.href = "login.html";
//     });
// });

// function decodeToken(token) {
//     if (!token) return null;
//     try {
//         const payload = token.split('.')[1];
//         return JSON.parse(atob(payload));
//     } catch (e) {
//         return null;
//     }
// }

// function loadUserInfo(token) {
//     const decoded = decodeToken(token);
//     if (decoded) {
//         const firstName = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
//             decoded['given_name'] ||
//             decoded['name'] ||
//             'User';
//         document.getElementById("userName").textContent = firstName;
//     }
// }

// async function loadReports(token) {
//     const loadingState = document.getElementById("loadingState");
//     const emptyState = document.getElementById("emptyState");
//     const reportsContainer = document.getElementById("reportsContainer");

//     try {
//         const response = await fetch("https://localhost:7288/api/v1/Incident/my-reports", {
//             headers: {
//                 "Authorization": `Bearer ${token}`,
//                 "Accept": "application/json"
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status}`);
//         }

//         const data = await response.json();

//         loadingState.style.display = "none";

//         if (!data.data || data.data.length === 0) {
//             emptyState.style.display = "block";
//             updateStats(0, 0, 0, 0);
//             return;
//         }

//         const active = data.data.filter(r => r.status === "Pending" || r.status === "Active").length;
//         const inProgress = data.data.filter(r => r.status === "InProgress" || r.status === "Responding").length;
//         const resolved = data.data.filter(r => r.status === "Resolved" || r.status === "Closed").length;
//         const total = data.data.length;

//         updateStats(active, inProgress, resolved, total);

//         displayReports(data.data.slice(0, 5));

//     } catch (error) {
//         console.error("Failed to load reports:", error);
//         loadingState.innerHTML = `
//             <i class="ri-error-warning-line"></i>
//             <p>Failed to load reports. Please refresh the page.</p>
//         `;
//     }
// }

// function updateStats(active, inProgress, resolved, total) {
//     document.getElementById("activeReports").textContent = active;
//     document.getElementById("inProgressReports").textContent = inProgress;
//     document.getElementById("resolvedReports").textContent = resolved;
//     document.getElementById("totalReports").textContent = total;
// }

// function displayReports(reports) {
//     const reportsContainer = document.getElementById("reportsContainer");
//     const loadingState = document.getElementById("loadingState");

//     loadingState.style.display = "none";

//     reports.forEach(report => {
//         const reportItem = createReportElement(report);
//         reportsContainer.appendChild(reportItem);
//     });
// }

// function createReportElement(report) {
//     const div = document.createElement("div");
//     div.className = "report-item";

//     const typeIcons = {
//         "Fire": "ri-fire-fill",
//         "Medical": "ri-health-book-fill",
//         "Accident": "ri-car-fill",
//         "Crime": "ri-police-car-fill",
//         "Flood": "ri-flood-fill",
//         "Other": "ri-alert-fill"
//     };

//     const statusClass = report.status === "Resolved" ? "status-resolved" :
//         report.status === "InProgress" ? "status-progress" : "status-pending";

//     const statusText = report.status === "Resolved" ? "Resolved" :
//         report.status === "InProgress" ? "In Progress" : "Pending";

//     const icon = typeIcons[report.type] || "ri-alert-fill";
//     const reportDate = new Date(report.occurredAt || report.createdAt).toLocaleDateString();
//     const reportTime = new Date(report.occurredAt || report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//     div.innerHTML = `
//         <div class="report-info">
//             <div class="report-type">
//                 <i class="${icon}"></i>
//                 <h3>${report.type || 'Emergency'} Incident</h3>
//             </div>
//             <div class="report-meta">
//                 <span><i class="ri-calendar-line"></i> ${reportDate}</span>
//                 <span><i class="ri-time-line"></i> ${reportTime}</span>
//                 <span><i class="ri-map-pin-line"></i> ${report.location || 'Location recorded'}</span>
//             </div>
//         </div>
//         <div class="report-status ${statusClass}">
//             ${statusText}
//         </div>
//     `;

//     return div;
// }

document.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("authToken");

    // 🔴 TESTING: Comment out redirect for testing
    // if (!token) {
    //     window.location.href = "/login.html";
    //     return;
    // }

    loadUserInfo(token);
    await loadReports(token);

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem("authToken");
        window.location.href = "/login.html";
    });
});

function decodeToken(token) {
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch (e) {
        return null;
    }
}

function loadUserInfo(token) {
    // 🔴 TESTING: Hardcoded user name
    const firstName = "John";

    /* 🟢 PRODUCTION: Uncomment this when connected to backend
    const decoded = decodeToken(token);
    if (decoded) {
        const firstName = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
            decoded['given_name'] ||
            decoded['name'] ||
            'User';
    }
    */

    document.getElementById("userName").textContent = firstName;
}

async function loadReports(token) {
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const reportsContainer = document.getElementById("reportsContainer");

    // 🔴 TESTING: Hardcoded mock data
    const mockData = {
        succeeded: true,
        data: [
            {
                id: 1,
                type: "Fire",
                status: "InProgress",
                location: "Victoria Island, Lagos",
                occurredAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                type: "Medical",
                status: "Resolved",
                location: "Ikeja, Lagos",
                occurredAt: new Date(Date.now() - 86400000).toISOString(),
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 3,
                type: "Accident",
                status: "Resolved",
                location: "Lekki, Lagos",
                occurredAt: new Date(Date.now() - 172800000).toISOString(),
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: 4,
                type: "Crime",
                status: "Pending",
                location: "Yaba, Lagos",
                occurredAt: new Date(Date.now() - 259200000).toISOString(),
                createdAt: new Date(Date.now() - 259200000).toISOString()
            }
        ]
    };

    // Simulate loading delay
    setTimeout(() => {
        const data = mockData;

        /* 🟢 PRODUCTION: Uncomment this when connected to backend
        try {
            const response = await fetch("https://localhost:7288/api/v1/Incident/my-reports", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
        */

        loadingState.style.display = "none";

        if (!data.data || data.data.length === 0) {
            emptyState.style.display = "block";
            updateStats(0, 0, 0, 0);
            return;
        }

        const active = data.data.filter(r => r.status === "Pending" || r.status === "Active").length;
        const inProgress = data.data.filter(r => r.status === "InProgress" || r.status === "Responding").length;
        const resolved = data.data.filter(r => r.status === "Resolved" || r.status === "Closed").length;
        const total = data.data.length;

        updateStats(active, inProgress, resolved, total);
        displayReports(data.data.slice(0, 5));

        /* 🟢 PRODUCTION: Uncomment error handling
        } catch (error) {
            console.error("Failed to load reports:", error);
            loadingState.innerHTML = `
                <i class="ri-error-warning-line" style="display:block;font-size:3rem;color:#ddd;margin-bottom:1rem"></i>
                <p>Failed to load reports. Please refresh the page.</p>
            `;
        }
        */
    }, 1000); // Simulate 1 second loading
}

function updateStats(active, inProgress, resolved, total) {
    document.getElementById("activeReports").textContent = active;
    document.getElementById("inProgressReports").textContent = inProgress;
    document.getElementById("resolvedReports").textContent = resolved;
    document.getElementById("totalReports").textContent = total;
}

function displayReports(reports) {
    const reportsContainer = document.getElementById("reportsContainer");
    const loadingState = document.getElementById("loadingState");

    loadingState.style.display = "none";

    reports.forEach(report => {
        const reportItem = createReportElement(report);
        reportsContainer.appendChild(reportItem);
    });
}

function createReportElement(report) {
    const div = document.createElement("div");
    div.className = "report-item";

    const typeIcons = {
        "Fire": "ri-fire-fill",
        "Medical": "ri-health-book-fill",
        "Accident": "ri-car-fill",
        "Crime": "ri-police-car-fill",
        "Flood": "ri-flood-fill",
        "Other": "ri-alert-fill"
    };

    const statusClass = report.status === "Resolved" ? "status-resolved" :
        report.status === "InProgress" ? "status-progress" : "status-pending";

    const statusText = report.status === "Resolved" ? "Resolved" :
        report.status === "InProgress" ? "In Progress" : "Pending";

    const icon = typeIcons[report.type] || "ri-alert-fill";
    const reportDate = new Date(report.occurredAt || report.createdAt).toLocaleDateString();
    const reportTime = new Date(report.occurredAt || report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="report-info">
            <div class="report-type">
                <i class="${icon}"></i>
                <h3>${report.type || 'Emergency'} Incident</h3>
            </div>
            <div class="report-meta">
                <span><i class="ri-calendar-line"></i> ${reportDate}</span>
                <span><i class="ri-time-line"></i> ${reportTime}</span>
                <span><i class="ri-map-pin-line"></i> ${report.location || 'Location recorded'}</span>
            </div>
        </div>
        <div class="report-status ${statusClass}">
            ${statusText}
        </div>
    `;

    return div;
}