const express = require("express");
const router = express.Router();

const Post = require("../models/Post");
const upload = require("../middleware/multer");

// ========================
// Custom Errors
// ========================
class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = "StorageError";
    this.statusCode = 500;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

// ========================
// Helper Functions (Outside Route)
// ========================

/**
 * Parse and validate analysis data safely
 */
const parseAnalysis = (analysisInput) => {
  if (!analysisInput) return undefined;

  try {
    const parsed = typeof analysisInput === "string"
      ? JSON.parse(analysisInput)
      : analysisInput;

    if (parsed && typeof parsed !== "object") {
      throw new ValidationError("Analysis must be a valid object");
    }

    // يمكنك إضافة schema validation أقوى هنا لاحقًا (Joi / Zod)
    return parsed;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError("INVALID_ANALYSIS_FORMAT");
  }
};

/**
 * Process uploaded files strictly
 */
const processUploadedImages = (files) => {
  if (!files || files.length === 0) return [];

  // Check fieldname consistency
  const hasMismatch = files.some(file => file.fieldname !== "images");
  if (hasMismatch) {
    throw new ValidationError("UPLOAD_FIELD_MISMATCH: Field name must be 'images'");
  }

  return files.map(file => {
    const fileUrl = file.path || file.url || file.location;

    if (!fileUrl) {
      throw new StorageError("INVALID_FILE_STORAGE_FORMAT: No path or url in multer file object");
    }

    return fileUrl;
  });
};

// ================================
// CREATE POST ROUTE - CLEAN VERSION
// ================================

router.post("/", upload.array("images", 12), async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  try {
    console.log(`[${requestId}] NEW POST | User: ${req.userId}`);

    // Auth Guard
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "UNAUTHORIZED"
      });
    }

    const {
      content,
      mood,
      emotion,
      tags,
      isAnonymous,
      analysis,
      explicitScore
    } = req.body;

    // Empty Post Guard
    if (!content?.trim() && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "EMPTY_POST"
      });
    }

    // Process files + analysis (clean & separated)
    const imageUrls = processUploadedImages(req.files);
    const analysisData = parseAnalysis(analysis);

    // Tags
    const tagsArray = tags
      ? (Array.isArray(tags)
          ? tags
          : typeof tags === "string"
            ? tags.split(",").map(t => t.trim()).filter(Boolean)
            : [])
      : [];

    const newPost = new Post({
      user: req.userId,
      content: content?.trim() || "",
      mood: mood || undefined,
      emotion: emotion || undefined,
      tags: tagsArray,
      isAnonymous: isAnonymous === "true" || isAnonymous === true,
      images: imageUrls,
      analysis: analysisData,
      explicitScore: Number(explicitScore || 0),
    });

    await newPost.save();
    await newPost.populate("user", "username name profileImage");

    console.log(`[${requestId}] POST CREATED SUCCESSFULLY | ID: ${newPost._id}`);

    return res.status(201).json({
      success: true,
      message: "تم إنشاء المنشور بنجاح",
      post: newPost
    });

  } catch (err) {
    console.error(`[${requestId}] POST ERROR:`, err.name, err.message);

    const status = err.statusCode || 500;
    const message = err.message || "POST_FAILED";

    return res.status(status).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === "development" && { error: err.name })
    });
  }
});

module.exports = router;