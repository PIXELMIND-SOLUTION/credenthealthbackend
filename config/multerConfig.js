import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Support files directory
const supportFileDir = path.join(__dirname, '..', 'uploads', 'support');

// 🔧 Ensure the directory exists
fs.mkdirSync(supportFileDir, { recursive: true });

// 📦 Multer storage config for support issue files
const supportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, supportFileDir);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

// 📤 Exported multer instance (field name: 'file')
export const uploadSupportFile = multer({
  storage: supportStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
}).single('file');
