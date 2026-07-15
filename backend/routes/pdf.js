const express = require("express");
const router = express.Router();
const pdfController = require("../controllers/pdfController");
const verifyToken = require("../middleware/auth");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

router.use(verifyToken);
router.post("/upload", upload.single("pdf"), pdfController.uploadPdf);
router.get("/", pdfController.getPdfs);
router.delete("/:fileName", pdfController.deletePdf);

module.exports = router;
