import express from 'express';
import {
  createCertificate,
  deleteCertificate,
  listCertificates,
  updateCertificate,
} from '../controllers/certificate.controller.js';
import {
  createCertificateSchema,
  deleteCertificateSchema,
  updateCertificateSchema,
} from '../validations/certificate.validation.js';
import { validateRequest } from '../validations/validateRequest.js';
import { admin, protect } from '../middlewares/auth.middleware.js';
import {
  handleUploadError,
  imageUpload,
} from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/', listCertificates);

router.post(
  '/',
  protect,
  admin,
  (req, res, next) => imageUpload.single('image')(req, res, (err) => handleUploadError(err, req, res, next)),
  validateRequest(createCertificateSchema),
  createCertificate
);

router.delete(
  '/:id',
  protect,
  admin,
  validateRequest(deleteCertificateSchema),
  deleteCertificate
);

router.patch(
  '/:id',
  protect,
  admin,
  (req, res, next) => imageUpload.single('image')(req, res, (err) => handleUploadError(err, req, res, next)),
  validateRequest(updateCertificateSchema),
  updateCertificate
);

export default router;
