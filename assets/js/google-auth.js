// document.addEventListener("DOMContentLoaded", () => {
//     const googleLoginBtn = document.getElementById("googleLogin");
//     const feedback = document.getElementById("feedback");

//     const client = google.accounts.oauth2.initCodeClient({
//         // Use the client ID from the global config file
//         client_id: AppConfig.GOOGLE_CLIENT_ID,
//         scope: "email profile openid",
//         ux_mode: "popup",
//         callback: async (response) => {
//             const credential = response.credential;

//             if (credential) {
//                 googleLoginBtn.disabled = true;
//                 googleLoginBtn.classList.add("loading");

//                 try {
//                     const res = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/continue-with-google`, {
//                         method: "POST",
//                         headers: {
//                             "Content-Type": "application/json",
//                             "Accept": "text/plain"
//                         },
//                         body: JSON.stringify({ accessToken: credential })
//                     });

//                     const data = await res.json();

//                     if (res.ok && data.succeeded) {
//                         feedback.textContent = "✅ Logged in successfully!";
//                         feedback.className = "feedback-message success";

//                         sessionStorage.setItem("authToken", data.data.token);

//                         const role = getRole(data.data.token);

//                         console.log("User role:", role);

//                         if (role === "Victim") {
//                             setTimeout(() => window.location.href = "victim/victim-dashboard.html", 3000);
//                             return;
//                         }
//                         else if (role === "SuperAdmin") {
//                             setTimeout(() => window.location.href = "superadmin/superadmin-dashboard.html", 3000);
//                             return;
//                         }
//                         else if (role === "AgencyAdmin") {
//                             setTimeout(() => window.location.href = "agencyadmin/agencyadmin-dashboard.html", 3000);
//                             return;
//                         }
//                         else if (role === "Responder") {
//                             setTimeout(() => window.location.href = "responder/responder-dashboard.html", 3000);
//                             return;
//                         }
//                         else {
//                             feedback.textContent = "⚠️ Unknown user role. Contact support.";
//                             feedback.className = "feedback-message error";
//                             window.location.href = "/login.html";
//                             return;
//                         }
//                     } else {
//                         feedback.textContent = `❌ ${data.message || "Google login failed."}`;
//                         feedback.className = "feedback-message error";
//                     }
//                 } catch (err) {
//                     console.error("Google login error:", err);
//                     feedback.textContent = "⚠️ Network error. Please try again.";
//                     feedback.className = "feedback-message error";
//                 } finally {
//                     googleLoginBtn.disabled = false;
//                     googleLoginBtn.classList.remove("loading");
//                 }
//             }
//         }
//     });

//     googleLoginBtn.addEventListener("click", () => {
//         client.requestCode();
//     });
// });

document.addEventListener("DOMContentLoaded", () => {
    const googleLoginBtn = document.getElementById("googleLogin");
    const feedback = document.getElementById("feedback");

    function createClient() {
        return google.accounts.oauth2.initCodeClient({
            client_id: AppConfig.GOOGLE_CLIENT_ID,
            scope: "email profile openid",
            ux_mode: "popup",
            callback: async (response) => {
                // const credential = response && response.credential;
                // const code = response && response.code;
                // const tokenOrCode = credential || code;

                // if (!tokenOrCode) {
                //     feedback.textContent = "⚠️ Google response missing credential/code.";
                //     feedback.className = "feedback-message error";
                //     return;
                // }

                if (!response || !response.code) {
        feedback.textContent = "⚠️ Google did not return an authorization code.";
        feedback.className = "feedback-message error";
        return;
    }

                if (googleLoginBtn) {
                    googleLoginBtn.disabled = true;
                    googleLoginBtn.classList.add("loading");
                }

                try {
                    // const body = credential ? { accessToken: credential } : { accessToken: code };

                    // const body = { accessToken: response.code };

                    console.log("Sending to backend:", response.code);

                    const res = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/continue-with-google`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ accessToken: response.code })
                    });

                    const data = await res.json();

                    if (res.ok && data.succeeded) {
                        feedback.textContent = "✅ Logged in successfully!";
                        feedback.className = "feedback-message success";

                        const token = data.data.token;
                        if (token) {
                            sessionStorage.setItem("authToken", token);
                        }

                        const role = getRole(token);

                        if (role === "Victim") {
                            setTimeout(() => window.location.href = "victim/victim-dashboard.html", 3000);
                            return;
                        }
                        else if (role === "SuperAdmin") {
                            setTimeout(() => window.location.href = "superadmin/superadmin-dashboard.html", 3000);
                            return;
                        }
                        else if (role === "AgencyAdmin") {
                            setTimeout(() => window.location.href = "agencyadmin/agencyadmin-dashboard.html", 3000);
                            return;
                        }
                        else if (role === "Responder") {
                            setTimeout(() => window.location.href = "responder/responder-dashboard.html", 3000);
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
                    if (googleLoginBtn) {
                        googleLoginBtn.disabled = false;
                        googleLoginBtn.classList.remove("loading");
                    }
                }
            }
        });
    }

    let client = null;
    // disable the button until Google client is ready
    if (googleLoginBtn) googleLoginBtn.disabled = true;

    const waitForGoogle = (attempts = 0) => {
        if (window.google && google.accounts && google.accounts.oauth2 && google.accounts.oauth2.initCodeClient) {
            try {
                client = createClient();
                if (googleLoginBtn) {
                    googleLoginBtn.disabled = false;
                    googleLoginBtn.addEventListener("click", () => client.requestCode());
                }
            } catch (e) {
                console.error('Failed to initialize Google client:', e);
            }
        } else if (attempts < 50) {
            setTimeout(() => waitForGoogle(attempts + 1), 100);
        } else {
            console.warn('Google API not available after waiting.');
            if (googleLoginBtn) googleLoginBtn.disabled = true;
        }
    };

    waitForGoogle();
});

// document.addEventListener("DOMContentLoaded", () => {
//     const googleLoginBtn = document.getElementById("googleLogin");
//     const feedback = document.getElementById("feedback");

//     function createClient() {
//         return google.accounts.oauth2.initCodeClient({
//             client_id: AppConfig.GOOGLE_CLIENT_ID,
//             scope: "email profile openid",
//             ux_mode: "popup",
//             callback: async (response) => {
//                 // Validate response
//                 if (!response || !response.code) {
//                     feedback.textContent = "⚠️ Google did not return an authorization code.";
//                     feedback.className = "feedback-message error";
//                     return;
//                 }

//                 // Disable button during processing
//                 if (googleLoginBtn) {
//                     googleLoginBtn.disabled = true;
//                     googleLoginBtn.classList.add("loading");
//                 }

//                 try {
//                     console.log("Sending authorization code to backend:", response.code);

//                     const res = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/continue-with-google`, {
//                         method: "POST",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({ accessToken: response.code }) // Backend expects 'accessToken' field
//                     });

//                     const data = await res.json();

//                     if (res.ok && data.succeeded) {
//                         feedback.textContent = "✅ Logged in successfully!";
//                         feedback.className = "feedback-message success";

//                         const token = data.data.token;
//                         if (token) {
//                             sessionStorage.setItem("authToken", token);
//                         }

//                         const role = getRole(token);

//                         // Role-based redirect
//                         const roleRedirects = {
//                             "Victim": "victim/victim-dashboard.html",
//                             "SuperAdmin": "superadmin/superadmin-dashboard.html",
//                             "AgencyAdmin": "agencyadmin/agencyadmin-dashboard.html",
//                             "Responder": "responder/responder-dashboard.html"
//                         };

//                         if (roleRedirects[role]) {
//                             setTimeout(() => window.location.href = roleRedirects[role], 1500);
//                         } else {
//                             feedback.textContent = "⚠️ Unknown user role. Contact support.";
//                             feedback.className = "feedback-message error";
//                             setTimeout(() => window.location.href = "/login.html", 2000);
//                         }
//                     } else {
//                         feedback.textContent = `❌ ${data.message || "Google login failed."}`;
//                         feedback.className = "feedback-message error";
//                     }
//                 } catch (err) {
//                     console.error("Google login error:", err);
//                     feedback.textContent = "⚠️ Network error. Please try again.";
//                     feedback.className = "feedback-message error";
//                 } finally {
//                     if (googleLoginBtn) {
//                         googleLoginBtn.disabled = false;
//                         googleLoginBtn.classList.remove("loading");
//                     }
//                 }
//             }
//         });
//     }

//     let client = null;
//     // Disable button until Google client is ready
//     if (googleLoginBtn) googleLoginBtn.disabled = true;

//     const waitForGoogle = (attempts = 0) => {
//         if (window.google?.accounts?.oauth2?.initCodeClient) {
//             try {
//                 client = createClient();
//                 if (googleLoginBtn) {
//                     googleLoginBtn.disabled = false;
//                     googleLoginBtn.addEventListener("click", () => client.requestCode());
//                 }
//             } catch (e) {
//                 console.error('Failed to initialize Google client:', e);
//                 if (googleLoginBtn) googleLoginBtn.disabled = true;
//             }
//         } else if (attempts < 50) {
//             setTimeout(() => waitForGoogle(attempts + 1), 100);
//         } else {
//             console.warn('Google API not available after waiting.');
//             if (googleLoginBtn) googleLoginBtn.disabled = true;
//         }
//     };

//     waitForGoogle();
// });