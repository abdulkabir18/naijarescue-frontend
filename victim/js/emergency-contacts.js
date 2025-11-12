document.addEventListener("DOMContentLoaded", () => {
    const token = sessionStorage.getItem("authToken");

    // Official emergency services (hardcoded, can be fetched from API)
    const officialServices = [
        { name: "Police", phone: "112", icon: "ri-police-car-line" },
        { name: "Fire Service", phone: "119", icon: "ri-fire-line" },
        { name: "Ambulance", phone: "122", icon: "ri-hospital-line" },
        { name: "FRSC (Road Safety)", phone: "112", icon: "ri-roadster-line" }
    ];

    const officialList = document.getElementById("officialContacts");
    const personalList = document.getElementById("personalContacts");
    const emptyPersonal = document.getElementById("emptyPersonal");
    const addContactBtn = document.getElementById("addContactBtn");
    const modal = document.getElementById("addContactModal");
    const form = document.getElementById("addContactForm");
    const closeModalBtn = document.querySelector(".modal-close");
    const cancelBtn = document.getElementById("cancelAddBtn");

    // Render official services
    function renderOfficialContacts() {
        officialList.innerHTML = officialServices
            .map(service => `
                <div class="contact-card official">
                    <div class="contact-icon">
                        <i class="${service.icon}"></i>
                    </div>
                    <div class="contact-info">
                        <h3>${escapeHtml(service.name)}</h3>
                        <a href="tel:${escapeHtml(service.phone)}" class="contact-phone">${escapeHtml(service.phone)}</a>
                    </div>
                    <a href="tel:${escapeHtml(service.phone)}" class="btn-call" aria-label="Call ${service.name}">
                        <i class="ri-phone-line"></i>
                    </a>
                </div>
            `)
            .join("");
    }

    // Load personal contacts from localStorage (or API in production)
    function loadPersonalContacts() {
        try {
            const stored = localStorage.getItem("personalEmergencyContacts");
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Error loading contacts:", e);
            return [];
        }
    }

    // Save personal contacts to localStorage (or API in production)
    function savePersonalContacts(contacts) {
        try {
            localStorage.setItem("personalEmergencyContacts", JSON.stringify(contacts));
        } catch (e) {
            console.error("Error saving contacts:", e);
        }
    }

    // Render personal contacts
    function renderPersonalContacts() {
        const contacts = loadPersonalContacts();
        personalList.innerHTML = "";

        if (contacts.length === 0) {
            emptyPersonal.style.display = "block";
            personalList.style.display = "none";
        } else {
            emptyPersonal.style.display = "none";
            personalList.style.display = "grid";
            personalList.innerHTML = contacts
                .map((contact, index) => `
                    <div class="contact-card personal">
                        <div class="contact-icon">
                            <i class="ri-user-line"></i>
                        </div>
                        <div class="contact-info">
                            <h3>${escapeHtml(contact.name)}</h3>
                            ${contact.relation ? `<p class="relation">${escapeHtml(contact.relation)}</p>` : ""}
                            <a href="tel:${escapeHtml(contact.phone)}" class="contact-phone">${escapeHtml(contact.phone)}</a>
                        </div>
                        <div class="contact-actions">
                            <a href="tel:${escapeHtml(contact.phone)}" class="btn-call" aria-label="Call ${contact.name}">
                                <i class="ri-phone-line"></i>
                            </a>
                            <button type="button" class="btn-delete" data-index="${index}" aria-label="Delete contact">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </div>
                `)
                .join("");

            // Attach delete listeners
            document.querySelectorAll(".btn-delete").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    deleteContact(index);
                });
            });
        }
    }

    // Delete personal contact
    function deleteContact(index) {
        if (confirm("Delete this contact?")) {
            const contacts = loadPersonalContacts();
            contacts.splice(index, 1);
            savePersonalContacts(contacts);
            renderPersonalContacts();
        }
    }

    // Modal handlers
    addContactBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        form.reset();
        document.getElementById("contactName").focus();
    });

    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    cancelBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    // Add contact form submit
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("contactName").value.trim();
        const phone = document.getElementById("contactPhone").value.trim();
        const relation = document.getElementById("contactRelation").value.trim();

        if (!name || !phone) {
            alert("Please fill in name and phone number.");
            return;
        }

        const contacts = loadPersonalContacts();
        contacts.push({ name, phone, relation });
        savePersonalContacts(contacts);
        renderPersonalContacts();
        modal.style.display = "none";
        form.reset();
    });

    // Logout handler
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        sessionStorage.removeItem("authToken");
        window.location.href = "/login.html";
    });

    // Initialize
    renderOfficialContacts();
    renderPersonalContacts();

    // Helper
    function escapeHtml(str) {
        if (!str && str !== 0) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});