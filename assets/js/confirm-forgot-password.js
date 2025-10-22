document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("confirmResetForm");
    const emailInput = document.getElementById("email");
    const codeBoxes = document.querySelectorAll(".code-box");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const resetBtn = document.getElementById("resetBtn");
    const feedback = document.getElementById("feedback");
    const formError = document.getElementById("formError");

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `feedback-message ${type}`;
    }

    function toggleLoading(isLoading) {
        resetBtn.disabled = isLoading;
        resetBtn.setAttribute("aria-busy", isLoading);
    }

    function setupEventListeners() {
        const passwordError = document.createElement("small");
        passwordError.className = "error-message";
        newPasswordInput.closest('.form-group').appendChild(passwordError);

        const confirmError = document.createElement("small");
        confirmError.className = "error-message";
        confirmPasswordInput.closest('.form-group').appendChild(confirmError);

        newPasswordInput.addEventListener("input", () => {
            const pass = newPasswordInput.value;
            const strong = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
            passwordError.textContent = pass && !strong.test(pass)
                ? "8+ chars, with a number & uppercase letter."
                : "";
        });

        confirmPasswordInput.addEventListener("input", () => {
            confirmError.textContent =
                confirmPasswordInput.value && newPasswordInput.value !== confirmPasswordInput.value
                    ? "Passwords do not match."
                    : "";
        });

        document.querySelectorAll(".toggle-password").forEach(btn => {
            btn.addEventListener("click", () => {
                const wrapper = btn.closest(".password-wrapper");
                const input = wrapper.querySelector("input");
                const isPassword = input.type === "password";
                input.type = isPassword ? "text" : "password";
                btn.textContent = isPassword ? "👁" : "🔒";
            });
        });

        codeBoxes.forEach((box, index) => {
            box.addEventListener("input", (e) => {
                e.target.value = e.target.value.replace(/\D/g, "");
                if (box.value.length === 1 && index < codeBoxes.length - 1) {
                    codeBoxes[index + 1].focus();
                }
                if (index === codeBoxes.length - 1 && box.value.length === 1) {
                    form.requestSubmit(resetBtn);
                }
            });

            box.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && !box.value && index > 0) {
                    codeBoxes[index - 1].focus();
                }
            });

            box.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = e.clipboardData.getData('text').trim();
                if (/^\d{6}$/.test(pasteData)) {
                    pasteData.split('').forEach((char, i) => {
                        if (codeBoxes[i]) codeBoxes[i].value = char;
                    });
                    form.requestSubmit(resetBtn);
                }
            });
        });

        form.addEventListener("submit", handleFormSubmit);
    }

    function validateForm(email, code, newPassword, confirmPassword) {
        formError.textContent = "";
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            formError.textContent = "Please enter a valid email address.";
            return false;
        }
        if (code.length !== 6) {
            formError.textContent = "Verification code must be 6 digits.";
            return false;
        }
        if (newPassword !== confirmPassword) {
            formError.textContent = "Passwords do not match.";
            return false;
        }
        const strong = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strong.test(newPassword)) {
            formError.textContent = "Password is not strong enough.";
            return false;
        }
        return true;
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        showFeedback("", "");

        const email = emailInput.value.trim();
        const code = Array.from(codeBoxes).map(b => b.value).join("");
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!validateForm(email, code, newPassword, confirmPassword)) return;

        toggleLoading(true);

        try {
            const payload = {
                email: email,
                code: code,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            };
            const res = await fetch("https://localhost:7288/api/v1/Auth/confirm-forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({ model: payload })
            });
            const data = await res.json();

            if (res.ok && data.succeeded) {
                showFeedback("✅ Password reset successfully! Redirecting to login...", "success");
                localStorage.removeItem("EmailForForgotPassword");
                setTimeout(() => window.location.href = "login.html", 2000);
            } else {
                showFeedback(`❌ ${data.message || "Reset failed. Please check your details."}`, "error");
            }
        } catch (err) {
            console.error("Password reset error:", err);
            showFeedback("⚠️ Network error. Please check your connection and try again.", "error");
        } finally {
            toggleLoading(false);
        }
    }

    function initialize() {
        const storedEmail = localStorage.getItem("EmailForForgotPassword");
        if (storedEmail) {
            emailInput.value = storedEmail;
            emailInput.setAttribute("readonly", "true");
        } else {
            emailInput.removeAttribute("readonly");
            emailInput.placeholder = "Enter the email used to request reset";
            if (codeBoxes.length > 0) codeBoxes[0].focus();
            emailInput.focus();
        }

        if (!storedEmail) {
            showFeedback("Stored email not found. Please enter your email to continue.", "info");
        }

        setupEventListeners();
    }

    initialize();
});
