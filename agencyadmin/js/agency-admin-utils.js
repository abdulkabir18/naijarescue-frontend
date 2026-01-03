async function loadAgencyAdminProfile(token) {
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/User/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load profile');
        const result = await response.json();

        if (result.succeeded && result.data) {
            const profile = result.data;

            // Update header
            const adminNameEl = document.getElementById("adminName");
            const adminAvatarEl = document.getElementById("adminAvatar");

            if (adminNameEl) {
                adminNameEl.textContent = profile.fullName;
            }

            if (adminAvatarEl) {
                if (profile.profilePictureUrl) {
                    adminAvatarEl.src = `${profile.profilePictureUrl}`;
                } else {
                    adminAvatarEl.src = generateInitialsAvatar(profile.fullName);
                }
            }

            return profile;
        }
    } catch (error) {
        console.error('Error loading agency admin profile:', error);
        return null;
    }
}

// Get agency statistics
async function getAgencyStats(token, agencyId) {
    try {
        const [respondersRes, incidentsRes] = await Promise.all([
            fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/agency/${agencyId}?pageSize=1000`, {
                headers: { "Authorization": `Bearer ${token}` }
            }),
            fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/agency/${agencyId}/incidents`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
        ]);

        const respondersResult = await respondersRes.json();
        const incidentsResult = await incidentsRes.json();

        const stats = {
            totalResponders: 0,
            availableResponders: 0,
            busyResponders: 0,
            totalIncidents: 0,
            activeIncidents: 0,
            resolvedIncidents: 0,
            pendingIncidents: 0
        };

        if (respondersResult.succeeded && respondersResult.data) {
            const responders = respondersResult.data;
            stats.totalResponders = responders.length;
            stats.availableResponders = responders.filter(r => r.status === 'Available').length;
            stats.busyResponders = responders.filter(r => r.status === 'Busy').length;
        }

        if (incidentsResult.succeeded && incidentsResult.data) {
            const incidents = incidentsResult.data;
            stats.totalIncidents = incidents.length;
            stats.activeIncidents = incidents.filter(i =>
                i.status !== 'Resolved' && i.status !== 'Cancelled'
            ).length;
            stats.resolvedIncidents = incidents.filter(i => i.status === 'Resolved').length;
            stats.pendingIncidents = incidents.filter(i => i.status === 'Pending').length;
        }

        return stats;
    } catch (error) {
        console.error('Error getting agency stats:', error);
        return null;
    }
}

// Format responder status for display
function getResponderStatusClass(status) {
    const statusMap = {
        'Available': 'available',
        'Busy': 'busy',
        'Offline': 'offline',
        'OnLeave': 'on-leave'
    };
    return statusMap[status] || 'offline';
}

function getResponderStatusDisplay(status) {
    const statusMap = {
        'Available': 'Available',
        'Busy': 'On Duty',
        'Offline': 'Offline',
        'OnLeave': 'On Leave'
    };
    return statusMap[status] || status;
}

// --- Incident Utility Functions (from victim/js/incident-utils.js) ---

function formatAddress(address) {
    if (!address) return null;
    const parts = [address.street, address.city, address.state];
    return parts.filter(Boolean).join(', ');
}

function formatIncidentType(type) {
    if (!type) return 'Unknown';
    return type.replace(/([A-Z])/g, ' $1').trim();
}

function getStatusClass(status) {
    const statusMap = {
        'Pending': 'pending',
        'Acknowledged': 'acknowledged',
        'InProgress': 'in-progress',
        'Resolved': 'resolved',
        'Closed': 'closed',
        'Cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending';
}

function getStatusDisplay(status) {
    const statusMap = {
        'InProgress': 'In Progress',
    };
    return statusMap[status] || status;
}

// --- End of Incident Utility Functions ---

// Check if user has permission for action
function hasPermission(action) {
    const userRole = localStorage.getItem('userRole');

    const permissions = {
        'AgencyAdmin': [
            'view_responders',
            'create_responder',
            'edit_responder',
            'delete_responder',
            'view_incidents',
            'assign_responder',
            'update_incident_status',
            'view_reports',
            'edit_agency_profile'
        ]
    };

    return permissions[userRole]?.includes(action) || false;
}

// Export stats to CSV
function exportToCSV(data, filename) {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',')
                ? `"${value}"`
                : value;
        }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
}

// Calculate time difference for activity logs
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return date.toLocaleDateString();
}

// Validate form inputs
function validateResponderForm(formData) {
    const errors = [];

    if (!formData.get('firstName')?.trim()) {
        errors.push('First name is required');
    }

    if (!formData.get('lastName')?.trim()) {
        errors.push('Last name is required');
    }

    if (!formData.get('email')?.trim()) {
        errors.push('Email is required');
    } else if (!isValidEmail(formData.get('email'))) {
        errors.push('Invalid email format');
    }

    if (!formData.get('password') && !formData.get('isEdit')) {
        errors.push('Password is required');
    } else if (formData.get('password') && formData.get('password').length < 8) {
        errors.push('Password must be at least 8 characters');
    }

    return errors;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Show confirmation dialog
function confirmAction(message, onConfirm) {
    if (confirm(message)) {
        onConfirm();
    }
}