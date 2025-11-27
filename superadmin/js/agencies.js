// document.addEventListener("DOMContentLoaded", async () => {
//     const token = protectPage();
//     if (!token) return;

//     if (token) {
//         await window.notificationManager.initialize(token);
//     }
//     await loadAdminProfile(token);

//     // DOM Elements
//     const menuToggle = document.getElementById("menuToggle");
//     const adminSidebar = document.getElementById("adminSidebar");
//     const logoutBtn = document.getElementById("logoutBtn");
//     const agenciesContainer = document.getElementById("agenciesContainer");
//     const searchInput = document.getElementById("searchInput");
//     const incidentTypeFilter = document.getElementById("incidentTypeFilter");
//     const resetFiltersBtn = document.getElementById("resetFiltersBtn");
//     const createAgencyBtn = document.getElementById("createAgencyBtn");
//     const modal = document.getElementById("agencyModal");
//     const closeModalBtn = document.getElementById("closeModal");
//     const cancelBtn = document.getElementById("cancelBtn");
//     const form = document.getElementById("agencyForm");
//     const formFeedback = document.getElementById("formFeedback");
//     const submitBtn = document.getElementById("submitBtn");

//     let allAgencies = [];

//     // Event Listeners
//     menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
//     logoutBtn.addEventListener("click", (e) => {
//         e.preventDefault();
//         logoutUser();
//     });

//     createAgencyBtn.addEventListener("click", () => modal.style.display = "flex");
//     closeModalBtn.addEventListener("click", () => modal.style.display = "none");
//     cancelBtn.addEventListener("click", () => modal.style.display = "none");
//     window.addEventListener("click", (e) => {
//         if (e.target === modal) {
//             modal.style.display = "none";
//         }
//     });

//     searchInput.addEventListener("input", debounce(filterAndDisplayAgencies, 300));
//     incidentTypeFilter.addEventListener("change", filterAndDisplayAgencies);
//     resetFiltersBtn.addEventListener("click", () => {
//         searchInput.value = "";
//         incidentTypeFilter.value = "";
//         filterAndDisplayAgencies();
//     });

//     function debounce(func, delay) {
//         let timeout;
//         return function (...args) {
//             clearTimeout(timeout);
//             timeout = setTimeout(() => func.apply(this, args), delay);
//         };
//     }

//     async function loadAgencies() {
//         agenciesContainer.innerHTML = `
//             <div class="loading-container">
//                 <div class="spinner-large"></div>
//                 <p>Loading agencies...</p>
//             </div>`;

//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/all?pageSize=1000`, {
//                 headers: { "Authorization": `Bearer ${token}` }
//             });
//             if (!response.ok) throw new Error('Failed to fetch agencies');
//             const result = await response.json();

//             if (result.succeeded && result.data) {
//                 allAgencies = result.data;
//                 // Fetch supported incidents for each agency
//                 const incidentPromises = allAgencies.map(agency =>
//                     fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${agency.id}/supported-incidents`, {
//                         headers: { "Authorization": `Bearer ${token}` }
//                     }).then(res => res.json())
//                 );

//                 const incidentResults = await Promise.all(incidentPromises);
//                 incidentResults.forEach((incidentResult, index) => {
//                     if (incidentResult.succeeded) {
//                         allAgencies[index].supportedIncidents = incidentResult.data;
//                     } else {
//                         allAgencies[index].supportedIncidents = [];
//                     }
//                 });

//                 filterAndDisplayAgencies();
//             } else {
//                 throw new Error(result.message || 'Could not load agencies');
//             }
//         } catch (error) {
//             console.error("Error loading agencies:", error);
//             agenciesContainer.innerHTML = `<div class="error-state"><p>Could not load agencies.</p></div>`;
//         }
//     }

//     function filterAndDisplayAgencies() {
//         const searchTerm = searchInput.value.toLowerCase().trim();
//         const incidentType = incidentTypeFilter.value;

//         let filteredAgencies = allAgencies;

//         if (searchTerm) {
//             filteredAgencies = filteredAgencies.filter(agency =>
//                 agency.name.toLowerCase().includes(searchTerm) ||
//                 agency.email.toLowerCase().includes(searchTerm) ||
//                 (agency.phoneNumber && agency.phoneNumber.includes(searchTerm))
//             );
//         }

//         if (incidentType) {
//             filteredAgencies = filteredAgencies.filter(agency =>
//                 agency.supportedIncidents && agency.supportedIncidents.includes(incidentType)
//             );
//         }

//         displayAgencies(filteredAgencies);
//     }

//     function displayAgencies(agencies) {
//         if (agencies.length === 0) {
//             agenciesContainer.innerHTML = `<div class="empty-state"><p>No agencies found matching your criteria.</p></div>`;
//             return;
//         }

//         agenciesContainer.innerHTML = agencies.map(agency => {
//             const logoUrl = agency.logoUrl ? `${AppConfig.API_BASE_URL}${agency.logoUrl}` : generateInitialsAvatar(agency.name);
//             const address = formatAddress(agency.address) || 'No address provided';

//             return `
//                 <div class="agency-card" data-agency-id="${agency.id}">
//                     <div class="agency-card-header">
//                         <img src="${logoUrl}" alt="${agency.name} Logo" class="agency-logo">
//                         <div class="agency-title">
//                             <h3>${escapeHtml(agency.name)}</h3>
//                             <p>${escapeHtml(agency.email)}</p>
//                         </div>
//                     </div>
//                     <div class="agency-card-body">
//                         <p class="agency-address"><i class="ri-map-pin-line"></i> ${escapeHtml(address)}</p>
//                         <div class="incident-types">
//                             ${(agency.supportedIncidents || []).map(type =>
//                 `<span class="incident-badge">${formatIncidentType(type)}</span>`
//             ).join('')}
//                         </div>
//                     </div>
//                     <div class="agency-card-footer">
//                         <a href="agency-details.html?id=${agency.id}" class="btn-secondary">View Details</a>
//                     </div>
//                 </div>
//             `;
//         }).join('');
//     }

//     // Handle Form Submission for creating an agency
//     form.addEventListener("submit", async (e) => {
//         e.preventDefault();
//         submitBtn.disabled = true;
//         submitBtn.classList.add('loading');
//         formFeedback.textContent = '';
//         formFeedback.className = 'form-feedback';

//         const formData = new FormData(form);

//         // Manually append checkbox values
//         const supportedIncidents = [];
//         form.querySelectorAll('input[name="supportedIncidents"]:checked').forEach(checkbox => {
//             supportedIncidents.push(checkbox.value);
//         });

//         // Clear existing and append new
//         formData.delete('supportedIncidents');
//         supportedIncidents.forEach(type => formData.append('SupportedIncidents', type));

//         // Rename form fields to match API expectation
//         const fieldMappings = {
//             'adminFirstName': 'RegisterUserRequest.FirstName',
//             'adminLastName': 'RegisterUserRequest.LastName',
//             'adminEmail': 'RegisterUserRequest.Email',
//             'gender': 'RegisterUserRequest.Gender',
//             'password': 'RegisterUserRequest.Password',
//             'confirmPassword': 'RegisterUserRequest.ConfirmPassword',
//             'profilePicture': 'RegisterUserRequest.ProfilePicture',
//             'agencyName': 'AgencyName',
//             'agencyEmail': 'AgencyEmail',
//             'agencyPhoneNumber': 'AgencyPhoneNumber',
//             'agencyLogo': 'AgencyLogo',
//             'street': 'AgencyAddress.Street',
//             'city': 'AgencyAddress.City',
//             'state': 'AgencyAddress.State',
//             'country': 'AgencyAddress.Country'
//         };

//         const apiFormData = new FormData();
//         for (const [key, value] of formData.entries()) {
//             if (fieldMappings[key]) {
//                 apiFormData.append(fieldMappings[key], value);
//             } else {
//                 apiFormData.append(key, value);
//             }
//         }

//         try {
//             const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Auth/register-agency`, {
//                 method: 'POST',
//                 headers: {
//                     "Authorization": `Bearer ${token}`
//                 },
//                 body: apiFormData
//             });

//             const result = await response.json();

//             if (response.ok && result.succeeded) {
//                 showFeedback('formFeedback', 'Agency created successfully!', 'success');
//                 setTimeout(() => {
//                     modal.style.display = "none";
//                     form.reset();
//                     loadAgencies();
//                 }, 2000);
//             } else {
//                 const errorMessage = result.message || (result.errors ? Object.values(result.errors).flat().join(' ') : 'An unknown error occurred.');
//                 throw new Error(errorMessage);
//             }
//         } catch (error) {
//             console.error('Agency creation error:', error);
//             showFeedback('formFeedback', `Error: ${error.message}`, 'error', 0);
//         } finally {
//             submitBtn.disabled = false;
//             submitBtn.classList.remove('loading');
//         }
//     });

//     // Handle file input display
//     const logoInput = document.getElementById('agencyLogo');
//     const logoFileName = document.getElementById('logoFileName');
//     const logoPreview = document.getElementById('logoPreview');
//     logoInput.addEventListener('change', () => {
//         if (logoInput.files.length > 0) {
//             logoFileName.textContent = logoInput.files[0].name;
//             const reader = new FileReader();
//             reader.onload = (e) => {
//                 logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo Preview">`;
//             };
//             reader.readAsDataURL(logoInput.files[0]);
//         }
//     });

//     const profilePicInput = document.getElementById('profilePicture');
//     const profileFileName = document.getElementById('profileFileName');
//     const profilePreview = document.getElementById('profilePreview');
//     profilePicInput.addEventListener('change', () => {
//         if (profilePicInput.files.length > 0) {
//             profileFileName.textContent = profilePicInput.files[0].name;
//             const reader = new FileReader();
//             reader.onload = (e) => {
//                 profilePreview.innerHTML = `<img src="${e.target.result}" alt="Profile Preview">`;
//             };
//             reader.readAsDataURL(profilePicInput.files[0]);
//         }
//     });

//     // Initial Load
//     loadAgencies();
// });


document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    if (!token) return;

    if (token) {
        await window.notificationManager.initialize(token);
    }
    await loadAdminProfile(token);

    // DOM Elements
    const menuToggle = document.getElementById("menuToggle");
    const adminSidebar = document.getElementById("adminSidebar");
    const logoutBtn = document.getElementById("logoutBtn");
    const agenciesContainer = document.getElementById("agenciesContainer");
    const searchInput = document.getElementById("searchInput");
    const incidentTypeFilter = document.getElementById("incidentTypeFilter");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");

    let allAgencies = [];

    // Event Listeners
    menuToggle.addEventListener("click", () => adminSidebar.classList.toggle("collapsed"));
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    searchInput.addEventListener("input", debounce(filterAndDisplayAgencies, 300));
    incidentTypeFilter.addEventListener("change", filterAndDisplayAgencies);
    resetFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        incidentTypeFilter.value = "";
        filterAndDisplayAgencies();
    });

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    async function loadAgencies() {
        agenciesContainer.innerHTML = `
            <div class="loading-container">
                <div class="spinner-large"></div>
                <p>Loading agencies...</p>
            </div>`;

        try {
            const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/all?pageSize=1000`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch agencies');
            const result = await response.json();

            if (result.succeeded && result.data) {
                allAgencies = result.data; // Handle nested paginated data
                // Fetch supported incidents for each agency
                const incidentPromises = allAgencies.map(agency =>
                    fetch(`${AppConfig.API_BASE_URL}/api/v1/Agency/${agency.id}/supported-incidents`, {
                        headers: { "Authorization": `Bearer ` }
                    }).then(res => res.json())
                );

                const incidentResults = await Promise.all(incidentPromises);
                incidentResults.forEach((incidentResult, index) => {
                    if (incidentResult.succeeded) {
                        allAgencies[index].supportedIncidents = incidentResult.data;
                    } else {
                        allAgencies[index].supportedIncidents = [];
                    }
                });

                filterAndDisplayAgencies();
            } else {
                throw new Error(result.message || 'Could not load agencies');
            }
        } catch (error) {
            console.error("Error loading agencies:", error);
            agenciesContainer.innerHTML = `<div class="error-state"><p>Could not load agencies.</p></div>`;
        }
    }

    function filterAndDisplayAgencies() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const incidentType = incidentTypeFilter.value;

        let filteredAgencies = allAgencies;

        if (searchTerm) {
            filteredAgencies = filteredAgencies.filter(agency =>
                agency.name.toLowerCase().includes(searchTerm) ||
                agency.email.toLowerCase().includes(searchTerm) ||
                (agency.phoneNumber && agency.phoneNumber.includes(searchTerm))
            );
        }

        if (incidentType) {
            filteredAgencies = filteredAgencies.filter(agency =>
                agency.supportedIncidents && agency.supportedIncidents.includes(incidentType)
            );
        }

        displayAgencies(filteredAgencies);
    }

    function displayAgencies(agencies) {
        if (agencies.length === 0) {
            agenciesContainer.innerHTML = `<div class="empty-state"><p>No agencies found matching your criteria.</p></div>`;
            return;
        }

        agenciesContainer.innerHTML = agencies.map(agency => {
            const logoUrl = agency.logoUrl ? `${AppConfig.API_BASE_URL}${agency.logoUrl}` : generateInitialsAvatar(agency.name);
            const address = formatAddress(agency.address) || 'No address provided';

            return `
                <div class="agency-card" data-agency-id="${agency.id}">
                    <div class="agency-card-header">
                        <img src="${logoUrl}" alt="${agency.name} Logo" class="agency-logo">
                        <div class="agency-title">
                            <h3>${escapeHtml(agency.name)}</h3>
                            <p>${escapeHtml(agency.email)}</p>
                        </div>
                    </div>
                    <div class="agency-card-body">
                        <p class="agency-address"><i class="ri-map-pin-line"></i> ${escapeHtml(address)}</p>
                        <div class="incident-types">
                            ${(agency.supportedIncidents || []).map(type =>
                `<span class="incident-badge">${formatIncidentType(type)}</span>`
            ).join('')}
                        </div>
                    </div>
                    <div class="agency-card-footer">
                        <a href="agency-details.html?id=${agency.id}" class="btn-secondary">View Details</a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Initial Load
    loadAgencies();
});
