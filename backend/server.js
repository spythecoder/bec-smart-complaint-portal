const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const IS_VERCEL = process.env.VERCEL === "1";

const dataFile = path.join(__dirname, "complaints.json");
const frontendDir = path.join(__dirname, "..", "frontend");
const KV_REST_API_URL = process.env.KV_REST_API_URL || "";
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || "";
const KV_COMPLAINTS_KEY = "complaints";
const kvEnabled = Boolean(KV_REST_API_URL && KV_REST_API_TOKEN);

app.use(cors());
app.use(express.json());
app.use(express.static(frontendDir));

async function readComplaints() {
  try {
    if (kvEnabled) {
      const res = await fetch(`${KV_REST_API_URL}/get/${KV_COMPLAINTS_KEY}`, {
        headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
      });
      if (!res.ok) throw new Error(`KV read failed: ${res.status}`);
      const data = await res.json();
      if (!data || !data.result) return [];
      return JSON.parse(data.result);
    }

    const raw = await fs.readFile(dataFile, "utf-8");
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === "ENOENT") return [];
    console.error("Error reading complaints:", err);
    return [];
  }
}

async function writeComplaints(complaints) {
  if (kvEnabled) {
    const res = await fetch(`${KV_REST_API_URL}/set/${KV_COMPLAINTS_KEY}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: JSON.stringify(complaints) }),
    });
    if (!res.ok) {
      throw new Error(`KV write failed: ${res.status}`);
    }
    return;
  }

  if (IS_VERCEL) {
    throw new Error("Persistent storage not configured. Add Vercel KV env vars.");
  }

  await fs.writeFile(dataFile, JSON.stringify(complaints, null, 2), "utf-8");
}

app.post("/api/submit-complaint", async (req, res) => {
  try {
    const complaints = await readComplaints();
    complaints.push(req.body);
    await writeComplaints(complaints);
    res.status(201).json({ message: "Complaint submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to submit complaint",
      detail: IS_VERCEL && !kvEnabled ? "Configure Vercel KV for persistent storage." : undefined,
    });
  }
});

app.post("/api/admin-login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, message: "Login successful" });
  }
  return res.status(401).json({ success: false, message: "Wrong password" });
});

app.get("/api/complaints", async (req, res) => {
  const complaints = await readComplaints();
  res.json(complaints);
});

app.get("/api/track/:usn", async (req, res) => {
  const usn = (req.params.usn || "").toLowerCase();
  const complaints = await readComplaints();
  const matched = complaints.filter((c) => (c.usn || "").toLowerCase() === usn);
  res.json(matched);
});

app.put("/api/reply/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { adminReply, status } = req.body;

  const complaints = await readComplaints();
  const idx = complaints.findIndex((c) => Number(c.id) === id);

  if (idx === -1) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  complaints[idx].adminReply = adminReply || complaints[idx].adminReply;
  complaints[idx].status = status || complaints[idx].status;
  try {
    await writeComplaints(complaints);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to update complaint",
      detail: IS_VERCEL && !kvEnabled ? "Configure Vercel KV for persistent storage." : undefined,
    });
  }

  return res.json({ message: "Reply and status updated" });
});

app.delete("/api/complaints/:id", async (req, res) => {
  const id = Number(req.params.id);
  const complaints = await readComplaints();
  const filtered = complaints.filter((c) => Number(c.id) !== id);

  if (filtered.length === complaints.length) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  try {
    await writeComplaints(filtered);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to delete complaint",
      detail: IS_VERCEL && !kvEnabled ? "Configure Vercel KV for persistent storage." : undefined,
    });
  }
  return res.json({ message: "Complaint deleted successfully" });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    storage: kvEnabled ? "vercel-kv" : IS_VERCEL ? "non-persistent" : "local-file",
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
