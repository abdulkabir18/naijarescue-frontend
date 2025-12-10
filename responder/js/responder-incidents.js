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

//     if (token) {
//         await window.notificationManager.initialize(token);
//     }

//     // DOM Elements
//     const menuToggle = document.getElementById("menuToggle");
//     const responderSidebar = document.getElementById("responderSidebar");
//     const logoutBtn = document.getElementById("logoutBtn");
//     const refreshBtn = document.getElementById("refreshBtn");
//     const statusToggle = document.getElementById("statusToggle");
//     const statusLabel = document.getElementById("statusLabel");

//     // Tab elements
//     const tabBtns = document.querySelectorAll(".tab-btn");
//     const tabContents = document.querySelectorAll(".tab-content");

//     // Filter elements
//     const availableTypeFilter = document.getElementById("availableTypeFilter");
//     const availableSortFilter = document.getElementById("availableSortFilter");
//     const myTypeFilter = document.getElementById("myTypeFilter");
//     const myStatusFilter = document.getElementById("myStatusFilter");

//     // Modal elements
//     const acceptModal = document.getElementById("acceptModal");
//     const closeAcceptModal = document.getElementById("closeAcceptModal");
//     const cancelAcceptBtn = document.getElementById("cancelAcceptBtn");
//     const confirmAcceptBtn = document.getElementById("confirmAcceptBtn");

//     let responderId = null;
//     let allIncidents = [];
//     let myIncidents = [];
//     let selectedIncidentId = null;

//     // Event Listeners
//     menuToggle.addEventListener("click", () => responderSidebar.classList.toggle("active"));
    
//     logoutBtn.addEventListener("click", (e) => {
//         e.preventDefault();
//         logoutUser();
//     });

//     refreshBtn.addEventListener("click", () => {
//         loadAllData();
//     });

//     // Tab switching
//     tabBtns.forEach(btn => {
//         btn.addEventListener("click", () => {
//             const tabName = btn.dataset.tab;
            
//             // Update active states
//             tabBtns.forEach(b => b.classList.remove("active"));
//             btn.classList.add("active");
            
//             tabContents.forEach(content => {
//                 content.classList.remove("active");
//                 if (content.id === `${tabName}-tab`) {
//                     content.classList.add("active");
//                 }
//             });
//         });
//     });

//     // Filter listeners
//     availableTypeFilter.addEventListener("change", () => renderAvailableIncidents());
//     availableSortFilter.addEventListener("change", () => renderAvailableIncidents());
//     myTypeFilter.addEventListener("change", () => renderMyIncidents());
//     myStatusFilter.addEventListener("change", () => renderMyIncidents());

//     // Modal listeners
//     closeAcceptModal.addEventListener("click", () => acceptModal.classList.remove("active"));
//     cancelAcceptBtn.addEventListener("click", () => acceptModal.classList.remove("active"));
//     confirmAcceptBtn.addEventListener("click", () => handleAcceptIncident());

//     // Close modal on outside click
//     acceptModal.addEventListener("click", (e) => {
//         if (e.target === acceptModal) {
//             acceptModal.classList.remove("active");
//         }
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

//             // Load incidents data
//             await loadAllData();
//         }
//     } catch (error) {
//         console.error('Error loading responder profile:', error);
//         alert('Failed to load profile. Please refresh the page.');
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

//     async function loadAllData() {
//         refreshBtn.disabled = true;
//         refreshBtn.innerHTML = '<i class="ri-loader-4-line"></i> Loading...';

//         try {
//             await Promise.all([
//                 loadAvailableIncidents(),
//                 loadMyIncidents()
//             ]);
//         } finally {
//             refreshBtn.disabled = false;
//             refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> Refresh';
//         }
//     }

//     async function loadAvailableIncidents() {
//         const container = document.getElementById("availableIncidents");
//         container.innerHTML = '<div class="loading-state"><div class="spinner-small"></div><p>Loading available incidents...</p></div>';

//         try {
//             // Get all pending/dispatched incidents
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/all?pageSize=100`, {
//                 headers: { "Authorization": `Bearer ${token}` }
//             });

//             if (!response.ok) throw new Error('Failed to load incidents');
//             const result = await response.json();

//             if (result.succeeded && result.data) {
//                 const incidents = result.data.data || result.data;
                
//                 // Filter for available incidents (not assigned to this responder yet)
//                 allIncidents = incidents.filter(incident => {
//                     const isPendingOrDispatched = incident.status === 'Pending' || incident.status === 'Dispatched';
//                     const notAssignedToMe = !incident.assignedResponders?.some(r => r.responderId === responderId);
//                     return isPendingOrDispatched && notAssignedToMe;
//                 });

//                 updateBadge("availableBadge", allIncidents.length);
//                 renderAvailableIncidents();
//             }
//         } catch (error) {
//             console.error('Error loading available incidents:', error);
//             container.innerHTML = '<div class="empty-state"><i class="ri-error-warning-line"></i><h3>Failed to load incidents</h3><p>Please try again</p></div>';
//         }
//     }

//     async function loadMyIncidents() {
//         const container = document.getElementById("myIncidents");
//         container.innerHTML = '<div class="loading-state"><div class="spinner-small"></div><p>Loading your incidents...</p></div>';

//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/responder/${responderId}/incidents`, {
//                 headers: { "Authorization": `Bearer ${token}` }
//             });

//             if (!response.ok) throw new Error('Failed to load incidents');
//             const result = await response.json();

//             if (result.succeeded && result.data) {
//                 // Filter for active incidents only
//                 myIncidents = result.data.filter(i => 
//                     i.status !== 'Resolved' && i.status !== 'Closed' && i.status !== 'Cancelled'
//                 );

//                 updateBadge("myIncidentsBadge", myIncidents.length);
//                 renderMyIncidents();
//             }
//         } catch (error) {
//             console.error('Error loading my incidents:', error);
//             container.innerHTML = '<div class="empty-state"><i class="ri-error-warning-line"></i><h3>Failed to load incidents</h3><p>Please try again</p></div>';
//         }
//     }

//     function renderAvailableIncidents() {
//         const container = document.getElementById("availableIncidents");
//         let filtered = [...allIncidents];

//         // Apply type filter
//         const typeFilter = availableTypeFilter.value;
//         if (typeFilter) {
//             filtered = filtered.filter(i => i.type === typeFilter);
//         }

//         // Apply sort
//         const sortFilter = availableSortFilter.value;
//         if (sortFilter === 'newest') {
//             filtered.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
//         } else if (sortFilter === 'oldest') {
//             filtered.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
//         }

//         if (filtered.length === 0) {
//             container.innerHTML = '<div class="empty-state"><i class="ri-notification-off-line"></i><h3>No Available Incidents</h3><p>There are no new incidents at the moment</p></div>';
//             return;
//         }

//         container.innerHTML = filtered.map(incident => createIncidentCard(incident, true)).join('');

//         // Add event listeners to accept buttons
//         container.querySelectorAll('.btn-accept').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 e.stopPropagation();
//                 const incidentId = btn.dataset.incidentId;
//                 showAcceptModal(incidentId);
//             });
//         });

//         // Add event listeners to view buttons
//         container.querySelectorAll('.btn-view-details').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 e.stopPropagation();
//                 const incidentId = btn.dataset.incidentId;
//                 window.location.href = `responder-incident-details.html?id=${incidentId}`;
//             });
//         });
//     }

//     function renderMyIncidents() {
//         const container = document.getElementById("myIncidents");
//         let filtered = [...myIncidents];

//         // Apply type filter
//         const typeFilter = myTypeFilter.value;
//         if (typeFilter) {
//             filtered = filtered.filter(i => i.type === typeFilter);
//         }

//         // Apply status filter
//         const statusFilter = myStatusFilter.value;
//         if (statusFilter) {
//             filtered = filtered.filter(i => i.status === statusFilter);
//         }

//         if (filtered.length === 0) {
//             container.innerHTML = '<div class="empty-state"><i class="ri-file-list-line"></i><h3>No Active Incidents</h3><p>You have no active incidents at the moment</p></div>';
//             return;
//         }

//         container.innerHTML = filtered.map(incident => createIncidentCard(incident, false)).join('');

//         // Add event listeners to action buttons
//         container.querySelectorAll('.btn-in-progress').forEach(btn => {
//             btn.addEventListener('click', async (e) => {
//                 e.stopPropagation();
//                 const incidentId = btn.dataset.incidentId;
//                 await updateIncidentStatus(incidentId, 'in-progress');
//             });
//         });

//         container.querySelectorAll('.btn-resolve').forEach(btn => {
//             btn.addEventListener('click', async (e) => {
//                 e.stopPropagation();
//                 const incidentId = btn.dataset.incidentId;
//                 await updateIncidentStatus(incidentId, 'resolve');
//             });
//         });

//         container.querySelectorAll('.btn-view-details').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 e.stopPropagation();
//                 const incidentId = btn.dataset.incidentId;
//                 window.location.href = `responder-incident-details.html?id=${incidentId}`;
//             });
//         });
//     }

//     function createIncidentCard(incident, isAvailable) {
//         const typeClass = incident.type.toLowerCase();
//         const location = formatAddress(incident.address) || 'Location unavailable';
//         const timeAgo = formatTimeAgo(incident.occurredAt);
//         const isUrgent = isUrgentIncident(incident.occurredAt);
//         const confidence = incident.confidence ? Math.round(incident.confidence * 100) : null;

//         let actionsHtml = '';
//         if (isAvailable) {
//             actionsHtml = `
//                 <button class="btn-accept" data-incident-id="${incident.id}">
//                     <i class="ri-check-line"></i> Accept
//                 </button>
//                 <button class="btn-view-details" data-incident-id="${incident.id}">
//                     <i class="ri-eye-line"></i> View
//                 </button>
//             `;
//         } else {
//             // For My Active Incidents - always show action buttons
//             if (incident.status === 'Pending' || incident.status === 'Dispatched') {
//                 actionsHtml = `
//                     <button class="btn-in-progress" data-incident-id="${incident.id}">
//                         <i class="ri-play-line"></i> Start
//                     </button>
//                     <button class="btn-view-details" data-incident-id="${incident.id}">
//                         <i class="ri-eye-line"></i> View
//                     </button>
//                 `;
//             } else if (incident.status === 'InProgress') {
//                 actionsHtml = `
//                     <button class="btn-resolve" data-incident-id="${incident.id}">
//                         <i class="ri-check-double-line"></i> Resolve
//                     </button>
//                     <button class="btn-view-details" data-incident-id="${incident.id}">
//                         <i class="ri-eye-line"></i> View
//                     </button>
//                 `;
//             } else {
//                 // For any other status, at least show view button
//                 actionsHtml = `
//                     <button class="btn-view-details" data-incident-id="${incident.id}">
//                         <i class="ri-eye-line"></i> View Details
//                     </button>
//                 `;
//             }
//         }

//         return `
//             <div class="incident-card ${isUrgent ? 'urgent' : ''}" data-incident-id="${incident.id}">
//                 <div class="incident-card-header">
//                     <div>
//                         <div class="incident-ref">${escapeHtml(incident.referenceNumber)}</div>
//                         ${isUrgent ? '<span class="urgent-badge"><i class="ri-alarm-warning-fill"></i> URGENT</span>' : ''}
//                     </div>
//                     <span class="incident-type-badge ${typeClass}">
//                         <i class="ri-${getIncidentIcon(incident.type)}"></i>
//                         ${formatIncidentType(incident.type)}
//                     </span>
//                 </div>
//                 <div class="incident-card-body">
//                     <div class="incident-title">${escapeHtml(incident.title || formatIncidentType(incident.type))}</div>
//                     <div class="incident-meta">
//                         <div class="incident-meta-item">
//                             <i class="ri-map-pin-line"></i>
//                             <span>${escapeHtml(location)}</span>
//                         </div>
//                         <div class="incident-meta-item">
//                             <i class="ri-time-line"></i>
//                             <span>${timeAgo}</span>
//                         </div>
//                         ${confidence ? `
//                         <div class="incident-confidence">
//                             <div class="confidence-bar">
//                                 <div class="confidence-fill" style="width: ${confidence}%"></div>
//                             </div>
//                             <span class="confidence-value">${confidence}%</span>
//                         </div>
//                         ` : ''}
//                     </div>
//                 </div>
//                 <div class="incident-card-footer">
//                     ${actionsHtml}
//                 </div>
//             </div>
//         `;
//     }

//     function showAcceptModal(incidentId) {
//         selectedIncidentId = incidentId;
//         const incident = allIncidents.find(i => i.id === incidentId);
        
//         if (!incident) return;

//         const location = formatAddress(incident.address) || 'Location unavailable';
//         const timeAgo = formatTimeAgo(incident.occurredAt);

//         document.getElementById("acceptIncidentSummary").innerHTML = `
//             <div class="incident-meta">
//                 <div class="incident-meta-item">
//                     <strong>Reference:</strong> ${escapeHtml(incident.referenceNumber)}
//                 </div>
//                 <div class="incident-meta-item">
//                     <strong>Type:</strong> ${formatIncidentType(incident.type)}
//                 </div>
//                 <div class="incident-meta-item">
//                     <strong>Location:</strong> ${escapeHtml(location)}
//                 </div>
//                 <div class="incident-meta-item">
//                     <strong>Time:</strong> ${timeAgo}
//                 </div>
//             </div>
//         `;

//         acceptModal.classList.add("active");
//     }

//     async function handleAcceptIncident() {
//         if (!selectedIncidentId) return;

//         confirmAcceptBtn.disabled = true;
//         confirmAcceptBtn.innerHTML = '<i class="ri-loader-4-line"></i> Accepting...';

//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${selectedIncidentId}/accept`, {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Content-Type": "application/json"
//                 }
//             });

//             const result = await response.json();

//             if (response.ok && result.succeeded) {
//                 acceptModal.classList.remove("active");
//                 alert('Incident accepted successfully!');
//                 await loadAllData();
//             } else {
//                 throw new Error(result.message || 'Failed to accept incident');
//             }
//         } catch (error) {
//             console.error('Error accepting incident:', error);
//             alert(`Failed to accept incident: ${error.message}`);
//         } finally {
//             confirmAcceptBtn.disabled = false;
//             confirmAcceptBtn.innerHTML = '<i class="ri-check-line"></i> Accept Incident';
//         }
//     }

//     async function updateIncidentStatus(incidentId, action) {
//         const actionText = action === 'in-progress' ? 'mark as in progress' : 'resolve';
//         if (!confirm(`Are you sure you want to ${actionText} this incident?`)) return;

//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/${action}`, {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Content-Type": "application/json"
//                 }
//             });

//             const result = await response.json();

//             if (response.ok && result.succeeded) {
//                 alert(`Incident ${actionText === 'resolve' ? 'resolved' : 'updated'} successfully!`);
//                 await loadAllData();
//             } else {
//                 throw new Error(result.message || 'Failed to update incident');
//             }
//         } catch (error) {
//             console.error('Error updating incident:', error);
//             alert(`Failed to update incident: ${error.message}`);
//         }
//     }

//     function updateBadge(badgeId, count) {
//         const badge = document.getElementById(badgeId);
//         if (badge) {
//             badge.textContent = count;
//         }
//     }

//     function isUrgentIncident(occurredAt) {
//         const incidentTime = new Date(occurredAt);
//         const now = new Date();
//         const diffMinutes = (now - incidentTime) / (1000 * 60);
//         return diffMinutes <= 30;
//     }

//     function getIncidentIcon(type) {
//         const icons = {
//             'Fire': 'fire-fill',
//             'Medical': 'heart-pulse-line',
//             'Accident': 'car-fill',
//             'Crime': 'shield-star-line',
//             'Flood': 'flood-line',
//             'Other': 'alert-line'
//         };
//         return icons[type] || icons['Other'];
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

    if (token) {
        await window.notificationManager.initialize(token);
    }

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const responderSidebar = document.getElementById("responderSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const statusToggle = document.getElementById("statusToggle");
    const statusLabel = document.getElementById("statusLabel");

    // Tab elements
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    // Filter elements
    const availableTypeFilter = document.getElementById("availableTypeFilter");
    const availableSortFilter = document.getElementById("availableSortFilter");
    const myTypeFilter = document.getElementById("myTypeFilter");
    const myStatusFilter = document.getElementById("myStatusFilter");

    // Modal elements
    const acceptModal = document.getElementById("acceptModal");
    const closeAcceptModal = document.getElementById("closeAcceptModal");
    const cancelAcceptBtn = document.getElementById("cancelAcceptBtn");
    const confirmAcceptBtn = document.getElementById("confirmAcceptBtn");

    let responderId = null;
    let allIncidents = [];
    let myIncidents = [];
    let selectedIncidentId = null;

    // Event Listeners
    menuToggle.addEventListener("click", () => responderSidebar.classList.toggle("active"));
    
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    refreshBtn.addEventListener("click", () => {
        loadAllData();
    });

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabName = btn.dataset.tab;
            
            // Update active states
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === `${tabName}-tab`) {
                    content.classList.add("active");
                }
            });
        });
    });

    // Filter listeners
    availableTypeFilter.addEventListener("change", () => renderAvailableIncidents());
    availableSortFilter.addEventListener("change", () => renderAvailableIncidents());
    myTypeFilter.addEventListener("change", () => renderMyIncidents());
    myStatusFilter.addEventListener("change", () => renderMyIncidents());

    // Modal listeners
    closeAcceptModal.addEventListener("click", () => acceptModal.classList.remove("active"));
    cancelAcceptBtn.addEventListener("click", () => acceptModal.classList.remove("active"));
    confirmAcceptBtn.addEventListener("click", () => handleAcceptIncident());

    // Close modal on outside click
    acceptModal.addEventListener("click", (e) => {
        if (e.target === acceptModal) {
            acceptModal.classList.remove("active");
        }
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

            // Update UI
            document.getElementById("responderName").textContent = responder.userFullName;
            document.getElementById("agencyName").textContent = responder.agencyName;

            if (responder.profilePictureUrl) {
                document.getElementById("responderAvatar").src = `${AppConfig.API_BASE_URL}/${responder.profilePictureUrl}`;
            } else {
                document.getElementById("responderAvatar").src = generateInitialsAvatar(responder.userFullName);
            }

            // Set current status
            const status = responder.status;
            statusToggle.checked = (status === 'Available');
            statusLabel.textContent = status;

            // Load incidents data
            await loadAllData();
        }
    } catch (error) {
        console.error('Error loading responder profile:', error);
        alert('Failed to load profile. Please refresh the page.');
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

    async function loadAllData() {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="ri-loader-4-line"></i> Loading...';

        try {
            await Promise.all([
                loadAvailableIncidents(),
                loadMyIncidents()
            ]);
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="ri-refresh-line"></i> Refresh';
        }
    }

    async function loadAvailableIncidents() {
        const container = document.getElementById("availableIncidents");
        container.innerHTML = '<div class="loading-state"><div class="spinner-small"></div><p>Loading available incidents...</p></div>';

        try {
            // Get all pending/dispatched incidents
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/all?pageSize=100`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load incidents');
            const result = await response.json();

            if (result.succeeded && result.data) {
                const incidents = result.data.data || result.data;
                
                // Filter for available incidents (not assigned to this responder yet)
                allIncidents = incidents.filter(incident => {
                    const isPendingOrDispatched = incident.status === 'Pending' || incident.status === 'Dispatched';
                    const notAssignedToMe = !incident.assignedResponders?.some(r => r.responderId === responderId);
                    return isPendingOrDispatched && notAssignedToMe;
                });

                updateBadge("availableBadge", allIncidents.length);
                renderAvailableIncidents();
            }
        } catch (error) {
            console.error('Error loading available incidents:', error);
            container.innerHTML = '<div class="empty-state"><i class="ri-error-warning-line"></i><h3>Failed to load incidents</h3><p>Please try again</p></div>';
        }
    }

    async function loadMyIncidents() {
        const container = document.getElementById("myIncidents");
        container.innerHTML = '<div class="loading-state"><div class="spinner-small"></div><p>Loading your incidents...</p></div>';

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/responder/${responderId}/incidents`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load incidents');
            const result = await response.json();

            if (result.succeeded && result.data) {
                // Filter for active incidents only (exclude Resolved, Cancelled, Invalid)
                myIncidents = result.data.filter(i => 
                    i.status !== 'Resolved' && i.status !== 'Cancelled' && i.status !== 'Invalid'
                );

                updateBadge("myIncidentsBadge", myIncidents.length);
                renderMyIncidents();
            }
        } catch (error) {
            console.error('Error loading my incidents:', error);
            container.innerHTML = '<div class="empty-state"><i class="ri-error-warning-line"></i><h3>Failed to load incidents</h3><p>Please try again</p></div>';
        }
    }

    function renderAvailableIncidents() {
        const container = document.getElementById("availableIncidents");
        let filtered = [...allIncidents];

        // Apply type filter
        const typeFilter = availableTypeFilter.value;
        if (typeFilter) {
            filtered = filtered.filter(i => i.type === typeFilter);
        }

        // Apply sort
        const sortFilter = availableSortFilter.value;
        if (sortFilter === 'newest') {
            filtered.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
        } else if (sortFilter === 'oldest') {
            filtered.sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-notification-off-line"></i><h3>No Available Incidents</h3><p>There are no new incidents at the moment</p></div>';
            return;
        }

        container.innerHTML = filtered.map(incident => createIncidentCard(incident, true)).join('');

        // Add event listeners to accept buttons
        container.querySelectorAll('.btn-accept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const incidentId = btn.dataset.incidentId;
                showAcceptModal(incidentId);
            });
        });

        // Add event listeners to view buttons
        container.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const incidentId = btn.dataset.incidentId;
                window.location.href = `responder-incident-details.html?id=${incidentId}`;
            });
        });
    }

    function renderMyIncidents() {
        const container = document.getElementById("myIncidents");
        let filtered = [...myIncidents];

        // Apply type filter
        const typeFilter = myTypeFilter.value;
        if (typeFilter) {
            filtered = filtered.filter(i => i.type === typeFilter);
        }

        // Apply status filter
        const statusFilter = myStatusFilter.value;
        if (statusFilter) {
            filtered = filtered.filter(i => i.status === statusFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="ri-file-list-line"></i><h3>No Active Incidents</h3><p>You have no active incidents at the moment</p></div>';
            return;
        }

        container.innerHTML = filtered.map(incident => createIncidentCard(incident, false)).join('');

        // Add event listeners to action buttons
        container.querySelectorAll('.btn-in-progress').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const incidentId = btn.dataset.incidentId;
                await updateIncidentStatus(incidentId, 'in-progress');
            });
        });

        container.querySelectorAll('.btn-resolve').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const incidentId = btn.dataset.incidentId;
                await updateIncidentStatus(incidentId, 'resolve');
            });
        });

        container.querySelectorAll('.btn-view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const incidentId = btn.dataset.incidentId;
                window.location.href = `responder-incident-details.html?id=${incidentId}`;
            });
        });
    }

    function createIncidentCard(incident, isAvailable) {
        const typeClass = incident.type.toLowerCase();
        const location = formatAddress(incident.address) || 'Location unavailable';
        const timeAgo = formatTimeAgo(incident.occurredAt);
        const isUrgent = isUrgentIncident(incident.occurredAt);
        const confidence = incident.confidence ? Math.round(incident.confidence * 100) : null;

        let actionsHtml = '';
        if (isAvailable) {
            actionsHtml = `
                <button class="btn-accept" data-incident-id="${incident.id}">
                    <i class="ri-check-line"></i> Accept
                </button>
                <button class="btn-view-details" data-incident-id="${incident.id}">
                    <i class="ri-eye-line"></i> View
                </button>
            `;
        } else {
            // For My Active Incidents - check status
            if (incident.status === 'Pending' || incident.status === 'Reported' || incident.status === 'Analyzed') {
                actionsHtml = `
                    <button class="btn-in-progress" data-incident-id="${incident.id}">
                        <i class="ri-play-line"></i> Start
                    </button>
                    <button class="btn-view-details" data-incident-id="${incident.id}">
                        <i class="ri-eye-line"></i> View
                    </button>
                `;
            } else if (incident.status === 'InProgress' || incident.status === 'Escalated') {
                actionsHtml = `
                    <button class="btn-resolve" data-incident-id="${incident.id}">
                        <i class="ri-check-double-line"></i> Resolve
                    </button>
                    <button class="btn-view-details" data-incident-id="${incident.id}">
                        <i class="ri-eye-line"></i> View
                    </button>
                `;
            } else {
                // For any other status, at least show view button
                actionsHtml = `
                    <button class="btn-view-details" data-incident-id="${incident.id}">
                        <i class="ri-eye-line"></i> View Details
                    </button>
                `;
            }
        }

        return `
            <div class="incident-card ${isUrgent ? 'urgent' : ''}" data-incident-id="${incident.id}">
                <div class="incident-card-header">
                    <div>
                        <div class="incident-ref">${escapeHtml(incident.referenceNumber)}</div>
                        ${isUrgent ? '<span class="urgent-badge"><i class="ri-alarm-warning-fill"></i> URGENT</span>' : ''}
                    </div>
                    <span class="incident-type-badge ${typeClass}">
                        <i class="ri-${getIncidentIcon(incident.type)}"></i>
                        ${formatIncidentType(incident.type)}
                    </span>
                </div>
                <div class="incident-card-body">
                    <div class="incident-title">${escapeHtml(incident.title || formatIncidentType(incident.type))}</div>
                    <div class="incident-meta">
                        <div class="incident-meta-item">
                            <i class="ri-map-pin-line"></i>
                            <span>${escapeHtml(location)}</span>
                        </div>
                        <div class="incident-meta-item">
                            <i class="ri-time-line"></i>
                            <span>${timeAgo}</span>
                        </div>
                        ${confidence ? `
                        <div class="incident-confidence">
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${confidence}%"></div>
                            </div>
                            <span class="confidence-value">${confidence}%</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="incident-card-footer">
                    ${actionsHtml}
                </div>
            </div>
        `;
    }

    function showAcceptModal(incidentId) {
        selectedIncidentId = incidentId;
        const incident = allIncidents.find(i => i.id === incidentId);
        
        if (!incident) return;

        const location = formatAddress(incident.address) || 'Location unavailable';
        const timeAgo = formatTimeAgo(incident.occurredAt);

        document.getElementById("acceptIncidentSummary").innerHTML = `
            <div class="incident-meta">
                <div class="incident-meta-item">
                    <strong>Reference:</strong> ${escapeHtml(incident.referenceNumber)}
                </div>
                <div class="incident-meta-item">
                    <strong>Type:</strong> ${formatIncidentType(incident.type)}
                </div>
                <div class="incident-meta-item">
                    <strong>Location:</strong> ${escapeHtml(location)}
                </div>
                <div class="incident-meta-item">
                    <strong>Time:</strong> ${timeAgo}
                </div>
            </div>
        `;

        acceptModal.classList.add("active");
    }

    async function handleAcceptIncident() {
        if (!selectedIncidentId) return;

        confirmAcceptBtn.disabled = true;
        confirmAcceptBtn.innerHTML = '<i class="ri-loader-4-line"></i> Accepting...';

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${selectedIncidentId}/accept`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                acceptModal.classList.remove("active");
                alert('Incident accepted successfully!');
                await loadAllData();
            } else {
                throw new Error(result.message || 'Failed to accept incident');
            }
        } catch (error) {
            console.error('Error accepting incident:', error);
            alert(`Failed to accept incident: ${error.message}`);
        } finally {
            confirmAcceptBtn.disabled = false;
            confirmAcceptBtn.innerHTML = '<i class="ri-check-line"></i> Accept Incident';
        }
    }

    async function updateIncidentStatus(incidentId, action) {
        const actionText = action === 'in-progress' ? 'mark as in progress' : 'resolve';
        if (!confirm(`Are you sure you want to ${actionText} this incident?`)) return;

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${incidentId}/${action}`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (response.ok && result.succeeded) {
                alert(`Incident ${actionText === 'resolve' ? 'resolved' : 'updated'} successfully!`);
                await loadAllData();
            } else {
                throw new Error(result.message || 'Failed to update incident');
            }
        } catch (error) {
            console.error('Error updating incident:', error);
            alert(`Failed to update incident: ${error.message}`);
        }
    }

    function updateBadge(badgeId, count) {
        const badge = document.getElementById(badgeId);
        if (badge) {
            badge.textContent = count;
        }
    }

    function isUrgentIncident(occurredAt) {
        const incidentTime = new Date(occurredAt);
        const now = new Date();
        const diffMinutes = (now - incidentTime) / (1000 * 60);
        return diffMinutes <= 30;
    }

    function getIncidentIcon(type) {
        const icons = {
            'Fire': 'fire-fill',
            'Medical': 'heart-pulse-line',
            'Accident': 'car-fill',
            'Crime': 'shield-star-line',
            'Flood': 'flood-line',
            'Other': 'alert-line'
        };
        return icons[type] || icons['Other'];
    }
});