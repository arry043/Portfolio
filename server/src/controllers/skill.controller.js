import Skill from '../models/Skill.js';
import {
  isCloudinaryUrl,
  uploadImageBufferToCloudinary,
} from '../services/cloudinary.service.js';

const validateCloudinaryLogoUrl = (value) => {
  if (!value) {
    return;
  }

  if (!isCloudinaryUrl(value)) {
    const error = new Error('Only Cloudinary image URLs are allowed for logos');
    error.statusCode = 400;
    throw error;
  }
};

const uploadSkillLogo = async (file) => {
  const uploaded = await uploadImageBufferToCloudinary(file, 'portfolio/skills');
  return uploaded.url;
};

const checkDuplicateSkillName = async (skillName, excludeId = null) => {
  const query = { skill: { $regex: new RegExp(`^${skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Skill.findOne(query).lean();

  if (existing) {
    const error = new Error(`A skill named "${skillName}" already exists`);
    error.statusCode = 409;
    throw error;
  }
};

export const listSkills = async (req, res, next) => {
  try {
    const items = await Skill.find({ isActive: true })
      .sort({ displayOrder: 1, percentage: -1 })
      .lean();

    return res.json({
      success: true,
      items,
      fallbackMessage: items.length === 0 ? 'No Skills Found!' : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const listAllSkills = async (req, res, next) => {
  try {
    const items = await Skill.find()
      .sort({ displayOrder: 1, percentage: -1 })
      .lean();

    return res.json({
      success: true,
      items,
      fallbackMessage: items.length === 0 ? 'No Skills Found!' : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const getSkillById = async (req, res, next) => {
  try {
    const item = await Skill.findById(req.params.id).lean();

    if (!item) {
      res.status(404);
      throw new Error('Skill not found');
    }

    return res.json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

export const createSkill = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const { logo: payloadLogo, ...restPayload } = payload;

    await checkDuplicateSkillName(restPayload.skill);

    let logoUrl = (payloadLogo || '').trim();
    let uploadProvider = logoUrl ? 'cloudinary' : '';

    validateCloudinaryLogoUrl(logoUrl);

    if (req.file) {
      logoUrl = await uploadSkillLogo(req.file);
      uploadProvider = 'cloudinary';
    }

    const created = await Skill.create({
      ...restPayload,
      logo: logoUrl,
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

    if (error?.code === 11000) {
      res.status(409);
      return next(new Error('A skill with this name already exists'));
    }

    return next(error);
  }
};

export const updateSkill = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const { logo: payloadLogo, ...restPayload } = payload;

    if (restPayload.skill) {
      await checkDuplicateSkillName(restPayload.skill, req.params.id);
    }

    let logoUrl = (payloadLogo || '').trim();
    let uploadProvider = logoUrl ? 'cloudinary' : '';

    validateCloudinaryLogoUrl(logoUrl);

    if (req.file) {
      logoUrl = await uploadSkillLogo(req.file);
      uploadProvider = 'cloudinary';
    }

    const updated = await Skill.findByIdAndUpdate(
      req.params.id,
      {
        ...restPayload,
        ...(logoUrl ? { logo: logoUrl } : {}),
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      res.status(404);
      throw new Error('Skill not found');
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

    if (error?.code === 11000) {
      res.status(409);
      return next(new Error('A skill with this name already exists'));
    }

    return next(error);
  }
};

export const deleteSkill = async (req, res, next) => {
  try {
    const deleted = await Skill.findByIdAndDelete(req.params.id);

    if (!deleted) {
      res.status(404);
      throw new Error('Skill not found');
    }

    return res.json({ success: true, message: 'Skill removed successfully' });
  } catch (error) {
    return next(error);
  }
};
