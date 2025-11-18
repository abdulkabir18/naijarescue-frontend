document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const passwordToggles = document.querySelectorAll(".toggle-password");

    const loginBtn = document.getElementById("loginBtn");
    const feedback = document.getElementById("feedback");

    const messages = {
        email: {
            required: "Please enter your email address.",
            invalid: "That doesn't look like a valid email format."
        },
        password: {
            required: "Please enter your password.",
            short: "Password must be at least 6 characters long."
        }
    };

    function showFeedback(text, type = "error") {
        if (!feedback) return;
        feedback.textContent = text;
        feedback.className = `feedback-message ${type}`;
        feedback.style.display = "block";
    }

    const clearFeedback = () => {
        if (!feedback) return;
        feedback.style.opacity = "0";
        setTimeout(() => {
            feedback.textContent = "";
            feedback.className = "feedback-message";
            feedback.style.display = "none";
            feedback.style.opacity = "1";
        }, 200);
    };

    function validateEmail() {
        const value = emailInput.value.trim();
        if (!value) {
            emailError.textContent = messages.email.required;
            return false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            emailError.textContent = messages.email.invalid;
            return false;
        }
        emailError.textContent = "";
        return true;
    }

    function validatePassword() {
        const value = passwordInput.value.trim();
        if (!value) {
            passwordError.textContent = messages.password.required;
            return false;
        } else if (value.length < 6) {
            passwordError.textContent = messages.password.short;
            return false;
        }
        passwordError.textContent = "";
        return true;
    }

    passwordToggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.dataset.target;
            const input = document.getElementById(targetId);
            const icon = toggle.querySelector("i");

            if (input) {
                if (input.type === "password") {
                    input.type = "text";
                    icon.className = "ri-eye-off-line";
                } else {
                    input.type = "password";
                    icon.className = "ri-eye-line";
                }
            }
        });
    });

    emailInput.addEventListener("input", () => {
        validateEmail();
        clearFeedback();
    });
    passwordInput.addEventListener("input", () => {
        validatePassword();
        clearFeedback();
    });

    passwordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") form.dispatchEvent(new Event("submit"));
    });

    async function submitLogin(payload) {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ model: payload })
        });

        const text = await response.text();
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch (err) { json = null; }

        return { response, json };
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearFeedback();

        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            showFeedback("Please fix the highlighted fields and try again.", "error");
            return;
        }

        loginBtn.disabled = true;
        loginBtn.classList.add("loading");

        const payload = {
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        };

        try {
            const { response, json } = await submitLogin(payload);

            if (response.ok) {
                if (json?.succeeded) {
                    if (json.data.isEmailVerified === false) {
                        localStorage.setItem("EmailForVerification", payload.email);
                        showFeedback(json?.message || "Email not verified. Redirecting...", "error");
                        setTimeout(() => window.location.href = "/verify-email.html", 5000);
                        return;
                    }
                    showFeedback("✅ Welcome back! Redirecting...", "success");

                    sessionStorage.setItem("authToken", json.data.token);
                    const role = getRole(json.data.token);

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
                        showFeedback("⚠️ Unknown user role. Contact support.", "error");
                        window.location.href = "/login.html";
                        return;
                    }
                } else {
                    showFeedback(json?.message || "Login failed. Try again.", "error");
                }
            } else {
                showFeedback(json?.message || `Error ${response.status}`, "error");
            }
        } catch (err) {
            console.error("Network/backend error:", err);
            showFeedback("⚠️ Network issue. Please try again.", "error");
        } finally {
            loginBtn.disabled = false;
            loginBtn.classList.remove("loading");
        }
    });
});