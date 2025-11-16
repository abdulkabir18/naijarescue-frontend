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

// Media type icons
const MEDIA_TYPE_ICONS = {
    "Image": "ri-image-line",
    "Video": "ri-video-line",
    "Audio": "ri-volume-up-line"
};

// Responder role icons
const RESPONDER_ROLE_ICONS = {
    "Primary": "ri-shield-star-fill",
    "Backup": "ri-shield-check-fill",
    "Support": "ri-shield-line"
};

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

// Get incident type icon
function getIncidentTypeIcon(type) {
    return INCIDENT_TYPE_ICONS[type] || INCIDENT_TYPE_ICONS["Unknown"];
}

// Get status class
function getStatusClass(status) {
    return STATUS_CLASSES[status] || "status-pending";
}

// Get status display text
function getStatusDisplay(status) {
    return STATUS_DISPLAY[status] || status;
}

// Format confidence percentage
function formatConfidence(confidence) {
    if (!confidence) return null;
    return Math.round(confidence * 100);
}

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