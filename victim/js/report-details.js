document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("reportDetails");
    const loadingEl = document.getElementById("detailsLoading");

    function getReportId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("id") || sessionStorage.getItem("selectedReportId");
    }

    const id = getReportId();
    if (!id) {
        container.innerHTML = `<div class="error">No report selected. Go back to <a href="my-reports.html">My Reports</a>.</div>`;
        return;
    }

    // Mock fetch or replace with real API
    function fetchReportMock(reportId) {
        // sample record - in production fetch from API using token
        const mock = {
            id: reportId,
            type: "Accident",
            status: "InProgress",
            location: "Lekki, Lagos",
            coordinate: { latitude: 6.4474, longitude: 3.5405 },
            occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            proofUrl: "/assets/images/sample-accident.jpg", // or mp4
            responder: {
                name: "Dispatch Team A",
                phone: "+234800000000",
                eta: "10 mins"
            },
            timeline: [
                { time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: "Reported" },
                { time: new Date(Date.now() - 90 * 60 * 1000).toISOString(), status: "Acknowledged" },
                { time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), status: "Responder Dispatched" },
            ]
        };
        return Promise.resolve(mock);
    }

    try {
        const report = await fetchReportMock(id);
        renderReport(report);
    } catch (err) {
        container.innerHTML = `<div class="error">Failed to load report.</div>`;
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
            map
        });
    }

    function renderReport(r) {
        const occurred = new Date(r.occurredAt).toLocaleString();
        const created = new Date(r.createdAt).toLocaleString();
        const mapUrl = r.coordinate
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.coordinate.latitude + ',' + r.coordinate.longitude)}`
            : '';

        container.innerHTML = `
            <div class="details-card">
                <div class="details-head">
                    <div class="type">
                        <i class="ri-map-pin-2-fill"></i>
                        <h2>${escapeHtml(r.type)} Emergency</h2>
                        <span class="badge ${escapeHtml(r.status || '').toLowerCase()}">${escapeHtml(r.status)}</span>
                    </div>
                    <div class="meta">
                        <div><strong>Occurred:</strong> ${occurred}</div>
                        <div><strong>Reported:</strong> ${created}</div>
                    </div>
                </div>

                <div class="details-body">
                    <div class="left">
                        <h3>Location</h3>
                        <p class="location-text">${escapeHtml(r.location || 'Location recorded')}</p>
                        ${r.coordinate ? `<a class="btn" target="_blank" rel="noopener" href="${mapUrl}">Open in Google Maps</a>` : ''}
                        ${r.coordinate ? `<div id="map" class="map" aria-label="Report location map"></div>` : ''}

                        <h3 style="margin-top:1.25rem;">Proof</h3>
                        <div id="proofPreview" class="proof-preview" aria-live="polite"></div>

                        <h3 style="margin-top:1.25rem;">Responder</h3>
                        <div class="responder">
                            <p><strong>${escapeHtml(r.responder?.name || 'Not assigned')}</strong></p>
                            ${r.responder?.phone ? `<p>Phone: <a href="tel:${encodeURIComponent(r.responder.phone)}">${escapeHtml(r.responder.phone)}</a></p>` : ''}
                            ${r.responder?.eta ? `<p>ETA: ${escapeHtml(r.responder.eta)}</p>` : ''}
                        </div>
                    </div>

                    <div class="right">
                        <h3>Status Timeline</h3>
                        <ul class="timeline">
                            ${r.timeline.map(t => `<li><time>${new Date(t.time).toLocaleString()}</time><div class="stage">${escapeHtml(t.status)}</div></li>`).join("")}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Render proof safely (create elements)
        const preview = document.getElementById("proofPreview");
        preview.innerHTML = "";
        if (r.proofUrl) {
            const url = r.proofUrl;
            if (/\.(mp4|webm|ogg)$/i.test(url)) {
                const video = document.createElement("video");
                video.controls = true;
                video.src = url;
                video.className = "proof-video";
                video.setAttribute("title", "Uploaded video proof");
                preview.appendChild(video);
            } else {
                const img = document.createElement("img");
                img.src = url;
                img.alt = "Uploaded proof image";
                img.className = "proof-image";
                preview.appendChild(img);
            }
        } else {
            preview.textContent = "No proof uploaded";
        }

        // Initialize Google map if coordinates exist
        if (r.coordinate && r.coordinate.latitude && r.coordinate.longitude) {
            const API_KEY = "Your Google Maps API key"; // <-- replace with your Google Maps JS API key
            loadGoogleMapsApi(API_KEY)
                .then(() => initMap(r.coordinate, "map"))
                .catch(err => {
                    console.warn("Google Maps not loaded:", err);
                    // Map link is provided as a fallback
                });
        }
    }

    // small safe-escape helper
    function escapeHtml(str) {
        if (!str && str !== 0) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});