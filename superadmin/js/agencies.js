document.addEventListener("DOMContentLoaded", () => {
    const addAgencyBtn = document.getElementById("addAgencyBtn");
    const agencyModal = document.getElementById("agencyModal");
    const closeModal = document.getElementById("closeModal");
    const agencyForm = document.getElementById("agencyForm");
    const agencyList = document.getElementById("agencyList");

    // Open modal
    addAgencyBtn.addEventListener("click", () => {
        agencyModal.style.display = "flex";
    });

    // Close modal
    closeModal.addEventListener("click", () => {
        agencyModal.style.display = "none";
    });

    // Add new agency (temporary demo)
    agencyForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("agencyName").value;
        const type = document.getElementById("agencyType").value;
        const location = document.getElementById("agencyLocation").value;
        const status = document.getElementById("agencyStatus").value;

        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${name}</td>
      <td>${type}</td>
      <td>${location}</td>
      <td><span class="status ${status.toLowerCase()}">${status}</span></td>
      <td>${new Date().toLocaleDateString()}</td>
      <td>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </td>
    `;
        agencyList.appendChild(row);

        agencyModal.style.display = "none";
        agencyForm.reset();
    });
});
