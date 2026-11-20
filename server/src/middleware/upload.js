const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// server/uploads  (src/middleware -> ../../uploads)
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const storageFor = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_ROOT, folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    }
  });

const profilePhoto = multer({
  storage: storageFor('profile'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(badRequest('Only PNG, JPG, WEBP or GIF images are allowed'))
}).single('photo');

const ALLOWED_WORK_FILES = new Set([
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.csv', '.txt', '.md',
  '.zip', '.ipynb', '.py', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.webp'
]);

const taskFile = multer({
  storage: storageFor('submissions'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ALLOWED_WORK_FILES.has(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(badRequest('This file type is not allowed'))
}).single('file');

/** Deletes a file previously saved under /uploads (ignores anything else) */
const removeUploaded = (publicPath) => {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const full = path.join(UPLOAD_ROOT, publicPath.replace('/uploads/', ''));
  if (full.startsWith(UPLOAD_ROOT)) fs.unlink(full, () => {});
};

module.exports = { UPLOAD_ROOT, profilePhoto, taskFile, removeUploaded };
