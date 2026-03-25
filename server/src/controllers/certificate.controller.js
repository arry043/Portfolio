import Certificate from '../models/Certificate.js';
import { ensureSeedData } from '../services/seedData.service.js';
import {
  isCloudinaryUrl,
  uploadImageBufferToCloudinary,
} from '../services/cloudinary.service.js';
import { resolveCertificateIssueDate } from '../services/date.service.js';
import {
  buildTimelineSortStages,
  hideTimelineSortFieldStage,
} from '../services/timelineSort.service.js';

const validateCloudinaryImageUrl = (value) => {
  if (!value) {
    return;
  }

  if (!isCloudinaryUrl(value)) {
    const error = new Error('Only Cloudinary image URLs are allowed');
    error.statusCode = 400;
    throw error;
  }
};

const uploadCertificateImage = async (file) => {
  const uploaded = await uploadImageBufferToCloudinary(file, 'portfolio/certificates');
  return uploaded.url;
};

export const listCertificates = async (req, res, next) => {
  try {
    await ensureSeedData();
    const sortAlias = '__timelineSortDate';
    const items = await Certificate.aggregate([
      ...buildTimelineSortStages(['issueDate', 'issuedDate'], { alias: sortAlias }),
      hideTimelineSortFieldStage(sortAlias),
    ]);

    return res.json({
      success: true,
      items,
      fallbackMessage:
        items.length === 0
          ? 'No Certificates Found!'
          : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const createCertificate = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const {
      image: payloadImage,
      issueDate: payloadIssueDate,
      issuedDate: payloadIssuedDate,
      ...restPayload
    } = payload;
    const issueDate = resolveCertificateIssueDate({
      issueDate: payloadIssueDate,
      issuedDate: payloadIssuedDate,
    });

    let imageUrl = (payloadImage || '').trim();
    let uploadProvider = imageUrl ? 'cloudinary' : '';

    validateCloudinaryImageUrl(imageUrl);

    if (req.file) {
      imageUrl = await uploadCertificateImage(req.file);
      uploadProvider = 'cloudinary';
    }

    if (!imageUrl) {
      res.status(400);
      throw new Error('Certificate image is required');
    }

    const created = await Certificate.create({
      title: restPayload.title,
      organization: restPayload.organization || restPayload.issuer,
      issuer: restPayload.issuer || restPayload.organization,
      issueDate: issueDate ?? null,
      issuedDate: issueDate ?? null,
      image: imageUrl,
    });

    return res.status(201).json({
      success: true,
      item: created,
      uploadProvider,
    });
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

export const updateCertificate = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const {
      image: payloadImage,
      issueDate: payloadIssueDate,
      issuedDate: payloadIssuedDate,
      ...restPayload
    } = payload;
    const issueDate = resolveCertificateIssueDate({
      issueDate: payloadIssueDate,
      issuedDate: payloadIssuedDate,
    });
    const hasIssueDate =
      Object.prototype.hasOwnProperty.call(req.body || {}, 'issueDate') ||
      Object.prototype.hasOwnProperty.call(req.body || {}, 'issuedDate');

    let imageUrl = (payloadImage || '').trim();
    let uploadProvider = imageUrl ? 'cloudinary' : '';

    validateCloudinaryImageUrl(imageUrl);

    if (req.file) {
      imageUrl = await uploadCertificateImage(req.file);
      uploadProvider = 'cloudinary';
    }

    const updated = await Certificate.findByIdAndUpdate(
      req.params.id,
      {
        ...restPayload,
        ...(imageUrl ? { image: imageUrl } : {}),
        ...(hasIssueDate
          ? {
              issueDate: issueDate ?? null,
              issuedDate: issueDate ?? null,
            }
          : {}),
        ...(restPayload.organization || restPayload.issuer
          ? {
              organization: restPayload.organization || restPayload.issuer,
              issuer: restPayload.issuer || restPayload.organization,
            }
          : {}),
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      res.status(404);
      throw new Error('Certificate not found');
    }

    return res.json({
      success: true,
      item: updated,
      uploadProvider,
    });
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

export const deleteCertificate = async (req, res, next) => {
  try {
    const deleted = await Certificate.findByIdAndDelete(req.params.id);

    if (!deleted) {
      res.status(404);
      throw new Error('Certificate not found');
    }

    return res.json({ success: true, message: 'Certificate removed successfully' });
  } catch (error) {
    return next(error);
  }
};
