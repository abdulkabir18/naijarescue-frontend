const form = document.getElementById("verifyForm");
const message = document.getElementById("message");
const boxes = document.querySelectorAll(".code-box");
const hiddenCode = document.getElementById("fullCode");
const resendLink = document.getElementById("resend-link");
const countdownEl = document.getElementById("countdown");
let countdown = 30;
let countdownTimer;

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const code = hiddenCode.value.trim();

    if (!validateEmail(email)) {
        message.textContent = "❌ Please enter a valid email address.";
        message.style.color = "red";
        return;
    }

    if (code.length !== 6) {
        message.textContent = "❌ Please enter a 6-digit code.";
        message.style.color = "red";
        return;
    }

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
        if (res.ok) {
            message.textContent = "✅ Email verified! You can now log in.";
            message.style.color = "green";
        } else {
            message.textContent = "❌ " + data.error;
            message.style.color = "red";
        }
    } catch (err) {
        message.textContent = "❌ An error occurred. Please try again.";
        message.style.color = "red";
    }

    button.disabled = false;
    button.innerHTML = `Verify Email`;
});
startCountdown(); // Start when page loads

resendLink.addEventListener("click", async () => {
    if (resendLink.classList.contains("disabled")) return;

    const email = form.email.value.trim();
    if (!validateEmail(email)) {
        message.textContent = "❌ Please enter a valid email before resending.";
        message.style.color = "red";
        return;
    }

    resendLink.textContent = "Sending...";

    try {
        const res = await fetch("/api/resend-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (res.ok) {
            message.textContent = "✅ Code resent successfully.";
            message.style.color = "green";
            resetCountdown();
        } else {
            message.textContent = "❌ " + data.error;
            message.style.color = "red";
            resendLink.textContent = "Resend code";
        }
    } catch (err) {
        message.textContent = "❌ Failed to resend. Please try again.";
        message.style.color = "red";
        resendLink.textContent = "Resend code";
    }
});

function startCountdown() {
    resendLink.classList.add("disabled");
    countdown = 30;
    updateCountdownText();

    countdownTimer = setInterval(() => {
        countdown--;
        updateCountdownText();

        if (countdown <= 0) {
            clearInterval(countdownTimer);
            resendLink.textContent = "Resend code";
            resendLink.classList.remove("disabled");
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