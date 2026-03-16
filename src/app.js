import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import ApiError from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/course.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';

// load environment variables early
dotenv.config();

const app = express();

// middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/purchases', purchaseRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, `Not found - ${req.originalUrl}`));
});

// global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }
  res.status(statusCode).json(new ApiResponse(false, message));
});

export default app;
