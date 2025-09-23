// document.addEventListener("DOMContentLoaded", () => {
//     const form = document.getElementById("signupForm");

//     // All fields
//     const fields = {
//         firstName: document.getElementById("firstName"),
//         lastName: document.getElementById("lastName"),
//         userName: document.getElementById("userName"),
//         gender: document.getElementById("gender"),
//         email: document.getElementById("email"),
//         phone: document.getElementById("phone"),
//         password: document.getElementById("password"),
//         confirmPassword: document.getElementById("confirmPassword"),
//         street: document.getElementById("street"),
//         city: document.getElementById("city"),
//         lga: document.getElementById("lga"),
//         state: document.getElementById("state"),
//         postalCode: document.getElementById("postalCode"),
//     };

//     // Validation rules
//     const validators = {
//         firstName: value => value.trim() !== "" || "First name is required",
//         lastName: value => value.trim() !== "" || "Last name is required",
//         userName: value => value.length >= 3 || "Username must be at least 3 characters",
//         gender: value => value !== "" || "Select a gender",
//         email: value => /\S+@\S+\.\S+/.test(value) || "Invalid email",
//         phone: value => /^[0-9]{10,}$/.test(value) || "Enter a valid phone number",
//         password: value => value.length >= 6 || "Password must be at least 6 characters",
//         confirmPassword: value => value === fields.password.value || "Passwords do not match",
//         street: value => value.trim() !== "" || "Street is required",
//         city: value => value !== "" || "Select a city",
//         lga: value => value !== "" || "Select an LGA",
//         state: value => value !== "" || "Select a state",
//         postalCode: value => /^[0-9]+$/.test(value) || "Enter a valid postal code",
//     };

//     // Show error
//     function showError(field, message) {
//         const errorEl = document.getElementById(field.id + "Error");
//         if (errorEl) {
//             errorEl.textContent = message;
//         }
//         field.classList.add("invalid");
//     }

//     // Clear error
//     function clearError(field) {
//         const errorEl = document.getElementById(field.id + "Error");
//         if (errorEl) {
//             errorEl.textContent = "";
//         }
//         field.classList.remove("invalid");
//     }

//     // Attach live validation
//     Object.keys(fields).forEach(key => {
//         const field = fields[key];
//         if (validators[key]) {
//             field.addEventListener("input", () => {
//                 const valid = validators[key](field.value);
//                 if (valid === true) {
//                     clearError(field);
//                 } else {
//                     showError(field, valid);
//                 }
//             });
//         }
//     });

//     // On form submit
//     form.addEventListener("submit", e => {
//         e.preventDefault();
//         let isValid = true;

//         Object.keys(fields).forEach(key => {
//             const field = fields[key];
//             if (validators[key]) {
//                 const valid = validators[key](field.value);
//                 if (valid === true) {
//                     clearError(field);
//                 } else {
//                     showError(field, valid);
//                     isValid = false;
//                 }
//             }
//         });

//         if (isValid) {
//             document.getElementById("feedback").className = "feedback-message success";
//             document.getElementById("feedback").textContent = "Form looks good! Submitting...";
//             // 👉 here we’ll later call backend API
//         } else {
//             document.getElementById("feedback").className = "feedback-message error";
//             document.getElementById("feedback").textContent = "Please fix the errors above.";
//         }
//     });
// });

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const signupBtn = document.getElementById("signupBtn");
    const feedbackEl = document.getElementById("feedback");

    // Elements map
    const elems = {
        firstName: document.getElementById("firstName"),
        lastName: document.getElementById("lastName"),
        userName: document.getElementById("userName"),
        gender: document.getElementById("gender"),
        email: document.getElementById("email"),
        phone: document.getElementById("phone"),
        password: document.getElementById("password"),
        confirmPassword: document.getElementById("confirmPassword"),
        street: document.getElementById("street"),
        city: document.getElementById("city"),
        lga: document.getElementById("lga"),
        state: document.getElementById("state"),
        postalCode: document.getElementById("postalCode"),
        profilePicture: document.getElementById("profilePicture")
    };

    // Helpers to show/clear field errors (error span id: <fieldId>Error)
    function showFieldError(fieldId, message) {
        const err = document.getElementById(fieldId + "Error");
        if (err) err.textContent = message;
        const el = elems[fieldId];
        if (el) el.classList.add("invalid");
    }

    function clearFieldError(fieldId) {
        const err = document.getElementById(fieldId + "Error");
        if (err) err.textContent = "";
        const el = elems[fieldId];
        if (el) el.classList.remove("invalid");
    }

    // Basic validators: return true if valid, or an error string when invalid
    const validators = {
        firstName: v => v.trim() !== "" || "First name is required.",
        lastName: v => v.trim() !== "" || "Last name is required.",
        userName: v => (v.trim() === "" || v.trim().length >= 3) || "Username must be at least 3 characters (or leave empty).",
        gender: v => v !== "" || "Please select a gender.",
        email: v => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || "Please enter a valid email address.",
        phone: v => (/^\+?\d{10,15}$/.test(v.replace(/\s+/g, ""))) || "Enter a valid phone (10–15 digits).",
        password: v => (v.length >= 6) || "Password must be at least 6 characters.",
        confirmPassword: v => (v === elems.password.value) || "Passwords do not match.",
        street: v => v.trim() !== "" || "Street is required.",
        city: v => v !== "" || "Select a city.",
        lga: v => v !== "" || "Select an LGA.",
        state: v => v !== "" || "Select a state.",
        postalCode: v => (v.trim() !== "") || "Postal code is required."
        // profilePicture is optional
    };

    // Validate a single field by key
    function validateField(key) {
        const el = elems[key];
        if (!el || !validators[key]) return true; // nothing to validate
        const value = (el.tagName === "SELECT") ? el.value : el.value.trim();
        const res = validators[key](value);
        if (res === true) {
            clearFieldError(key);
            return true;
        } else {
            showFieldError(key, res);
            return false;
        }
    }

    // Attach live validation listeners
    Object.keys(elems).forEach(key => {
        const el = elems[key];
        if (!el) return;
        const eventType = el.tagName === "SELECT" || el.type === "file" ? "change" : "input";
        el.addEventListener(eventType, () => {
            validateField(key);
            // hide global feedback when user starts editing
            if (feedbackEl) {
                feedbackEl.textContent = "";
                feedbackEl.className = "feedback-message";
                feedbackEl.style.display = "none";
            }
        });
    });

    // Password toggle (works for both password & confirmPassword)
    const toggles = document.querySelectorAll(".toggle-password");
    toggles.forEach(btn => {
        btn.addEventListener("click", (ev) => {
            ev.preventDefault();
            const wrapper = btn.closest(".password-wrapper") || btn.parentElement;
            if (!wrapper) return;
            const input = wrapper.querySelector("input[type='password'], input[type='text']");
            if (!input) return;

            const isPwd = input.getAttribute("type") === "password";
            input.setAttribute("type", isPwd ? "text" : "password");

            // Toggle icon/text for affordance (adjust to preferred glyphs)
            btn.textContent = isPwd ? "🙈" : "👁";
            btn.setAttribute("aria-pressed", isPwd ? "true" : "false");
        });
    });

    // Validate all fields at once
    function validateAll() {
        let ok = true;
        Object.keys(validators).forEach(key => {
            const valid = validateField(key);
            if (!valid) ok = false;
        });
        return ok;
    }

    // Small util to show feedback area
    function showFeedback(message, type = "error") {
        if (!feedbackEl) return;
        feedbackEl.textContent = message;
        feedbackEl.className = "feedback-message " + (type === "success" ? "success" : "error");
        feedbackEl.style.display = "block";
    }

    // Form submit handler (currently does client validation + placeholder for API)
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // clear global feedback
        if (feedbackEl) {
            feedbackEl.textContent = "";
            feedbackEl.className = "feedback-message";
            feedbackEl.style.display = "none";
        }

        // Run validation
        const ok = validateAll();
        if (!ok) {
            showFeedback("Please fix the highlighted fields and try again.", "error");
            return;
        }

        // Prepare FormData (match backend expectation: Model.* if needed)
        const fd = new FormData();
        fd.append("Model.FirstName", elems.firstName.value.trim());
        fd.append("Model.LastName", elems.lastName.value.trim());
        fd.append("Model.UserName", elems.userName.value.trim() || "");
        fd.append("Model.Gender", elems.gender.value);
        fd.append("Model.Email", elems.email.value.trim());
        fd.append("Model.PhoneNumber", elems.phone.value.trim());
        fd.append("Model.Password", elems.password.value);
        fd.append("Model.ConfirmPassword", elems.confirmPassword.value);
        fd.append("Model.Address.Street", elems.street.value.trim());
        fd.append("Model.Address.City", elems.city.value || "");
        fd.append("Model.Address.LGA", elems.lga.value || "");
        fd.append("Model.Address.State", elems.state.value || "");
        fd.append("Model.Address.Country", elems.country ? elems.country.value : "Nigeria");
        fd.append("Model.Address.PostalCode", elems.postalCode.value.trim());

        if (elems.profilePicture && elems.profilePicture.files && elems.profilePicture.files[0]) {
            fd.append("Model.ProfilePicture", elems.profilePicture.files[0]);
        }

        // UI: show loading on button
        signupBtn.disabled = true;
        signupBtn.classList.add("loading");
        signupBtn.setAttribute("aria-busy", "true");

        try {
            // Replace URL with your real signup endpoint
            const res = await fetch("https://localhost:7107/api/v1/Auth/signup", {
                method: "POST",
                body: fd
            });

            // parse body safely
            const text = await res.text();
            let json = null;
            try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }

            if (!res.ok) {
                const msg = (json && json.message) ? json.message : `Server error ${res.status}`;
                showFeedback(msg, "error");
            } else {
                // success according to your API (succeeded true)
                if (json && json.succeeded === true) {
                    showFeedback("✅ Signup successful! Redirecting to login...", "success");
                    // small delay to let user read the message
                    setTimeout(() => window.location.href = "login.html", 900);
                    return; // keep button disabled while redirecting
                } else {
                    // server responded 200 but flagged error in payload
                    const msg = (json && json.message) ? json.message : "Signup failed. Please try again.";
                    showFeedback(msg, "error");
                }
            }
        } catch (err) {
            console.error("Signup error:", err);
            showFeedback("Network error. Check your connection and try again.", "error");
        } finally {
            // Re-enable button if not redirecting
            signupBtn.disabled = false;
            signupBtn.classList.remove("loading");
            signupBtn.setAttribute("aria-busy", "false");
        }
    });
});
