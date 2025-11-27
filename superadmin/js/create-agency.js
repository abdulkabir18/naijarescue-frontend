document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    if (!token) return;

    if (token) {
        await window.notificationManager.initialize(token);
    }
    await loadAdminProfile(token);

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const form = document.getElementById("agencyForm");
    const formFeedback = document.getElementById("formFeedback");
    const submitBtn = document.getElementById("submitBtn");
    const passwordToggles = document.querySelectorAll(".toggle-password");

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    passwordToggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.dataset.target;
            const input = document.getElementById(targetId);
            const icon = toggle.querySelector("i");

            if (input.type === "password") {
                input.type = "text";
                icon.className = "ri-eye-off-line";
            } else {
                input.type = "password";
                icon.className = "ri-eye-line";
            }
        });
    });

    // Handle Form Submission for creating an agency
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        formFeedback.textContent = '';
        formFeedback.className = 'form-feedback';

        const formData = new FormData(form);

        // Manually append checkbox values
        const supportedIncidents = [];
        form.querySelectorAll('input[name="supportedIncidents"]:checked').forEach(checkbox => {
            supportedIncidents.push(checkbox.value);
        });

        if (supportedIncidents.length === 0) {
            showFeedback('formFeedback', 'Error: Please select at least one supported incident type.', 'error', 0);
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            return;
        }

        // Clear existing and append new
        formData.delete('supportedIncidents');
        supportedIncidents.forEach(type => formData.append('SupportedIncidents', type));

        // Rename form fields to match API expectation
        const fieldMappings = {
            'adminFirstName': 'RegisterUserRequest.FirstName',
            'adminLastName': 'RegisterUserRequest.LastName',
            'adminEmail': 'RegisterUserRequest.Email',
            'gender': 'RegisterUserRequest.Gender',
            'password': 'RegisterUserRequest.Password',
            'confirmPassword': 'RegisterUserRequest.ConfirmPassword',
            'profilePicture': 'RegisterUserRequest.ProfilePicture',
            'agencyName': 'AgencyName',
            'agencyEmail': 'AgencyEmail',
            'agencyPhoneNumber': 'AgencyPhoneNumber',
            'agencyLogo': 'AgencyLogo',
            'street': 'AgencyAddress.Street',
            'city': 'AgencyAddress.City',
            'state': 'AgencyAddress.State',
            'country': 'AgencyAddress.Country',
            'lga': 'AgencyAddress.LGA',
            'postalCode': 'AgencyAddress.PostalCode'
        };

        const apiFormData = new FormData();
        for (const [key, value] of formData.entries()) {
            if (fieldMappings[key]) {
                apiFormData.append(fieldMappings[key], value);
            } else {
                apiFormData.append(key, value);
            }
        }

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/register-agency`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: apiFormData
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                showFeedback('formFeedback', 'Agency created successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'agencies.html';
                }, 2000);
            } else {
                const errorMessage = result.message || (result.errors ? Object.values(result.errors).flat().join(' ') : 'An unknown error occurred.');
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Agency creation error:', error);
            showFeedback('formFeedback', `Error: ${error.message}`, 'error', 0);
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    });

    // Handle file input display
    const logoInput = document.getElementById('agencyLogo');
    const logoFileName = document.getElementById('logoFileName');
    const logoPreview = document.getElementById('logoPreview');
    logoInput.addEventListener('change', () => {
        if (logoInput.files.length > 0) {
            logoFileName.textContent = logoInput.files[0].name;
            const reader = new FileReader();
            reader.onload = (e) => {
                logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo Preview">`;
            };
            reader.readAsDataURL(logoInput.files[0]);
        }
    });

    const profilePicInput = document.getElementById('profilePicture');
    const profileFileName = document.getElementById('profileFileName');
    const profilePreview = document.getElementById('profilePreview');
    profilePicInput.addEventListener('change', () => {
        if (profilePicInput.files.length > 0) {
            profileFileName.textContent = profilePicInput.files[0].name;
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePreview.innerHTML = `<img src="${e.target.result}" alt="Profile Preview">`;
            };
            reader.readAsDataURL(profilePicInput.files[0]);
        }
    });
});
