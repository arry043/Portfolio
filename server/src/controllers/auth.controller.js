import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { verifyToken } from '@clerk/clerk-sdk-node';

// @desc    Register new user
// @route   POST /api/v1/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: 'local'
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
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

    const user = await User.findOne({ email }).select('+password');
    if (user && user.provider === 'local' && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        token: generateToken(user._id, user.role),
        user: { _id: user._id, name: user.name, email: user.email, role: user.role }
      });
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
    const { token, email, name } = req.body;

    // Clerk JWT Verification intercept
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!decoded) {
      res.status(401);
      throw new Error('Invalid or expired Clerk token payload');
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        provider: 'google'
      });
    } // Overwrites role dynamically if they had one stored

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(401);
    next(new Error('Google synchronization failed via Clerk SDK'));
  }
};
