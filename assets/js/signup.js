document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const signupBtn = document.getElementById("signupBtn");
    const feedbackEl = document.getElementById("feedback");

    const elems = {
        firstName: document.getElementById("firstName"),
        lastName: document.getElementById("lastName"),
        gender: document.getElementById("gender"),
        email: document.getElementById("email"),
        password: document.getElementById("password"),
        confirmPassword: document.getElementById("confirmPassword"),
        profilePicture: document.getElementById("profilePicture"),
        profileFileName: document.getElementById("profileFileName"),
        profilePreview: document.getElementById("profilePreview")
    };

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

    const validators = {
        firstName: v => v.trim() !== "" || "First name is required.",
        lastName: v => v.trim() !== "" || "Last name is required.",
        gender: v => v !== "" || "Please select a gender.",
        email: v => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || "Please enter a valid email address.",
        password: v => (v.length >= 6) || "Password must be at least 6 characters.",
        confirmPassword: v => (v === elems.password.value) || "Passwords do not match.",
        street: v => v.trim() !== "" || "Street is required.",
    };

    function validateField(key) {
        const el = elems[key];
        if (!el || !validators[key]) return true;
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

    function handleFilePreview(file, fileNameEl, previewEl, type) {
        if (!file) {
            fileNameEl.textContent = "Choose profile picture (optional)";
            previewEl.innerHTML = "";
            previewEl.classList.remove("show");
            return;
        }

        fileNameEl.textContent = file.name;

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewEl.innerHTML = `<img src="${e.target.result}" alt="${type} preview">`;
                previewEl.classList.add("show");
            };
            reader.readAsDataURL(file);
        }
    }


    Object.keys(elems).forEach(key => {
        const el = elems[key];
        if (!el) return;
        const eventType = el.tagName === "SELECT" || el.type === "file" ? "change" : "input";
        el.addEventListener(eventType, () => {
            validateField(key);
            if (feedbackEl) {
                feedbackEl.textContent = "";
                feedbackEl.className = "feedback-message";
                feedbackEl.style.display = "none";
            }
        });
    });

    elems.profilePicture.addEventListener("change", (e) => {
        handleFilePreview(e.target.files[0], elems.profileFileName, elems.profilePreview, "profile");
    });

    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const icon = btn.querySelector("i");

            if (input) {
                if (input.type === "password") {
                    input.type = "text";
                    icon.className = "ri-eye-off-line";
                } else {
                    input.type = "password";
                    icon.className = "ri-eye-line";
                }
            }
        });
    });

    function validateAll() {
        let ok = true;
        Object.keys(validators).forEach(key => {
            const valid = validateField(key);
            if (!valid) ok = false;
        });
        return ok;
    }

    function showFeedback(message, type = "error") {
        if (!feedbackEl) return;
        feedbackEl.textContent = message;
        feedbackEl.className = "feedback-message " + (type === "success" ? "success" : "error");
        feedbackEl.style.display = "block";
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        if (feedbackEl) {
            feedbackEl.textContent = "";
            feedbackEl.className = "feedback-message";
            feedbackEl.style.display = "none";
        }

        if (!validateAll()) {
            showFeedback("Please fix the highlighted fields and try again.", "error");
            return;
        }

        const fd = new FormData();
        fd.append("Model.FirstName", elems.firstName.value.trim());
        fd.append("Model.LastName", elems.lastName.value.trim());
        fd.append("Model.Email", elems.email.value.trim());
        fd.append("Model.Gender", elems.gender.value);
        fd.append("Model.Password", elems.password.value);
        fd.append("Model.ConfirmPassword", elems.confirmPassword.value);

        if (elems.profilePicture && elems.profilePicture.files[0]) {
            fd.append("Model.ProfilePicture", elems.profilePicture.files[0]);
        }

        signupBtn.disabled = true;
        signupBtn.classList.add("loading");
        signupBtn.setAttribute("aria-busy", "true");

        try {
            const res = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/signup`, {
                method: "POST",
                body: fd
            });

            const text = await res.text();
            let json = null;
            try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }

            if (!res.ok) {
                const msg = (json && json.message) ? json.message : `Server error ${res.status}`;
                showFeedback(msg, "error");
            } else {
                if (json && json.succeeded === true) {
                    showFeedback("✅ Signup successful! Redirecting to verification page...", "success");
                    localStorage.setItem("EmailForVerification", elems.email.value.trim());
                    setTimeout(() => window.location.href = "verify-email.html", 900);
                    return;
                } else {
                    const msg = (json && json.message) ? json.message : "Signup failed. Please try again.";
                    showFeedback(msg, "error");
                }
            }
        } catch (err) {
            console.error("Signup error:", err);
            showFeedback("Network error. Check your connection and try again.", "error");
        } finally {
            signupBtn.disabled = false;
            signupBtn.classList.remove("loading");
            signupBtn.setAttribute("aria-busy", "false");
        }
    });
});

    // async function fetchStates() {
    //     try {
    //         const res = await fetch("http://localhost:5084/api/v1/NigeriaData/states");
    //         if (!res.ok) throw new Error(`Error ${res.status}`);
    //         const states = await res.json();
    //         const stateSelect = elems.state;
    //         stateSelect.innerHTML = '<option value="">Select State...</option>';
    //         states.forEach(s => {
    //             const opt = document.createElement("option");
    //             opt.value = s;
    //             opt.textContent = s;
    //             stateSelect.appendChild(opt);
    //         });
    //         elems.city.innerHTML = '<option value="">Select City...</option>';
    //         elems.lga.innerHTML = '<option value="">Select LGA...</option>';
    //     } catch (err) {
    //         console.error("Failed to load states:", err);
    //     }
    // }

    // async function fetchCities(state) {
    //     try {
    //         const res = await fetch(`http://localhost:5084/api/v1/NigeriaData/cities/${state}`);
    //         if (!res.ok) throw new Error(`Error ${res.status}`);
    //         const cities = await res.json();
    //         const citySelect = elems.city;
    //         citySelect.innerHTML = '<option value="">Select City...</option>';
    //         cities.forEach(c => {
    //             const opt = document.createElement("option");
    //             opt.value = c;
    //             opt.textContent = c;
    //             citySelect.appendChild(opt);
    //         });
    //         elems.lga.innerHTML = '<option value="">Select LGA...</option>';
    //     } catch (err) {
    //         console.error("Failed to load cities:", err);
    //     }
    // }

    // async function fetchLgas(state) {
    //     try {
    //         const res = await fetch(`http://localhost:5084/api/v1/NigeriaData/lgas/${state}`);
    //         if (!res.ok) throw new Error(`Error ${res.status}`);
    //         const lgas = await res.json();
    //         const lgaSelect = elems.lga;
    //         lgaSelect.innerHTML = '<option value="">Select LGA...</option>';
    //         lgas.forEach(l => {
    //             const opt = document.createElement("option");
    //             opt.value = l;
    //             opt.textContent = l;
    //             lgaSelect.appendChild(opt);
    //         });
    //     } catch (err) {
    //         console.error("Failed to load LGAs:", err);
    //     }
    // }

    // elems.state.addEventListener("change", e => {
    //     const state = e.target.value;
    //     if (state) {
    //         fetchCities(state);   
    //         fetchLgas(state);    
    //     }
    // });

    // fetchStates();
