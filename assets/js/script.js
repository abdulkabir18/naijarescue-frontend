const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");

// Only add the event listener if the hamburger element exists on the page
if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
}