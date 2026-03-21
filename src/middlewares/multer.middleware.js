import multer from 'multer';
import path from 'path';
import fs from 'fs';

// directory where files are temporarily stored before being sent to Cloudinary
const uploadDir = path.join(process.cwd(), 'uploads');
// ensure the uploads folder exists
fs.mkdirSync(uploadDir, { recursive: true });

// disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // prefix with timestamp to avoid collisions
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

// file filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
