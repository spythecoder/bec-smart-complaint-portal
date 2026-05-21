const API = `${window.location.origin}/api`;
const LOCAL_KEY = "bec_complaints_local";
const LOCAL_ADMIN_PASSWORD = "admin123";

window.loginAdmin = loginAdmin;
window.trackComplaint = trackComplaint;
window.sendReply = sendReply;
window.deleteComplaint = deleteComplaint;

const mainContainer = document.querySelector(".main-container");

function setLayoutMode(mode) {
  if (!mainContainer) return;
  mainContainer.classList.remove("student-active", "admin-active");
  mainContainer.classList.add(mode === "admin" ? "admin-active" : "student-active");
}

setLayoutMode("student");

function getLocalComplaints() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function setLocalComplaints(list) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

async function apiJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function renderComplaints(complaints) {
  const complaintsList = document.getElementById("complaintsList");
  if (!complaintsList) return;
  complaintsList.innerHTML = "";

  [...complaints].reverse().forEach((c) => {
    complaintsList.innerHTML += `
      <div class="complaint-card">
        <h3>${c.title}</h3>
        <p><strong>Name:</strong> ${c.name}</p>
        <p><strong>USN:</strong> ${c.usn}</p>
        <p><strong>Status:</strong> ${c.status}</p>
        <p><strong>Reply:</strong> ${c.adminReply}</p>

        <textarea id="reply-${c.id}" placeholder="Write reply"></textarea>
        <select id="status-${c.id}">
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <button onclick="sendReply(${c.id})">Save Reply</button>
        <button onclick="deleteComplaint(${c.id})">Delete</button>
      </div>
    `;
    const statusEl = document.getElementById(`status-${c.id}`);
    if (statusEl) statusEl.value = c.status || "Pending";
  });
}

const complaintForm = document.getElementById("complaintForm");

if (complaintForm) {
  complaintForm.addEventListener("focusin", () => setLayoutMode("student"));

  complaintForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const complaint = {
      id: Date.now(),
      name: document.getElementById("name").value.trim(),
      usn: document.getElementById("usn").value.trim().toLowerCase(),
      department: document.getElementById("department").value,
      category: document.getElementById("category").value,
      title: document.getElementById("title").value.trim(),
      description: document.getElementById("description").value.trim(),
      status: "Pending",
      adminReply: "No reply yet"
    };

    const messageEl = document.getElementById("message");

    try {
      const data = await apiJson(`${API}/submit-complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(complaint)
      });
      messageEl.innerText = data.message || "Complaint submitted";
      complaintForm.reset();
    } catch (_) {
      const local = getLocalComplaints();
      local.push(complaint);
      setLocalComplaints(local);
      messageEl.innerText = "Saved offline (local browser storage).";
      complaintForm.reset();
    }
  });
}

async function loginAdmin() {
  setLayoutMode("admin");

  const passwordInput = document.getElementById("adminPassword");
  const loginMessage = document.getElementById("loginMessage");
  const password = passwordInput.value;

  try {
    const data = await apiJson(`${API}/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!data.success) {
      loginMessage.innerText = data.message || "Wrong password";
      return;
    }
  } catch (_) {
    if (password !== LOCAL_ADMIN_PASSWORD) {
      loginMessage.innerText = "Wrong password";
      passwordInput.value = "";
      return;
    }
    loginMessage.innerText = "Offline admin mode";
  }

  passwordInput.value = "";
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("adminDashboard").style.display = "block";
  loadComplaints();
}

async function loadComplaints() {
  setLayoutMode("admin");
  try {
    const complaints = await apiJson(`${API}/complaints`);
    renderComplaints(complaints);
  } catch (_) {
    renderComplaints(getLocalComplaints());
  }
}

async function sendReply(id) {
  setLayoutMode("admin");

  const adminReply = document.getElementById(`reply-${id}`).value;
  const status = document.getElementById(`status-${id}`).value;

  try {
    const data = await apiJson(`${API}/reply/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminReply, status })
    });
    alert(data.message || "Updated");
    loadComplaints();
  } catch (_) {
    const list = getLocalComplaints();
    const idx = list.findIndex((c) => Number(c.id) === Number(id));
    if (idx !== -1) {
      list[idx].adminReply = adminReply;
      list[idx].status = status;
      setLocalComplaints(list);
      alert("Updated in offline mode");
      loadComplaints();
    }
  }
}

async function deleteComplaint(id) {
  setLayoutMode("admin");

  try {
    const data = await apiJson(`${API}/complaints/${id}`, { method: "DELETE" });
    alert(data.message || "Deleted");
    loadComplaints();
  } catch (_) {
    const list = getLocalComplaints().filter((c) => Number(c.id) !== Number(id));
    setLocalComplaints(list);
    alert("Deleted in offline mode");
    loadComplaints();
  }
}

async function trackComplaint() {
  setLayoutMode("student");

  const usnInput = document.getElementById("trackUsn");
  const usn = usnInput.value.trim().toLowerCase();
  const result = document.getElementById("trackResult");
  result.innerHTML = "";

  let complaints = [];
  try {
    complaints = await apiJson(`${API}/track/${usn}`);
  } catch (_) {
    complaints = getLocalComplaints().filter((c) => (c.usn || "").toLowerCase() === usn);
  }

  usnInput.value = "";

  if (!complaints.length) {
    result.innerHTML = "<p>No complaints found</p>";
    return;
  }

  complaints.forEach((c) => {
    result.innerHTML += `
      <div class="complaint-card">
        <h3>${c.title}</h3>
        <p><strong>Status:</strong> ${c.status}</p>
        <p><strong>Reply:</strong> ${c.adminReply}</p>
      </div>
    `;
  });
}

const adminPasswordInput = document.getElementById("adminPassword");
if (adminPasswordInput) adminPasswordInput.addEventListener("focus", () => setLayoutMode("admin"));

const studentPanel = document.querySelector(".student-panel");
if (studentPanel) studentPanel.addEventListener("click", () => setLayoutMode("student"));

const adminPanel = document.querySelector(".admin-panel");
if (adminPanel) adminPanel.addEventListener("click", () => setLayoutMode("admin"));