document.addEventListener("DOMContentLoaded", () => {
    const GOOGLE_CLIENT_ID = "88984039780-g17q7897o6fsec1oimirdbjv3otoor2e.apps.googleusercontent.com";
    const googleLoginBtn = document.getElementById("googleLogin");
    const feedback = document.getElementById("feedback");

    const client = google.accounts.oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "email profile openid",
        ux_mode: "popup",
        callback: async (response) => {
            const credential = response.credential;

            if (credential) {
                googleLoginBtn.disabled = true;
                googleLoginBtn.classList.add("loading");

                try {
                    const res = await fetch("https://localhost:7288/api/v1/Auth/continue-with-google", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ accessToken: credential })
                    });

                    const data = await res.json();

                    if (res.ok && data.succeeded) {
                        feedback.textContent = "✅ Logged in successfully!";
                        feedback.className = "feedback-message success";

                        sessionStorage.setItem("authToken", data.data.token);

                        const role = getRole(json.data.token);

                        if (role === "Victim") {
                            setTimeout(() => window.location.href = "/victim-dashboard.html", 3000);
                            return;
                        }
                        else if (role === "SuperAdmin") {
                            setTimeout(() => window.location.href = "assets/admin/html/admin-dashboard.html", 3000);
                            return;
                        }
                        else if (role === "AgencyAdmin") {
                            setTimeout(() => window.location.href = "/agencyadmin-dashboard.html", 3000);
                            return;
                        }
                        else if (role === "Responder") {
                            setTimeout(() => window.location.href = "/responder-dashboard.html", 3000);
                            return;
                        }
                        else {
                            feedback.textContent = "⚠️ Unknown user role. Contact support.";
                            feedback.className = "feedback-message error";
                            window.location.href = "/login.html";
                            return;
                        }
                    } else {
                        feedback.textContent = `❌ ${data.message || "Google login failed."}`;
                        feedback.className = "feedback-message error";
                    }
                } catch (err) {
                    console.error("Google login error:", err);
                    feedback.textContent = "⚠️ Network error. Please try again.";
                    feedback.className = "feedback-message error";
                } finally {
                    googleLoginBtn.disabled = false;
                    googleLoginBtn.classList.remove("loading");
                }
            }
        }
    });

    googleLoginBtn.addEventListener("click", () => {
        client.requestCode();
    });
});

function decodeToken(token) {
    if (!token) return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
}

let getRole = (token) => {
    const decoded = decodeToken(token);
    return decoded ? decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null : null;
}