const express = require("express");
const multer = require("multer");
const File = require("../models/File");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// UPLOAD FILE
router.post("/upload", upload.single("file"), async (req, res) => {
  const newFile = new File({
    username: req.body.username,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`
  });

  await newFile.save();
  res.json({ message: "File uploaded successfully" });
});

// SEARCH FILES BY USERNAME
router.get("/files/:username", async (req, res) => {
  const files = await File.find({ username: req.params.username });
  res.json(files);
});

module.exports = router;
