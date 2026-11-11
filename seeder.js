require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Destination = require('./models/Destination');
const sampleDestinations = require('./data/destinations');

// npm run seed          -> clears the collection and inserts sample data
// npm run seed:destroy  -> only clears the collection
const run = async () => {
  await connectDB();
  try {
    await Destination.deleteMany({});
    console.log('Existing destinations removed');

    if (!process.argv.includes('--destroy')) {
      const inserted = await Destination.insertMany(sampleDestinations);
      console.log(`${inserted.length} sample destinations inserted`);
    }
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
