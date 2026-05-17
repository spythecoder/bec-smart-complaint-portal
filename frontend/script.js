const API = "";

// =======================
// SUBMIT COMPLAINT
// =======================

document
  .getElementById("complaintForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    const complaint = {

      id: Date.now(),

      name:
        document.getElementById("name").value,

      usn:
        document
          .getElementById("usn")
          .value
          .trim()
          .toLowerCase(),

      department:
        document.getElementById("department").value,

      category:
        document.getElementById("category").value,

      title:
        document.getElementById("title").value,

      description:
        document.getElementById("description").value,

      adminReply: "No reply yet",

      status: "Pending",
    };

    try {

      const res = await fetch(
        `${API}/submit-complaint`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(complaint),
        }
      );

      const data = await res.json();

      const message =
        document.getElementById("message");

      message.innerText = data.message;

      message.style.color = "green";

      document
        .getElementById("complaintForm")
        .reset();

    } catch (err) {

      console.log(err);
    }
  });

// =======================
// ADMIN LOGIN
// =======================

function loginAdmin() {

  const password =
    document.getElementById(
      "adminPassword"
    ).value;

  if (password === "admin123") {

    document.getElementById(
      "loginSection"
    ).style.display = "none";

    document.getElementById(
      "adminDashboard"
    ).style.display = "block";

    // 80% ADMIN PANEL
    document.querySelector(
      ".student-panel"
    ).style.flex = "0.2";

    document.querySelector(
      ".admin-panel"
    ).style.flex = "0.8";

    loadComplaints();

  } else {

    document.getElementById(
      "loginMessage"
    ).innerText = "Wrong Password";

    document.getElementById(
      "loginMessage"
    ).style.color = "red";
  }
}

// =======================
// LOAD COMPLAINTS
// =======================

async function loadComplaints() {

  try {

    const res = await fetch(
      `${API}/complaints`
    );

    const complaints = await res.json();

    const complaintsList =
      document.getElementById(
        "complaintsList"
      );

    complaintsList.innerHTML = "";

    if (complaints.length === 0) {

      complaintsList.innerHTML =
        "<p>No complaints available</p>";

      return;
    }

    complaints.reverse().forEach((c) => {

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
            <strong>Department:</strong>
            ${c.department}
          </p>

          <p>
            <strong>Category:</strong>
            ${c.category}
          </p>

          <p>
            <strong>Description:</strong>
            ${c.description}
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
            placeholder="Write admin reply..."
          >${c.adminReply === "No reply yet" ? "" : c.adminReply}</textarea>

          <select id="status-${c.id}">

            <option value="Pending"
              ${c.status === "Pending"
                ? "selected"
                : ""}
            >
              Pending
            </option>

            <option value="In Progress"
              ${c.status === "In Progress"
                ? "selected"
                : ""}
            >
              In Progress
            </option>

            <option value="Resolved"
              ${c.status === "Resolved"
                ? "selected"
                : ""}
            >
              Resolved
            </option>

          </select>

          <button onclick="sendReply(${c.id})">
            Save Reply
          </button>

          <button
            onclick="deleteComplaint(${c.id})"
            style="
              margin-top:10px;
              background:#dc2626;
            "
          >
            Delete Complaint
          </button>

        </div>

      `;
    });

  } catch (err) {

    console.log(err);
  }
}

// =======================
// SEND REPLY
// =======================

async function sendReply(id) {

  try {

    const allRes = await fetch(
      `${API}/complaints`
    );

    const allComplaints =
      await allRes.json();

    const currentComplaint =
      allComplaints.find(
        (c) => c.id === id
      );

    const newReply =
      document.getElementById(
        `reply-${id}`
      ).value.trim();

    const status =
      document.getElementById(
        `status-${id}`
      ).value;

    const finalReply =
      newReply !== ""
        ? newReply
        : currentComplaint.adminReply;

    const res = await fetch(
      `${API}/reply/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          adminReply: finalReply,
          status: status,
        }),
      }
    );

    const data = await res.json();

    alert(data.message);

    loadComplaints();

  } catch (err) {

    console.log(err);
  }
}

// =======================
// DELETE COMPLAINT
// =======================

async function deleteComplaint(id) {

  const confirmDelete = confirm(
    "Are you sure you want to delete this complaint?"
  );

  if (!confirmDelete) return;

  try {

    const res = await fetch(
      `${API}/delete/${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();

    alert(data.message);

    loadComplaints();

  } catch (err) {

    console.log(err);
  }
}

// =======================
// TRACK COMPLAINT
// =======================

async function trackComplaint() {

  const usn = document
    .getElementById("trackUsn")
    .value
    .trim()
    .toLowerCase();

  const result =
    document.getElementById(
      "trackResult"
    );

  result.innerHTML = "Loading...";

  try {

    const res = await fetch(
      `${API}/track/${usn}`
    );

    const complaints =
      await res.json();

    result.innerHTML = "";

    if (
      !complaints ||
      complaints.length === 0
    ) {

      result.innerHTML = `
        <p style="color:red;">
          No complaints found
        </p>
      `;

      return;
    }

    complaints.reverse().forEach((c) => {

      result.innerHTML += `

        <div class="complaint-card">

          <h3>${c.title}</h3>

          <p>
            <strong>Status:</strong>
            ${c.status}
          </p>

          <p>
            <strong>Department:</strong>
            ${c.department}
          </p>

          <p>
            <strong>Category:</strong>
            ${c.category}
          </p>

          <p>
            <strong>Complaint:</strong>
            ${c.description}
          </p>

          <p>
            <strong>Admin Reply:</strong>
            ${c.adminReply}
          </p>

        </div>

      `;
    });

  } catch (err) {

    result.innerHTML = `
      <p style="color:red;">
        Error loading complaints
      </p>
    `;

    console.log(err);
  }
}