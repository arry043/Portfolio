import multer from 'multer';

const FIVE_MB = 5 * 1024 * 1024;

const imageMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const resumeMimeTypes = new Set(['application/pdf']);

const fileKindLabels = {
  image: 'JPG, PNG, or WEBP image',
  resume: 'PDF',
};

class UploadValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'UploadValidationError';
    this.statusCode = statusCode;
  }
}

const createUploader = ({ allowedMimeTypes, maxBytes, fileKind }) =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxBytes,
    },
    fileFilter: (req, file, cb) => {
      if (!file?.mimetype || !allowedMimeTypes.has(file.mimetype)) {
        return cb(
          new UploadValidationError(
            `Invalid file type. Please upload a valid ${fileKindLabels[fileKind]}.`
          )
        );
      }

      return cb(null, true);
    },
  });

export const imageUpload = createUploader({
  allowedMimeTypes: imageMimeTypes,
  maxBytes: FIVE_MB,
  fileKind: 'image',
});

export const resumeUpload = createUploader({
  allowedMimeTypes: resumeMimeTypes,
  maxBytes: FIVE_MB,
  fileKind: 'resume',
});

export const handleUploadError = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum allowed size is 5MB.'
        : err.message;

    return res.status(400).json({
      success: false,
      message,
    });
  }

  if (err instanceof UploadValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(400).json({
    success: false,
    message: err.message || 'Invalid file upload request',
  });
};
