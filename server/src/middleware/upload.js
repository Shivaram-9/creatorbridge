import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Strict filename sanitization
const sanitizeFilename = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  return `${uuidv4()}${ext}`;
};

// Strict MIME type filters
const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid image type. Only JPG, PNG, WEBP and GIF are allowed."), false);
  }
};

const mediaFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid media type. Only safe images and MP4/MOV videos are allowed."), false);
  }
};

const storageConfig = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureDir(folder)),
  filename: (req, file, cb) => cb(null, sanitizeFilename(file))
});

// Hardened Uploaders
export const upload = multer({
  storage: storageConfig("uploads/"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export const chatUpload = multer({
  storage: storageConfig("uploads/chat/"),
  fileFilter: mediaFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

export const profileUpload = multer({
  storage: storageConfig("uploads/avatars/"),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB for avatars
});

export const storyUpload = multer({
  storage: storageConfig("uploads/stories/"),
  fileFilter: mediaFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

export const postUpload = multer({
  storage: storageConfig("uploads/posts/"),
  fileFilter: mediaFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
