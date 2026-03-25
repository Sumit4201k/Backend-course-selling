import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import * as purchaseController from '../controllers/purchase.controller.js';

const router = express.Router();

router.post('/:courseId', protect, purchaseController.purchaseCourse);
router.get('/', protect, purchaseController.getMyCourses);

export default router;
