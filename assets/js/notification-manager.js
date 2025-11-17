// notification-manager.js - Reusable notification system

class NotificationManager {
    constructor() {
        this.connection = null;
        this.isInitialized = false;
    }

    async initialize(token) {
        if (this.isInitialized) {
            console.log("Notification manager already initialized");
            return;
        }

        await this.setupNotificationDropdown();
        await this.loadNotifications(token);
        await this.initializeSignalR(token);

        this.isInitialized = true;
    }

    async initializeSignalR(token) {
        try {
            // 🟢 PRODUCTION: Use your actual SignalR hub URL
            const hubUrl = `${AppConfig.API_BASE_URL}/hubs/notification`;

            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: () => token,
                    skipNegotiation: false,
                    transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
                })
                .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // Listen for new notifications
            this.connection.on("ReceiveNotification", (notification) => {
                console.log("New notification received:", notification);
                this.handleNewNotification(notification);
            });

            // Listen for broadcast notifications
            this.connection.on("ReceiveBroadcast", (notification) => {
                console.log("Broadcast notification received:", notification);
                this.handleNewNotification(notification);
            });

            // Handle reconnecting
            this.connection.onreconnecting((error) => {
                console.log("SignalR reconnecting:", error);
                this.showConnectionStatus("Reconnecting...", "warning");
            });

            // Handle reconnected
            this.connection.onreconnected((connectionId) => {
                console.log("SignalR reconnected:", connectionId);
                this.showConnectionStatus("Connected", "success");
                setTimeout(() => this.hideConnectionStatus(), 2000);
            });

            // Handle disconnected
            this.connection.onclose((error) => {
                console.log("SignalR disconnected:", error);
                this.showConnectionStatus("Disconnected", "error");
            });

            // Start connection
            await this.connection.start();
            console.log("SignalR connected successfully");
            this.showConnectionStatus("Connected", "success");
            setTimeout(() => this.hideConnectionStatus(), 2000);

        } catch (error) {
            console.error("SignalR connection failed:", error);
            this.showConnectionStatus("Connection failed", "error");

            // Retry connection after 5 seconds
            setTimeout(() => this.initializeSignalR(token), 5000);
        }
    }

    async loadNotifications(token) {
        // 🔴 TESTING: Hardcoded mock notifications
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
                }
            ]
        };

        setTimeout(() => {
            const data = mockNotifications;

            /* 🟢 PRODUCTION: Uncomment this when connected to backend
            try {
                const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Notification/my-notifications`, {
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

            if (data.succeeded && data.data) {
                this.displayNotifications(data.data);
                this.updateNotificationBadge(data.data.filter(n => !n.isRead).length);
            }

            /* 🟢 PRODUCTION: Uncomment error handling
            } catch (error) {
                console.error("Failed to load notifications:", error);
            }
            */
        }, 800);
    }

    setupNotificationDropdown() {
        const bell = document.getElementById("notificationBell");
        const dropdown = document.getElementById("notificationDropdown");
        const markAllRead = document.getElementById("markAllRead");

        if (!bell || !dropdown) {
            console.warn("Notification elements not found in DOM");
            return;
        }

        // Toggle dropdown
        bell.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("show");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
                dropdown.classList.remove("show");
            }
        });

        // Mark all as read
        if (markAllRead) {
            markAllRead.addEventListener("click", async () => {
                await this.markAllNotificationsAsRead();
            });
        }
    }

    handleNewNotification(notification) {
        // Play notification sound (optional)
        this.playNotificationSound();

        // Show browser notification if permitted
        this.showBrowserNotification(notification);

        // Add to notification list
        this.addNotificationToList(notification);

        // Update badge count
        const badge = document.getElementById("notificationBadge");
        const currentCount = parseInt(badge?.textContent || "0");
        this.updateNotificationBadge(currentCount + 1);

        // Show toast notification
        this.showToastNotification(notification);
    }

    addNotificationToList(notification) {
        const notificationList = document.getElementById("notificationList");
        if (!notificationList) return;

        // Remove empty state if present
        const emptyState = notificationList.querySelector(".empty-notifications");
        if (emptyState) {
            emptyState.remove();
        }

        // Remove loading state if present
        const loadingState = notificationList.querySelector(".loading-notifications");
        if (loadingState) {
            loadingState.remove();
        }

        // Create and prepend new notification
        const notificationElement = this.createNotificationElement(notification);
        notificationList.insertBefore(notificationElement, notificationList.firstChild);

        // Keep only the 10 most recent
        const items = notificationList.querySelectorAll(".notification-item");
        if (items.length > 10) {
            items[items.length - 1].remove();
        }

        // Animate the new notification
        notificationElement.style.animation = "slideIn 0.3s ease";
    }

    showToastNotification(notification) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById("toastContainer");
        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.id = "toastContainer";
            toastContainer.className = "toast-container";
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement("div");
        toast.className = `toast toast-${this.getNotificationTypeClass(notification.type)}`;

        const typeIcons = {
            "Info": "ri-information-line",
            "System": "ri-settings-3-line",
            "Warning": "ri-error-warning-line",
            "Alert": "ri-alarm-warning-line",
            "Success": "ri-checkbox-circle-line",
            "Broadcast": "ri-broadcast-line"
        };

        const icon = typeIcons[notification.type] || "ri-notification-3-line";

        toast.innerHTML = `
            <i class="${icon}"></i>
            <div class="toast-content">
                <strong>${notification.title}</strong>
                <p>${notification.message}</p>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="ri-close-line"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = "slideOut 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    playNotificationSound() {
        try {
            const audio = new Audio("/assets/sounds/notification.mp3");
            audio.volume = 0.3;
            audio.play().catch(err => console.log("Could not play sound:", err));
        } catch (error) {
            // Ignore if sound file doesn't exist
        }
    }

    showBrowserNotification(notification) {
        if (!("Notification" in window)) {
            return;
        }

        if (Notification.permission === "granted") {
            new Notification(notification.title, {
                body: notification.message,
                icon: "/assets/images/logo/logo.png",
                badge: "/assets/images/logo/logo.png",
                tag: notification.id
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: "/assets/images/logo/logo.png"
                    });
                }
            });
        }
    }

    showConnectionStatus(message, type) {
        let statusBar = document.getElementById("connectionStatus");

        if (!statusBar) {
            statusBar = document.createElement("div");
            statusBar.id = "connectionStatus";
            statusBar.className = "connection-status";
            document.body.appendChild(statusBar);
        }

        statusBar.className = `connection-status connection-${type}`;
        statusBar.textContent = message;
        statusBar.style.display = "block";
    }

    hideConnectionStatus() {
        const statusBar = document.getElementById("connectionStatus");
        if (statusBar) {
            statusBar.style.display = "none";
        }
    }

    displayNotifications(notifications) {
        const notificationList = document.getElementById("notificationList");
        if (!notificationList) return;

        notificationList.innerHTML = "";

        if (!notifications || notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="empty-notifications">
                    <i class="ri-notification-off-line"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        // Show most recent 10
        notifications.slice(0, 10).forEach(notification => {
            const item = this.createNotificationElement(notification);
            notificationList.appendChild(item);
        });
    }

    getNotificationTypeClass(type) {
        const typeMap = {
            "Info": "info",
            "System": "system",
            "Warning": "warning",
            "Alert": "alert",
            "Success": "success",
            "Broadcast": "broadcast"
        };
        return typeMap[type] || "info";
    }

    createNotificationElement(notification) {
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
        const timeAgo = this.getTimeAgo(new Date(notification.createdAt));

        div.innerHTML = `
            <div class="notification-icon ${iconData.class}">
                <i class="${iconData.icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${timeAgo}</div>
            </div>
        `;

        // Mark as read when clicked
        div.addEventListener("click", async () => {
            if (!notification.isRead) {
                await this.markNotificationAsRead(notification.id);
                div.classList.remove("unread");
                this.updateNotificationBadge();
            }

            // Navigate to target if applicable
            if (notification.targetType === "Incident" && notification.targetId) {
                window.location.href = `my-reports.html#${notification.targetId}`;
            }
        });

        return div;
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById("notificationBadge");
        const bell = document.getElementById("notificationBell");

        if (!badge || !bell) return;

        if (count === undefined) {
            // Recalculate from DOM
            count = document.querySelectorAll(".notification-item.unread").length;
        }

        if (count > 0) {
            badge.textContent = count > 99 ? "99+" : count;
            badge.style.display = "block";
            bell.classList.add("has-unread");
        } else {
            badge.style.display = "none";
            bell.classList.remove("has-unread");
        }
    }

    async markNotificationAsRead(notificationId) {
        const token = sessionStorage.getItem("authToken");

        /* 🟢 PRODUCTION: Uncomment this when connected to backend
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Notification/${notificationId}/mark-read`, {
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

    async markAllNotificationsAsRead() {
        const token = sessionStorage.getItem("authToken");

        /* 🟢 PRODUCTION: Uncomment this when connected to backend
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Notification/mark-all-read`, {
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
        this.updateNotificationBadge(0);
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    disconnect() {
        if (this.connection) {
            this.connection.stop();
            console.log("SignalR disconnected");
        }
    }
}

// Create global instance
window.notificationManager = new NotificationManager();