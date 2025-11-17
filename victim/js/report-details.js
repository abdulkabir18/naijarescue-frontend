document.addEventListener("DOMContentLoaded", async () => {
    const token = protectPage();
    // if (!token) return;
    if (token) {
        await window.notificationManager.initialize(token);
    }

    // Logout handler
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Load report details
    const container = document.getElementById("reportDetails");
    const loadingEl = document.getElementById("detailsLoading");

    function getReportId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("id");
    }

    const id = getReportId();
    if (!id) {
        container.innerHTML = `<div class="error">No report selected. Go back to <a href="my-reports.html">My Reports</a>.</div>`;
        if (loadingEl) loadingEl.remove();
        return;
    }

    // 🔴 TESTING: Mock fetch matching your DTO structure
    function fetchReportMock(reportId) {
        const mock = {
            succeeded: true,
            data: {
                id: reportId,
                title: "Road accident at Lekki toll gate - Multiple vehicles involved",
                type: "Accident",
                confidence: 0.92,
                status: "InProgress",
                coordinates: { latitude: 6.4474, longitude: 3.5405 },
                address: {
                    street: "Lekki-Epe Expressway",
                    city: "Lagos",
                    state: "Lagos",
                    lga: "Eti-Osa",
                    country: "Nigeria",
                    postalCode: "101245"
                },
                occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                userId: "user-123",
                media: [
                    {
                        url: "https://res.cloudinary.com/dqsvw7scd/image/upload/v1762328140/ChatGPT_Image_Nov_5_2025_08_34_56_AM_aqtyml.png",
                        type: "Image"
                    }
                ],
                assignedResponders: [
                    {
                        id: "resp-assign-1",
                        responderId: "resp-001",
                        userId: "user-resp-1",
                        role: "Primary",
                        responderName: "Emergency Response Team Alpha"
                    },
                    {
                        id: "resp-assign-2",
                        responderId: "resp-002",
                        userId: "user-resp-2",
                        role: "Backup",
                        responderName: "Medical Support Unit"
                    }
                ]
            }
        };
        return Promise.resolve(mock);
    }

    try {
        /* 🟢 PRODUCTION: Uncomment this when connected to backend
        const response = await fetch(`${AppConfig.API_BASE_URL}/api/v1/Incident/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        */

        const result = await fetchReportMock(id);

        if (result.succeeded && result.data) {
            renderReport(result.data);
        } else {
            throw new Error("Failed to load report data");
        }
    } catch (err) {
        container.innerHTML = `<div class="error">Failed to load report. Please try again.</div>`;
        console.error(err);
    } finally {
        if (loadingEl) loadingEl.remove();
    }

    // Load Google Maps JS API dynamically
    function loadGoogleMapsApi(apiKey) {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) return resolve(window.google.maps);
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.google && window.google.maps) resolve(window.google.maps);
                else reject(new Error("Google maps loaded but window.google.maps is missing"));
            };
            script.onerror = () => reject(new Error("Failed to load Google Maps script"));
            document.head.appendChild(script);
        });
    }

    function initMap(coords, mapElId = "map") {
        if (!coords || !coords.latitude || !coords.longitude) return;
        const lat = parseFloat(coords.latitude);
        const lng = parseFloat(coords.longitude);
        const mapEl = document.getElementById(mapElId);
        if (!mapEl) return;
        const map = new google.maps.Map(mapEl, {
            center: { lat, lng },
            zoom: 15,
            disableDefaultUI: false
        });
        new google.maps.Marker({
            position: { lat, lng },
            map,
            title: "Incident Location"
        });
    }

    function renderReport(r) {
        const occurred = new Date(r.occurredAt).toLocaleString();

        // Format address using utility function
        const fullAddress = formatAddress(r.address);

        const mapUrl = r.coordinates
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.coordinates.latitude + ',' + r.coordinates.longitude)}`
            : '';

        // Get status class and display text using utility functions
        const statusClass = getStatusClass(r.status);
        const statusDisplay = getStatusDisplay(r.status);

        const displayTitle = r.title || `${r.type} Emergency`;

        container.innerHTML = `
            <div class="details-card">
                <div class="details-head">
                    <div class="type">
                        <i class="ri-map-pin-2-fill"></i>
                        <h2>${escapeHtml(displayTitle)}</h2>
                        <span class="badge ${statusClass}">${escapeHtml(statusDisplay)}</span>
                    </div>
                    <div class="meta">
                        <div><strong>Occurred:</strong> ${occurred}</div>
                        <div><strong>Type:</strong> ${escapeHtml(r.type)}</div>
                        ${r.confidence ? `<div><strong>AI Confidence:</strong> ${formatConfidence(r.confidence)}%</div>` : ''}
                    </div>
                </div>

                <div class="details-body">
                    <div class="left">
                        <h3>Location</h3>
                        <p class="location-text">${escapeHtml(fullAddress)}</p>
                        ${r.coordinates ? `<a class="btn" target="_blank" rel="noopener" href="${mapUrl}">
                            <i class="ri-map-pin-line"></i> Open in Google Maps
                        </a>` : ''}
                        ${r.coordinates ? `<div id="map" class="map" aria-label="Report location map"></div>` : ''}

                        <h3 style="margin-top:1.25rem;">Evidence</h3>
                        <div id="mediaPreview" class="media-preview" aria-live="polite"></div>

                        <h3 style="margin-top:1.25rem;">Assigned Responders</h3>
                        <div id="respondersContainer" class="responders-container"></div>
                    </div>

                    <div class="right">
                        <h3>Incident Details</h3>
                        <div class="details-info">
                            <div class="detail-item">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value badge-inline ${statusClass}">${escapeHtml(statusDisplay)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Type:</span>
                                <span class="detail-value">${escapeHtml(r.type)}</span>
                            </div>
                            ${r.confidence ? `
                            <div class="detail-item">
                                <span class="detail-label">Confidence:</span>
                                <span class="detail-value">${formatConfidence(r.confidence)}%</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render media
        renderMedia(r.media);

        // Render responders
        renderResponders(r.assignedResponders);

        // Initialize Google map if coordinates exist
        if (r.coordinates && r.coordinates.latitude && r.coordinates.longitude) {
            // Use the key from the global config file
            loadGoogleMapsApi(AppConfig.GOOGLE_MAPS_API_KEY)
                .then(() => initMap(r.coordinates, "map"))
                .catch(err => {
                    console.warn("Google Maps not loaded:", err);
                });
        }
    }

    function renderMedia(mediaList) {
        const preview = document.getElementById("mediaPreview");
        preview.innerHTML = "";

        if (!mediaList || mediaList.length === 0) {
            preview.innerHTML = '<p class="no-media">No evidence uploaded</p>';
            return;
        }

        mediaList.forEach(media => {
            const mediaEl = document.createElement("div");
            mediaEl.className = "media-item";

            if (media.type === "Image") {
                const img = document.createElement("img");
                img.src = media.url;
                img.alt = "Evidence image";
                img.className = "proof-image";
                mediaEl.appendChild(img);
            } else if (media.type === "Video") {
                const video = document.createElement("video");
                video.controls = true;
                video.src = media.url;
                video.className = "proof-video";
                video.setAttribute("title", "Evidence video");
                mediaEl.appendChild(video);
            } else if (media.type === "Audio") {
                const audio = document.createElement("audio");
                audio.controls = true;
                audio.src = media.url;
                audio.className = "proof-audio";
                mediaEl.appendChild(audio);
            }

            preview.appendChild(mediaEl);
        });
    }

    function renderResponders(responders) {
        const container = document.getElementById("respondersContainer");
        container.innerHTML = "";

        if (!responders || responders.length === 0) {
            container.innerHTML = '<p class="no-responders">No responders assigned yet</p>';
            return;
        }

        responders.forEach(responder => {
            const responderCard = document.createElement("div");
            responderCard.className = "responder-card";

            const roleClass = responder.role.toLowerCase();
            const roleIcon = RESPONDER_ROLE_ICONS[responder.role] || RESPONDER_ROLE_ICONS["Support"];

            responderCard.innerHTML = `
                <div class="responder-header">
                    <i class="${roleIcon}"></i>
                    <span class="responder-role ${roleClass}">${escapeHtml(responder.role)}</span>
                </div>
                <div class="responder-info">
                    <p class="responder-name">${escapeHtml(responder.responderName || 'Response Team')}</p>
                </div>
            `;

            container.appendChild(responderCard);
        });
    }
});