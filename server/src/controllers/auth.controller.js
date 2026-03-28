import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { verifyToken } from '@clerk/clerk-sdk-node';

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const normalizeName = (value = '') => String(value).trim();

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildEmailLookup = (email = '') => ({
  $regex: `^${escapeRegex(email)}$`,
  $options: 'i',
});

const getNameFromEmail = (email = '') => {
  const [prefix] = String(email).split('@');
  return prefix || 'User';
};

const getClerkEmailFromToken = (decodedToken) => {
  if (!decodedToken || typeof decodedToken !== 'object') {
    return '';
  }

  return (
    decodedToken.email ||
    decodedToken.email_address ||
    decodedToken?.email_addresses?.[0]?.email_address ||
    decodedToken?.claims?.email ||
    ''
  );
};

const mapUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  provider: user.provider,
  profileImage: user.profileImage || '',
  createdAt: user.createdAt,
});

const verifyClerkSession = async (token) => {
  if (!process.env.CLERK_SECRET_KEY) {
    const configurationError = new Error('Server configuration error: Clerk keys missing');
    configurationError.statusCode = 500;
    throw configurationError;
  }

  return verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
  });
};

const syncOAuthUser = async ({
  token,
  email,
  name,
  profileImage,
  provider = 'google',
  allowCreate = true,
}) => {
  const decoded = await verifyClerkSession(token);

  if (!decoded) {
    const verificationError = new Error('Invalid or expired Clerk token payload');
    verificationError.statusCode = 401;
    throw verificationError;
  }

  const tokenEmail = normalizeEmail(getClerkEmailFromToken(decoded));
  const incomingEmail = normalizeEmail(email || tokenEmail);

  if (!incomingEmail) {
    const missingEmailError = new Error('Unable to resolve an email for this Clerk session');
    missingEmailError.statusCode = 400;
    throw missingEmailError;
  }

  if (tokenEmail && incomingEmail !== tokenEmail) {
    const mismatchError = new Error('Email mismatch between Clerk token and request payload');
    mismatchError.statusCode = 401;
    throw mismatchError;
  }

  const incomingName = normalizeName(name);
  const normalizedImage = typeof profileImage === 'string' ? profileImage.trim() : '';

  let user = await User.findOne({ email: buildEmailLookup(incomingEmail) });
  let created = false;

  if (!user) {
    if (!allowCreate || provider !== 'google') {
      const notFoundError = new Error('User not found in database');
      notFoundError.statusCode = 403;
      throw notFoundError;
    }

    user = await User.create({
      name: incomingName || getNameFromEmail(incomingEmail),
      email: incomingEmail,
      provider: 'google',
      profileImage: normalizedImage || undefined,
    });
    created = true;
  } else {
    let shouldSave = false;

    if (incomingName && incomingName !== user.name) {
      user.name = incomingName;
      shouldSave = true;
    }

    if (normalizedImage && normalizedImage !== user.profileImage) {
      user.profileImage = normalizedImage;
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save();
    }
  }

  return {
    created,
    user,
    token: generateToken(user._id, user.role),
  };
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = normalizeName(name);

    const userExists = await User.findOne({ email: buildEmailLookup(normalizedEmail) });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      provider: 'local',
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: mapUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user via Local Bcrypt
// @route   POST /api/v1/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: buildEmailLookup(normalizedEmail) }).select('+password');

    if (user && user.provider === 'local') {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        res.json({
          success: true,
          token: generateToken(user._id, user.role),
          user: mapUserResponse(user),
        });
      } else {
        res.status(401);
        throw new Error('Invalid email or password');
      }
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login / Register mapped via Clerk Google verification
// @route   POST /api/v1/auth/google
export const googleAuth = async (req, res, next) => {
  try {
    const { token, email, name, profileImage } = req.body;
    const syncResult = await syncOAuthUser({
      token,
      email,
      name,
      profileImage,
      provider: 'google',
      allowCreate: true,
    });

    res.json({
      success: true,
      token: syncResult.token,
      user: mapUserResponse(syncResult.user),
      created: syncResult.created,
    });
  } catch (error) {
    res.status(error.statusCode || 401);
    next(error);
  }
};

// @desc    Sync Clerk user with backend source of truth
// @route   POST /api/v1/auth/sync-user
export const syncUser = async (req, res, next) => {
  try {
    const { token, email, name, profileImage, provider = 'google' } = req.body;
    const syncResult = await syncOAuthUser({
      token,
      email,
      name,
      profileImage,
      provider,
      allowCreate: provider === 'google',
    });

    res.json({
      success: true,
      token: syncResult.token,
      user: mapUserResponse(syncResult.user),
      created: syncResult.created,
    });
  } catch (error) {
    res.status(error.statusCode || 401);
    next(error);
  }
};
