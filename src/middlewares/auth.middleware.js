import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import User from '../models/user.model.js';

// protect middleware, verify access token from cookies or Authorization header
export const protect = async (req, res, next) => {
  let token;

  // first try to get token from cookies
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // fallback to Authorization header (Bearer token)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized, token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ApiError(401, 'User not found'));
    }

    req.user = user; // attach user document
    next();
  } catch (err) {
    return next(new ApiError(401, 'Token invalid or expired'));
  }
};
