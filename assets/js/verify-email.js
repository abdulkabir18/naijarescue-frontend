document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("verifyForm");
    const emailInput = document.getElementById("email");
    const userEmailDisplay = document.getElementById("userEmailDisplay");
    const codeBoxes = document.querySelectorAll(".code-box");
    const verifyBtn = document.getElementById("verifyBtn");
    const feedback = document.getElementById("feedback");

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `feedback-message ${type}`;
    }

    function toggleLoading(isLoading) {
        verifyBtn.disabled = isLoading;
        verifyBtn.classList.toggle("loading", isLoading);
        verifyBtn.setAttribute("aria-busy", isLoading ? "true" : "false");
    }

    function setupEventListeners() {
        codeBoxes.forEach((box, index) => {
            box.addEventListener("input", (e) => {
                e.target.value = e.target.value.replace(/\D/g, "");

                if (box.value.length === 1 && index < codeBoxes.length - 1) {
                    codeBoxes[index + 1].focus();
                }

                if (index === codeBoxes.length - 1 && box.value.length === 1) {
                    form.requestSubmit(verifyBtn);
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
                        if (codeBoxes[i]) {
                            codeBoxes[i].value = char;
                        }
                    });
                    form.requestSubmit(verifyBtn);
                }
            });
        });

        form.addEventListener("submit", handleFormSubmit);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        showFeedback("", "");

        const email = emailInput.value.trim();
        const code = Array.from(codeBoxes).map(b => b.value).join("");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return showFeedback("A valid email is required for verification.", "error");
        }
        if (code.length !== 6) {
            return showFeedback("Please enter the complete 6-digit code.", "error");
        }

        toggleLoading(true);

        try {
            const payload = {
                email: email,
                code: code
            };

            const res = await fetch("https://localhost:7288/api/v1/Auth/verify-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ model: payload })
            });

            const data = await res.json();

            if (res.ok && data.succeeded) {
                showFeedback("✅ Email verified successfully! Redirecting to login...", "success");
                localStorage.removeItem("EmailForVerification");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                showFeedback(`❌ ${data.message || "Verification failed. Please check the code and try again."}`, "error");
                toggleLoading(false);
            }
        } catch (error) {
            console.error("Verification error:", error);
            showFeedback("❌ Network error. Please check your connection and try again.", "error");
            toggleLoading(false);
        }
    }

    function initialize() {
        const storedEmail = localStorage.getItem("EmailForVerification");
        if (storedEmail) {
            emailInput.value = storedEmail;
            userEmailDisplay.textContent = storedEmail;
        } else {
            userEmailDisplay.textContent = "your email";
            showFeedback("Could not find an email to verify. Please start from the signup or login page.", "error");
        }

        localStorage.setItem("EmailForVerification", storedEmail);

        if (codeBoxes.length > 0) {
            codeBoxes[0].focus();
        }

        setupEventListeners();
    }

    initialize();
});
