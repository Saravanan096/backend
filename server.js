require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const File = require("./models/File");
const authRouter = require("./routes/authRouter");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= MONGODB ATLAS ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

/* ================= AUTH ROUTES ================= */
app.use("/api/auth", authRouter);

/* ================= UPLOAD FOLDER ================= */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed =
      file.mimetype === "application/pdf" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!allowed) {
      return cb(new Error("Only PDF and DOCX allowed"));
    }

    cb(null, true);
  }
});

/* ================= UPLOAD API ================= */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { username } = req.body;

    const newFile = new File({
      username,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: `/uploads/${req.file.filename}`
    });

    await newFile.save();

    res.json({ message: "File uploaded successfully" });
  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
});

/* ================= SEARCH API ================= */
app.get("/api/files/:username", async (req, res) => {
  try {
    const files = await File.find({ username: req.params.username });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
});

/* ================= STATIC FILE ACCESS ================= */
app.use("/uploads", express.static("uploads"));

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
