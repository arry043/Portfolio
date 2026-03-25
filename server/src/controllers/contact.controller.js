import Message from '../models/Message.js';

const COOLDOWN_MS = 20_000;
const cooldownMap = new Map();

const getCooldownKey = (req, email) => `${req.ip || req.headers['x-forwarded-for']}:${email}`;

export const submitMessage = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const cooldownKey = getCooldownKey(req, payload.email);
    const lastSubmissionAt = cooldownMap.get(cooldownKey) || 0;
    const now = Date.now();

    if (now - lastSubmissionAt < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (now - lastSubmissionAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds}s before sending another message.`,
      });
    }

    const created = await Message.create({
      ...payload,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    });

    cooldownMap.set(cooldownKey, now);

    return res.status(201).json({
      success: true,
      item: created,
      message: 'Message sent successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const listMessages = async (req, res, next) => {
  try {
    const items = await Message.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, items });
  } catch (error) {
    return next(error);
  }
};
