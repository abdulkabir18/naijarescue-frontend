// document.addEventListener("DOMContentLoaded", async () => {
//     const token = protectPage();
//     if (!token) return;

//     // Check if user is Responder
//     const role = getRole(token);
//     if (role !== 'Responder') {
//         alert('Access denied. Responders only.');
//         window.location.href = '/login.html';
//         return;
//     }

//     // Load Google Maps API dynamically
//     await loadGoogleMapsAPI();

//     if (token) {
//         await window.notificationManager.initialize(token);
//     }

//     // Get incident ID from URL
//     const urlParams = new URLSearchParams(window.location.search);
//     const incidentId = urlParams.get('id');

//     if (!incidentId) {
//         showError('No incident ID provided');
//         return;
//     }

//     // DOM Elements
//     const menuToggle = document.getElementById("menuToggle");
//     const responderSidebar = document.getElementById("responderSidebar");
//     const logoutBtn = document.getElementById("logoutBtn");
//     const statusToggle = document.getElementById("statusToggle");
//     const statusLabel = document.getElementById("statusLabel");

//     const loadingState = document.getElementById("loadingState");
//     const errorState = document.getElementById("errorState");
//     const contentContainer = document.getElementById("contentContainer");

//     let responderId = null;
//     let responderLocation = null;
//     let incidentData = null;
//     let map = null;
//     let directionsService = null;
//     let directionsRenderer = null;

//     // Load Google Maps API
//     function loadGoogleMapsAPI() {
//         return new Promise((resolve, reject) => {
//             // Check if already loaded
//             if (window.google && window.google.maps) {
//                 resolve();
//                 return;
//             }

//             const script = document.createElement('script');
//             script.src = `https://maps.googleapis.com/maps/api/js?key=${AppConfig.GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
//             script.async = true;
//             script.defer = true;
//             script.onload = () => resolve();
//             script.onerror = () => reject(new Error('Failed to load Google Maps'));
//             document.head.appendChild(script);
//         });
//     }

//     // Event Listeners
//     menuToggle.addEventListener("click", () => responderSidebar.classList.toggle("active"));

//     logoutBtn.addEventListener("click", (e) => {
//         e.preventDefault();
//         logoutUser();
//     });

//     // Status Toggle
//     statusToggle.addEventListener("change", async (e) => {
//         const newStatus = e.target.checked ? 'Available' : 'Offline';
//         await updateStatus(newStatus);
//     });

//     // Load responder profile
//     try {
//         const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/me`, {
//             headers: { "Authorization": `Bearer ${token}` }
//         });

//         if (!response.ok) throw new Error('Failed to load responder profile');
//         const result = await response.json();

//         if (result.succeeded && result.data) {
//             const responder = result.data;
//             responderId = responder.id;
//             responderLocation = responder.coordinates;

//             // Update UI
//             document.getElementById("responderName").textContent = responder.userFullName;
//             document.getElementById("agencyName").textContent = responder.agencyName;

//             if (responder.profilePictureUrl) {
//                 document.getElementById("responderAvatar").src = `${AppConfig.API_BASE_URL}/${responder.profilePictureUrl}`;
//             } else {
//                 document.getElementById("responderAvatar").src = generateInitialsAvatar(responder.userFullName);
//             }

//             // Set current status
//             const status = responder.status;
//             statusToggle.checked = (status === 'Available');
//             statusLabel.textContent = status;

//             // Load incident details
//             await loadIncidentDetails();
//         }
//     } catch (error) {
//         console.error('Error loading responder profile:', error);
//         showError('Failed to load responder profile');
//     }

//     async function updateStatus(newStatus) {
//         try {
//             const statusValue = newStatus === 'Available' ? 1 : 3;

//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/${responderId}/status`, {
//                 method: 'PATCH',
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({ status: statusValue })
//             });

//             const result = await response.json();

//             if (response.ok && result.succeeded) {
//                 statusLabel.textContent = newStatus;
//             } else {
//                 throw new Error(result.message || 'Failed to update status');
//             }
//         } catch (error) {
//             console.error('Error updating status:', error);
//             statusToggle.checked = !statusToggle.checked;
//         }
//     }

//     async function loadIncidentDetails() {
//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}`, {
//                 headers: { "Authorization": `Bearer ${token}` }
//             });

//             if (!response.ok) throw new Error('Failed to load incident');
//             const result = await response.json();

//             if (result.succeeded && result.data) {
//                 incidentData = result.data;
//                 renderIncidentDetails(incidentData);
//                 initializeMap(incidentData);
//             } else {
//                 throw new Error('Incident not found');
//             }
//         } catch (error) {
//             console.error('Error loading incident:', error);
//             showError(error.message || 'Failed to load incident details');
//         }
//     }

//     function renderIncidentDetails(incident) {
//         // Hide loading, show content
//         loadingState.style.display = 'none';
//         contentContainer.style.display = 'block';

//         // Header
//         document.getElementById("incidentRef").textContent = incident.referenceNumber;
//         const statusBadge = document.getElementById("incidentStatusBadge");
//         statusBadge.textContent = getStatusDisplay(incident.status);
//         statusBadge.className = `status-badge-large ${getStatusClass(incident.status)}`;

//         // Action Buttons
//         renderActionButtons(incident);

//         // Incident Information
//         document.getElementById("incidentType").textContent = formatIncidentType(incident.type);
//         document.getElementById("incidentStatus").textContent = getStatusDisplay(incident.status);
//         document.getElementById("incidentPriority").textContent = getPriorityText(incident.type);
//         document.getElementById("incidentTime").textContent = formatDateTime(incident.occurredAt);

//         // Confidence Score
//         if (incident.confidence) {
//             const confidenceItem = document.getElementById("confidenceItem");
//             const confidencePercentage = Math.round(incident.confidence * 100);
//             confidenceItem.style.display = 'block';
//             document.getElementById("confidenceFill").style.width = `${confidencePercentage}%`;
//             document.getElementById("confidencePercentage").textContent = `${confidencePercentage}%`;
//         }

//         // Location
//         const address = formatAddress(incident.address) || 'Address not available';
//         document.getElementById("incidentAddress").textContent = address;
//         document.getElementById("incidentCoordinates").textContent = 
//             `${incident.coordinates.latitude.toFixed(6)}, ${incident.coordinates.longitude.toFixed(6)}`;

//         // Reporter Information
//         document.getElementById("reporterName").textContent = incident.userName || 'Anonymous';
//         const emailLink = document.getElementById("reporterEmail");
//         emailLink.querySelector('span').textContent = incident.userContact || 'No email';
//         emailLink.href = `mailto:${incident.userContact}`;

//         // Check if reporter has avatar
//         const reporterAvatar = document.getElementById("reporterAvatar");
//         if (incident.userProfilePicture) {
//             reporterAvatar.innerHTML = `<img src="${AppConfig.API_BASE_URL}/${incident.userProfilePicture}" alt="${incident.userName}">`;
//         }

//         // Media
//         if (incident.media && incident.media.length > 0) {
//             renderMedia(incident.media);
//         }

//         // Assigned Responders
//         if (incident.assignedResponders && incident.assignedResponders.length > 0) {
//             renderResponders(incident.assignedResponders);
//         }

//         // Timeline
//         renderTimeline(incident);
//     }

//     function renderActionButtons(incident) {
//         const container = document.getElementById("actionButtons");
//         const isAssignedToMe = incident.assignedResponders?.some(r => r.responderId === responderId);

//         let buttonsHtml = '';

//         if (!isAssignedToMe && (incident.status === 'Pending' || incident.status === 'Dispatched')) {
//             // Show Accept button
//             buttonsHtml = `
//                 <button class="btn-accept-incident" id="acceptIncidentBtn">
//                     <i class="ri-check-line"></i> Accept Incident
//                 </button>
//             `;
//         } else if (isAssignedToMe) {
//             if (incident.status === 'Pending' || incident.status === 'Analyzed') {
//                 buttonsHtml = `
//                     <button class="btn-start-incident" id="startIncidentBtn">
//                         <i class="ri-play-line"></i> Start Response
//                     </button>
//                 `;
//             } else if (incident.status === 'InProgress') {
//                 buttonsHtml = `
//                     <button class="btn-resolve-incident" id="resolveIncidentBtn">
//                         <i class="ri-check-double-line"></i> Mark as Resolved
//                     </button>
//                 `;
//             }

//             // Add escalate button for any active incident
//             if (incident.status !== 'Resolved' && incident.status !== 'Closed') {
//                 buttonsHtml += `
//                     <button class="btn-escalate" id="escalateIncidentBtn">
//                         <i class="ri-alarm-warning-line"></i> Escalate
//                     </button>
//                 `;
//             }
//         }

//         container.innerHTML = buttonsHtml;

//         // Add event listeners
//         const acceptBtn = document.getElementById("acceptIncidentBtn");
//         const startBtn = document.getElementById("startIncidentBtn");
//         const resolveBtn = document.getElementById("resolveIncidentBtn");
//         const escalateBtn = document.getElementById("escalateIncidentBtn");

//         if (acceptBtn) acceptBtn.addEventListener('click', () => handleAcceptIncident());
//         if (startBtn) startBtn.addEventListener('click', () => handleStartIncident());
//         if (resolveBtn) resolveBtn.addEventListener('click', () => handleResolveIncident());
//         if (escalateBtn) escalateBtn.addEventListener('click', () => handleEscalateIncident());
//     }

//     function renderMedia(media) {
//         const mediaCard = document.getElementById("mediaCard");
//         const mediaGrid = document.getElementById("mediaGrid");

//         mediaCard.style.display = 'block';

//         mediaGrid.innerHTML = media.map(item => {
//             const isVideo = item.type?.toLowerCase() === 'video';
//             return `
//                 <div class="media-item">
//                     ${isVideo ? 
//                         `<video src="${item.url}" controls></video>` :
//                         `<img src="${item.url}" alt="Evidence">`
//                     }
//                     <span class="media-type-badge">${isVideo ? 'Video' : 'Image'}</span>
//                 </div>
//             `;
//         }).join('');
//     }

//     function renderResponders(responders) {
//         const respondersCard = document.getElementById("respondersCard");
//         const respondersList = document.getElementById("respondersList");

//         respondersCard.style.display = 'block';

//         respondersList.innerHTML = responders.map(responder => `
//             <div class="responder-item">
//                 <div class="responder-item-avatar">
//                     ${responder.profilePicture ? 
//                         `<img src="${AppConfig.API_BASE_URL}/${responder.profilePicture}" alt="${responder.responderName}">` :
//                         `<img src="${generateInitialsAvatar(responder.responderName)}" alt="${responder.responderName}">`
//                     }
//                 </div>
//                 <div class="responder-item-info">
//                     <div class="responder-item-name">${escapeHtml(responder.responderName)}</div>
//                     <div class="responder-item-role">${escapeHtml(responder.role || 'Responder')}</div>
//                 </div>
//             </div>
//         `).join('');
//     }

//     function renderTimeline(incident) {
//         const timeline = document.getElementById("timeline");

//         const events = [];

//         events.push({
//             title: 'Incident Reported',
//             time: incident.occurredAt
//         });

//         if (incident.status === 'Dispatched' || incident.status === 'InProgress' || incident.status === 'Resolved') {
//             events.push({
//                 title: 'Responders Dispatched',
//                 time: incident.occurredAt // Replace with actual dispatch time when available
//             });
//         }

//         if (incident.status === 'InProgress' || incident.status === 'Resolved') {
//             events.push({
//                 title: 'Response Started',
//                 time: incident.occurredAt // Replace with actual start time
//             });
//         }

//         if (incident.status === 'Resolved') {
//             events.push({
//                 title: 'Incident Resolved',
//                 time: incident.occurredAt // Replace with actual resolved time
//             });
//         }

//         timeline.innerHTML = events.map(event => `
//             <div class="timeline-item">
//                 <div class="timeline-title">${escapeHtml(event.title)}</div>
//                 <div class="timeline-time">${formatDateTime(event.time)}</div>
//             </div>
//         `).join('');
//     }

//     function initializeMap(incident) {
//         const incidentLocation = {
//             lat: incident.coordinates.latitude,
//             lng: incident.coordinates.longitude
//         };

//         // Initialize map
//         map = new google.maps.Map(document.getElementById("map"), {
//             zoom: 14,
//             center: incidentLocation,
//             mapTypeControl: true,
//             fullscreenControl: true
//         });

//         // Add incident marker
//         new google.maps.Marker({
//             position: incidentLocation,
//             map: map,
//             title: incident.referenceNumber,
//             icon: {
//                 url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
//             }
//         });

//         // If we have responder location, show route
//         if (responderLocation && responderLocation.latitude && responderLocation.longitude) {
//             const responderPos = {
//                 lat: responderLocation.latitude,
//                 lng: responderLocation.longitude
//             };

//             // Add responder marker
//             new google.maps.Marker({
//                 position: responderPos,
//                 map: map,
//                 title: 'Your Location',
//                 icon: {
//                     url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
//                 }
//             });

//             // Calculate and display route
//             directionsService = new google.maps.DirectionsService();
//             directionsRenderer = new google.maps.DirectionsRenderer({
//                 map: map,
//                 suppressMarkers: false
//             });

//             calculateRoute(responderPos, incidentLocation);
//         }

//         // Navigation button
//         document.getElementById("navigateBtn").addEventListener('click', () => {
//             openNavigation(incidentLocation);
//         });

//         // Get Directions button
//         document.getElementById("getDirectionsBtn").addEventListener('click', () => {
//             if (responderLocation) {
//                 const responderPos = {
//                     lat: responderLocation.latitude,
//                     lng: responderLocation.longitude
//                 };
//                 calculateRoute(responderPos, incidentLocation);
//             } else {
//                 // Get current location
//                 getCurrentLocationAndRoute(incidentLocation);
//             }
//         });
//     }

//     function calculateRoute(origin, destination) {
//         const request = {
//             origin: origin,
//             destination: destination,
//             travelMode: google.maps.TravelMode.DRIVING,
//             provideRouteAlternatives: true
//         };

//         directionsService.route(request, (result, status) => {
//             if (status === 'OK') {
//                 directionsRenderer.setDirections(result);

//                 // Display route info
//                 const route = result.routes[0].legs[0];
//                 document.getElementById("routeDistance").textContent = route.distance.text;
//                 document.getElementById("routeDuration").textContent = route.duration.text;
//                 document.getElementById("routeInfo").style.display = 'grid';
//             } else {
//                 console.error('Directions request failed:', status);
//                 alert('Could not calculate route. Please try again.');
//             }
//         });
//     }

//     function getCurrentLocationAndRoute(destination) {
//         if (!navigator.geolocation) {
//             alert('Geolocation is not supported by your browser.');
//             return;
//         }

//         navigator.geolocation.getCurrentPosition(
//             (position) => {
//                 const origin = {
//                     lat: position.coords.latitude,
//                     lng: position.coords.longitude
//                 };
//                 calculateRoute(origin, destination);
//             },
//             (error) => {
//                 console.error('Geolocation error:', error);
//                 alert('Failed to get your location. Please enable location services.');
//             }
//         );
//     }

//     function openNavigation(destination) {
//         // Open Google Maps with directions
//         const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
//         window.open(url, '_blank');
//     }

//     async function handleAcceptIncident() {
//         if (!confirm('Are you sure you want to accept this incident?')) return;

//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/accept`, {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Content-Type": "application/json"
//                 }
//             });

//             const result = await response.json();

//             if (response.ok && result.succeeded) {
//                 alert('Incident accepted successfully!');
//                 location.reload();
//             } else {
//                 throw new Error(result.message || 'Failed to accept incident');
//             }
//         } catch (error) {
//             console.error('Error accepting incident:', error);
//             alert(`Failed to accept incident: ${error.message}`);
//         }
//     }

//     async function handleStartIncident() {
//         if (!confirm('Start responding to this incident?')) return;

//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/in-progress`, {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Content-Type": "application/json"
//                 }
//             });

//             const result = await response.json();

//             if (response.ok && result.succeeded) {
//                 alert('Incident status updated!');
//                 location.reload();
//             } else {
//                 throw new Error(result.message || 'Failed to update incident');
//             }
//         } catch (error) {
//             console.error('Error updating incident:', error);
//             alert(`Failed to update incident: ${error.message}`);
//         }
//     }

//     async function handleResolveIncident() {
//         if (!confirm('Mark this incident as resolved?')) return;

//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/resolve`, {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Content-Type": "application/json"
//                 }
//             });

//             const result = await response.json();

//             if (response.ok && result.succeeded) {
//                 alert('Incident resolved successfully!');
//                 window.location.href = 'responder-incidents.html';
//             } else {
//                 throw new Error(result.message || 'Failed to resolve incident');
//             }
//         } catch (error) {
//             console.error('Error resolving incident:', error);
//             alert(`Failed to resolve incident: ${error.message}`);
//         }
//     }

//     async function handleEscalateIncident() {
//         if (!confirm('Escalate this incident to higher priority?')) return;

//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/escalate`, {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Content-Type": "application/json"
//                 }
//             });

//             const result = await response.json();

//             if (response.ok && result.succeeded) {
//                 alert('Incident escalated successfully!');
//                 location.reload();
//             } else {
//                 throw new Error(result.message || 'Failed to escalate incident');
//             }
//         } catch (error) {
//             console.error('Error escalating incident:', error);
//             alert(`Failed to escalate incident: ${error.message}`);
//         }
//     }

//     function showError(message) {
//         loadingState.style.display = 'none';
//         errorState.style.display = 'flex';
//         document.getElementById("errorMessage").textContent = message;
//     }

//     function getPriorityText(type) {
//         const priorities = {
//             'Fire': 'Critical',
//             'Medical': 'High',
//             'Accident': 'High',
//             'Crime': 'Medium',
//             'Flood': 'Medium',
//             'Other': 'Low'
//         };
//         return priorities[type] || 'Medium';
//     }

//     function formatDateTime(dateString) {
//         const date = new Date(dateString);
//         return date.toLocaleString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit'
//         });
//     }
// });

document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    if (!token) return;

    // Check if user is Responder
    const role = getRole(token);
    if (role !== 'Responder') {
        alert('Access denied. Responders only.');
        window.location.href = '/login.html';
        return;
    }

    // Load Google Maps API dynamically
    await loadGoogleMapsAPI();

    if (token) {
        await window.notificationManager.initialize(token);
    }

    // Get incident ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const incidentId = urlParams.get('id');

    if (!incidentId) {
        showError('No incident ID provided');
        return;
    }

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const responderSidebar = document.getElementById("responderSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const statusToggle = document.getElementById("statusToggle");
    const statusLabel = document.getElementById("statusLabel");

    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const contentContainer = document.getElementById("contentContainer");

    let responderId = null;
    let responderLocation = null;
    let incidentData = null;
    let map = null;
    let directionsService = null;
    let directionsRenderer = null;

    // Load Google Maps API
    function loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${AppConfig.GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
        });
    }

    // Event Listeners
    menuToggle.addEventListener("click", () => responderSidebar.classList.toggle("active"));

    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Status Toggle
    statusToggle.addEventListener("change", async (e) => {
        const newStatus = e.target.checked ? 'Available' : 'Offline';
        await updateStatus(newStatus);
    });

    // Load responder profile
    try {
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load responder profile');
        const result = await response.json();

        if (result.succeeded && result.data) {
            const responder = result.data;
            responderId = responder.id;
            responderLocation = responder.coordinates;

            // Update UI
            document.getElementById("responderName").textContent = responder.userFullName;
            document.getElementById("agencyName").textContent = responder.agencyName;

            if (responder.profilePictureUrl) {
                document.getElementById("responderAvatar").src = `${responder.profilePictureUrl}`;
            } else {
                document.getElementById("responderAvatar").src = generateInitialsAvatar(responder.userFullName);
            }

            // Set current status
            const status = responder.status;
            statusToggle.checked = (status === 'Available');
            statusLabel.textContent = status;

            // Load incident details
            await loadIncidentDetails();
        }
    } catch (error) {
        console.error('Error loading responder profile:', error);
        showError('Failed to load responder profile');
    }

    async function updateStatus(newStatus) {
        try {
            const statusValue = newStatus === 'Available' ? 1 : 3;

            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/${responderId}/status`, {
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: statusValue })
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                statusLabel.textContent = newStatus;
            } else {
                throw new Error(result.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            statusToggle.checked = !statusToggle.checked;
        }
    }

    async function loadIncidentDetails() {
        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load incident');
            const result = await response.json();

            if (result.succeeded && result.data) {
                incidentData = result.data;
                renderIncidentDetails(incidentData);
                initializeMap(incidentData);
            } else {
                throw new Error('Incident not found');
            }
        } catch (error) {
            console.error('Error loading incident:', error);
            showError(error.message || 'Failed to load incident details');
        }
    }

    function renderIncidentDetails(incident) {
        // Hide loading, show content
        loadingState.style.display = 'none';
        contentContainer.style.display = 'block';

        // Header
        document.getElementById("incidentRef").textContent = incident.referenceNumber;
        const statusBadge = document.getElementById("incidentStatusBadge");
        statusBadge.textContent = getStatusDisplay(incident.status);
        statusBadge.className = `status-badge-large ${getStatusClass(incident.status)}`;

        // Action Buttons
        renderActionButtons(incident);

        // Incident Information
        document.getElementById("incidentType").textContent = formatIncidentType(incident.type);
        document.getElementById("incidentStatus").textContent = getStatusDisplay(incident.status);
        document.getElementById("incidentPriority").textContent = getPriorityText(incident.type);
        document.getElementById("incidentTime").textContent = formatDateTime(incident.occurredAt);

        // Confidence Score
        if (incident.confidence) {
            const confidenceItem = document.getElementById("confidenceItem");
            const confidencePercentage = Math.round(incident.confidence * 100);
            confidenceItem.style.display = 'block';
            document.getElementById("confidenceFill").style.width = `${confidencePercentage}%`;
            document.getElementById("confidencePercentage").textContent = `${confidencePercentage}%`;
        }

        // Location
        const address = formatAddress(incident.address) || 'Address not available';
        document.getElementById("incidentAddress").textContent = address;
        document.getElementById("incidentCoordinates").textContent =
            `${incident.coordinates.latitude.toFixed(6)}, ${incident.coordinates.longitude.toFixed(6)}`;

        // Reporter Information
        document.getElementById("reporterName").textContent = incident.userName || 'Anonymous';
        const emailLink = document.getElementById("reporterEmail");
        emailLink.querySelector('span').textContent = incident.userContact || 'No email';
        emailLink.href = `mailto:${incident.userContact}`;

        // Check if reporter has avatar
        const reporterAvatar = document.getElementById("reporterAvatar");
        if (incident.userProfilePicture) {
            reporterAvatar.innerHTML = `<img src="${incident.userProfilePicture}" alt="${incident.userName}">`;
        } else {
            reporterAvatar.innerHTML = `<img src="${generateInitialsAvatar(incident.userName)}" alt="${incident.userName}">`;
        }

        // Media
        if (incident.media && incident.media.length > 0) {
            renderMedia(incident.media);
        }

        // Assigned Responders
        if (incident.assignedResponders && incident.assignedResponders.length > 0) {
            renderResponders(incident.assignedResponders);
        }

        // Timeline
        renderTimeline(incident);
    }

    function renderActionButtons(incident) {
        const container = document.getElementById("actionButtons");
        const isAssignedToMe = incident.assignedResponders?.some(r => r.responderId === responderId);

        let buttonsHtml = '';

        if (!isAssignedToMe && (incident.status === 'Pending' || incident.status === 'Dispatched')) {
            // Show Accept button
            buttonsHtml = `
                <button class="btn-accept-incident" id="acceptIncidentBtn">
                    <i class="ri-check-line"></i> Accept Incident
                </button>
            `;
        } else if (isAssignedToMe) {
            if (incident.status === 'Pending' || incident.status === 'Dispatched') {
                buttonsHtml = `
                    <button class="btn-start-incident" id="startIncidentBtn">
                        <i class="ri-play-line"></i> Start Response
                    </button>
                `;
            } else if (incident.status === 'InProgress') {
                buttonsHtml = `
                    <button class="btn-resolve-incident" id="resolveIncidentBtn">
                        <i class="ri-check-double-line"></i> Mark as Resolved
                    </button>
                `;
            }

            // Add escalate button for any active incident
            if (incident.status !== 'Resolved' && incident.status !== 'Closed') {
                buttonsHtml += `
                    <button class="btn-escalate" id="escalateIncidentBtn">
                        <i class="ri-alarm-warning-line"></i> Escalate
                    </button>
                `;
            }
        }

        container.innerHTML = buttonsHtml;

        // Add event listeners
        const acceptBtn = document.getElementById("acceptIncidentBtn");
        const startBtn = document.getElementById("startIncidentBtn");
        const resolveBtn = document.getElementById("resolveIncidentBtn");
        const escalateBtn = document.getElementById("escalateIncidentBtn");

        if (acceptBtn) acceptBtn.addEventListener('click', () => handleAcceptIncident());
        if (startBtn) startBtn.addEventListener('click', () => handleStartIncident());
        if (resolveBtn) resolveBtn.addEventListener('click', () => handleResolveIncident());
        if (escalateBtn) escalateBtn.addEventListener('click', () => handleEscalateIncident());
    }

    function renderMedia(media) {
        const mediaCard = document.getElementById("mediaCard");
        const mediaGrid = document.getElementById("mediaGrid");

        mediaCard.style.display = 'block';

        mediaGrid.innerHTML = media.map(item => {
            const isVideo = item.type?.toLowerCase() === 'video';
            return `
                <div class="media-item">
                    ${isVideo ?
                    `<video src="$${item.url}" controls></video>` :
                    `<img src="${item.url}" alt="Evidence">`
                }
                    <span class="media-type-badge">${isVideo ? 'Video' : 'Image'}</span>
                </div>
            `;
        }).join('');
    }

    function renderResponders(responders) {
        const respondersCard = document.getElementById("respondersCard");
        const respondersList = document.getElementById("respondersList");

        respondersCard.style.display = 'block';

        respondersList.innerHTML = responders.map(responder => `
            <div class="responder-item">
                <div class="responder-item-avatar">
                    ${responder.profilePicture ?
                `<img src="${responder.profilePicture}" alt="${responder.responderName}">` :
                `<img src="${generateInitialsAvatar(responder.responderName)}" alt="${responder.responderName}">`
            }
                </div>
                <div class="responder-item-info">
                    <div class="responder-item-name">${escapeHtml(responder.responderName)}</div>
                    <div class="responder-item-role">${escapeHtml(responder.role || 'Responder')}</div>
                </div>
            </div>
        `).join('');
    }

    function renderTimeline(incident) {
        const timeline = document.getElementById("timeline");

        const events = [];

        events.push({
            title: 'Incident Reported',
            time: incident.occurredAt
        });

        if (incident.status === 'Reported' || incident.status === 'InProgress' || incident.status === 'Resolved' || incident.status === 'Escalated') {
            events.push({
                title: 'Responders Dispatched',
                time: incident.occurredAt // Replace with actual dispatch time when available
            });
        }

        if (incident.status === 'InProgress' || incident.status === 'Resolved') {
            events.push({
                title: 'Response Started',
                time: incident.occurredAt // Replace with actual start time
            });
        }

        if (incident.status === 'Resolved') {
            events.push({
                title: 'Incident Resolved',
                time: incident.occurredAt // Replace with actual resolved time
            });
        }

        if (incident.status === 'Escalated') {
            events.push({
                title: 'Incident Escalated',
                time: incident.occurredAt
            });
        }

        if (incident.status === 'Cancelled') {
            events.push({
                title: 'Incident Cancelled',
                time: incident.occurredAt
            });
        }

        timeline.innerHTML = events.map(event => `
            <div class="timeline-item">
                <div class="timeline-title">${escapeHtml(event.title)}</div>
                <div class="timeline-time">${formatDateTime(event.time)}</div>
            </div>
        `).join('');
    }

    function initializeMap(incident) {
        const incidentLocation = {
            lat: incident.coordinates.latitude,
            lng: incident.coordinates.longitude
        };

        // Initialize map
        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 14,
            center: incidentLocation,
            mapTypeControl: true,
            fullscreenControl: true
        });

        // Add incident marker
        new google.maps.Marker({
            position: incidentLocation,
            map: map,
            title: incident.referenceNumber,
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
        });

        // If we have responder location, show route
        if (responderLocation && responderLocation.latitude && responderLocation.longitude) {
            const responderPos = {
                lat: responderLocation.latitude,
                lng: responderLocation.longitude
            };

            // Add responder marker
            new google.maps.Marker({
                position: responderPos,
                map: map,
                title: 'Your Location',
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                }
            });

            // Calculate and display route
            directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer({
                map: map,
                suppressMarkers: false
            });

            calculateRoute(responderPos, incidentLocation);
        }

        // Navigation button
        document.getElementById("navigateBtn").addEventListener('click', () => {
            openNavigation(incidentLocation);
        });

        // Get Directions button
        document.getElementById("getDirectionsBtn").addEventListener('click', () => {
            if (responderLocation) {
                const responderPos = {
                    lat: responderLocation.latitude,
                    lng: responderLocation.longitude
                };
                calculateRoute(responderPos, incidentLocation);
            } else {
                // Get current location
                getCurrentLocationAndRoute(incidentLocation);
            }
        });
    }

    function calculateRoute(origin, destination) {
        const request = {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        };

        directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(result);

                // Display route info
                const route = result.routes[0].legs[0];
                document.getElementById("routeDistance").textContent = route.distance.text;
                document.getElementById("routeDuration").textContent = route.duration.text;
                document.getElementById("routeInfo").style.display = 'grid';
            } else {
                console.error('Directions request failed:', status);
                alert('Could not calculate route. Please try again.');
            }
        });
    }

    function getCurrentLocationAndRoute(destination) {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const origin = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                calculateRoute(origin, destination);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Failed to get your location. Please enable location services.');
            }
        );
    }

    function openNavigation(destination) {
        // Open Google Maps with directions
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
        window.open(url, '_blank');
    }

    async function handleAcceptIncident() {
        if (!confirm('Are you sure you want to accept this incident?')) return;

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/accept`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                alert('Incident accepted successfully!');
                location.reload();
            } else {
                throw new Error(result.message || 'Failed to accept incident');
            }
        } catch (error) {
            console.error('Error accepting incident:', error);
            alert(`Failed to accept incident: ${error.message}`);
        }
    }

    async function handleStartIncident() {
        if (!confirm('Start responding to this incident?')) return;

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/in-progress`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                alert('Incident status updated!');
                location.reload();
            } else {
                throw new Error(result.message || 'Failed to update incident');
            }
        } catch (error) {
            console.error('Error updating incident:', error);
            alert(`Failed to update incident: ${error.message}`);
        }
    }

    async function handleResolveIncident() {
        if (!confirm('Mark this incident as resolved?')) return;

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/resolve`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                alert('Incident resolved successfully!');
                window.location.href = 'responder-incidents.html';
            } else {
                throw new Error(result.message || 'Failed to resolve incident');
            }
        } catch (error) {
            console.error('Error resolving incident:', error);
            alert(`Failed to resolve incident: ${error.message}`);
        }
    }

    async function handleEscalateIncident() {
        if (!confirm('Escalate this incident to higher priority?')) return;

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/escalate`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                alert('Incident escalated successfully!');
                location.reload();
            } else {
                throw new Error(result.message || 'Failed to escalate incident');
            }
        } catch (error) {
            console.error('Error escalating incident:', error);
            alert(`Failed to escalate incident: ${error.message}`);
        }
    }

    function showError(message) {
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
        document.getElementById("errorMessage").textContent = message;
    }

    function getPriorityText(type) {
        const priorities = {
            'Fire': 'Critical',
            'Medical': 'High',
            'Accident': 'High',
            'Crime': 'Medium',
            'Flood': 'Medium',
            'Other': 'Low'
        };
        return priorities[type] || 'Medium';
    }

    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});