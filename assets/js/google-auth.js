document.addEventListener("DOMContentLoaded", () => {
    const GOOGLE_CLIENT_ID = "88984039780-g17q7897o6fsec1oimirdbjv3otoor2e.apps.googleusercontent.com";

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("googleLogin"),
        { theme: "outline", size: "large", text: "continue_with", shape: "rectangular" }
    );

    google.accounts.id.prompt();

    async function handleCredentialResponse(response) {
        const credential = response.credential;

        try {
            const res = await fetch("https://localhost:7288/api/v1/Auth/continue-with-google", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ accessToken: credential })
            });

            const data = await res.json();

            if (res.ok && data.succeeded) {
                localStorage.setItem("authToken", data.data.token);
                alert("✅ Logged in successfully!");
                window.location.href = "/dashboard.html";
            } else {
                alert("❌ Google login failed: " + (data.message || "Try again."));
            }
        } catch (err) {
            console.error("Google login error:", err);
            alert("⚠️ Network error. Please try again.");
        }
    }
});