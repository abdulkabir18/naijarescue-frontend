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
        togglePassword.textContent = type === "password" ? "👁" : "🔒";
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
            const emailValue = emailInput.value.trim();
            const passwordValue = passwordInput.value.trim();
            console.log(emailValue);

            try {
                submitLoginForm({
                    "email": emailValue,
                    "password": passwordValue
                });

                // await new Promise(resolve => setTimeout(resolve, 2000));
                // alert("Login successful!");
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
    try {
        console.log(data);
        const response = await fetch("https://localhost:7107/api/v1/Auth/login", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        console.log(response);
    }
    catch (error) {
        console.error("Error submitting login form:", error);
    }
}