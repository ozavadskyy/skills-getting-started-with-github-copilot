document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const submitButton = signupForm.querySelector("button[type='submit']");

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const titleButton = document.createElement("button");
      titleButton.type = "button";
      titleButton.className = "activity-title-button";
      titleButton.textContent = name;

      const description = document.createElement("p");
      description.textContent = details.description;

      const schedule = document.createElement("p");
      schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

      const availability = document.createElement("p");
      availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

      const participantsBlock = document.createElement("div");
      participantsBlock.className = "participants hidden";

      const participantsTitle = document.createElement("p");
      participantsTitle.className = "participants-title";
      participantsTitle.textContent = "Participants:";

      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";

      if (details.participants.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No participants yet";
        participantsList.appendChild(item);
      } else {
        details.participants.forEach((email) => {
          const item = document.createElement("li");
          item.textContent = email;
          participantsList.appendChild(item);
        });
      }

      participantsBlock.appendChild(participantsTitle);
      participantsBlock.appendChild(participantsList);

      titleButton.addEventListener("click", () => {
        participantsBlock.classList.toggle("hidden");
      });

      activityCard.appendChild(titleButton);
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
      const response = await fetch("/activities");
      const activities = await response.json();
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
        signupForm.reset();

        // Enhancement 1: refresh activities so available spots update immediately.
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

  fetchActivities();
});