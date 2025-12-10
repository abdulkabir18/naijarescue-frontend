// Responder utility functions

// Update responder status
async function updateResponderStatus(token, responderId, status) {
    try {
        const statusMap = {
            'Available': 1,
            'Busy': 2,
            'Offline': 3,
            'OnLeave': 4,
            'Unavailable': 5
        };

        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/${responderId}/status`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: statusMap[status] || 1 })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
}

// Update responder location
async function updateResponderLocation(token, responderId, latitude, longitude) {
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/${responderId}/location`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ latitude, longitude })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating location:', error);
        throw error;
    }
}

// Get current location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// Accept incident
async function acceptIncident(token, incidentId) {
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/accept`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error accepting incident:', error);
        throw error;
    }
}

// Mark incident as in progress
async function markIncidentInProgress(token, incidentId) {
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/in-progress`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error marking incident in progress:', error);
        throw error;
    }
}

// Resolve incident
async function resolveIncident(token, incidentId) {
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/resolve`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error resolving incident:', error);
        throw error;
    }
}

// Format responder status
function formatResponderStatus(status) {
    const statusMap = {
        'Available': { text: 'Available', class: 'available', icon: 'ri-checkbox-circle-line' },
        'Busy': { text: 'On Duty', class: 'busy', icon: 'ri-time-line' },
        'Offline': { text: 'Offline', class: 'offline', icon: 'ri-close-circle-line' },
        'OnLeave': { text: 'On Leave', class: 'on-leave', icon: 'ri-calendar-line' },
        'Unavailable': { text: 'Unavailable', class: 'unavailable', icon: 'ri-subtract-line' }
    };

    return statusMap[status] || statusMap['Offline'];
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(2); // Returns distance in km
}

// Format distance for display
function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)}m away`;
    }
    return `${km}km away`;
}

// Get incident priority color
function getIncidentPriorityColor(type) {
    const priorityMap = {
        'Fire': '#dc2626',
        'Medical': '#ea580c',
        'Accident': '#d97706',
        'Crime': '#7c3aed',
        'Flood': '#2563eb',
        'Other': '#6b7280'
    };
    return priorityMap[type] || priorityMap['Other'];
}

// Check if incident is urgent (within 30 minutes)
function isUrgent(occurredAt) {
    const incidentTime = new Date(occurredAt);
    const now = new Date();
    const diffMinutes = (now - incidentTime) / (1000 * 60);
    return diffMinutes <= 30;
}

// Format time ago
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return date.toLocaleDateString();
}