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
    return decoded ? decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null : null;
}

function logoutUser() {
    console.log("Logging out user...");
    if (window.notificationManager && typeof window.notificationManager.disconnect === 'function') {
        window.notificationManager.disconnect();
    }
    sessionStorage.removeItem("authToken");
    window.location.href = "/login.html";
}

function protectPage() {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
        // window.location.href = "/login.html";
        return null;
    }
    return token;
}