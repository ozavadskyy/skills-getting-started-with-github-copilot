document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const submitButton = signupForm.querySelector("button[type='submit']");
  let cachedActivities = {};

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const title = document.createElement("h4");
      title.className = "activity-title";
      title.textContent = name;

      const description = document.createElement("p");
      description.textContent = details.description;

      const schedule = document.createElement("p");
      schedule.className = "activity-meta";
      schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

      const availability = document.createElement("p");
      availability.className = "activity-meta";
      availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

      const participantsBlock = document.createElement("div");
      participantsBlock.className = "participants";

      const participantsTitle = document.createElement("p");
      participantsTitle.className = "participants-title";
      participantsTitle.textContent = "Participants:";

      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";

      if (details.participants.length === 0) {
        const item = document.createElement("li");
        item.className = "participants-empty";
        item.textContent = "No participants yet";
        participantsList.appendChild(item);
      } else {
        details.participants.forEach((email) => {
          const item = document.createElement("li");

          const emailText = document.createElement("span");
          emailText.className = "participant-email";
          emailText.textContent = email;

          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "participant-delete";
          deleteButton.dataset.activity = name;
          deleteButton.dataset.email = email;
          deleteButton.setAttribute("aria-label", `Remove ${email}`);
          deleteButton.title = `Remove ${email}`;
          deleteButton.innerHTML = "&times;";

          item.appendChild(emailText);
          item.appendChild(deleteButton);
          participantsList.appendChild(item);
        });
      }

      participantsBlock.appendChild(participantsTitle);
      participantsBlock.appendChild(participantsList);

      activityCard.appendChild(title);
      activityCard.appendChild(description);
      activityCard.appendChild(schedule);
      activityCard.appendChild(availability);
      activityCard.appendChild(participantsBlock);

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?t=${Date.now()}`, { cache: "no-store" });
      const activities = await response.json();
      cachedActivities = activities;
      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    submitButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Update local UI state first so users see the new participant immediately.
        if (cachedActivities[activity]) {
          if (!cachedActivities[activity].participants.includes(email)) {
            cachedActivities[activity].participants.push(email);
          }
          renderActivities(cachedActivities);
        }

        signupForm.reset();

        // Then sync from API to keep UI consistent with server state.
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    } finally {
      submitButton.disabled = false;
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete");
    if (!deleteButton) {
      return;
    }

    const { activity, email } = deleteButton.dataset;
    if (!activity || !email) {
      return;
    }

    deleteButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to remove participant");
      }

      if (cachedActivities[activity]) {
        cachedActivities[activity].participants = cachedActivities[activity].participants.filter(
          (participantEmail) => participantEmail !== email
        );
        renderActivities(cachedActivities);
      }

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");

      await fetchActivities();

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to remove participant";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    } finally {
      deleteButton.disabled = false;
    }
  });

  fetchActivities();
});