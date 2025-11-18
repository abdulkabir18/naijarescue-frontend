// ==================== INCIDENT TYPE UTILITIES ====================

// Incident type icon mappings
const INCIDENT_TYPE_ICONS = {
    "Unknown": "ri-question-line",
    "Fire": "ri-fire-fill",
    "Security": "ri-police-car-fill",
    "Medical": "ri-health-book-fill",
    "NaturalDisaster": "ri-flood-fill",
    "Accident": "ri-car-fill",
    "Other": "ri-alert-fill"
};

// Get incident type icon
function getIncidentTypeIcon(type) {
    return INCIDENT_TYPE_ICONS[type] || INCIDENT_TYPE_ICONS["Unknown"];
}

function formatIncidentType(type) {
    // Convert "NaturalDisaster" to "Natural Disaster"
    return type.replace(/([A-Z])/g, ' $1').trim();
}

// ==================== STATUS UTILITIES ====================

// Status class mappings
const STATUS_CLASSES = {
    "Pending": "status-pending",
    "Reported": "status-pending",
    "InProgress": "status-progress",
    "Analyzed": "status-progress",
    "Resolved": "status-resolved",
    "Escalated": "status-escalated",
    "Cancelled": "status-cancelled",
    "Invalid": "status-invalid"
};

// Status display text
const STATUS_DISPLAY = {
    "Pending": "Pending",
    "Reported": "Reported",
    "InProgress": "In Progress",
    "Analyzed": "Analyzed",
    "Resolved": "Resolved",
    "Escalated": "Escalated",
    "Cancelled": "Cancelled",
    "Invalid": "Invalid"
};

// Get status class
function getStatusClass(status) {
    return STATUS_CLASSES[status] || "status-pending";
}

// Get status display text
function getStatusDisplay(status) {
    return STATUS_DISPLAY[status] || status;
}

// ==================== MEDIA TYPE UTILITIES ====================

// Media type icons
const MEDIA_TYPE_ICONS = {
    "Image": "ri-image-line",
    "Video": "ri-video-line",
    "Audio": "ri-volume-up-line"
};

// ==================== RESPONDER ROLE UTILITIES ====================

// Responder role icons
const RESPONDER_ROLE_ICONS = {
    "Primary": "ri-shield-star-fill",
    "Backup": "ri-shield-check-fill",
    "Support": "ri-shield-line"
};

function getResponderRoleIcon(role) {
    return RESPONDER_ROLE_ICONS[role] || RESPONDER_ROLE_ICONS.Support;
}

// ==================== ADDRESS UTILITIES ====================

// Format address helper
function formatAddress(address) {
    if (!address) return 'Location recorded';

    const parts = [
        address.street,
        address.lga,
        address.city,
        address.state,
        address.country
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : 'Location recorded';
}

// Format coordinates for Google Maps
function formatCoordinatesForMaps(coordinates) {
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) return null;
    return `${coordinates.latitude},${coordinates.longitude}`;
}

// ==================== CONFIDENCE UTILITIES ====================

// Format confidence percentage
function formatConfidence(confidence) {
    if (!confidence) return null;
    return Math.round(confidence * 100);
}

// ==================== HTML ESCAPE UTILITY ====================

// Escape HTML to prevent XSS
function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==================== TIME UTILITIES ====================

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
}

// ==================== CANCEL INCIDENT UTILITIES ====================

function canCancelIncident(status, assignedResponders = []) {
    // Cannot cancel if resolved or already cancelled
    if (status === 'Resolved' || status === 'Cancelled') {
        return false;
    }

    // Can cancel if no responders assigned yet
    // Allowing cancel for: Pending, Reported, Analyzed
    const cancelableStatuses = ['Pending', 'Reported', 'Analyzed'];
    return cancelableStatuses.includes(status);
}