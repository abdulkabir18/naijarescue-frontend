// document.addEventListener("DOMContentLoaded", () => {
//     const token = sessionStorage.getItem("authToken");

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
//             },
//             (error) => {
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
//     });

//     proveUpload.addEventListener("change", (e) => {
//         const file = e.target.files[0];
//         if (!file) return;

//         if (file.size > 10 * 1024 * 1024) {
//             showFeedback("File size must be less than 10MB.", "error");
//             proveUpload.value = "";
//             return;
//         }

//         proveFile = file;
//         displayUploadedFile(file);
//     });

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

//     function handleFileSelect(file) {
//         if (!file) return;
//         if (file.size > 10 * 1024 * 1024) {
//             showFeedback("File size must be less than 10MB.", "error");
//             return;
//         }
//         proveFile = file;
//         displayUploadedFile(file);
//     }

//     photoCapture.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));

//     const takePhotoBtn = document.querySelector("label[for='photoCapture']");
//     takePhotoBtn.addEventListener("click", async (e) => {
//         const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

//         if (isMobile) {
//             return;
//         }

//         e.preventDefault();
//         try {
//             mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
//             cameraPreview.srcObject = mediaStream;
//             cameraContainer.style.display = "block";
//             showFeedback("Camera ready! You can capture a photo or record video.", "success");
//         } catch (err) {
//             showFeedback("Unable to access camera. Please check permissions.", "error");
//         }
//     });

//     capturePhotoBtn.addEventListener("click", () => {
//         if (!mediaStream) return;

//         const ctx = photoCanvas.getContext("2d");
//         photoCanvas.width = cameraPreview.videoWidth;
//         photoCanvas.height = cameraPreview.videoHeight;
//         ctx.drawImage(cameraPreview, 0, 0);

//         photoCanvas.toBlob((blob) => {
//             const file = new File([blob], "captured-photo.jpg", { type: "image/jpeg" });
//             proveFile = file;
//             displayUploadedFile(file);
//             stopCamera();
//         }, "image/jpeg");
//     });

//     startRecordingBtn.addEventListener("click", () => {
//         if (!mediaStream) return;
//         recordedChunks = [];
//         mediaRecorder = new MediaRecorder(mediaStream, { mimeType: "video/webm" });

//         mediaRecorder.ondataavailable = (e) => {
//             if (e.data.size > 0) recordedChunks.push(e.data);
//         };

//         mediaRecorder.onstop = () => {
//             const blob = new Blob(recordedChunks, { type: "video/webm" });
//             const file = new File([blob], "recorded-video.webm", { type: "video/webm" });
//             proveFile = file;
//             displayUploadedFile(file);
//             stopCamera();
//         };

//         mediaRecorder.start();
//         startRecordingBtn.style.display = "none";
//         stopRecordingBtn.style.display = "inline-flex";
//         showFeedback("Recording started...", "success");
//     });

//     stopRecordingBtn.addEventListener("click", () => {
//         if (mediaRecorder && mediaRecorder.state !== "inactive") {
//             mediaRecorder.stop();
//             showFeedback("Recording stopped.", "success");
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


//     videoCapture.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));

//     window.removeFile = function () {
//         proveFile = null;
//         proveUpload.value = "";
//         uploadedFileDiv.innerHTML = "";
//     };

//     function showFeedback(message, type) {
//         feedback.textContent = message;
//         feedback.className = `feedback-message ${type}`;
//         feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
//     }

//     form.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         if (!currentLocation) {
//             showFeedback("Please provide your location.", "error");
//             return;
//         }

//         if (!proveFile) {
//             showFeedback("Please upload proof (photo or video) of the incident.", "error");
//             return;
//         }

//         if (!occurredAtInput.value) {
//             showFeedback("Please select when the incident occurred.", "error");
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

//         // 🔴 TESTING: Mock submission
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

document.addEventListener("DOMContentLoaded", () => {
    const token = sessionStorage.getItem("authToken");

    // 🔴 TESTING: Comment out redirect for testing
    // if (!token) {
    //     alert("Please login to report an emergency.");
    //     window.location.href = "/login.html";
    //     return;
    // }

    const form = document.getElementById("reportForm");
    const submitBtn = document.getElementById("submitBtn");
    const feedback = document.getElementById("feedback");

    const useLocationBtn = document.getElementById("useCurrentLocation");
    const manualLocationBtn = document.getElementById("enterManually");
    const setManualLocationBtn = document.getElementById("setManualLocation");
    const locationDisplay = document.getElementById("locationDisplay");
    const locationText = document.getElementById("locationText");
    const manualFields = document.getElementById("manualLocationFields");

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

    let mediaStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let proveFile = null;
    let currentLocation = null;

    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    occurredAtInput.value = localDateTime;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.removeItem("authToken");
            window.location.href = "/login.html";
        });
    }

    useLocationBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
            showFeedback("Geolocation is not supported by your browser.", "error");
            return;
        }

        useLocationBtn.disabled = true;
        useLocationBtn.innerHTML = '<i class="ri-loader-4-line"></i> Getting location...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                document.getElementById("latitude").value = currentLocation.latitude;
                document.getElementById("longitude").value = currentLocation.longitude;

                locationText.textContent = `Location: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
                locationDisplay.classList.add("active");
                manualFields.style.display = "none";

                useLocationBtn.disabled = false;
                useLocationBtn.innerHTML = '<i class="ri-crosshair-line"></i> Use Current Location';
                showFeedback("✅ Location captured successfully!", "success");
            },
            (error) => {
                console.error("Geolocation error:", error);
                showFeedback("Unable to get your location. Please enter manually.", "error");
                useLocationBtn.disabled = false;
                useLocationBtn.innerHTML = '<i class="ri-crosshair-line"></i> Use Current Location';
            }
        );
    });

    manualLocationBtn.addEventListener("click", () => {
        manualFields.style.display = "block";
        locationDisplay.classList.remove("active");
        locationText.textContent = "Enter coordinates below";
    });

    setManualLocationBtn.addEventListener("click", () => {
        const lat = parseFloat(document.getElementById("manualLat").value);
        const lng = parseFloat(document.getElementById("manualLng").value);

        if (isNaN(lat) || isNaN(lng)) {
            showFeedback("Please enter valid latitude and longitude.", "error");
            return;
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            showFeedback("Coordinates out of range. Lat: -90 to 90, Lng: -180 to 180", "error");
            return;
        }

        currentLocation = { latitude: lat, longitude: lng };
        document.getElementById("latitude").value = lat;
        document.getElementById("longitude").value = lng;

        locationText.textContent = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        locationDisplay.classList.add("active");
        manualFields.style.display = "none";
        showFeedback("✅ Location set successfully!", "success");
    });

    function handleFileSelect(file) {
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showFeedback("File size must be less than 10MB.", "error");
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
                    <h4>${file.name}</h4>
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

    const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const takePhotoBtn = document.querySelector("label[for='photoCapture']");
    if (takePhotoBtn) {
        takePhotoBtn.addEventListener("click", async (e) => {
            if (isMobileDevice()) {
                return;
            }

            e.preventDefault();
            await startCamera();
        });
    }

    const recordVideoBtn = document.querySelector("label[for='videoCapture']");
    if (recordVideoBtn) {
        recordVideoBtn.addEventListener("click", async (e) => {
            if (isMobileDevice()) {
                return;
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

    function showFeedback(message, type) {
        feedback.textContent = message;
        feedback.className = `feedback-message ${type}`;
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (type === 'success') {
            setTimeout(() => {
                feedback.className = 'feedback-message';
            }, 3000);
        }
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!currentLocation) {
            showFeedback("❌ Please provide your location.", "error");
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

        submitBtn.disabled = true;
        submitBtn.classList.add("loading");

        const formData = new FormData();

        formData.append("Coordinate.Latitude", currentLocation.latitude);
        formData.append("Coordinate.Longitude", currentLocation.longitude);

        formData.append("Prove", proveFile);

        const occurredAt = new Date(occurredAtInput.value).toISOString();
        formData.append("OccurredAt", occurredAt);

        setTimeout(() => {
            showFeedback("✅ Incident reported successfully! Redirecting to dashboard...", "success");
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
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.succeeded) {
                showFeedback("✅ Incident reported successfully! Help is on the way.", "success");
                setTimeout(() => {
                    window.location.href = "victim-dashboard.html";
                }, 2000);
            } else {
                showFeedback(`❌ ${data.message || "Failed to submit report. Please try again."}`, "error");
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