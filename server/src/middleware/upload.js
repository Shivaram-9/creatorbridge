import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Chat media storage
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/chat/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    cb(null, uniqueSuffix + "-" + sanitized);
  },
});

const chatFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed"), false);
  }
};

export const chatUpload = multer({
  storage: chatStorage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Profile avatar storage
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/avatars/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    cb(null, `avatar-${uniqueSuffix}-${sanitized}`);
  },
});

export const profileUpload = multer({
  storage: profileStorage,
  fileFilter, // Only images
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Story storage
const storyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/stories/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    cb(null, `story-${uniqueSuffix}-${sanitized}`);
  },
});

export const storyUpload = multer({
  storage: storyStorage,
  fileFilter: chatFileFilter, // Allows images & videos
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});
