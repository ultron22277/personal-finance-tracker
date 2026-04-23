/**
 * Secure File Upload Middleware
 * - ONLY accepts .csv files — rejects PDFs, images, scripts, executables, everything else
 * - Maximum file size: 5MB
 * - Validates both extension AND MIME type (double-check)
 * - Prevents path traversal attacks
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure temp upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Sanitize filename — strip path separators, special chars
    const safeName = `${Date.now()}-${req.user?.id || 'unknown'}.csv`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.csv') {
    return cb(new Error('Only .csv files are allowed. Rejected: ' + ext), false);
  }

  // Check MIME type — must be text/csv or text/plain (some OS send this for CSV)
  const allowedMimes = ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only CSV files are accepted.'), false);
  }

  cb(null, true);
};

const csvUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB hard limit
    files: 1,                    // Only 1 file per request
  },
  fileFilter,
}).single('file');

/** Wrap multer to return proper JSON errors */
const handleCsvUpload = (req, res, next) => {
  csvUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum allowed size is 5MB.' });
      }
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    next();
  });
};

module.exports = { handleCsvUpload, UPLOAD_DIR };
