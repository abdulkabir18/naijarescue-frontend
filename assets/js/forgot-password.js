document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("forgotPasswordForm");
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    const feedback = document.getElementById("feedback");
    const forgotBtn = document.getElementById("forgotBtn");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    emailInput.addEventListener("input", () => {
        const email = emailInput.value.trim();

        feedback.textContent = "";
        feedback.className = "feedback-message";

        if (!email) {
            emailError.textContent = "Email is required.";
            emailInput.classList.remove("valid");
            emailInput.classList.add("invalid");
            return;
        }

        if (!emailPattern.test(email)) {
            emailError.textContent = "Enter a valid email address.";
            emailInput.classList.remove("valid");
            emailInput.classList.add("invalid");
        } else {
            emailError.textContent = "";
            emailInput.classList.remove("invalid");
            emailInput.classList.add("valid");
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            emailError.textContent = "Email is required.";
            emailInput.classList.add("invalid");
            return;
        }

        if (!emailPattern.test(email)) {
            emailError.textContent = "Enter a valid email address.";
            emailInput.classList.add("invalid");
            return;
        }

        emailError.textContent = "";
        feedback.textContent = "";
        feedback.className = "feedback-message";

        forgotBtn.disabled = true;
        forgotBtn.setAttribute("aria-busy", "true");

        try {
            const response = await fetch("https://localhost:7288/api/v1/Auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();
            localStorage.setItem("EmailForForgotPassword", email);

            if (response.ok && data.succeeded) {
                feedback.textContent = "✅ Reset code sent successfully! Check your email.";
                feedback.className = "feedback-message success";

                setTimeout(() => {
                    document.body.classList.add("fade-out");
                    setTimeout(() => (window.location.href = "verify-reset.html"), 600);
                }, 1500);
            } else {
                const message = data.message || data.errors?.[0] || "Something went wrong.";
                feedback.textContent = `❌ ${message}`;
                feedback.className = "feedback-message error";
            }
        } catch (error) {
            console.error("Reset request error:", error);
            feedback.textContent = "⚠️ Network error. Please try again.";
            feedback.className = "feedback-message error";
        } finally {
            forgotBtn.disabled = false;
            forgotBtn.setAttribute("aria-busy", "false");
        }
    });
});