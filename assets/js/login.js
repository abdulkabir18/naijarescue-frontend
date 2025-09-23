// document.addEventListener("DOMContentLoaded", () => {
//     const form = document.getElementById("loginForm");
//     const emailInput = document.getElementById("email");
//     const passwordInput = document.getElementById("password");
//     const emailError = document.getElementById("emailError");
//     const passwordError = document.getElementById("passwordError");
//     const togglePassword = document.getElementById("togglePassword");
//     const loginBtn = document.getElementById("loginBtn");

//     const messages = {
//         email: {
//             required: "Please enter your email address.",
//             invalid: "That doesn't look like a valid email."
//         },
//         password: {
//             required: "Please enter your password.",
//             short: "Password must be at least 6 characters long."
//         }
//     };

//     function validateEmail() {
//         const value = emailInput.value.trim();
//         if (!value) {
//             emailError.textContent = messages.email.required;
//             return false;
//         } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
//             emailError.textContent = messages.email.invalid;
//             return false;
//         }
//         emailError.textContent = "";
//         return true;
//     }

//     function validatePassword() {
//         const value = passwordInput.value.trim();
//         if (!value) {
//             passwordError.textContent = messages.password.required;
//             return false;
//         } else if (value.length < 6) {
//             passwordError.textContent = messages.password.short;
//             return false;
//         }
//         passwordError.textContent = "";
//         return true;
//     }

//     togglePassword.addEventListener("click", () => {
//         const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
//         passwordInput.setAttribute("type", type);
//         togglePassword.textContent = type === "password" ? "👁" : "🔒";
//     });

//     emailInput.addEventListener("input", validateEmail);
//     passwordInput.addEventListener("input", validatePassword);

//     form.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         const isEmailValid = validateEmail();
//         const isPasswordValid = validatePassword();

//         if (isEmailValid && isPasswordValid) {
//             loginBtn.disabled = true;
//             loginBtn.innerHTML = `
//             <div class="spinner"></div>
//             <span>Logging in...</span>
//         `;
//             const emailValue = emailInput.value.trim();
//             const passwordValue = passwordInput.value.trim();
//             console.log(emailValue);

//             try {
//                 submitLoginForm({
//                     "email": emailValue,
//                     "password": passwordValue
//                 });
//             } catch (error) {
//                 console.error("Error logging in:", error);
//             } finally {
//                 loginBtn.disabled = false;
//                 loginBtn.innerHTML = "Login";
//             }
//         }
//     });

// });

// async function submitLoginForm(data) {
//     const loginBtn = document.getElementById("loginBtn");
//     const feedback = document.getElementById("feedback");

//     try {
//         // show spinner
//         loginBtn.disabled = true;
//         loginBtn.innerHTML = `<div class="spinner"></div> Logging in...`;

//         const response = await fetch("https://localhost:7107/api/v1/Auth/login", {
//             method: "POST",
//             headers: {
//                 'Content-Type': 'application/json',
//                 'accept': 'application/json'
//             },
//             body: JSON.stringify({ model: data })
//         });

//         const result = await response.json();
//         console.log("Response:", result);

//         if (!response.ok || !result.succeeded) {
//             // show backend error
//             feedback.textContent = result.message || "Invalid email or password.";
//             feedback.className = "feedback-message error";
//             feedback.style.display = "block";
//             loginBtn.disabled = false;
//             loginBtn.innerHTML = "Login";
//             return;
//         }

//         // success 🎉
//         feedback.textContent = "✅ Welcome back! Redirecting...";
//         feedback.className = "feedback-message success";
//         feedback.style.display = "block";

//         localStorage.setItem("authToken", result.data.token);

//         window.location.href = "/index.html";
//         // setTimeout(() => {
//         // }, 1500);

//     } catch (error) {
//         console.error("Error submitting login form:", error);
//         feedback.textContent = "⚠️ Something went wrong. Please check your connection.";
//         feedback.className = "feedback-message error";
//         feedback.style.display = "block";
//         loginBtn.disabled = false;
//         loginBtn.innerHTML = "Login";
//     }
// }

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const togglePassword = document.getElementById("togglePassword");

    const loginBtn = document.getElementById("loginBtn");
    const btnText = loginBtn.querySelector(".btn-text");
    const spinner = loginBtn.querySelector(".spinner");
    const feedback = document.getElementById("feedback");

    const messages = {
        email: {
            required: "Please enter your email address.",
            invalid: "That doesn't look like a valid email."
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

    function clearFeedback() {
        if (!feedback) return;
        feedback.textContent = "";
        feedback.className = "feedback-message";
        feedback.style.display = "none";
    }

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

    // show/hide password
    togglePassword.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        togglePassword.textContent = type === "password" ? "👁" : "🔒";
    });

    emailInput.addEventListener("input", () => {
        validateEmail();
        clearFeedback();
    });
    passwordInput.addEventListener("input", () => {
        validatePassword();
        clearFeedback();
    });

    // centralized function that performs fetch and returns parsed result
    async function submitLoginFormToBackend(payload) {
        const url = "https://localhost:7107/api/v1/Auth/login"; // change if needed
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ model: payload })
        });

        const text = await response.text();
        // try to parse JSON safely
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

        // set loading state
        loginBtn.disabled = true;
        loginBtn.classList.add("loading");
        loginBtn.setAttribute("aria-busy", "true");

        const payload = {
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        };

        try {
            const { response, json } = await submitLoginFormToBackend(payload);

            if (response.ok) {
                // ✅ Success
                if (json?.succeeded) {
                    showFeedback("✅ Welcome back! Redirecting...", "success");
                    if (json.data?.token) {
                        localStorage.setItem("authToken", json.data.token);
                    }
                    setTimeout(() => window.location.href = "/dashboard.html", 1000);
                    return;
                } else {
                    showFeedback(json?.message || "Login failed. Try again.", "error");
                }
            } else {
                // ❌ Handle 400, 401, etc
                showFeedback(json?.message || `Error ${response.status}`, "error");
            }
        } catch (err) {
            console.error("Network/backend error:", err);
            showFeedback("⚠️ Network issue. Please try again.", "error");
        } finally {
            // reset button ONLY if not redirecting
            loginBtn.disabled = false;
            loginBtn.classList.remove("loading");
            loginBtn.setAttribute("aria-busy", "false");
        }
    });


    // form.addEventListener("submit", async (e) => {
    //     e.preventDefault();
    //     clearFeedback();

    //     const isEmailValid = validateEmail();
    //     const isPasswordValid = validatePassword();

    //     if (!isEmailValid || !isPasswordValid) {
    //         showFeedback("Please fix the highlighted fields and try again.", "error");
    //         return;
    //     }

    //     // set loading state (CSS-driven)
    //     loginBtn.disabled = true;
    //     loginBtn.classList.add("loading");
    //     loginBtn.setAttribute("aria-busy", "true");
    //     loginBtn.setAttribute("aria-disabled", "true");

    //     const payload = {
    //         email: emailInput.value.trim(),
    //         password: passwordInput.value.trim()
    //     };

    //     try {
    //         const { response, json } = await submitLoginFormToBackend(payload);

    //         // Backend returns JSON like: { succeeded: false, message: "...", data: null }
    //         if (!response.ok) {
    //             // If server returned JSON error message, show it
    //             const message = json && json.message ? json.message : `Server returned ${response.status}`;
    //             showFeedback(message, "error");
    //             // optionally set specific field errors (e.g., wrong creds)
    //         } else {
    //             // response.ok (200). Check succeeded flag if backend uses it
    //             if (json && json.succeeded === false) {
    //                 showFeedback(json.message || "Invalid email or password.", "error");
    //             } else {
    //                 // success
    //                 showFeedback("✅ Welcome back! Redirecting...", "success");
    //                 if (json && json.data && json.data.token) {
    //                     localStorage.setItem("authToken", json.data.token);
    //                 }
    //                 // small delay so user sees message
    //                 setTimeout(() => window.location.href = "/dashboard.html", 900);
    //                 return; // don't re-enable button — redirecting
    //             }
    //         }
    //     } catch (err) {
    //         console.error("Network/backend error:", err);
    //         showFeedback("⚠️ Something went wrong. Check your network and try again.", "error");
    //     } finally {
    //         // ensure we reset loading state if we are not redirecting
    //         loginBtn.disabled = false;
    //         loginBtn.classList.remove("loading");
    //         loginBtn.setAttribute("aria-busy", "false");
    //         loginBtn.setAttribute("aria-disabled", "false");
    //     }
    // });
});
