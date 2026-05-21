const API = `${window.location.origin}/api`;

// ======================================
// GLOBAL FUNCTIONS
// ======================================

window.loginAdmin = loginAdmin;
window.trackComplaint = trackComplaint;
window.sendReply = sendReply;
window.deleteComplaint = deleteComplaint;

// ======================================
// PANEL LAYOUT SWITCH
// ======================================

const mainContainer =
  document.querySelector(
    ".main-container"
  );

function setLayoutMode(mode) {
  if (!mainContainer) return;

  mainContainer.classList.remove(
    "student-active",
    "admin-active"
  );

  mainContainer.classList.add(
    mode === "admin"
      ? "admin-active"
      : "student-active"
  );
}

setLayoutMode("student");

// ======================================
// SUBMIT COMPLAINT
// ======================================

const complaintForm =
  document.getElementById(
    "complaintForm"
  );

if (complaintForm) {

  complaintForm.addEventListener(
    "focusin",
    function () {
      setLayoutMode("student");
    }
  );

  complaintForm.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();

      const complaint = {

        id: Date.now(),

        name:
          document
            .getElementById(
              "name"
            )
            .value
            .trim(),

        usn:
          document
            .getElementById(
              "usn"
            )
            .value
            .trim()
            .toLowerCase(),

        department:
          document
            .getElementById(
              "department"
            )
            .value,

        category:
          document
            .getElementById(
              "category"
            )
            .value,

        title:
          document
            .getElementById(
              "title"
            )
            .value
            .trim(),

        description:
          document
            .getElementById(
              "description"
            )
            .value
            .trim(),

        status: "Pending",

        adminReply:
          "No reply yet",
      };

      try {

        const res = await fetch(
          `${API}/submit-complaint`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              complaint
            ),
          }
        );

        const data =
          await res.json();

        document.getElementById(
          "message"
        ).innerText =
          data.message;

        complaintForm.reset();

      } catch (err) {

        console.log(err);

        alert(
          "Backend not running"
        );
      }
    }
  );
}

// ======================================
// ADMIN LOGIN
// ======================================

async function loginAdmin() {

  setLayoutMode("admin");

  const passwordInput =
    document.getElementById(
      "adminPassword"
    );

  const password =
    passwordInput.value;

  try {

    const res = await fetch(
      `${API}/admin-login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          password,
        }),
      }
    );

    const data =
      await res.json();

    if (data.success) {

      // CLEAR PASSWORD FIELD

      passwordInput.value = "";

      // CLEAR ERROR MESSAGE

      document.getElementById(
        "loginMessage"
      ).innerText = "";

      // HIDE LOGIN

      document.getElementById(
        "loginSection"
      ).style.display =
        "none";

      // SHOW DASHBOARD

      document.getElementById(
        "adminDashboard"
      ).style.display =
        "block";

      // LOAD COMPLAINTS

      loadComplaints();

    } else {

      document.getElementById(
        "loginMessage"
      ).innerText =
        data.message;
    }

  } catch (err) {

    console.log(err);

    alert(
      "Server error"
    );
  }
}

// ======================================
// LOAD COMPLAINTS
// ======================================

async function loadComplaints() {

  setLayoutMode("admin");

  try {

    const res = await fetch(
      `${API}/complaints`
    );

    const complaints =
      await res.json();

    const complaintsList =
      document.getElementById(
        "complaintsList"
      );

    complaintsList.innerHTML =
      "";

    complaints.reverse();

    complaints.forEach((c) => {

      complaintsList.innerHTML += `

      <div class="complaint-card">

        <h3>${c.title}</h3>

        <p>
          <strong>Name:</strong>
          ${c.name}
        </p>

        <p>
          <strong>USN:</strong>
          ${c.usn}
        </p>

        <p>
          <strong>Status:</strong>
          ${c.status}
        </p>

        <p>
          <strong>Reply:</strong>
          ${c.adminReply}
        </p>

        <textarea
          id="reply-${c.id}"
          placeholder="Write reply"
        ></textarea>

        <select id="status-${c.id}">

          <option value="Pending">
            Pending
          </option>

          <option value="In Progress">
            In Progress
          </option>

          <option value="Resolved">
            Resolved
          </option>

        </select>

        <button
          onclick="sendReply(${c.id})"
        >
          Save Reply
        </button>

        <button
          onclick="deleteComplaint(${c.id})"
        >
          Delete
        </button>

      </div>
      `;
    });

  } catch (err) {

    console.log(err);
  }
}

// ======================================
// SEND REPLY
// ======================================

async function sendReply(id) {

  setLayoutMode("admin");

  const adminReply =
    document.getElementById(
      `reply-${id}`
    ).value;

  const status =
    document.getElementById(
      `status-${id}`
    ).value;

  try {

    const res = await fetch(
      `${API}/reply/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          adminReply,
          status,
        }),
      }
    );

    const data =
      await res.json();

    alert(data.message);

    loadComplaints();

  } catch (err) {

    console.log(err);
  }
}

// ======================================
// DELETE COMPLAINT
// ======================================

async function deleteComplaint(id) {

  setLayoutMode("admin");

  try {

    const res = await fetch(
      `${API}/complaints/${id}`,
      {
        method: "DELETE",
      }
    );

    const data =
      await res.json();

    alert(data.message);

    loadComplaints();

  } catch (err) {

    console.log(err);
  }
}

// ======================================
// TRACK COMPLAINT
// ======================================

async function trackComplaint() {

  setLayoutMode("student");

  const usnInput =
    document.getElementById(
      "trackUsn"
    );

  const usn =
    usnInput.value
      .trim()
      .toLowerCase();

  const result =
    document.getElementById(
      "trackResult"
    );

  // CLEAR OLD RESULTS

  result.innerHTML = "";

  try {

    const res = await fetch(
      `${API}/track/${usn}`
    );

    const complaints =
      await res.json();

    // CLEAR INPUT FIELD

    usnInput.value = "";

    if (
      complaints.length === 0
    ) {

      result.innerHTML =
        "<p>No complaints found</p>";

      return;
    }

    complaints.forEach((c) => {

      result.innerHTML += `

      <div class="complaint-card">

        <h3>${c.title}</h3>

        <p>
          <strong>Status:</strong>
          ${c.status}
        </p>

        <p>
          <strong>Reply:</strong>
          ${c.adminReply}
        </p>

      </div>
      `;
    });

  } catch (err) {

    console.log(err);
  }
}

const adminPasswordInput =
  document.getElementById(
    "adminPassword"
  );

if (adminPasswordInput) {
  adminPasswordInput.addEventListener(
    "focus",
    function () {
      setLayoutMode("admin");
    }
  );
}

const studentPanel =
  document.querySelector(
    ".student-panel"
  );

if (studentPanel) {
  studentPanel.addEventListener(
    "click",
    function () {
      setLayoutMode("student");
    }
  );
}

const adminPanel =
  document.querySelector(
    ".admin-panel"
  );

if (adminPanel) {
  adminPanel.addEventListener(
    "click",
    function () {
      setLayoutMode("admin");
    }
  );
}
