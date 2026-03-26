import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { verifyToken } from '@clerk/clerk-sdk-node';

// @desc    Register new user
// @route   POST /api/v1/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    console.log(`[AUTH DEBUG] Register request received for email: ${email}`);

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`[AUTH DEBUG] Registration failed: Email ${email} already in use`);
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

    console.log(`[AUTH DEBUG] Registration successful for email: ${email}`);

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(`[AUTH ERROR] Registration failed: ${error.message}`);
    next(error);
  }
};

// @desc    Login user via Local Bcrypt
// @route   POST /api/v1/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH DEBUG] Login request received for email: ${email}`);

    const user = await User.findOne({ email }).select('+password');
    console.log(`[AUTH DEBUG] User found in DB: ${!!user}`);

    if (user && user.provider === 'local') {
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`[AUTH DEBUG] Bcrypt compare result: ${isMatch}`);

      if (isMatch) {
        console.log(`[AUTH DEBUG] Generating token for user: ${user._id}`);
        res.json({
          success: true,
          token: generateToken(user._id, user.role),
          user: { _id: user._id, name: user.name, email: user.email, role: user.role }
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
    console.error(`[AUTH ERROR] Login failed: ${error.message}`);
    next(error);
  }
};

// @desc    Login / Register mapped via Clerk Google verification
// @route   POST /api/v1/auth/google
export const googleAuth = async (req, res, next) => {
  try {
    const { token, email, name } = req.body;
    console.log(`[AUTH DEBUG] Google Auth request received for email: ${email}`);

    if (!process.env.CLERK_SECRET_KEY) {
      console.error(`[AUTH ERROR] CLERK_SECRET_KEY is missing from environment variables`);
      res.status(500);
      throw new Error('Server configuration error: Clerk keys missing');
    }

    // Clerk JWT Verification intercept
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!decoded) {
      console.log(`[AUTH DEBUG] Clerk token verification failed for email: ${email}`);
      res.status(401);
      throw new Error('Invalid or expired Clerk token payload');
    }

    console.log(`[AUTH DEBUG] Clerk token verified. Looking up user: ${email}`);
    let user = await User.findOne({ email });
    if (!user) {
      console.log(`[AUTH DEBUG] Creating new user from Google Auth: ${email}`);
      user = await User.create({
        name,
        email,
        provider: 'google'
      });
    } // Overwrites role dynamically if they had one stored

    console.log(`[AUTH DEBUG] Google Auth successful. Generating token for user: ${user._id}`);
    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(`[AUTH ERROR] Google Auth failed: ${error.message}`);
    res.status(401);
    next(new Error('Google synchronization failed via Clerk SDK'));
  }
};
