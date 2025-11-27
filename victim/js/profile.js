document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    if (!token) return;

    if (token) {
        await window.notificationManager.initialize(token);
    }

    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    await loadUserProfile(token);

    initializeProfilePicture(token);
    initializePersonalInfoForm(token);
    initializeAddressForm(token);
    initializePasswordForm(token);
    initializeAccountActions();
});

async function loadUserProfile(token) {
    // 🔴 TESTING: Mock user data
    // const mockUser = {
    //     fullName: "John Doe",
    //     email: "john.doe@example.com",
    //     gender: "1",
    //     profilePictureUrl: null,
    //     address: {
    //         street: "123 Main Street",
    //         city: "Lagos",
    //         state: "Lagos",
    //         lga: "Ikeja",
    //         postalCode: "100001",
    //         country: "Nigeria"
    //     }
    // };

    // populateUserData(mockUser);

    // 🟢 PRODUCTION: Uncomment for real API
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/profile`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.succeeded && data.data) {
            populateUserData(data.data);
        }
    } catch (error) {
        console.error("Failed to load profile:", error);
        showFeedback("personalInfoFeedback", "Failed to load profile data.", "error");
    }
}

function populateUserData(user) {
    const nameParts = (user.fullName || "").split(' ');
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(' ') || "";

    document.getElementById("firstName").value = firstName;
    document.getElementById("lastName").value = lastName;
    document.getElementById("email").value = user.email || "";
    document.getElementById("gender").value = user.gender || "Not specified";

    const preview = document.getElementById("profilePicturePreview");

    console.log(user.profilePictureUrl);

    if (user.profilePictureUrl && user.profilePictureUrl.trim() !== "") {
        preview.src = `${AppConfig.API_BASE_URL}${user.profilePictureUrl}`;
    } else {
        preview.src = generateInitialsAvatar(user.fullName || "");
    }


    if (user.address) {
        document.getElementById("street").value = user.address.street || "";
        document.getElementById("city").value = user.address.city || "";
        document.getElementById("state").value = user.address.state || "";
        document.getElementById("lga").value = user.address.lga || "";
        document.getElementById("postalCode").value = user.address.postalCode || "";
        document.getElementById("country").value = user.address.country || "Nigeria";
    }
}

function initializeProfilePicture(token) {
    const uploadBtn = document.getElementById("uploadPictureBtn");
    const removeBtn = document.getElementById("removePictureBtn");
    const fileInput = document.getElementById("profilePictureInput");
    const preview = document.getElementById("profilePicturePreview");
    const pictureDisplay = document.querySelector(".profile-picture-display");

    pictureDisplay.addEventListener("click", () => fileInput.click());
    uploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showFeedback("pictureFeedback", "Please select a valid image file.", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showFeedback("pictureFeedback", "Image size must be less than 5MB.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);

        await uploadProfilePicture(token, file);
    });

    removeBtn.addEventListener("click", async () => {
        if (confirm("Are you sure you want to remove your profile picture?")) {
            const fullName = `${document.getElementById("firstName").value} ${document.getElementById("lastName").value}`.trim();
            preview.src = generateInitialsAvatar(fullName);
            showFeedback("pictureFeedback", "Profile picture removed successfully.", "success");
            // TODO: Add API call here to remove the picture on the backend
        }
    });
}

async function uploadProfilePicture(token, file) {
    const formData = new FormData();
    formData.append("image", file);

    // 🔴 TESTING: Mock upload
    // setTimeout(() => {
    //     showFeedback("pictureFeedback", "✅ Profile picture updated successfully!", "success");
    // }, 1000);

    // 🟢 PRODUCTION: Uncomment for real API
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/profile-image`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.succeeded) {
            showFeedback("pictureFeedback", "✅ Profile picture updated successfully!", "success");
        } else {
            showFeedback("pictureFeedback", `❌ ${data.message || "Failed to upload picture."}`, "error");
        }
    } catch (error) {
        console.error("Upload error:", error);
        showFeedback("pictureFeedback", "⚠️ Network error. Please try again.", "error");
    }
}

function initializePersonalInfoForm(token) {
    const form = document.getElementById("personalInfoForm");
    const submitBtn = document.getElementById("updatePersonalInfoBtn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();

        if (!firstName || firstName.length < 2) {
            showFieldError("firstNameError", "First name must be at least 2 characters.");
            return;
        }
        if (!lastName || lastName.length < 2) {
            showFieldError("lastNameError", "Last name must be at least 2 characters.");
            return;
        }

        clearFieldError("firstNameError");
        clearFieldError("lastNameError");

        submitBtn.disabled = true;
        submitBtn.classList.add("loading");

        // 🔴 TESTING: Mock update
        // setTimeout(() => {
        //     showFeedback("personalInfoFeedback", "✅ Personal information updated successfully!", "success");
        //     submitBtn.disabled = false;
        //     submitBtn.classList.remove("loading");
        // }, 1500);

        // 🟢 PRODUCTION: Uncomment for real API
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/details`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: {
                        firstName: firstName,
                        lastName: lastName
                    }
                })
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                showFeedback("personalInfoFeedback", "✅ Personal information updated successfully!", "success");
            } else {
                showFeedback("personalInfoFeedback", `❌ ${data.message || "Failed to update."}`, "error");
            }
        } catch (error) {
            console.error("Update error:", error);
            showFeedback("personalInfoFeedback", "⚠️ Network error. Please try again.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
        }
    });
}

function initializeAddressForm(token) {
    const form = document.getElementById("addressForm");
    const submitBtn = document.getElementById("updateAddressBtn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const addressData = {
            street: document.getElementById("street").value.trim(),
            city: document.getElementById("city").value.trim(),
            state: document.getElementById("state").value.trim(),
            lga: document.getElementById("lga").value.trim(),
            postalCode: document.getElementById("postalCode").value.trim(),
            country: document.getElementById("country").value.trim()
        };

        submitBtn.disabled = true;
        submitBtn.classList.add("loading");

        // 🔴 TESTING: Mock update
        // setTimeout(() => {
        //     showFeedback("addressFeedback", "✅ Address updated successfully!", "success");
        //     submitBtn.disabled = false;
        //     submitBtn.classList.remove("loading");
        // }, 1500);

        // 🟢 PRODUCTION: Uncomment for real API
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/update-address`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ address: addressData })
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                showFeedback("addressFeedback", "✅ Address updated successfully!", "success");
            } else {
                showFeedback("addressFeedback", `❌ ${data.message || "Failed to update address."}`, "error");
            }
        } catch (error) {
            console.error("Address update error:", error);
            showFeedback("addressFeedback", "⚠️ Network error. Please try again.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
        }
    });
}

function initializePasswordForm(token) {
    const form = document.getElementById("passwordForm");
    const submitBtn = document.getElementById("changePasswordBtn");

    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const icon = btn.querySelector("i");

            if (input.type === "password") {
                input.type = "text";
                icon.className = "ri-eye-off-line";
            } else {
                input.type = "password";
                icon.className = "ri-eye-line";
            }
        });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        clearFieldError("currentPasswordError");
        clearFieldError("newPasswordError");
        clearFieldError("confirmPasswordError");

        let hasError = false;

        if (!currentPassword) {
            showFieldError("currentPasswordError", "Current password is required.");
            hasError = true;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!newPassword) {
            showFieldError("newPasswordError", "New password is required.");
            hasError = true;
        } else if (!passwordRegex.test(newPassword)) {
            showFieldError("newPasswordError", "Password must be at least 8 characters with 1 uppercase and 1 number.");
            hasError = true;
        }

        if (newPassword !== confirmPassword) {
            showFieldError("confirmPasswordError", "Passwords do not match.");
            hasError = true;
        }

        if (hasError) return;
        submitBtn.disabled = true;
        submitBtn.classList.add("loading");

        // 🔴 TESTING: Mock password change
        // setTimeout(() => {
        //     showFeedback("passwordFeedback", "✅ Password changed successfully!", "success");
        //     form.reset();
        //     submitBtn.disabled = false;
        //     submitBtn.classList.remove("loading");
        // }, 1500);

        // 🟢 PRODUCTION: Uncomment for real API
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/reset-password`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: {
                        currentPassword: currentPassword,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword
                    }
                })
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                showFeedback("passwordFeedback", "✅ Password changed successfully!", "success");
                form.reset();
            } else {
                showFeedback("passwordFeedback", `❌ ${data.message || "Failed to change password."}`, "error");
            }
        } catch (error) {
            console.error("Password change error:", error);
            showFeedback("passwordFeedback", "⚠️ Network error. Please try again.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
        }
    });
}

function initializeAccountActions() {
    const deactivateBtn = document.getElementById("deactivateAccountBtn");

    deactivateBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to deactivate your account? You can reactivate it by logging in again.")) {
            // TODO: Call API to deactivate account
            alert("Account deactivation feature will be implemented.");
        }
    });
}

function showFieldError(errorId, message) {
    const element = document.getElementById(errorId);
    if (element) {
        element.textContent = message;
    }
}

function clearFieldError(errorId) {
    const element = document.getElementById(errorId);
    if (element) {
        element.textContent = "";
    }
}