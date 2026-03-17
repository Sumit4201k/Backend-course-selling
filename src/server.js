import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

// Use dynamic imports to ensure dotenv is configured before loading app
const { default: app } = await import('./app.js');
const { default: connectDB } = await import('./config/db.js');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
