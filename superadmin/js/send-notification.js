document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    if (!token) return;

    // Check role
    const role = getRole(token);
    if (role !== 'SuperAdmin' && role !== 'AgencyAdmin') {
        alert('Access denied. Admins only.');
        window.location.href = '/auth/login.html';
        return;
    }

    if (token) {
        await window.notificationManager.initialize(token);
    }
    await loadAdminProfile(token);

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const form = document.getElementById("notificationForm");
    const sendBtn = document.getElementById("sendBtn");
    const formFeedback = document.getElementById("formFeedback");
    const userSearchInput = document.getElementById("userSearch");
    const searchResults = document.getElementById("searchResults");
    const selectedRecipientsContainer = document.getElementById("selectedRecipients");
    const sendModeRadios = document.getElementsByName("sendMode");

    let selectedUsers = [];
    let allUsers = [];
    let searchTimeout = null;

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Handle Send Mode Change
    sendModeRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            const mode = e.target.value;
            selectedUsers = [];
            renderSelectedUsers();
            userSearchInput.value = "";
            searchResults.style.display = "none";
            userSearchInput.placeholder = mode === "single"
                ? "Search for a user..."
                : "Search to add multiple users...";
        });
    });

    // Search Users with debounce
    userSearchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => handleUserSearch(), 300);
    });

    userSearchInput.addEventListener("focus", () => {
        if (userSearchInput.value.trim().length >= 2) {
            searchResults.style.display = "block";
        }
    });

    // Close search results when clicking outside
    document.addEventListener("click", (e) => {
        if (!userSearchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = "none";
        }
    });

    // Form Submission
    form.addEventListener("submit", handleFormSubmit);

    // Functions
    async function handleUserSearch() {
        const query = userSearchInput.value.trim();

        if (query.length < 2) {
            searchResults.style.display = "none";
            return;
        }

        try {
            // Search via API
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/search?keyword=${encodeURIComponent(query)}&pageSize=10`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Search failed');

            const result = await response.json();

            if (result.succeeded && result.data) {
                const users = result.data.data || result.data;
                displaySearchResults(users);
            } else {
                searchResults.innerHTML = '<div class="search-result-item" style="cursor: default; color: #6b7280;">No users found</div>';
                searchResults.style.display = "block";
            }
        } catch (error) {
            console.error("Error searching users:", error);
            searchResults.innerHTML = '<div class="search-result-item" style="cursor: default; color: #dc2626;">Search failed. Please try again.</div>';
            searchResults.style.display = "block";
        }
    }

    function displaySearchResults(users) {
        searchResults.innerHTML = "";

        if (users.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item" style="cursor: default; color: #6b7280;">No users found</div>';
            searchResults.style.display = "block";
            return;
        }

        // Filter out already selected users
        const availableUsers = users.filter(user =>
            !selectedUsers.some(selected => selected.id === user.id)
        );

        if (availableUsers.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item" style="cursor: default; color: #6b7280;">All matching users already selected</div>';
            searchResults.style.display = "block";
            return;
        }

        availableUsers.forEach(user => {
            const div = document.createElement("div");
            div.className = "search-result-item";

            const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
            const avatar = user.profilePictureUrl
                ? `${AppConfig.API_BASE_URL}/${user.profilePictureUrl}`
                : generateInitialsAvatar(fullName);

            div.innerHTML = `
                <img src="${avatar}" class="search-avatar" alt="User" onerror="this.src='${generateInitialsAvatar(fullName)}'">
                <div class="search-info">
                    <h4>${escapeHtml(fullName)}</h4>
                    <p>${escapeHtml(user.email || 'No email')}</p>
                </div>
            `;

            div.addEventListener("click", () => selectUser(user));
            searchResults.appendChild(div);
        });

        searchResults.style.display = "block";
    }

    function selectUser(user) {
        const mode = document.querySelector('input[name="sendMode"]:checked').value;

        if (mode === "single") {
            selectedUsers = [user];
        } else {
            // Check if user is already selected
            if (!selectedUsers.some(u => u.id === user.id)) {
                selectedUsers.push(user);
            }
        }

        renderSelectedUsers();
        userSearchInput.value = "";
        searchResults.style.display = "none";
    }

    function renderSelectedUsers() {
        selectedRecipientsContainer.innerHTML = "";

        if (selectedUsers.length === 0) {
            selectedRecipientsContainer.innerHTML = '<span style="color: #9ca3af; font-size: 0.875rem; padding: 0.5rem;">No recipients selected</span>';
            return;
        }

        selectedUsers.forEach(user => {
            const chip = document.createElement("div");
            chip.className = "recipient-chip";

            const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';

            chip.innerHTML = `
                <span>${escapeHtml(fullName)}</span>
                <button type="button" aria-label="Remove ${escapeHtml(fullName)}">
                    <i class="ri-close-line"></i>
                </button>
            `;

            chip.querySelector("button").addEventListener("click", () => removeUser(user.id));
            selectedRecipientsContainer.appendChild(chip);
        });
    }

    function removeUser(userId) {
        selectedUsers = selectedUsers.filter(u => u.id !== userId);
        renderSelectedUsers();
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        // Validation
        if (selectedUsers.length === 0) {
            showFeedback("formFeedback", "Please select at least one recipient.", "error", 0);
            return;
        }

        const title = document.getElementById("title").value.trim();
        const message = document.getElementById("message").value.trim();
        const type = parseInt(document.getElementById("type").value);

        if (!title || !message) {
            showFeedback("formFeedback", "Please fill in all required fields.", "error", 0);
            return;
        }

        sendBtn.disabled = true;
        sendBtn.classList.add("loading");
        formFeedback.style.display = "none";

        try {
            const mode = document.querySelector('input[name="sendMode"]:checked').value;

            if (mode === "single" || selectedUsers.length === 1) {
                // Send to single user
                await sendToSingleUser(selectedUsers[0].id, title, message, type);
            } else {
                // Broadcast to multiple users
                await sendBroadcast(selectedUsers.map(u => u.id), title, message, type);
            }

            showFeedback("formFeedback", `Notification sent successfully to ${selectedUsers.length} user(s)!`, "success");

            // Reset form
            form.reset();
            selectedUsers = [];
            renderSelectedUsers();

        } catch (error) {
            console.error("Send notification error:", error);
            showFeedback("formFeedback", error.message || "Failed to send notification.", "error", 0);
        } finally {
            sendBtn.disabled = false;
            sendBtn.classList.remove("loading");
        }
    }

    async function sendToSingleUser(recipientId, title, message, type) {
        const params = new URLSearchParams({
            recipientId: recipientId,
            title: title,
            message: message,
            type: type.toString()
        });

        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Notification/send?${params.toString()}`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (!response.ok || !result.succeeded) {
            throw new Error(result.message || "Failed to send notification");
        }

        return result;
    }

    async function sendBroadcast(recipientIds, title, message, type) {
        const params = new URLSearchParams({
            title: title,
            message: message,
            type: type.toString()
        });

        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Notification/broadcast?${params.toString()}`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(recipientIds)
        });

        const result = await response.json();

        if (!response.ok || !result.succeeded) {
            throw new Error(result.message || "Failed to send broadcast notification");
        }

        return result;
    }
});