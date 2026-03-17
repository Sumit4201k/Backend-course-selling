import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import User from '../models/user.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

// helper to set tokens in cookies
const sendTokens = (res, user) => {
  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });
  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  };

  // set access token cookie (1 hour)
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60, // 1 hour
  });

  // set refresh token cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  return accessToken;
};

export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return next(new ApiError(400, 'Email already in use'));
  }
  const user = await User.create({ name, email, password, role });
  const accessToken = sendTokens(res, user);
  res.status(201).json(new ApiResponse(true, 'User registered', { accessToken }));
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new ApiError(401, 'Invalid credentials'));
  }
  const accessToken = sendTokens(res, user);
  res.json(new ApiResponse(true, 'Login successful', { accessToken }));
});

export const refresh = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return next(new ApiError(401, 'Refresh token missing'));
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return next(new ApiError(401, 'Invalid refresh token'));
    }
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    res.json(new ApiResponse(true, 'Token refreshed', { accessToken }));
  } catch (err) {
    return next(new ApiError(401, 'Refresh token invalid or expired'));
  }
});

export const logout = asyncHandler(async (req, res, next) => {
  if (req.user) {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });
  }
  res.clearCookie('refreshToken');
  res.json(new ApiResponse(true, 'Logged out successfully'));
});
