// let notificationConnection = null;

// document.addEventListener("DOMContentLoaded", async () => {
//     const token = sessionStorage.getItem("authToken");

//     // 🔴 TESTING: Comment out redirect for testing
//     // if (!token) {
//     //     window.location.href = "/login.html";
//     //     return;
//     // }

//     loadUserInfo(token);
//     await loadReports(token);
//     await window.notificationManager.initialize(token);

//     document.getElementById("logoutBtn").addEventListener("click", (e) => {
//         e.preventDefault();

//         // Disconnect notifications
//         window.notificationManager.disconnect();

//         sessionStorage.removeItem("authToken");
//         window.location.href = "/login.html";
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
//     // 🔴 TESTING: Hardcoded user name
//     const firstName = "John";

//     /* 🟢 PRODUCTION: Uncomment this when connected to backend
//     const decoded = decodeToken(token);
//     if (decoded) {
//         const firstName = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
//             decoded['given_name'] ||
//             decoded['name'] ||
//             'User';
//     }
//     */

//     document.getElementById("userName").textContent = firstName;
// }

// async function loadReports(token) {
//     const loadingState = document.getElementById("loadingState");
//     const emptyState = document.getElementById("emptyState");
//     const reportsContainer = document.getElementById("reportsContainer");

//     // 🔴 TESTING: Hardcoded mock data
//     const mockData = {
//         succeeded: true,
//         data: [
//             {
//                 id: 1,
//                 type: "Fire",
//                 status: "InProgress",
//                 location: "Victoria Island, Lagos",
//                 occurredAt: new Date().toISOString(),
//                 createdAt: new Date().toISOString()
//             },
//             {
//                 id: 2,
//                 type: "Medical",
//                 status: "Resolved",
//                 location: "Ikeja, Lagos",
//                 occurredAt: new Date(Date.now() - 86400000).toISOString(),
//                 createdAt: new Date(Date.now() - 86400000).toISOString()
//             },
//             {
//                 id: 3,
//                 type: "Accident",
//                 status: "Resolved",
//                 location: "Lekki, Lagos",
//                 occurredAt: new Date(Date.now() - 172800000).toISOString(),
//                 createdAt: new Date(Date.now() - 172800000).toISOString()
//             },
//             {
//                 id: 4,
//                 type: "Crime",
//                 status: "Pending",
//                 location: "Yaba, Lagos",
//                 occurredAt: new Date(Date.now() - 259200000).toISOString(),
//                 createdAt: new Date(Date.now() - 259200000).toISOString()
//             }
//         ]
//     };

//     // Simulate loading delay
//     setTimeout(() => {
//         const data = mockData;

//         /* 🟢 PRODUCTION: Uncomment this when connected to backend
//         try {
//             const response = await fetch("https://localhost:7288/api/v1/Incident/my-reports", {
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Accept": "application/json"
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP ${response.status}`);
//             }

//             const data = await response.json();
//         */

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

//         /* 🟢 PRODUCTION: Uncomment error handling
//         } catch (error) {
//             console.error("Failed to load reports:", error);
//             loadingState.innerHTML = `
//                 <i class="ri-error-warning-line" style="display:block;font-size:3rem;color:#ddd;margin-bottom:1rem"></i>
//                 <p>Failed to load reports. Please refresh the page.</p>
//             `;
//         }
//         */
//     }, 1000);
// }

// async function loadNotifications(token) {
//     // 🔴 TESTING: Hardcoded mock notifications
//     const mockNotifications = {
//         succeeded: true,
//         data: [
//             {
//                 id: "1",
//                 title: "Report Acknowledged",
//                 message: "Your fire incident report has been acknowledged by emergency services",
//                 type: "System",
//                 isRead: false,
//                 createdAt: new Date(Date.now() - 300000).toISOString(),
//                 targetId: "1",
//                 targetType: "Incident"
//             },
//             {
//                 id: "2",
//                 title: "Responder Assigned",
//                 message: "A responder has been assigned to your medical emergency",
//                 type: "Alert",
//                 isRead: false,
//                 createdAt: new Date(Date.now() - 1800000).toISOString(),
//                 targetId: "2",
//                 targetType: "Incident"
//             },
//             {
//                 id: "3",
//                 title: "Incident Resolved",
//                 message: "Your accident report has been marked as resolved",
//                 type: "Success",
//                 isRead: true,
//                 createdAt: new Date(Date.now() - 86400000).toISOString(),
//                 targetId: "3",
//                 targetType: "Incident"
//             },
//             {
//                 id: "4",
//                 title: "System Maintenance",
//                 message: "Scheduled maintenance will occur on Sunday at 2:00 AM",
//                 type: "Broadcast",
//                 isRead: false,
//                 createdAt: new Date(Date.now() - 172800000).toISOString()
//             }
//         ]
//     };

//     setTimeout(() => {
//         const data = mockNotifications;

//         /* 🟢 PRODUCTION: Uncomment this when connected to backend
//         try {
//             const response = await fetch("https://localhost:7288/api/v1/Notification/my-notifications", {
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Accept": "application/json"
//                 }
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP ${response.status}`);
//             }

//             const data = await response.json();
//         */

//         if (data.succeeded && data.data) {
//             displayNotifications(data.data);
//             updateNotificationBadge(data.data.filter(n => !n.isRead).length);
//         }

//         /* 🟢 PRODUCTION: Uncomment error handling
//         } catch (error) {
//             console.error("Failed to load notifications:", error);
//         }
//         */
//     }, 800);
// }

// function setupNotificationDropdown() {
//     const bell = document.getElementById("notificationBell");
//     const dropdown = document.getElementById("notificationDropdown");
//     const markAllRead = document.getElementById("markAllRead");

//     // Toggle dropdown
//     bell.addEventListener("click", (e) => {
//         e.stopPropagation();
//         dropdown.classList.toggle("show");
//     });

//     // Close dropdown when clicking outside
//     document.addEventListener("click", (e) => {
//         if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
//             dropdown.classList.remove("show");
//         }
//     });

//     // Mark all as read
//     markAllRead.addEventListener("click", async () => {
//         await markAllNotificationsAsRead();
//     });
// }

// function displayNotifications(notifications) {
//     const notificationList = document.getElementById("notificationList");
//     notificationList.innerHTML = "";

//     if (!notifications || notifications.length === 0) {
//         notificationList.innerHTML = `
//             <div class="empty-notifications">
//                 <i class="ri-notification-off-line"></i>
//                 <p>No notifications yet</p>
//             </div>
//         `;
//         return;
//     }

//     // Show most recent 10
//     notifications.slice(0, 10).forEach(notification => {
//         const item = createNotificationElement(notification);
//         notificationList.appendChild(item);
//     });
// }

// function getNotificationTypeClass(type) {
//     const typeMap = {
//         "Info": "info",
//         "System": "system",
//         "Warning": "warning",
//         "Alert": "alert",
//         "Success": "success",
//         "Broadcast": "broadcast"
//     };
//     return typeMap[type] || "info";
// }

// function createNotificationElement(notification) {
//     const div = document.createElement("div");
//     div.className = `notification-item ${!notification.isRead ? 'unread' : ''}`;
//     div.dataset.id = notification.id;

//     const typeIcons = {
//         "Info": { icon: "ri-information-line", class: "info" },
//         "System": { icon: "ri-settings-3-line", class: "system" },
//         "Warning": { icon: "ri-error-warning-line", class: "warning" },
//         "Alert": { icon: "ri-alarm-warning-line", class: "alert" },
//         "Success": { icon: "ri-checkbox-circle-line", class: "success" },
//         "Broadcast": { icon: "ri-broadcast-line", class: "broadcast" }
//     };

//     const iconData = typeIcons[notification.type] || typeIcons["Info"];
//     const timeAgo = getTimeAgo(new Date(notification.createdAt));

//     div.innerHTML = `
//         <div class="notification-icon ${iconData.class}">
//             <i class="${iconData.icon}"></i>
//         </div>
//         <div class="notification-content">
//             <div class="notification-title">${notification.title}</div>
//             <div class="notification-message">${notification.message}</div>
//             <div class="notification-time">${timeAgo}</div>
//         </div>
//     `;

//     // Mark as read when clicked
//     div.addEventListener("click", async () => {
//         if (!notification.isRead) {
//             await markNotificationAsRead(notification.id);
//             div.classList.remove("unread");
//             updateNotificationBadge();
//         }

//         // Navigate to target if applicable
//         if (notification.targetType === "Incident" && notification.targetId) {
//             window.location.href = `my-reports.html#${notification.targetId}`;
//         }
//     });

//     return div;
// }

// function updateNotificationBadge(count) {
//     const badge = document.getElementById("notificationBadge");
//     const bell = document.getElementById("notificationBell");

//     if (count === undefined) {
//         // Recalculate from DOM
//         count = document.querySelectorAll(".notification-item.unread").length;
//     }

//     if (count > 0) {
//         badge.textContent = count > 99 ? "99+" : count;
//         badge.style.display = "block";
//         bell.classList.add("has-unread");
//     } else {
//         badge.style.display = "none";
//         bell.classList.remove("has-unread");
//     }
// }

// async function markNotificationAsRead(notificationId) {
//     const token = sessionStorage.getItem("authToken");

//     /* 🟢 PRODUCTION: Uncomment this when connected to backend
//     try {
//         const response = await fetch(`https://localhost:7288/api/v1/Notification/${notificationId}/mark-read`, {
//             method: "PUT",
//             headers: {
//                 "Authorization": `Bearer ${token}`,
//                 "Accept": "application/json"
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status}`);
//         }
//     } catch (error) {
//         console.error("Failed to mark notification as read:", error);
//     }
//     */

//     // 🔴 TESTING: Just log for now
//     console.log(`Marking notification ${notificationId} as read`);
// }

// async function markAllNotificationsAsRead() {
//     const token = sessionStorage.getItem("authToken");

//     /* 🟢 PRODUCTION: Uncomment this when connected to backend
//     try {
//         const response = await fetch("https://localhost:7288/api/v1/Notification/mark-all-read", {
//             method: "PUT",
//             headers: {
//                 "Authorization": `Bearer ${token}`,
//                 "Accept": "application/json"
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status}`);
//         }
//     } catch (error) {
//         console.error("Failed to mark all notifications as read:", error);
//         return;
//     }
//     */

//     // 🔴 TESTING: Just update UI for now
//     console.log("Marking all notifications as read");

//     // Update UI
//     document.querySelectorAll(".notification-item.unread").forEach(item => {
//         item.classList.remove("unread");
//     });
//     updateNotificationBadge(0);
// }

// function getTimeAgo(date) {
//     const seconds = Math.floor((new Date() - date) / 1000);

//     if (seconds < 60) return "Just now";
//     if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
//     if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
//     if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
//     return date.toLocaleDateString();
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
    const token = protectPage();
    // if (!token) return;

    if (token) {
        await window.notificationManager.initialize(token);
    }


    loadUserInfo(token);
    await loadReports(token);

    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });
});

async function loadUserInfo(token) {
    const userNameEl = document.getElementById("userName");
    userNameEl.textContent = "User"; // Set a default name initially

    // 🔴 TESTING: Mock user data based on your UserProfileDto
    // const mockUser = {
    //     succeeded: true,
    //     data: {
    //         fullName: "John Doe"
    //     }
    // };

    // if (mockUser.succeeded && mockUser.data) {
    //     // Display the first name from the full name
    //     userNameEl.textContent = mockUser.data.fullName?.split(' ')[0] || "User";
    // }

    // 🟢 PRODUCTION: Uncomment for real API call
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/profile`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.succeeded && result.data) {
            // Display the first name from the full name
            userNameEl.textContent = result.data.fullName?.split(' ')[0] || "User";
        }
    } catch (error) {
        console.error("Failed to load user profile for dashboard:", error);
        // The name will remain "User" as a fallback
    }

}

async function loadReports(token) {
    const loadingState = document.getElementById("loadingState");
    const emptyState = document.getElementById("emptyState");
    const reportsContainer = document.getElementById("reportsContainer");

    // 🔴 TESTING: Hardcoded mock data matching your DTO
    // const mockData = {
    //     succeeded: true,
    //     data: [
    //         {
    //             id: "550e8400-e29b-41d4-a716-446655440001",
    //             title: "Fire outbreak at residential building",
    //             type: "Fire",
    //             confidence: 0.95,
    //             status: "InProgress",
    //             coordinates: { latitude: 6.5244, longitude: 3.3792 },
    //             address: {
    //                 street: "15 Admiralty Way",
    //                 city: "Lagos",
    //                 state: "Lagos",
    //                 lga: "Eti-Osa",
    //                 country: "Nigeria",
    //                 postalCode: "101241"
    //             },
    //             occurredAt: new Date().toISOString(),
    //             userId: "user-123",
    //             media: [
    //                 { url: "https://example.com/fire.jpg", type: "Image" }
    //             ],
    //             assignedResponders: [
    //                 {
    //                     id: "resp-1",
    //                     responderId: "resp-001",
    //                     userId: "user-resp-1",
    //                     role: "Primary",
    //                     responderName: "Fire Team Alpha"
    //                 }
    //             ]
    //         },
    //         {
    //             id: "550e8400-e29b-41d4-a716-446655440002",
    //             title: "Medical emergency - cardiac arrest",
    //             type: "Medical",
    //             confidence: 0.88,
    //             status: "Resolved",
    //             coordinates: { latitude: 6.4541, longitude: 3.3947 },
    //             address: {
    //                 street: "Allen Avenue",
    //                 city: "Lagos",
    //                 state: "Lagos",
    //                 lga: "Ikeja",
    //                 country: "Nigeria"
    //             },
    //             occurredAt: new Date(Date.now() - 86400000).toISOString(),
    //             userId: "user-123",
    //             media: [],
    //             assignedResponders: []
    //         },
    //         {
    //             id: "550e8400-e29b-41d4-a716-446655440003",
    //             title: "Road accident at Lekki toll gate",
    //             type: "Accident",
    //             confidence: 0.92,
    //             status: "Resolved",
    //             coordinates: { latitude: 6.4474, longitude: 3.5405 },
    //             address: {
    //                 street: "Lekki-Epe Expressway",
    //                 city: "Lagos",
    //                 state: "Lagos",
    //                 lga: "Eti-Osa",
    //                 country: "Nigeria"
    //             },
    //             occurredAt: new Date(Date.now() - 172800000).toISOString(),
    //             userId: "user-123",
    //             media: [
    //                 { url: "https://example.com/accident.jpg", type: "Image" }
    //             ],
    //             assignedResponders: []
    //         },
    //         {
    //             id: "550e8400-e29b-41d4-a716-446655440004",
    //             title: "Security threat reported",
    //             type: "Security",
    //             confidence: 0.75,
    //             status: "Pending",
    //             coordinates: { latitude: 6.5027, longitude: 3.3700 },
    //             address: {
    //                 street: "Herbert Macaulay Way",
    //                 city: "Lagos",
    //                 state: "Lagos",
    //                 lga: "Yaba",
    //                 country: "Nigeria"
    //             },
    //             occurredAt: new Date(Date.now() - 259200000).toISOString(),
    //             userId: "user-123",
    //             media: [],
    //             assignedResponders: []
    //         }
    //     ]
    // };

    // Simulate loading delay
    setTimeout(async () => {
        // const data = mockData;

        // 🟢 PRODUCTION: Uncomment this when connected to backend
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/me?pageNumber=1&pageSize=10`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "text/plain"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }


            const data = await response.json();

            if (data.message === "No incidents found.") {
                console.info("No incidents found.");
                loadingState.innerHTML = $`
                <i class="ri-error-warning-line" style="display:block;font-size:3rem;color:#ddd;margin-bottom:1rem"></i>
                <p>{data.message}</p>
            `;
            }


            loadingState.style.display = "none";

            if (!data.data || data.data.length === 0) {
                emptyState.style.display = "block";
                updateStats(0, 0, 0, 0);
                return;
            }

            // Calculate stats based on your IncidentStatus enum
            const pending = data.data.filter(r =>
                r.status === "Pending" || r.status === "Reported"
            ).length;

            const inProgress = data.data.filter(r =>
                r.status === "InProgress" || r.status === "Analyzed"
            ).length;

            const resolved = data.data.filter(r =>
                r.status === "Resolved"
            ).length;

            const total = data.data.length;

            updateStats(pending, inProgress, resolved, total);
            displayReports(data.data.slice(0, 5));

            // 🟢 PRODUCTION: Uncomment error handling
        } catch (error) {
            console.error("Failed to load reports:", error);
            loadingState.innerHTML = `
                <i class="ri-error-warning-line" style="display:block;font-size:3rem;color:#ddd;margin-bottom:1rem"></i>
                <p>Failed to load reports. Please refresh the page.</p>
            `;
        }
    }, 1000);
}

function updateStats(pending, inProgress, resolved, total) {
    document.getElementById("activeReports").textContent = pending;
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
    div.style.cursor = "pointer";

    const icon = getIncidentTypeIcon(report.type);
    const statusClass = getStatusClass(report.status);
    const statusText = getStatusDisplay(report.status);

    const reportDate = new Date(report.occurredAt).toLocaleDateString();
    const reportTime = new Date(report.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Format location from address
    const location = formatAddress(report.address);

    // Display title if available, otherwise use type
    const displayTitle = report.title || `${report.type} Incident`;

    div.innerHTML = `
        <div class="report-info">
            <div class="report-type">
                <i class="${icon}"></i>
                <h3>${displayTitle}</h3>
            </div>
            <div class="report-meta">
                <span><i class="ri-calendar-line"></i> ${reportDate}</span>
                <span><i class="ri-time-line"></i> ${reportTime}</span>
                <span><i class="ri-map-pin-line"></i> ${location}</span>
                ${report.confidence ? `<span title="AI Confidence"><i class="ri-brain-line"></i> ${formatConfidence(report.confidence)}%</span>` : ''}
            </div>
        </div>
        <div class="report-status ${statusClass}">
            ${statusText}
        </div>
    `;

    // Add click handler to navigate to report details
    div.addEventListener("click", () => {
        window.location.href = `report-details.html?id=${report.id}`;
    });

    return div;
}