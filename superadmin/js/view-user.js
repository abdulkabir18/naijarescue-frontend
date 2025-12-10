document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    if (!token) return;

    await window.notificationManager.initialize(token);
    await loadAdminProfile(token);

    // DOM Elements
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const contentArea = document.getElementById('contentArea');
    const formFeedback = document.getElementById('formFeedback');

    // User Info Elements
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userRole = document.getElementById('userRole');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const userPhone = document.getElementById('userPhone');
    const userJoinedDate = document.getElementById('userJoinedDate');

    // Action Buttons
    const toggleStatusBtn = document.getElementById('toggleStatusBtn');
    // const deleteBtn = document.getElementById('deleteBtn');

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    let currentUserData = null;

    if (!userId) {
        showError('No user ID provided in the URL.');
        return;
    }

    function showError(message) {
        loadingState.style.display = 'none';
        contentArea.style.display = 'none';
        errorMessage.textContent = message;
        errorState.style.display = 'block';
    }

    function populateUserData(user) {
        currentUserData = user;

        userName.textContent = user.fullName;
        userEmail.textContent = user.email;
        userAvatar.src = user.profilePictureUrl ? `${AppConfig.API_BASE_URL}${user.profilePictureUrl}` : generateInitialsAvatar(user.fullName);
        userAvatar.onerror = () => { userAvatar.src = generateInitialsAvatar(user.fullName); };

        userRole.textContent = user.role || 'User';
        userPhone.textContent = user.phoneNumber || 'Not Provided';
        userJoinedDate.textContent = new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        updateStatusUI(user.isActive);

        loadingState.style.display = 'none';
        contentArea.style.display = 'grid';
    }

    function updateStatusUI(isActive) {
        if (isActive) {
            statusIndicator.className = 'status-indicator active';
            statusText.textContent = 'Active';
            toggleStatusBtn.innerHTML = '<i class="ri-user-unfollow-line"></i> Deactivate User';
            toggleStatusBtn.className = 'btn-secondary';
        } else {
            statusIndicator.className = 'status-indicator inactive';
            statusText.textContent = 'Inactive';
            toggleStatusBtn.innerHTML = '<i class="ri-user-follow-line"></i> Activate User';
            toggleStatusBtn.className = 'btn-success'; // A success class would be good here
        }
    }

    async function loadUser() {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Failed to fetch user. Status: ${response.status}`);
            const result = await response.json();
            if (result.succeeded && result.data) {
                populateUserData(result.data);
            } else {
                throw new Error(result.message || 'User data could not be loaded.');
            }
        } catch (error) {
            console.error("Error loading user:", error);
            showError(error.message);
        }
    }

    toggleStatusBtn.addEventListener('click', async () => {
        const action = currentUserData.isActive ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        toggleStatusBtn.disabled = true;
        toggleStatusBtn.innerHTML = `<div class="spinner-small-white"></div> Updating...`;

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/${userId}/status`, {
                method: 'PATCH',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to update user status.');
            
            // Re-fetch user data to get the latest state
            await loadUser();
            showFeedback('formFeedback', `User successfully ${action}d.`, 'success');

        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            showFeedback('formFeedback', `Error: Could not ${action} user.`, 'error');
        } finally {
            toggleStatusBtn.disabled = false;
            // The text will be updated by updateStatusUI after re-loading
        }
    });

    // deleteBtn.addEventListener('click', async () => {
    //     if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;

    //     deleteBtn.disabled = true;
    //     deleteBtn.innerHTML = `<div class="spinner-small-white"></div> Deleting...`;

    //     try {
    //         const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/${userId}`, {
    //             method: 'DELETE',
    //             headers: { "Authorization": `Bearer ${token}` }
    //         });
    //         if (!response.ok) throw new Error('Failed to delete user.');
            
    //         alert('User deleted successfully. You will be redirected to the users list.');
    //         window.location.href = 'users.html';

    //     } catch (error) {
    //         console.error("Error deleting user:", error);
    //         showFeedback('formFeedback', 'Error: Could not delete user.', 'error');
    //     } finally {
    //         deleteBtn.disabled = false;
    //         deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i> Delete User';
    //     }
    // });

    // Initial Load
    loadUser();
});