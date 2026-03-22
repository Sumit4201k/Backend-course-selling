import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import Course from '../models/course.model.js';
import Purchase from '../models/purchase.model.js';
import cloudinary, { uploadLocalFile } from '../utils/cloudinary.js';

// note: previously we had a helper that uploaded a buffer directly.  With
// the new disk-based flow the middleware stores files in `uploads/` and we
// now call `uploadLocalFile`, which uploads from the filesystem and then
// removes the temporary copy.

export const createCourse = asyncHandler(async (req, res, next) => {
  const { title, description, price } = req.body;
  if (!req.files || !req.files.thumbnail || !req.files.video) {
    return next(new ApiError(400, 'Thumbnail and video are required'));
  }

  const course = new Course({
    title,
    description,
    price,
    createdBy: req.user._id,
  });

  // upload thumbnail (middleware saved file to disk)
  const thumb = await uploadLocalFile(
    req.files.thumbnail[0].path,       //file path on disk
    'thumbnails',                     //folder in Cloudinary
    'image'                         //resource type
  );
  course.thumbnail = { url: thumb.secure_url, public_id: thumb.public_id };

  // upload video
  const vid = await uploadLocalFile(
    req.files.video[0].path,
    'videos',
    'video'
  );
  course.video = { url: vid.secure_url, public_id: vid.public_id };

  await course.save();
  res.status(201).json(new ApiResponse(true, 'Course created successfully', { course }));
});

export const updateCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ApiError(404, 'Course not found'));

  ['title', 'description', 'price'].forEach(field => {
    if (req.body[field]) course[field] = req.body[field];
  });

  if (req.files && req.files.thumbnail) {
    // delete old thumb
    if (course.thumbnail && course.thumbnail.public_id) {
      await cloudinary.uploader.destroy(course.thumbnail.public_id);
    }
    const thumb = await uploadLocalFile(
      req.files.thumbnail[0].path,
      'thumbnails',
      'image'
    );
    course.thumbnail = { url: thumb.secure_url, public_id: thumb.public_id };
  }

  if (req.files && req.files.video) {
    if (course.video && course.video.public_id) {
      await cloudinary.uploader.destroy(course.video.public_id, {
        resource_type: 'video',
      });
    }
    const vid = await uploadLocalFile(
      req.files.video[0].path,
      'videos',
      'video'
    );
    course.video = { url: vid.secure_url, public_id: vid.public_id };
  }

  await course.save();
  res.json(new ApiResponse(true, 'Course updated', { course }));
});

export const deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ApiError(404, 'Course not found'));

  if (course.thumbnail && course.thumbnail.public_id) {
    await cloudinary.uploader.destroy(course.thumbnail.public_id);
  }
  if (course.video && course.video.public_id) {
    await cloudinary.uploader.destroy(course.video.public_id, {
      resource_type: 'video',
    });
  }

  await course.deleteOne();
  res.json(new ApiResponse(true, 'Course deleted'));
});

export const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find().select('-video');
  res.json(new ApiResponse(true, 'Courses fetched', { courses }));
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json(new ApiResponse(false, 'Course not found'));
  }

  let hasPurchased = false;
  if (req.user) {
    const purchase = await Purchase.findOne({
      user: req.user._id,
      course: course._id,
    });
    if (purchase) hasPurchased = true;
  }

  const responseData = {
    id: course._id,
    title: course.title,
    description: course.description,
    price: course.price,
    thumbnail: course.thumbnail,
    video: hasPurchased || req.user?.role === 'admin' ? course.video : undefined,
  };

  res.json(new ApiResponse(true, 'Course details', { course: responseData }));
});
