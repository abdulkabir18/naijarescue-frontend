let currentFilter = 'all';
let currentPage = 1;
let itemsPerPage = 20;
let allNotifications = [];

document.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("authToken");

    // 🔴 TESTING: Comment out redirect for testing
    // if (!token) {
    //     window.location.href = "/login.html";
    //     return;
    // }

    // Initialize notification manager for the bell icon
    await window.notificationManager.initialize(token);

    // Load all notifications for this page
    await loadAllNotifications(token);

    // Setup filter tabs
    setupFilters();

    // Setup pagination
    setupPagination();

    // Mark all as read button
    document.getElementById("markAllReadPage").addEventListener("click", async () => {
        await markAllNotificationsAsRead();
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        window.notificationManager.disconnect();
        sessionStorage.removeItem("authToken");
        window.location.href = "/login.html";
    });
});

async function loadAllNotifications(token) {
    const container = document.getElementById("notificationsContainer");
    const emptyState = document.getElementById("emptyNotifications");

    // 🔴 TESTING: Extended mock data
    const mockNotifications = {
        succeeded: true,
        data: [
            {
                id: "1",
                title: "Report Acknowledged",
                message: "Your fire incident report has been acknowledged by emergency services",
                type: "System",
                isRead: false,
                createdAt: new Date(Date.now() - 300000).toISOString(),
                targetId: "1",
                targetType: "Incident"
            },
            {
                id: "2",
                title: "Responder Assigned",
                message: "A responder has been assigned to your medical emergency",
                type: "Alert",
                isRead: false,
                createdAt: new Date(Date.now() - 1800000).toISOString(),
                targetId: "2",
                targetType: "Incident"
            },
            {
                id: "3",
                title: "Incident Resolved",
                message: "Your accident report has been marked as resolved",
                type: "Success",
                isRead: true,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                targetId: "3",
                targetType: "Incident"
            },
            {
                id: "4",
                title: "System Maintenance",
                message: "Scheduled maintenance will occur on Sunday at 2:00 AM",
                type: "Broadcast",
                isRead: false,
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: "5",
                title: "Safety Alert",
                message: "Heavy rainfall warning in your area. Stay safe!",
                type: "Warning",
                isRead: true,
                createdAt: new Date(Date.now() - 259200000).toISOString()
            },
            {
                id: "6",
                title: "New Feature",
                message: "You can now track your emergency reports in real-time",
                type: "Info",
                isRead: true,
                createdAt: new Date(Date.now() - 345600000).toISOString()
            },
            {
                id: "7",
                title: "Emergency Response Team Arrived",
                message: "The response team has arrived at your location",
                type: "Success",
                isRead: true,
                createdAt: new Date(Date.now() - 432000000).toISOString()
            },
            {
                id: "8",
                title: "Profile Updated",
                message: "Your profile information has been successfully updated",
                type: "System",
                isRead: true,
                createdAt: new Date(Date.now() - 518400000).toISOString()
            }
        ]
    };

    setTimeout(() => {
        const data = mockNotifications;

        /* 🟢 PRODUCTION: Uncomment this when connected to backend
        try {
            const response = await fetch("https://localhost:7288/api/v1/Notification/all", {
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

        container.innerHTML = "";

        if (!data.succeeded || !data.data || data.data.length === 0) {
            emptyState.style.display = "block";
            document.getElementById("paginationContainer").style.display = "none";
            updateFilterCounts(0, 0);
            return;
        }

        allNotifications = data.data;
        updateFilterCounts(allNotifications.length, allNotifications.filter(n => !n.isRead).length);
        displayNotifications(allNotifications);

        /* 🟢 PRODUCTION: Uncomment error handling
        } catch (error) {
            console.error("Failed to load notifications:", error);
            container.innerHTML = `
                <div class="empty-state-full">
                    <i class="ri-error-warning-line"></i>
                    <h3>Failed to Load</h3>
                    <p>Unable to load notifications. Please try again.</p>
                </div>
            `;
        }
        */
    }, 1000);
}

function setupFilters() {
    const filterTabs = document.querySelectorAll(".filter-tab");

    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // Update active state
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            // Apply filter
            currentFilter = tab.dataset.filter;
            currentPage = 1;
            displayNotifications(allNotifications);
        });
    });
}

function setupPagination() {
    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayNotifications(allNotifications);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        const totalPages = Math.ceil(getFilteredNotifications(allNotifications).length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayNotifications(allNotifications);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

function getFilteredNotifications(notifications) {
    if (currentFilter === 'all') {
        return notifications;
    } else if (currentFilter === 'unread') {
        return notifications.filter(n => !n.isRead);
    } else {
        // Filter by type
        const typeMap = {
            'alert': ['Alert', 'Warning'],
            'system': ['System'],
            'success': ['Success']
        };
        const types = typeMap[currentFilter] || [currentFilter];
        return notifications.filter(n => types.includes(n.type));
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById("notificationsContainer");
    const emptyState = document.getElementById("emptyNotifications");
    const paginationContainer = document.getElementById("paginationContainer");

    // Filter notifications
    const filtered = getFilteredNotifications(notifications);

    if (filtered.length === 0) {
        container.style.display = "none";
        emptyState.style.display = "block";
        paginationContainer.style.display = "none";
        return;
    }

    container.style.display = "block";
    emptyState.style.display = "none";

    // Paginate
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedNotifications = filtered.slice(startIndex, endIndex);

    // Group by date
    const grouped = groupNotificationsByDate(paginatedNotifications);

    container.innerHTML = "";

    // Render grouped notifications
    Object.keys(grouped).forEach(dateLabel => {
        // Add date separator
        const separator = document.createElement("div");
        separator.className = "date-separator";
        separator.textContent = dateLabel;
        container.appendChild(separator);

        // Add notifications
        grouped[dateLabel].forEach(notification => {
            const item = createFullNotificationElement(notification);
            container.appendChild(item);
        });
    });

    // Update pagination
    updatePagination(currentPage, totalPages);
}

function groupNotificationsByDate(notifications) {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
        const date = new Date(notification.createdAt);
        let dateLabel;

        if (isSameDay(date, today)) {
            dateLabel = "Today";
        } else if (isSameDay(date, yesterday)) {
            dateLabel = "Yesterday";
        } else if (isWithinDays(date, 7)) {
            dateLabel = date.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
            dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (!groups[dateLabel]) {
            groups[dateLabel] = [];
        }
        groups[dateLabel].push(notification);
    });

    return groups;
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

function isWithinDays(date, days) {
    const diff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    return diff < days;
}

function createFullNotificationElement(notification) {
    const div = document.createElement("div");
    div.className = `notification-item ${!notification.isRead ? 'unread' : ''}`;
    div.dataset.id = notification.id;

    const typeIcons = {
        "Info": { icon: "ri-information-line", class: "info" },
        "System": { icon: "ri-settings-3-line", class: "system" },
        "Warning": { icon: "ri-error-warning-line", class: "warning" },
        "Alert": { icon: "ri-alarm-warning-line", class: "alert" },
        "Success": { icon: "ri-checkbox-circle-line", class: "success" },
        "Broadcast": { icon: "ri-broadcast-line", class: "broadcast" }
    };

    const iconData = typeIcons[notification.type] || typeIcons["Info"];
    const time = new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    div.innerHTML = `
        <div class="notification-icon ${iconData.class}">
            <i class="${iconData.icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${time}</div>
        </div>
    `;

    div.addEventListener("click", async () => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
            div.classList.remove("unread");

            // Update counts
            const unreadCount = document.querySelectorAll(".notification-item.unread").length;
            updateFilterCounts(allNotifications.length, unreadCount);
        }

        // Navigate to target if applicable
        if (notification.targetType === "Incident" && notification.targetId) {
            window.location.href = `/victim/report-details.html#${notification.targetId}`;
        }
    });

    return div;
}

function updatePagination(current, total) {
    const paginationContainer = document.getElementById("paginationContainer");
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    const currentPageSpan = document.getElementById("currentPage");
    const totalPagesSpan = document.getElementById("totalPages");

    if (total <= 1) {
        paginationContainer.style.display = "none";
        return;
    }

    paginationContainer.style.display = "flex";
    currentPageSpan.textContent = current;
    totalPagesSpan.textContent = total;

    prevBtn.disabled = current === 1;
    nextBtn.disabled = current === total;
}

function updateFilterCounts(total, unread) {
    document.getElementById("countAll").textContent = total;
    document.getElementById("countUnread").textContent = unread;
}

async function markNotificationAsRead(notificationId) {
    const token = sessionStorage.getItem("authToken");

    /* 🟢 PRODUCTION: Uncomment this when connected to backend
    try {
        const response = await fetch(`https://localhost:7288/api/v1/Notification/${notificationId}/mark-read`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
    }
    */

    console.log(`Marking notification ${notificationId} as read`);
}

async function markAllNotificationsAsRead() {
    const token = sessionStorage.getItem("authToken");

    /* 🟢 PRODUCTION: Uncomment this when connected to backend
    try {
        const response = await fetch("https://localhost:7288/api/v1/Notification/mark-all-read", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
        return;
    }
    */

    console.log("Marking all notifications as read");

    // Update UI
    document.querySelectorAll(".notification-item.unread").forEach(item => {
        item.classList.remove("unread");
    });

    // Update all notifications in memory
    allNotifications.forEach(n => n.isRead = true);

    updateFilterCounts(allNotifications.length, 0);
}