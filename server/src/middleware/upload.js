import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// ─── Cloudinary Configuration ───────────────────────────────────────────────
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("☁️  Cloudinary storage enabled.");
} else {
  console.log("⚠️  Cloudinary not configured. Falling back to local disk storage.");
}

// ─── Strict MIME type filters ────────────────────────────────────────────────
const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid image type. Only JPG, PNG, WEBP and GIF are allowed."), false);
  }
};

const mediaFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid media type. Only images and MP4/MOV videos are allowed."), false);
  }
};

// ─── Cloudinary storage factory ──────────────────────────────────────────────
function cloudinaryStorage(folder, resourceType = "auto") {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `creatorbridge/${folder}`,
      resource_type: resourceType,
      allowed_formats: ["jpg", "png", "webp", "gif", "mp4", "mov"],
    },
  });
}

// ─── Local disk storage fallback ─────────────────────────────────────────────
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const sanitizeFilename = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  return `${uuidv4()}${ext}`;
};

function diskStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, ensureDir(folder)),
    filename: (req, file, cb) => cb(null, sanitizeFilename(file)),
  });
}

// ─── Multer instances ─────────────────────────────────────────────────────────
// General avatar upload
export const upload = multer({
  storage: useCloudinary ? cloudinaryStorage("avatars", "image") : diskStorage("uploads/"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Avatar upload specifically
export const profileUpload = multer({
  storage: useCloudinary ? cloudinaryStorage("avatars", "image") : diskStorage("uploads/avatars/"),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Post media upload (images + video)
export const postUpload = multer({
  storage: useCloudinary ? cloudinaryStorage("posts", "auto") : diskStorage("uploads/posts/"),
  fileFilter: mediaFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for posts
});

// Story upload
export const storyUpload = multer({
  storage: useCloudinary ? cloudinaryStorage("stories", "auto") : diskStorage("uploads/stories/"),
  fileFilter: mediaFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Chat media upload - Using memory storage for manual control in the route
export const chatUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: mediaFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});
