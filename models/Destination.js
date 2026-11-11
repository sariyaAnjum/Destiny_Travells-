const mongoose = require('mongoose');

const CATEGORIES = [
  'Beach',
  'Hill Station',
  'Heritage',
  'Adventure',
  'Wildlife',
  'Spiritual',
  'City',
];

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },
    duration: {
      type: Number,
      min: [1, 'Duration must be at least 1 day'],
      default: 3,
    },
    bestSeason: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'destinations',
  }
);

// Case-insensitive unique destination names ("goa" and "Goa" are the same).
destinationSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);
// Speeds up the filter + sort queries used by Smart Destination Discovery.
destinationSchema.index({ category: 1, price: 1 });

const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;
module.exports.CATEGORIES = CATEGORIES;
