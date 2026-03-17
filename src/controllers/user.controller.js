import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import User from '../models/user.model.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken');
  res.json(new ApiResponse(true, 'User profile fetched', { user }));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // build updates object with only provided fields
  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (password) updates.password = password;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select('-password -refreshToken');

  res.json(new ApiResponse(true, 'Profile updated', { user }));
});
