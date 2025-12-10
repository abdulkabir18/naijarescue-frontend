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
//     const welcomeName = document.getElementById("welcomeName");
//     const statusToggle = document.getElementById("statusToggle");
//     const statusLabel = document.getElementById("statusLabel");
//     const currentStatus = document.getElementById("currentStatus");
//     const updateLocationBtn = document.getElementById("updateLocationBtn");

//     // Event Listeners
//     menuToggle.addEventListener("click", () => responderSidebar.classList.toggle("active"));
//     logoutBtn.addEventListener("click", (e) => {
//         e.preventDefault();
//         logoutUser();
//     });

//     // Status Toggle
//     statusToggle.addEventListener("change", async (e) => {
//         const newStatus = e.target.checked ? 'Available' : 'Offline';
//         await updateResponderStatus(newStatus);
//     });

//     // Update Location
//     updateLocationBtn.addEventListener("click", () => {
//         updateCurrentLocation();
//     });

//     let responderId = null;

//     // Load responder profile and dashboard data
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
//             welcomeName.textContent = responder.userFullName.split(' ')[0];
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
//             currentStatus.textContent = status;

//             // Load dashboard data
//             await Promise.all([
//                 loadDashboardStats(responderId),
//                 loadActiveIncidents(responderId),
//                 loadRecentActivity(responderId)
//             ]);
//         }
//     } catch (error) {
//         console.error('Error loading responder profile:', error);
//         alert('Failed to load profile. Please refresh the page.');
//     }

//     async function updateResponderStatus(newStatus) {
//         try {
//             const statusValue = newStatus === 'Available' ? 1 : 3; // 1=Available, 3=Offline
            
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
//                 currentStatus.textContent = newStatus;
//                 showFeedback('formFeedback', `Status updated to ${newStatus}`, 'success');
//             } else {
//                 throw new Error(result.message || 'Failed to update status');
//             }
//         } catch (error) {
//             console.error('Error updating status:', error);
//             alert(`Failed to update status: ${error.message}`);
//             // Revert toggle
//             statusToggle.checked = !statusToggle.checked;
//         }
//     }

//     function updateCurrentLocation() {
//         if (!navigator.geolocation) {
//             alert('Geolocation is not supported by your browser.');
//             return;
//         }

//         navigator.geolocation.getCurrentPosition(
//             async (position) => {
//                 const { latitude, longitude } = position.coords;

//                 try {
//                     const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/${responderId}/location`, {
//                         method: 'PATCH',
//                         headers: {
//                             "Authorization": `Bearer ${token}`,
//                             "Content-Type": "application/json"
//                         },
//                         body: JSON.stringify({ latitude, longitude })
//                     });

//                     const result = await response.json();

//                     if (response.ok && result.succeeded) {
//                         alert('Location updated successfully!');
//                     } else {
//                         throw new Error(result.message || 'Failed to update location');
//                     }
//                 } catch (error) {
//                     console.error('Error updating location:', error);
//                     alert(`Failed to update location: ${error.message}`);
//                 }
//             },
//             (error) => {
//                 console.error('Geolocation error:', error);
//                 alert('Failed to get your location. Please enable location services.');
//             }
//         );
//     }

//     async function loadDashboardStats(responderId) {
//         try {
//             // For now, we calculate stats from incident data
//             // In production, use dedicated stats endpoint
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Responder/${responderId}`, {
//                 headers: { "Authorization": `Bearer ${token}` }
//             });

//             if (!response.ok) throw new Error('Failed to load stats');
//             const result = await response.json();

//             // Placeholder stats - replace with actual API data when available
//             document.getElementById("assignedIncidents").textContent = "0";
//             document.getElementById("inProgressIncidents").textContent = "0";
//             document.getElementById("resolvedToday").textContent = "0";
//             document.getElementById("totalResolved").textContent = "0";
//         } catch (error) {
//             console.error('Error loading stats:', error);
//         }
//     }

//     async function loadActiveIncidents(responderId) {
//         const container = document.getElementById("activeIncidents");

//         try {
//             // Get all incidents and filter for this responder
//             // Note: Ideally, backend should have endpoint like /api/v1/Incident/responder/{responderId}
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/all?pageSize=100`, {
//                 headers: { "Authorization": `Bearer ${token}` }
//             });

//             if (!response.ok) throw new Error('Failed to load incidents');
//             const result = await response.json();

//             if (result.succeeded && result.data) {
//                 const allIncidents = result.data.data || result.data;
                
//                 // Filter incidents assigned to this responder
//                 const myIncidents = allIncidents.filter(incident => 
//                     incident.assignedResponders?.some(r => r.responderId === responderId)
//                 );

//                 // Get active incidents (not resolved or closed)
//                 const activeIncidents = myIncidents.filter(i => 
//                     i.status !== 'Resolved' && i.status !== 'Closed'
//                 ).slice(0, 5);

//                 if (activeIncidents.length > 0) {
//                     container.innerHTML = activeIncidents.map(incident => {
//                         const location = formatAddress(incident.address) || 'Location unavailable';
//                         return `
//                             <div class="incident-item" onclick="window.location.href='responder-incident-details.html?id=${incident.id}'">
//                                 <div class="incident-header">
//                                     <div>
//                                         <div class="incident-ref">${escapeHtml(incident.referenceNumber)}</div>
//                                         <div class="incident-type">${formatIncidentType(incident.type)}</div>
//                                     </div>
//                                     <span class="status-badge ${getStatusClass(incident.status)}">${getStatusDisplay(incident.status)}</span>
//                                 </div>
//                                 <div class="incident-location">
//                                     <i class="ri-map-pin-line"></i>
//                                     ${escapeHtml(location)}
//                                 </div>
//                             </div>
//                         `;
//                     }).join('');
//                 } else {
//                     container.innerHTML = `
//                         <div class="empty-state">
//                             <i class="ri-checkbox-circle-line"></i>
//                             <p>No active incidents</p>
//                         </div>
//                     `;
//                 }
//             }
//         } catch (error) {
//             console.error('Error loading incidents:', error);
//             container.innerHTML = `
//                 <div class="empty-state">
//                     <i class="ri-error-warning-line"></i>
//                     <p>Failed to load incidents</p>
//                 </div>
//             `;
//         }
//     }

//     async function loadRecentActivity(responderId) {
//         const container = document.getElementById("recentActivity");

//         // Placeholder activity - replace with actual API data
//         container.innerHTML = `
//             <div class="empty-state">
//                 <i class="ri-time-line"></i>
//                 <p>No recent activity</p>
//             </div>
//         `;
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
    const welcomeName = document.getElementById("welcomeName");
    const statusToggle = document.getElementById("statusToggle");
    const statusLabel = document.getElementById("statusLabel");
    const currentStatus = document.getElementById("currentStatus");
    const updateLocationBtn = document.getElementById("updateLocationBtn");

    // Event Listeners
    menuToggle.addEventListener("click", () => responderSidebar.classList.toggle("active"));
    
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Status Toggle
    statusToggle.addEventListener("change", async (e) => {
        const newStatus = e.target.checked ? 'Available' : 'Offline';
        await updateResponderStatus(newStatus);
    });

    // Update Location
    updateLocationBtn.addEventListener("click", () => {
        updateCurrentLocation();
    });

    let responderId = null;

    // Load responder profile and dashboard data
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
            welcomeName.textContent = responder.userFullName.split(' ')[0];
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
            currentStatus.textContent = status;

            // Load dashboard data
            await Promise.all([
                loadDashboardStats(responderId),
                loadActiveIncidents(responderId),
                loadRecentActivity(responderId)
            ]);
        }
    } catch (error) {
        console.error('Error loading responder profile:', error);
        alert('Failed to load profile. Please refresh the page.');
    }

    async function updateResponderStatus(newStatus) {
        try {
            const statusValue = newStatus === 'Available' ? 1 : 3; // 1=Available, 3=Offline
            
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
                currentStatus.textContent = newStatus;
                showFeedback('formFeedback', `Status updated to ${newStatus}`, 'success');
            } else {
                throw new Error(result.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert(`Failed to update status: ${error.message}`);
            // Revert toggle
            statusToggle.checked = !statusToggle.checked;
        }
    }

    function updateCurrentLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

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

                    if (response.ok && result.succeeded) {
                        alert('Location updated successfully!');
                    } else {
                        throw new Error(result.message || 'Failed to update location');
                    }
                } catch (error) {
                    console.error('Error updating location:', error);
                    alert(`Failed to update location: ${error.message}`);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Failed to get your location. Please enable location services.');
            }
        );
    }

    async function loadDashboardStats(responderId) {
        try {
            // Get incidents assigned to this responder
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/responder/${responderId}/incidents`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load stats');
            const result = await response.json();

            if (result.succeeded && result.data) {
                const incidents = result.data;
                
                // Calculate stats
                const assigned = incidents.length;
                const inProgress = incidents.filter(i => i.status === 'InProgress').length;
                const today = new Date().toDateString();
                const resolvedToday = incidents.filter(i => 
                    i.status === 'Resolved' && new Date(i.occurredAt).toDateString() === today
                ).length;
                const totalResolved = incidents.filter(i => i.status === 'Resolved').length;

                // Update UI
                document.getElementById("assignedIncidents").textContent = assigned;
                document.getElementById("inProgressIncidents").textContent = inProgress;
                document.getElementById("resolvedToday").textContent = resolvedToday;
                document.getElementById("totalResolved").textContent = totalResolved;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Set defaults
            document.getElementById("assignedIncidents").textContent = "0";
            document.getElementById("inProgressIncidents").textContent = "0";
            document.getElementById("resolvedToday").textContent = "0";
            document.getElementById("totalResolved").textContent = "0";
        }
    }

    async function loadActiveIncidents(responderId) {
        const container = document.getElementById("activeIncidents");

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/responder/${responderId}/incidents`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to load incidents');
            const result = await response.json();

            if (result.succeeded && result.data) {
                const allIncidents = result.data;
                
                // Get active incidents (not resolved or closed)
                const activeIncidents = allIncidents.filter(i => 
                    i.status !== 'Resolved' && i.status !== 'Closed' && i.status !== 'Cancelled'
                ).slice(0, 5);

                if (activeIncidents.length > 0) {
                    container.innerHTML = activeIncidents.map(incident => {
                        const location = formatAddress(incident.address) || 'Location unavailable';
                        return `
                            <div class="incident-item" onclick="window.location.href='responder-incident-details.html?id=${incident.id}'">
                                <div class="incident-header">
                                    <div>
                                        <div class="incident-ref">${escapeHtml(incident.referenceNumber)}</div>
                                        <div class="incident-type">${formatIncidentType(incident.type)}</div>
                                    </div>
                                    <span class="status-badge ${getStatusClass(incident.status)}">${getStatusDisplay(incident.status)}</span>
                                </div>
                                <div class="incident-location">
                                    <i class="ri-map-pin-line"></i>
                                    ${escapeHtml(location)}
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="ri-checkbox-circle-line"></i>
                            <p>No active incidents</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading incidents:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="ri-error-warning-line"></i>
                    <p>Failed to load incidents</p>
                </div>
            `;
        }
    }

    async function loadRecentActivity(responderId) {
        const container = document.getElementById("recentActivity");

        // Placeholder activity - replace with actual API data when available
        container.innerHTML = `
            <div class="empty-state">
                <i class="ri-time-line"></i>
                <p>No recent activity</p>
            </div>
        `;
    }
});