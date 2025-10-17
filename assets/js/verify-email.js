const form = document.getElementById("verifyForm");
const message = document.getElementById("message");
const boxes = document.querySelectorAll(".code-box");
const hiddenCode = document.getElementById("fullCode");
const resendLink = document.getElementById("resend-link");
const countdownEl = document.getElementById("countdown");
const countdownWrapper = document.getElementById("countdown-wrapper");

let countdown = 60;
let countdownTimer;

boxes.forEach((box, index) => {
    box.addEventListener("input", () => {
        if (box.value.length === 1 && index < boxes.length - 1) {
            boxes[index + 1].focus();
        }
        updateHiddenCode();
    });

    box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value && index > 0) {
            boxes[index - 1].focus();
        }
    });
});

function updateHiddenCode() {
    hiddenCode.value = Array.from(boxes).map(b => b.value).join("");
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const code = hiddenCode.value.trim();

    if (!validateEmail(email)) return showMessage("❌ Please enter a valid email address.", "red");
    if (code.length !== 6) return showMessage("❌ Please enter a 6-digit code.", "red");

    const button = form.querySelector("button");
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Verifying...`;

    try {
        const res = await fetch('/api/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });
        const data = await res.json();
        if (res.ok) showMessage("✅ Email verified! You can now log in.", "green");
        else showMessage("❌ " + data.error, "red");
    } catch {
        showMessage("❌ An error occurred. Please try again.", "red");
    }

    button.disabled = false;
    button.innerHTML = "Verify Email";
});

resendLink.addEventListener("click", async () => {
    if (resendLink.classList.contains("disabled")) return;

    const email = form.email.value.trim();
    if (!validateEmail(email)) return showMessage("❌ Please enter a valid email before resending.", "red");

    resendLink.textContent = "Sending...";

    try {
        const res = await fetch("/api/resend-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            showMessage("✅ Code resent successfully.", "green");
            resetCountdown();
        } else {
            showMessage("❌ " + data.error, "red");
            resendLink.textContent = "Resend code";
        }
    } catch {
        showMessage("❌ Failed to resend. Please try again.", "red");
        resendLink.textContent = "Resend code";
    }
});

function startCountdown() {
    resendLink.classList.add("disabled");
    countdownWrapper.style.display = "inline";
    countdown = 60;
    updateCountdownText();

    countdownTimer = setInterval(() => {
        countdown--;
        updateCountdownText();
        if (countdown <= 0) {
            clearInterval(countdownTimer);
            resendLink.textContent = "Resend code";
            resendLink.classList.remove("disabled");
            countdownWrapper.style.display = "none";
        }
    }, 1000);
}

function resetCountdown() {
    clearInterval(countdownTimer);
    startCountdown();
}

function updateCountdownText() {
    countdownEl.textContent = countdown;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function showMessage(msg, color) {
    message.textContent = msg;
    message.style.color = color;
}