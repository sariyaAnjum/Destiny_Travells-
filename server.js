require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const destinationRoutes = require('./routes/destinationRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Destiny Travels API is running',
    endpoints: '/api/destinations',
  });
});

// Routes
app.use('/api/destinations', destinationRoutes);

// 404 + central error handling (must come last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  start();
}

module.exports = app;
