// Profile page: email gate logic

function setupProfileEmailGate() {
  const emailGateForm = document.getElementById("email-gate-form");
  const profileDetails = document.getElementById("profile-details");
  if (emailGateForm && profileDetails) {
    const emailInput = document.getElementById("profile-email-input");
    const viewBtn = document.getElementById("view-profile-btn");
    // Profile fields
    const profileName = document.getElementById('edit-profile-name');
    const profileEmail = document.getElementById('edit-profile-email');
    const profileNotifications = document.getElementById('edit-profile-notifications');
    const profileEditForm = document.getElementById('profile-edit-form');
    const saveBtn = document.getElementById('save-profile-btn');
    const cancelBtn = document.getElementById('cancel-profile-btn');
    const activityHistory = profileDetails.querySelector('.activity-history ul');
    const profileViewFields = document.getElementById('profile-view-fields');
    const profileViewName = document.getElementById('profile-view-name');
    const profileViewEmail = document.getElementById('profile-view-email');
    const profileViewNotifications = document.getElementById('profile-view-notifications');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    let lastProfileData = null;
    if (emailInput && viewBtn) {
      function updateButtonState() {
        const value = emailInput.value.trim();
        viewBtn.disabled = !(value && emailInput.checkValidity());
      }
      emailInput.addEventListener("input", updateButtonState);
      setTimeout(updateButtonState, 0);
    }
    emailGateForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = emailInput.value.trim();
      // Fetch user profile from backend
      try {
        const res = await fetch(`/profiles/${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error("Profile not found");
        const data = await res.json();
        lastProfileData = data;
        // Fill profile fields (edit form)
        if (profileName) profileName.value = data.name || "";
        if (profileEmail) profileEmail.value = email;
        if (profileNotifications) profileNotifications.value = String(data.preferences && data.preferences.notifications);
        // Fill profile fields (view mode)
        if (profileViewName) profileViewName.textContent = data.name || "";
        if (profileViewEmail) profileViewEmail.textContent = email;
        if (profileViewNotifications) profileViewNotifications.textContent = (data.preferences && data.preferences.notifications) ? "Enabled" : "Disabled";
        if (profileViewFields) profileViewFields.style.display = "block";
        if (profileEditForm) profileEditForm.style.display = "none";
            // Edit button shows the edit form
            if (editProfileBtn) {
              editProfileBtn.addEventListener("click", function () {
                if (profileEditForm) profileEditForm.style.display = "block";
                if (profileViewFields) profileViewFields.style.display = "none";
              });
            }
        // Fill activity history
        if (activityHistory) {
          activityHistory.innerHTML = "";
          if (data.activities && data.activities.length > 0) {
            data.activities.forEach(act => {
              const li = document.createElement("li");
              li.textContent = act + " - Registered";
              activityHistory.appendChild(li);
            });
          } else {
            const li = document.createElement("li");
            li.textContent = "No activities found.";
            activityHistory.appendChild(li);
          }
        }
        emailGateForm.style.display = "none";
        profileDetails.style.display = "block";
      } catch (err) {
        alert("Profile not found for this email.");
      }
    });

    // Save profile changes
    if (profileEditForm) {
      profileEditForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!profileEmail) return;
        const email = profileEmail.value;
        const name = profileName.value;
        const notifications = profileNotifications.value === "true";
        try {
          const res = await fetch(`/profiles/${encodeURIComponent(email)}?name=${encodeURIComponent(name)}&notifications=${notifications}`, {
            method: "PUT"
          });
          if (!res.ok) throw new Error("Failed to update profile");
          // Update view fields
          if (profileViewName) profileViewName.textContent = name;
          if (profileViewNotifications) profileViewNotifications.textContent = notifications ? "Enabled" : "Disabled";
          if (profileEditForm) profileEditForm.style.display = "none";
          if (profileViewFields) profileViewFields.style.display = "block";
          alert("Profile updated successfully!");
        } catch (err) {
          alert("Failed to update profile.");
        }
      });
    }

    // Cancel button resets fields to last loaded profile and switches to view mode
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        if (lastProfileData) {
          if (profileName) profileName.value = lastProfileData.name || "";
          if (profileNotifications) profileNotifications.value = String(lastProfileData.preferences && lastProfileData.preferences.notifications);
        }
        if (profileEditForm) profileEditForm.style.display = "none";
        if (profileViewFields) profileViewFields.style.display = "block";
      });
    }
  }
}

if (document.getElementById("profile-container")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupProfileEmailGate);
  } else {
    setupProfileEmailGate();
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
