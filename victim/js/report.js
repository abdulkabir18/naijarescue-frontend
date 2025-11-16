// document.addEventListener("DOMContentLoaded", async () => {
//     const token = sessionStorage.getItem("authToken");

//     await window.notificationManager.initialize(token);

//     // 🔴 TESTING: Comment out redirect for testing
//     // if (!token) {
//     //     alert("Please login to report an emergency.");
//     //     window.location.href = "/login.html";
//     //     return;
//     // }

//     const form = document.getElementById("reportForm");
//     const submitBtn = document.getElementById("submitBtn");
//     const feedback = document.getElementById("feedback");

//     const useLocationBtn = document.getElementById("useCurrentLocation");
//     const manualLocationBtn = document.getElementById("enterManually");
//     const setManualLocationBtn = document.getElementById("setManualLocation");
//     const locationDisplay = document.getElementById("locationDisplay");
//     const locationText = document.getElementById("locationText");
//     const manualFields = document.getElementById("manualLocationFields");

//     const photoCapture = document.getElementById("photoCapture");
//     const videoCapture = document.getElementById("videoCapture");
//     const proveUpload = document.getElementById("proveUpload");
//     const uploadedFileDiv = document.getElementById("uploadedFile");
//     const occurredAtInput = document.getElementById("occurredAt");

//     const cameraContainer = document.querySelector(".camera-container");
//     const cameraPreview = document.getElementById("cameraPreview");
//     const capturePhotoBtn = document.getElementById("capturePhoto");
//     const startRecordingBtn = document.getElementById("startRecording");
//     const stopRecordingBtn = document.getElementById("stopRecording");
//     const closeCameraBtn = document.getElementById("closeCamera");
//     const photoCanvas = document.getElementById("photoCanvas");

//     let mediaStream = null;
//     let mediaRecorder = null;
//     let recordedChunks = [];
//     let proveFile = null;
//     let currentLocation = null;

//     const now = new Date();
//     const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
//         .toISOString()
//         .slice(0, 16);
//     occurredAtInput.value = localDateTime;

//     const logoutBtn = document.getElementById("logoutBtn");
//     if (logoutBtn) {
//         logoutBtn.addEventListener("click", (e) => {
//             e.preventDefault();
//             sessionStorage.removeItem("authToken");
//             window.location.href = "/login.html";
//         });
//     }

//     useLocationBtn.addEventListener("click", () => {
//         if (!navigator.geolocation) {
//             showFeedback("Geolocation is not supported by your browser.", "error");
//             return;
//         }

//         useLocationBtn.disabled = true;
//         useLocationBtn.innerHTML = '<i class="ri-loader-4-line"></i> Getting location...';

//         navigator.geolocation.getCurrentPosition(
//             (position) => {
//                 currentLocation = {
//                     latitude: position.coords.latitude,
//                     longitude: position.coords.longitude
//                 };

//                 document.getElementById("latitude").value = currentLocation.latitude;
//                 document.getElementById("longitude").value = currentLocation.longitude;

//                 locationText.textContent = `Location: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
//                 locationDisplay.classList.add("active");
//                 manualFields.style.display = "none";

//                 useLocationBtn.disabled = false;
//                 useLocationBtn.innerHTML = '<i class="ri-crosshair-line"></i> Use Current Location';
//                 showFeedback("✅ Location captured successfully!", "success");
//             },
//             (error) => {
//                 console.error("Geolocation error:", error);
//                 showFeedback("Unable to get your location. Please enter manually.", "error");
//                 useLocationBtn.disabled = false;
//                 useLocationBtn.innerHTML = '<i class="ri-crosshair-line"></i> Use Current Location';
//             }
//         );
//     });

//     manualLocationBtn.addEventListener("click", () => {
//         manualFields.style.display = "block";
//         locationDisplay.classList.remove("active");
//         locationText.textContent = "Enter coordinates below";
//     });

//     setManualLocationBtn.addEventListener("click", () => {
//         const lat = parseFloat(document.getElementById("manualLat").value);
//         const lng = parseFloat(document.getElementById("manualLng").value);

//         if (isNaN(lat) || isNaN(lng)) {
//             showFeedback("Please enter valid latitude and longitude.", "error");
//             return;
//         }

//         if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
//             showFeedback("Coordinates out of range. Lat: -90 to 90, Lng: -180 to 180", "error");
//             return;
//         }

//         currentLocation = { latitude: lat, longitude: lng };
//         document.getElementById("latitude").value = lat;
//         document.getElementById("longitude").value = lng;

//         locationText.textContent = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
//         locationDisplay.classList.add("active");
//         manualFields.style.display = "none";
//         showFeedback("✅ Location set successfully!", "success");
//     });

//     function handleFileSelect(file) {
//         if (!file) return;

//         if (file.size > 10 * 1024 * 1024) {
//             showFeedback("File size must be less than 10MB.", "error");
//             return;
//         }

//         proveFile = file;
//         displayUploadedFile(file);
//         showFeedback("✅ File uploaded successfully!", "success");
//     }

//     proveUpload.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));
//     photoCapture.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));
//     videoCapture.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));

//     function displayUploadedFile(file) {
//         const fileType = file.type.startsWith('image/') ? 'image' : 'video';
//         const icon = fileType === 'image' ? 'ri-image-fill' : 'ri-vidicon-fill';
//         const fileSize = (file.size / (1024 * 1024)).toFixed(2);

//         uploadedFileDiv.innerHTML = `
//             <div class="file-preview">
//                 <i class="${icon}"></i>
//                 <div class="file-info">
//                     <h4>${file.name}</h4>
//                     <p>${fileSize} MB • ${fileType === 'image' ? 'Image' : 'Video'}</p>
//                 </div>
//                 <button type="button" class="remove-file" onclick="removeFile()">
//                     <i class="ri-close-line"></i> Remove
//                 </button>
//             </div>
//         `;
//     }

//     window.removeFile = function () {
//         proveFile = null;
//         proveUpload.value = "";
//         photoCapture.value = "";
//         videoCapture.value = "";
//         uploadedFileDiv.innerHTML = "";
//         showFeedback("File removed.", "error");
//     };

//     const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

//     const takePhotoBtn = document.querySelector("label[for='photoCapture']");
//     if (takePhotoBtn) {
//         takePhotoBtn.addEventListener("click", async (e) => {
//             if (isMobileDevice()) {
//                 return;
//             }

//             e.preventDefault();
//             await startCamera();
//         });
//     }

//     const recordVideoBtn = document.querySelector("label[for='videoCapture']");
//     if (recordVideoBtn) {
//         recordVideoBtn.addEventListener("click", async (e) => {
//             if (isMobileDevice()) {
//                 return;
//             }

//             e.preventDefault();
//             await startCamera();
//         });
//     }

//     async function startCamera() {
//         try {
//             mediaStream = await navigator.mediaDevices.getUserMedia({
//                 video: { facingMode: "environment" },
//                 audio: true
//             });
//             cameraPreview.srcObject = mediaStream;
//             cameraContainer.style.display = "block";
//             showFeedback("📹 Camera ready! You can capture a photo or record video.", "success");
//         } catch (err) {
//             console.error("Camera error:", err);
//             showFeedback("Unable to access camera. Please check permissions or use file upload.", "error");
//         }
//     }

//     capturePhotoBtn.addEventListener("click", () => {
//         if (!mediaStream) return;

//         const ctx = photoCanvas.getContext("2d");
//         photoCanvas.width = cameraPreview.videoWidth;
//         photoCanvas.height = cameraPreview.videoHeight;
//         ctx.drawImage(cameraPreview, 0, 0);

//         photoCanvas.toBlob((blob) => {
//             const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
//             proveFile = file;
//             displayUploadedFile(file);
//             stopCamera();
//             showFeedback("✅ Photo captured successfully!", "success");
//         }, "image/jpeg", 0.9);
//     });

//     startRecordingBtn.addEventListener("click", () => {
//         if (!mediaStream) return;

//         recordedChunks = [];
//         try {
//             mediaRecorder = new MediaRecorder(mediaStream, { mimeType: "video/webm;codecs=vp8,opus" });
//         } catch (e) {
//             mediaRecorder = new MediaRecorder(mediaStream);
//         }

//         mediaRecorder.ondataavailable = (e) => {
//             if (e.data.size > 0) recordedChunks.push(e.data);
//         };

//         mediaRecorder.onstop = () => {
//             const blob = new Blob(recordedChunks, { type: "video/webm" });
//             const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" });
//             proveFile = file;
//             displayUploadedFile(file);
//             stopCamera();
//             showFeedback("✅ Video recorded successfully!", "success");
//         };

//         mediaRecorder.start();
//         startRecordingBtn.style.display = "none";
//         stopRecordingBtn.style.display = "inline-flex";
//         showFeedback("🔴 Recording started...", "success");
//     });

//     stopRecordingBtn.addEventListener("click", () => {
//         if (mediaRecorder && mediaRecorder.state !== "inactive") {
//             mediaRecorder.stop();
//             startRecordingBtn.style.display = "inline-flex";
//             stopRecordingBtn.style.display = "none";
//         }
//     });

//     closeCameraBtn.addEventListener("click", stopCamera);

//     function stopCamera() {
//         if (mediaStream) {
//             mediaStream.getTracks().forEach(track => track.stop());
//             mediaStream = null;
//         }
//         cameraPreview.srcObject = null;
//         cameraContainer.style.display = "none";
//         startRecordingBtn.style.display = "inline-flex";
//         stopRecordingBtn.style.display = "none";
//     }

//     function showFeedback(message, type) {
//         feedback.textContent = message;
//         feedback.className = `feedback-message ${type}`;
//         feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

//         if (type === 'success') {
//             setTimeout(() => {
//                 feedback.className = 'feedback-message';
//             }, 3000);
//         }
//     }

//     form.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         if (!currentLocation) {
//             showFeedback("❌ Please provide your location.", "error");
//             return;
//         }

//         if (!proveFile) {
//             showFeedback("❌ Please upload proof (photo or video) of the incident.", "error");
//             return;
//         }

//         if (!occurredAtInput.value) {
//             showFeedback("❌ Please select when the incident occurred.", "error");
//             return;
//         }

//         submitBtn.disabled = true;
//         submitBtn.classList.add("loading");

//         const formData = new FormData();

//         formData.append("Coordinate.Latitude", currentLocation.latitude);
//         formData.append("Coordinate.Longitude", currentLocation.longitude);

//         formData.append("Prove", proveFile);

//         const occurredAt = new Date(occurredAtInput.value).toISOString();
//         formData.append("OccurredAt", occurredAt);

//         setTimeout(() => {
//             showFeedback("✅ Incident reported successfully! Redirecting to dashboard...", "success");
//             setTimeout(() => {
//                 window.location.href = "victim-dashboard.html";
//             }, 2000);
//         }, 1500);

//         /* 🟢 PRODUCTION: Uncomment this for real API call
//         try {
//             const response = await fetch("https://localhost:7288/api/v1/Incident/create", {
//                 method: "POST",
//                 headers: {
//                     "Authorization": `Bearer ${token}`
//                 },
//                 body: formData
//             });

//             const data = await response.json();

//             if (response.ok && data.succeeded) {
//                 showFeedback("✅ Incident reported successfully! Help is on the way.", "success");
//                 setTimeout(() => {
//                     window.location.href = "victim-dashboard.html";
//                 }, 2000);
//             } else {
//                 showFeedback(`❌ ${data.message || "Failed to submit report. Please try again."}`, "error");
//                 submitBtn.disabled = false;
//                 submitBtn.classList.remove("loading");
//             }
//         } catch (error) {
//             console.error("Report submission error:", error);
//             showFeedback("⚠️ Network error. Please check your connection and try again.", "error");
//             submitBtn.disabled = false;
//             submitBtn.classList.remove("loading");
//         }
//         */
//     });
// });

document.addEventListener("DOMContentLoaded", async () => {
    const token = sessionStorage.getItem("authToken");

    await window.notificationManager.initialize(token);

    // 🔴 TESTING: Comment out redirect for testing
    // if (!token) {
    //     alert("Please login to report an emergency.");
    //     window.location.href = "/login.html";
    //     return;
    // }

    const form = document.getElementById("reportForm");
    const submitBtn = document.getElementById("submitBtn");
    const feedback = document.getElementById("feedback");

    const locationStatus = document.getElementById("locationStatus");
    const statusText = document.getElementById("statusText");
    const locationSearch = document.getElementById("locationSearch");
    const searchSuggestions = document.getElementById("searchSuggestions");
    const detectedAddressBox = document.getElementById("detectedAddressBox");
    const detectedAddress = document.getElementById("detectedAddress");
    const retryLocationBtn = document.getElementById("retryLocation");

    const photoCapture = document.getElementById("photoCapture");
    const videoCapture = document.getElementById("videoCapture");
    const proveUpload = document.getElementById("proveUpload");
    const uploadedFileDiv = document.getElementById("uploadedFile");
    const occurredAtInput = document.getElementById("occurredAt");

    const cameraContainer = document.querySelector(".camera-container");
    const cameraPreview = document.getElementById("cameraPreview");
    const capturePhotoBtn = document.getElementById("capturePhoto");
    const startRecordingBtn = document.getElementById("startRecording");
    const stopRecordingBtn = document.getElementById("stopRecording");
    const closeCameraBtn = document.getElementById("closeCamera");
    const photoCanvas = document.getElementById("photoCanvas");

    let map = null;
    let marker = null;
    let mediaStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let proveFile = null;
    let currentLocation = null;

    // Set default time to now
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    occurredAtInput.value = localDateTime;

    // Logout handler
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.notificationManager.disconnect();
            sessionStorage.removeItem("authToken");
            window.location.href = "/login.html";
        });
    }

    // ==================== LOCATION HANDLING ====================

    // Auto-detect location on page load
    initializeLocation();

    async function initializeLocation() {
        // First, load Google Maps
        await loadGoogleMapsAPI();

        // Initialize the map
        initializeMap();

        // Then try to get user's location
        getUserLocation();
    }

    function loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            const API_KEY = "AIzaSyAUqbDPvfPNZAjQFD50PlnYPRhIcNGABEE"; // Replace with your actual API key
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function initializeMap(lat = 6.5244, lng = 3.3792) {
        const mapContainer = document.getElementById("locationMap");
        mapContainer.innerHTML = ""; // Clear placeholder

        map = new google.maps.Map(mapContainer, {
            center: { lat, lng },
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
        });

        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            draggable: true,
            title: "Drag me to adjust your location"
        });

        // Listen for marker drag
        marker.addListener("dragend", () => {
            const position = marker.getPosition();
            updateLocation(position.lat(), position.lng(), true);
        });

        // Listen for map clicks
        map.addListener("click", (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            marker.setPosition(e.latLng);
            updateLocation(lat, lng, true);
        });
    }

    function getUserLocation() {
        if (!navigator.geolocation) {
            updateStatus("error", "Geolocation is not supported by your browser. Please search for your location.");
            retryLocationBtn.style.display = "block";
            return;
        }

        updateStatus("loading", "Detecting your location...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                updateLocation(lat, lng, true);
                map.setCenter({ lat, lng });
                marker.setPosition({ lat, lng });
                updateStatus("success", "Location detected successfully!");
            },
            (error) => {
                console.error("Geolocation error:", error);
                updateStatus("error", "Unable to detect location. Please search or click on the map.");
                retryLocationBtn.style.display = "block";
            }
        );
    }

    function updateLocation(lat, lng, reverseGeocode = false) {
        currentLocation = { latitude: lat, longitude: lng };
        document.getElementById("latitude").value = lat;
        document.getElementById("longitude").value = lng;

        if (reverseGeocode) {
            getAddressFromCoordinates(lat, lng);
        }
    }

    function getAddressFromCoordinates(lat, lng) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
                const address = results[0].formatted_address;
                detectedAddress.textContent = address;
                detectedAddressBox.style.display = "flex";
            } else {
                detectedAddress.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                detectedAddressBox.style.display = "flex";
            }
        });
    }

    // function updateStatus(type, message) {
    //     statusText.textContent = message;
    //     locationStatus.className = `location-status ${type}`;
    // }

    function updateStatus(type, message) {
        let icon = "";

        if (type === "loading") {
            icon = `<i class="ri-loader-4-line spinning"></i>`;
        }
        else if (type === "success") {
            icon = `<i class="ri-checkbox-circle-fill"></i>`;
        }
        else if (type === "error") {
            icon = `<i class="ri-error-warning-fill"></i>`;
        }

        locationStatus.innerHTML = `
        ${icon}
        <span id="statusText">${message}</span>
    `;

        locationStatus.className = `location-status ${type}`;
    }


    // Retry location button
    retryLocationBtn.addEventListener("click", () => {
        retryLocationBtn.style.display = "none";
        getUserLocation();
    });

    // ==================== LOCATION SEARCH ====================

    let searchTimeout = null;

    locationSearch.addEventListener("input", (e) => {
        const query = e.target.value.trim();

        clearTimeout(searchTimeout);

        if (query.length < 3) {
            searchSuggestions.classList.remove("show");
            return;
        }
        searchTimeout = setTimeout(() => {
            searchLocation(query);
        }, 500);
    });

    function searchLocation(query) {
        const service = new google.maps.places.AutocompleteService();

        service.getPlacePredictions(
            {
                input: query,
                componentRestrictions: { country: "ng" }, 
                types: ["geocode", "establishment"]
            },
            (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    displaySearchSuggestions(predictions);
                } else {
                    searchSuggestions.classList.remove("show");
                }
            }
        );
    }

    function displaySearchSuggestions(predictions) {
        searchSuggestions.innerHTML = "";

        predictions.slice(0, 5).forEach(prediction => {
            const item = document.createElement("div");
            item.className = "suggestion-item";

            const mainText = prediction.structured_formatting.main_text;
            const secondaryText = prediction.structured_formatting.secondary_text;

            item.innerHTML = `
            <i class="ri-map-pin-line"></i>
            <div>
                <div class="suggestion-main">${mainText}</div>
                <div class="suggestion-sub">${secondaryText}</div>
            </div>
        `;

            item.addEventListener("click", () => {
                selectSearchResult(prediction.place_id, prediction.description);
            });

            searchSuggestions.appendChild(item);
        });

        searchSuggestions.classList.add("show");
    }

    function selectSearchResult(placeId, description) {
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ placeId: placeId }, (results, status) => {
            if (status === "OK" && results[0]) {
                const location = results[0].geometry.location;
                const lat = location.lat();
                const lng = location.lng();

                // Update map
                map.setCenter(location);
                map.setZoom(16);
                marker.setPosition(location);

                // Update location
                updateLocation(lat, lng);
                detectedAddress.textContent = description;
                detectedAddressBox.style.display = "flex";

                // Update status
                updateStatus("success", "✅ Location selected!");

                // Clear search
                locationSearch.value = "";
                searchSuggestions.classList.remove("show");
            }
        });
    }

    // Close suggestions when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".location-search-wrapper")) {
            searchSuggestions.classList.remove("show");
        }
    });

    // ==================== FILE UPLOAD HANDLING ====================

    function handleFileSelect(file) {
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showFeedback("File size must be less than 10MB.", "error");
            return;
        }

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "video/mp4", "video/webm"];
        if (!validTypes.includes(file.type)) {
            showFeedback("Please upload a valid image (JPG, PNG) or video (MP4, WEBM) file.", "error");
            return;
        }

        proveFile = file;
        displayUploadedFile(file);
        showFeedback("✅ File uploaded successfully!", "success");
    }

    proveUpload.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));
    photoCapture.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));
    videoCapture.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));

    function displayUploadedFile(file) {
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        const icon = fileType === 'image' ? 'ri-image-fill' : 'ri-vidicon-fill';
        const fileSize = (file.size / (1024 * 1024)).toFixed(2);

        uploadedFileDiv.innerHTML = `
        <div class="file-preview">
            <i class="${icon}"></i>
            <div class="file-info">
                <h4>${escapeHtml(file.name)}</h4>
                <p>${fileSize} MB • ${fileType === 'image' ? 'Image' : 'Video'}</p>
            </div>
            <button type="button" class="remove-file" onclick="removeFile()">
                <i class="ri-close-line"></i> Remove
            </button>
        </div>
    `;
    }

    window.removeFile = function () {
        proveFile = null;
        proveUpload.value = "";
        photoCapture.value = "";
        videoCapture.value = "";
        uploadedFileDiv.innerHTML = "";
        showFeedback("File removed.", "error");
    };

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // ==================== CAMERA HANDLING ====================

    const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const takePhotoBtn = document.querySelector("label[for='photoCapture']");
    if (takePhotoBtn) {
        takePhotoBtn.addEventListener("click", async (e) => {
            if (isMobileDevice()) {
                return; // Let mobile device use native camera
            }

            e.preventDefault();
            await startCamera();
        });
    }

    const recordVideoBtn = document.querySelector("label[for='videoCapture']");
    if (recordVideoBtn) {
        recordVideoBtn.addEventListener("click", async (e) => {
            if (isMobileDevice()) {
                return; // Let mobile device use native camera
            }

            e.preventDefault();
            await startCamera();
        });
    }

    async function startCamera() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: true
            });
            cameraPreview.srcObject = mediaStream;
            cameraContainer.style.display = "block";
            showFeedback("📹 Camera ready! You can capture a photo or record video.", "success");
        } catch (err) {
            console.error("Camera error:", err);
            showFeedback("Unable to access camera. Please check permissions or use file upload.", "error");
        }
    }

    capturePhotoBtn.addEventListener("click", () => {
        if (!mediaStream) return;

        const ctx = photoCanvas.getContext("2d");
        photoCanvas.width = cameraPreview.videoWidth;
        photoCanvas.height = cameraPreview.videoHeight;
        ctx.drawImage(cameraPreview, 0, 0);

        photoCanvas.toBlob((blob) => {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
            proveFile = file;
            displayUploadedFile(file);
            stopCamera();
            showFeedback("✅ Photo captured successfully!", "success");
        }, "image/jpeg", 0.9);
    });

    startRecordingBtn.addEventListener("click", () => {
        if (!mediaStream) return;

        recordedChunks = [];
        try {
            mediaRecorder = new MediaRecorder(mediaStream, { mimeType: "video/webm;codecs=vp8,opus" });
        } catch (e) {
            mediaRecorder = new MediaRecorder(mediaStream);
        }

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" });
            proveFile = file;
            displayUploadedFile(file);
            stopCamera();
            showFeedback("✅ Video recorded successfully!", "success");
        };

        mediaRecorder.start();
        startRecordingBtn.style.display = "none";
        stopRecordingBtn.style.display = "inline-flex";
        showFeedback("🔴 Recording started...", "success");
    });

    stopRecordingBtn.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            startRecordingBtn.style.display = "inline-flex";
            stopRecordingBtn.style.display = "none";
        }
    });

    closeCameraBtn.addEventListener("click", stopCamera);

    function stopCamera() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        cameraPreview.srcObject = null;
        cameraContainer.style.display = "none";
        startRecordingBtn.style.display = "inline-flex";
        stopRecordingBtn.style.display = "none";
    }
    // ==================== FEEDBACK MESSAGES ====================

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `feedback-message ${type}`;
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (type === 'success') {
            setTimeout(() => {
                feedback.className = 'feedback-message';
            }, 4000);
        }
    }

    // ==================== FORM SUBMISSION ====================

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validation
        if (!currentLocation) {
            showFeedback("❌ Please select your location on the map.", "error");
            locationStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!proveFile) {
            showFeedback("❌ Please upload proof (photo or video) of the incident.", "error");
            return;
        }

        if (!occurredAtInput.value) {
            showFeedback("❌ Please select when the incident occurred.", "error");
            return;
        }

        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.classList.add("loading");

        // Create FormData
        const formData = new FormData();

        // Add coordinates
        formData.append("Coordinate.Latitude", currentLocation.latitude);
        formData.append("Coordinate.Longitude", currentLocation.longitude);

        // Add proof file
        formData.append("Prove", proveFile);

        // Add occurred time
        const occurredAt = new Date(occurredAtInput.value).toISOString();
        formData.append("OccurredAt", occurredAt);

        // 🔴 TESTING: Mock successful submission
        setTimeout(() => {
            showFeedback("✅ Emergency reported successfully! Help is on the way. Redirecting...", "success");
            setTimeout(() => {
                window.location.href = "victim-dashboard.html";
            }, 2000);
        }, 1500);

        /* 🟢 PRODUCTION: Uncomment this for real API call
        try {
            const response = await fetch("https://localhost:7288/api/v1/Incident/create", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                    // Don't set Content-Type header - browser will set it automatically with boundary
                },
                body: formData
            });
    
            const data = await response.json();
    
            if (response.ok && data.succeeded) {
                showFeedback("✅ Emergency reported successfully! Help is on the way.", "success");
                setTimeout(() => {
                    window.location.href = "victim-dashboard.html";
                }, 2000);
            } else {
                const errorMessage = data.message || data.errors?.join(", ") || "Failed to submit report. Please try again.";
                showFeedback(`❌ ${errorMessage}`, "error");
                submitBtn.disabled = false;
                submitBtn.classList.remove("loading");
            }
        } catch (error) {
            console.error("Report submission error:", error);
            showFeedback("⚠️ Network error. Please check your connection and try again.", "error");
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
        }
        */
    });
});