function showFeedback(elementId, message, type, autoHideDelay = 5000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = `feedback-message ${type}`;
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (type === 'success' && autoHideDelay > 0) {
        setTimeout(() => {
            element.className = 'feedback-message';
            element.textContent = '';
        }, autoHideDelay);
    }
}

function generateInitialsAvatar(name) {
    // Add a guard clause to handle null, undefined, or empty names
    if (!name || typeof name !== 'string' || name.trim() === '') {
        name = '??'; // Use a default placeholder
    }

    const colors = ["#1F7A8C", "#E67E22", "#9B59B6", "#27AE60", "#C0392B", "#2980B9"];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    const bgColor = colors[index];
    const initials = name
        ? name
            .split(" ")
            .filter(Boolean) // Filter out empty strings from the split
            .map(n => n[0].toUpperCase())
            .slice(0, 2).join("")
        : "??";

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <circle cx="128" cy="128" r="120" fill="${bgColor}" />
      <text x="50%" y="52%" font-family="Arial, Helvetica, sans-serif"
            font-size="96" fill="#ffffff" font-weight="700"
            text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}