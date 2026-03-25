import express from 'express';
import upload from '../middlewares/multer.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import * as courseController from '../controllers/course.controller.js';

const router = express.Router();

// public for listing and details, but we require protect to know user for video access
router.get('/', protect, courseController.getCourses);
router.get('/:id', protect, courseController.getCourse);

router.post(
  '/',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  courseController.createCourse
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  courseController.updateCourse
);

router.delete('/:id', protect, authorize('admin'), courseController.deleteCourse);

export default router;
