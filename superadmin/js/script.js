document.addEventListener("DOMContentLoaded", () => {
    const userToken = sessionStorage.getItem("authToken");

    function decodeToken(token) {
        if (!token) return null;
        try {
            const payload = token.split('.')[1];
            if (!payload) return null;
            return JSON.parse(atob(payload));
        } catch (e) {
            console.error("Failed to decode token:", e);
            return null;
        }
    }

    function getRole(token) {
        const decoded = decodeToken(token);
        return decoded ? decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] : null;
    }

    function checkAuth() {
        if (!userToken) {
            window.location.href = "/login.html";
            return;
        }

        const role = getRole(userToken);
        if (role !== "SuperAdmin") {
            alert("You are not authorized to view this page.");
            window.location.href = "/login.html";
            return;
        }

        console.log("SuperAdmin authenticated.");
    }

    function setupLogout() {
        const logoutBtn = document.querySelector(".logout-btn");
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.removeItem("authToken");
            window.location.href = "/login.html";
        });
    }

    function setupSidebarToggle() {
        const hamburger = document.getElementById("hamburger");
        const sidebar = document.querySelector(".sidebar");

        hamburger.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    setupSidebarToggle();

    // checkAuth();
    setupLogout();
});