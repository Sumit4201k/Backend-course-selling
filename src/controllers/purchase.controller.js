import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Course from '../models/course.model.js';
import Purchase from '../models/purchase.model.js';

export const purchaseCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return next(new ApiError(404, 'Course not found'));
  }

  const existing = await Purchase.findOne({
    user: req.user._id,
    course: course._id,
  });
  if (existing) {
    return next(new ApiError(400, 'You have already purchased this course'));
  }

  const purchase = await Purchase.create({
    user: req.user._id,
    course: course._id,
  });

  res.status(201).json(new ApiResponse(true, 'Course purchased', { purchase }));
});

export const getMyCourses = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ user: req.user._id }).populate('course');
  res.json(new ApiResponse(true, 'Purchased courses', { purchases }));
});
