const express = require("express");
const multer = require("multer");
const supabase = require('../supabase');
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) throw new Error("Keine Datei bekommen!");

    const { data, error } = await supabase.storage
      .from('DocumentsAndPicturesT2')
      .upload(Date.now() + "_" + file.originalname, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    const publicUrl = supabase.storage
      .from('DocumentsAndPicturesT2')
      .getPublicUrl(data.path).data.publicUrl;

    res.json({ url: publicUrl, path: data.path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
