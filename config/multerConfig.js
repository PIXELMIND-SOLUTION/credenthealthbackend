import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Directory paths
const supportFileDir = path.join(__dirname, '..', 'uploads', 'support');
const documentDir = path.join(__dirname, '..', 'uploads', 'documents');
const testImageDir = path.join(__dirname, '..', 'uploads', 'testimages');
const companyImageDir = path.join(__dirname, '..', 'uploads', 'company-images');
const staffImageDir = path.join(__dirname, '..', 'uploads', 'staff-images'); // ✅ Staff images dir
const doctorImageDir = path.join(__dirname, '..', 'uploads', 'doctorimages');


// 🔧 Ensure directories exist
fs.mkdirSync(supportFileDir, { recursive: true });
fs.mkdirSync(documentDir, { recursive: true });
fs.mkdirSync(testImageDir, { recursive: true });
fs.mkdirSync(companyImageDir, { recursive: true });
fs.mkdirSync(staffImageDir, { recursive: true }); // ✅

/* ---------- STORAGE CONFIGURATIONS ---------- */

// 🧾 Support file storage
const supportStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, supportFileDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// 📄 Document storage
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

// 🧪 Test image storage
const testImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, testImageDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

// 🏢 Company image storage
const companyImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, companyImageDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

fs.mkdirSync(doctorImageDir, { recursive: true });


// 🔁 Dynamic company storage (image + documents)
const dynamicCompanyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') {
      cb(null, companyImageDir);
    } else if (file.fieldname === 'documents') {
      cb(null, documentDir);
    } else {
      cb(new Error('Invalid file field'), null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// 👥 Staff image storage (✅ ADDED)
const staffImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, staffImageDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// 🔧 Ensure the directory exists
fs.mkdirSync(doctorImageDir, { recursive: true });

// 🧑‍⚕️ Doctor image storage configuration
const doctorImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, doctorImageDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

/* ---------- EXPORT MULTER HANDLERS ---------- */

// 📤 Upload for support file (single)
export const uploadSupportFile = multer({
  storage: supportStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');

// 📤 Upload for documents (array of documents)
export const uploadDocuments = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },  // Limit to 10MB
}).array('documents', 5);  // If multiple documents, change '.single' to '.array'

// 📤 Upload for a single test image (Single file upload)
export const uploadTestImages = multer({
  storage: testImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },  // Limit to 10MB
}).single('testImage');  // Ensure the field name matches 'testImage'


// 📤 Upload for company assets (image + documents)
export const uploadCompanyAssets = multer({
  storage: dynamicCompanyStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

// 📤 Upload for staff images (profile + ID) ✅
export const uploadStaffImages = multer({
  storage: staffImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'idImage', maxCount: 1 },
]);

// 📤 Upload for a single doctor image (Single file upload)
export const uploadDoctorImage = multer({
  storage: doctorImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
}).single('image');  // Ensure the field name matches 'image' in the form


// 🔧 Ensure the directory exists

