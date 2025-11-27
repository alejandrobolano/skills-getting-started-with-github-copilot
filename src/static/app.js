document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // avoid any caching so we always get the latest participants
      const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();
      console.log('fetched activities', activities);

      // Clear loading message and activity select (keep placeholder)
      activitiesList.innerHTML = "";
      // Reset activity dropdown but preserve the first placeholder option if present
      const placeholder = activitySelect.querySelector('option[value=""]');
      activitySelect.innerHTML = "";
      if (placeholder) activitySelect.appendChild(placeholder.cloneNode(true));

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        // mark card with activity name to allow targeted updates
        activityCard.dataset.activity = name;

        const spotsLeft = details.max_participants - details.participants.length;

        // Title and basic info
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);

        // Participants section
        const participantsWrapper = document.createElement('div');
        const participantsTitle = document.createElement('div');
        participantsTitle.className = 'participants-title';
        participantsTitle.textContent = 'Participants';

        participantsWrapper.appendChild(participantsTitle);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          details.participants.forEach((p) => {
            const li = document.createElement('li');

            // Create avatar with initials (from email or name)
            const avatar = document.createElement('span');
            avatar.className = 'participant-avatar';
            const local = (p || '').split('@')[0] || p;
            const parts = local.split(/[^a-zA-Z0-9]+/).filter(Boolean);
            let initials = '';
            if (parts.length === 1) {
              initials = parts[0].slice(0, 2).toUpperCase();
            } else {
              initials = (parts[0][0] || '') + (parts[parts.length - 1][0] || '');
              initials = initials.toUpperCase();
            }
            avatar.textContent = initials || '•';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'participant-name';
            nameSpan.textContent = p;

            // Delete button
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'participant-delete';
            del.title = 'Remove participant';
            del.innerHTML = '✕';
            del.addEventListener('click', async (ev) => {
              ev.stopPropagation();
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const res = await fetch(`/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`, { method: 'DELETE' });
                const body = await res.json();
                if (res.ok) {
                  messageDiv.textContent = body.message || 'Removed participant';
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                  fetchActivities();
                } else {
                  messageDiv.textContent = body.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
              } catch (err) {
                messageDiv.textContent = 'Network error removing participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                console.error(err);
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(del);
            ul.appendChild(li);
          });

          participantsWrapper.appendChild(ul);
        } else {
          const none = document.createElement('div');
          none.className = 'no-participants';
          none.textContent = 'No participants yet';
          participantsWrapper.appendChild(none);
        }

        activityCard.appendChild(participantsWrapper);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // return activities for callers that await this function
      return activities;
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log('Signup successful:', result);
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show updated participants and wait for it to finish
        await fetchActivities();
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
