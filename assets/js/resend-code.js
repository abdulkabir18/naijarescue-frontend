// const resendBtn = document.getElementById("resendCodeBtn");
// const resendFeedback = document.getElementById("resendFeedback");

// resendBtn.addEventListener("click", async () => {
//     const email = localStorage.getItem("EmailForForgotPassword");
//     if (!email) {
//         resendFeedback.textContent = "Email not found. Please restart the reset process.";
//         resendFeedback.className = "feedback-message error";
//         return;
//     }

//     resendBtn.disabled = true;
//     resendFeedback.textContent = "Sending verification code...";
//     resendFeedback.className = "feedback-message info";

//     try {
//         const response = await fetch("https://localhost:7288/api/v1/Auth/resend-verification-code", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ email })
//         });

//         const data = await response.json();

//         if (response.ok && (data.succeeded || data.success)) {
//             resendFeedback.textContent = "✅ Verification code resent! Check your email.";
//             resendFeedback.className = "feedback-message success";
//         } else {
//             resendFeedback.textContent = `❌ ${data.message || "Failed to resend code."}`;
//             resendFeedback.className = "feedback-message error";
//         }
//     } catch {
//         resendFeedback.textContent = "⚠️ Network error. Please try again.";
//         resendFeedback.className = "feedback-message error";
//     }

//     let cooldown = 60;
//     const interval = setInterval(() => {
//         resendBtn.textContent = `Resend Code (${cooldown--}s)`;
//         if (cooldown < 0) {
//             clearInterval(interval);
//             resendBtn.textContent = "Resend Code";
//             resendBtn.disabled = false;
//         }
//     }, 1000);
// });

const resendBtn = document.getElementById("resendCodeBtn");
const resendFeedback = document.getElementById("resendFeedback");

resendBtn.addEventListener("click", async () => {
    const email =
        localStorage.getItem("EmailForForgotPassword") ||
        localStorage.getItem("EmailForVerification");

    if (!email) {
        resendFeedback.textContent = "Email not found. Please re-enter your email.";
        resendFeedback.className = "feedback-message error";
        return;
    }

    resendBtn.disabled = true;
    resendFeedback.textContent = "Sending verification code...";
    resendFeedback.className = "feedback-message info";

    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/resend-verification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok && data.succeeded) {
            resendFeedback.textContent = "✅ Verification code resent! Check your email.";
            resendFeedback.className = "feedback-message success";
        } else {
            resendFeedback.textContent = `❌ ${data.message || "Failed to resend code."}`;
            resendFeedback.className = "feedback-message error";
        }
    } catch {
        resendFeedback.textContent = "⚠️ Network error. Please try again.";
        resendFeedback.className = "feedback-message error";
    }

    let cooldown = 600;
    const interval = setInterval(() => {
        resendBtn.textContent = `Resend Code (${cooldown--}s)`;
        if (cooldown < 0) {
            clearInterval(interval);
            resendBtn.textContent = "Resend Code";
            resendBtn.disabled = false;
        }
    }, 1000);
});
