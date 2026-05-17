const express = require("express");

const cors = require("cors");

const fs = require("fs");

const path = require("path");

const app = express();

const PORT = 3000;

app.use(cors());

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "../frontend")
  )
);

const filePath = path.join(
  __dirname,
  "complaints.json"
);

// =======================
// CREATE FILE
// =======================

if (!fs.existsSync(filePath)) {

  fs.writeFileSync(
    filePath,
    JSON.stringify([])
  );
}

// =======================
// HOME PAGE
// =======================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "../frontend/index.html"
    )
  );
});

// =======================
// SUBMIT COMPLAINT
// =======================

app.post("/submit-complaint", (req, res) => {

  const complaint = req.body;

  const data = JSON.parse(
    fs.readFileSync(filePath)
  );

  data.push(complaint);

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2)
  );

  res.json({
    message:
      "Complaint Submitted Successfully",
  });
});

// =======================
// GET ALL COMPLAINTS
// =======================

app.get("/complaints", (req, res) => {

  const data = JSON.parse(
    fs.readFileSync(filePath)
  );

  res.json(data);
});

// =======================
// TRACK BY USN
// =======================

app.get("/track/:usn", (req, res) => {

  const usn = req.params.usn
    .trim()
    .toLowerCase();

  const data = JSON.parse(
    fs.readFileSync(filePath)
  );

  const filtered = data.filter((c) => {

    return (
      c.usn &&
      c.usn.trim().toLowerCase() === usn
    );
  });

  res.json(filtered);
});

// =======================
// ADMIN REPLY
// =======================

app.put("/reply/:id", (req, res) => {

  const id = Number(req.params.id);

  const { adminReply, status } =
    req.body;

  const data = JSON.parse(
    fs.readFileSync(filePath)
  );

  const complaint = data.find(
    (c) => c.id === id
  );

  if (!complaint) {

    return res.status(404).json({
      message: "Complaint not found",
    });
  }

  complaint.adminReply = adminReply;

  complaint.status = status;

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2)
  );

  res.json({
    message: "Reply Sent Successfully",
  });
});

// =======================
// START SERVER
// =======================

app.listen(PORT, () => {

  console.log(
    `Server running on http://localhost:${PORT}`
  );
});