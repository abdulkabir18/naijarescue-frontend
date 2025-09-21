// document.addEventListener("DOMContentLoaded", () => {
//     const loginForm = document.getElementById("loginForm");

//     loginForm.addEventListener("submit", function (e) {
//         e.preventDefault();

//         const email = document.getElementById("email").value.trim();
//         const password = document.getElementById("password").value.trim();

//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//         let isInputValid = true;

//         if (!emailRegex.test(email)) {
//             showEmailError();
//             isInputValid = false;
//         }

//         if (!password || password.length < 6) {
//             showPasswordError();
//             isInputValid = false;
//         }

//         if (isInputValid) {
//             alert("Form is valid. Proceeding with submission...");
//         }
//     });
// });

// async function showEmailError() {
//     document.getElementById("emailError").textContent = "Invalid input.";
// }

// async function showPasswordError() {
//     document.getElementById("passwordError").textContent = "Password is required";
// }

// document.addEventListener("DOMContentLoaded", () => {
//     const loginForm = document.getElementById("loginForm");
//     const emailInput = document.getElementById("email");
//     const passwordInput = document.getElementById("password");
//     const emailError = document.getElementById("emailError");
//     const passwordError = document.getElementById("passwordError");
//     const togglePassword = document.getElementById("togglePassword");

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     // Real-time email validation
//     emailInput.addEventListener("input", () => {
//         if (!emailInput.value.trim()) {
//             emailError.textContent = "Email is required.";
//         } else if (!emailRegex.test(emailInput.value.trim())) {
//             emailError.textContent = "Please enter a valid email address.";
//         } else {
//             emailError.textContent = "";
//         }
//     });

//     // Real-time password validation
//     passwordInput.addEventListener("input", () => {
//         if (!passwordInput.value.trim()) {
//             passwordError.textContent = "Your password cannot be empty.";
//         } else if (passwordInput.value.trim().length < 6) {
//             passwordError.textContent = "Password must be at least 6 characters.";
//         } else {
//             passwordError.textContent = "";
//         }
//     });

//     // Form submit validation
//     loginForm.addEventListener("submit", (e) => {
//         e.preventDefault();

//         let isValid = true;

//         if (!emailRegex.test(emailInput.value.trim())) {
//             emailError.textContent = "Please enter a valid email.";
//             isValid = false;
//         }

//         if (!passwordInput.value.trim()) {
//             passwordError.textContent = "Password is required.";
//             isValid = false;
//         }

//         if (isValid) {
//             alert("Form is valid ✅ Redirecting...");
//             loginForm.submit();
//         }
//     });

//     // 👁 Toggle password visibility
//     togglePassword.addEventListener("click", () => {
//         if (passwordInput.type === "password") {
//             passwordInput.type = "text";
//             togglePassword.textContent = "🔒";
//         } else {
//             passwordInput.type = "password";
//             togglePassword.textContent = "👁";
//         }
//     });
// });


document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const togglePassword = document.getElementById("togglePassword");
    const loginBtn = document.getElementById("loginBtn");

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

    togglePassword.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        togglePassword.textContent = type === "password" ? "👁" : "🙈";
    });

    emailInput.addEventListener("input", validateEmail);
    passwordInput.addEventListener("input", validatePassword);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (isEmailValid && isPasswordValid) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = `
            <div class="spinner"></div>
            <span>Logging in...</span>
        `;

            try {
                await new Promise(resolve => setTimeout(resolve, 2000));

                console.log("Form valid. Ready to connect backend.");
            } catch (error) {
                console.error("Error logging in:", error);
            } finally {
                loginBtn.disabled = false;
                loginBtn.innerHTML = "Login";
            }
        }
    });

});

async function submitLoginForm(data) {

}