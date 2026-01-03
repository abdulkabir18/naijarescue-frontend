async function loadAdminProfile(token) {
    const adminNameEl = document.getElementById("adminName");
    const adminAvatarEl = document.getElementById("adminAvatar");

    if (!adminNameEl || !adminAvatarEl) return;

    // Set a fallback in case the image fails to load
    adminAvatarEl.onerror = function () {
        const adminName = adminNameEl.textContent || "Super Admin";
        this.src = generateInitialsAvatar(adminName);
        this.onerror = null; // Prevent infinite loops
    };

    // 🔴 TESTING: Mock admin profile
    // const mockProfile = {
    //     succeeded: true,
    //     data: {
    //         fullName: "Admin User",
    //         profilePictureUrl: null // or a URL like "https://example.com/avatar.png"
    //     }
    // };

    // if (mockProfile.succeeded && mockProfile.data) {
    //     const profile = mockProfile.data;
    //     adminNameEl.textContent = profile.fullName || "Super Admin";
    //     if (profile.profilePictureUrl) {
    //         adminAvatarEl.src = profile.profilePictureUrl;
    //     } else {
    //         adminAvatarEl.src = generateInitialsAvatar(profile.fullName);
    //     }
    // }

    // 🟢 PRODUCTION: Uncomment for real API call
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.succeeded && result.data) {
            const profile = result.data;
            adminNameEl.textContent = profile.fullName || "Super Admin";
            adminAvatarEl.src = profile.profilePictureUrl ? `${profile.profilePictureUrl}` : generateInitialsAvatar(profile.fullName);
        }
    } catch (error) {
        console.error("Failed to load admin profile:", error);
    }
}