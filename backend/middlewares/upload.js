const multer = require("multer");

// نخزن في الذاكرة فقط
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;