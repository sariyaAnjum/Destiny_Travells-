/**
 * Single source of truth for the API test plan.
 * It feeds both the Postman collection (docs/build-postman.js) and the
 * Word report (docs/generate-report.js).
 *
 * "expected" values are EXAMPLES of the response shape. IDs and timestamps
 * will differ on your machine.
 */
const sample = require('../data/destinations');

const oid = (n) => `6720a1b2c3d4e5f6a7b8c9${String(n).padStart(2, '0')}`;
const T1 = '2026-11-10T17:30:00.000Z';
const T2 = '2026-11-10T17:42:00.000Z';
const withMeta = (doc, n, updated = T1) => ({
  _id: oid(n),
  ...doc,
  createdAt: T1,
  updatedAt: updated,
  __v: 0,
});

const goa = sample.find((d) => d.name === 'Goa Beaches');
const andaman = sample.find((d) => d.name === 'Andaman Islands');
const gokarna = sample.find((d) => d.name === 'Gokarna Coast');
const hampi = sample.find((d) => d.name === 'Hampi');
const corbett = sample.find((d) => d.name === 'Jim Corbett National Park');

const kashmir = {
  name: 'Kashmir Valley',
  location: 'Jammu and Kashmir, India',
  category: 'Hill Station',
  price: 26000,
  rating: 4.8,
  duration: 5,
  bestSeason: 'April - October',
  description: 'Dal Lake houseboats, Gulmarg meadows and snow-capped peaks.',
};

const challenges = [
  { key: 1, title: 'Challenge 01: Add Destinations', level: 'Intermediate' },
  { key: 2, title: 'Challenge 02: Retrieve Destinations', level: 'Intermediate' },
  { key: 3, title: 'Challenge 03: Update Destinations', level: 'Intermediate' },
  { key: 4, title: 'Challenge 04: Smart Destination Discovery', level: 'Advanced' },
  { key: 5, title: 'Challenge 05: Destination Cleanup', level: 'Advanced' },
  { key: 6, title: 'Error Handling Checks', level: 'Technical requirement' },
];

const items = [
  /* ---------------- Challenge 01 ---------------- */
  {
    id: '01-create-destination',
    challenge: 1,
    title: 'Add a single destination',
    method: 'POST',
    route: '/api/destinations',
    path: '/api/destinations',
    mongoose: 'create()',
    status: 201,
    purpose: 'Creates one destination and returns the saved document.',
    body: kashmir,
    saves: 'destinationId',
    expected: {
      success: true,
      message: 'Destination created',
      data: withMeta(kashmir, 1),
    },
  },
  {
    id: '02-bulk-insert',
    challenge: 1,
    title: 'Add many destinations at once',
    method: 'POST',
    route: '/api/destinations/bulk',
    path: '/api/destinations/bulk',
    mongoose: 'insertMany()',
    status: 201,
    purpose: 'Inserts an array of destinations in one database call.',
    body: sample,
    bodyNote: `Request body is an array of ${sample.length} destinations (first 2 shown).`,
    bodyPreview: sample.slice(0, 2),
    expected: {
      success: true,
      message: `${sample.length} destinations created`,
      count: sample.length,
      data: [withMeta(sample[0], 2), withMeta(sample[1], 3)],
    },
    expectedNote: 'Response trimmed: data holds all 11 documents.',
  },

  /* ---------------- Challenge 02 ---------------- */
  {
    id: '03-get-all',
    challenge: 2,
    title: 'Retrieve all destinations',
    method: 'GET',
    route: '/api/destinations',
    path: '/api/destinations',
    mongoose: 'find()',
    status: 200,
    purpose: 'Returns every document in the destinations collection.',
    expected: {
      success: true,
      count: sample.length + 1,
      data: [withMeta(kashmir, 1), withMeta(sample[0], 2)],
    },
    expectedNote: 'Response trimmed: data holds all 12 documents.',
  },
  {
    id: '04-get-by-id',
    challenge: 2,
    title: 'Retrieve a destination by ID',
    method: 'GET',
    route: '/api/destinations/:id',
    path: '/api/destinations/{{destinationId}}',
    mongoose: 'findById()',
    status: 200,
    purpose: 'Looks up one destination by its MongoDB _id.',
    expected: { success: true, data: withMeta(kashmir, 1) },
  },
  {
    id: '05-get-by-name',
    challenge: 2,
    title: 'Retrieve a destination by name',
    method: 'GET',
    route: '/api/destinations/name/:name',
    path: '/api/destinations/name/Goa%20Beaches',
    mongoose: 'findOne()',
    status: 200,
    purpose: 'Finds the first destination whose name matches (case-insensitive).',
    expected: { success: true, data: withMeta(goa, 2) },
  },

  /* ---------------- Challenge 03 ---------------- */
  {
    id: '06-update-by-id',
    challenge: 3,
    title: 'Update a destination by ID',
    method: 'PUT',
    route: '/api/destinations/:id',
    path: '/api/destinations/{{destinationId}}',
    mongoose: 'findByIdAndUpdate()',
    status: 200,
    purpose: 'Changes only the fields sent and returns the updated document.',
    body: { price: 27500, rating: 4.9 },
    expected: {
      success: true,
      message: 'Destination updated',
      data: withMeta({ ...kashmir, price: 27500, rating: 4.9 }, 1, T2),
    },
  },
  {
    id: '07-update-by-name',
    challenge: 3,
    title: 'Update a destination by name',
    method: 'PUT',
    route: '/api/destinations/name/:name',
    path: '/api/destinations/name/Hampi',
    mongoose: 'findOneAndUpdate()',
    status: 200,
    purpose: 'Updates the destination that matches the name in the URL.',
    body: { price: 6000, bestSeason: 'October - March' },
    expected: {
      success: true,
      message: 'Destination updated',
      data: withMeta({ ...hampi, price: 6000, bestSeason: 'October - March' }, 8, T2),
    },
  },

  /* ---------------- Challenge 04 ---------------- */
  {
    id: '08-discover-page-1',
    challenge: 4,
    title: 'Smart discovery: filter, sort and paginate (page 1)',
    method: 'GET',
    route: '/api/destinations/discover',
    path: '/api/destinations/discover',
    query: {
      category: 'Beach',
      minPrice: '5000',
      maxPrice: '40000',
      sort: 'price,-rating',
      page: '1',
      limit: '2',
    },
    mongoose: 'find().sort().skip().limit() + countDocuments()',
    status: 200,
    purpose:
      'Beach destinations priced 5,000-40,000, cheapest first (ties by best rating), 2 per page.',
    expected: {
      success: true,
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      count: 2,
      data: [withMeta(gokarna, 4), withMeta(goa, 2)],
    },
  },
  {
    id: '09-discover-page-2',
    challenge: 4,
    title: 'Smart discovery: page 2',
    method: 'GET',
    route: '/api/destinations/discover',
    path: '/api/destinations/discover',
    query: {
      category: 'Beach',
      minPrice: '5000',
      maxPrice: '40000',
      sort: 'price,-rating',
      page: '2',
      limit: '2',
    },
    mongoose: 'skip() + limit()',
    status: 200,
    purpose: 'skip((page - 1) x limit) moves to the next page of the same result set.',
    expected: {
      success: true,
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
      count: 1,
      data: [withMeta(andaman, 5)],
    },
  },
  {
    id: '10-categories',
    challenge: 4,
    title: 'Retrieve unique categories',
    method: 'GET',
    route: '/api/destinations/categories',
    path: '/api/destinations/categories',
    mongoose: 'distinct()',
    status: 200,
    purpose: 'Returns each category once, sorted alphabetically.',
    expected: {
      success: true,
      count: 6,
      data: ['Adventure', 'Beach', 'Heritage', 'Hill Station', 'Spiritual', 'Wildlife'],
    },
  },
  {
    id: '11-count',
    challenge: 4,
    title: 'Count destinations',
    method: 'GET',
    route: '/api/destinations/count',
    path: '/api/destinations/count',
    query: { category: 'Beach' },
    mongoose: 'countDocuments()',
    status: 200,
    purpose: 'Counts documents that match the optional filters (here: category = Beach).',
    expected: { success: true, count: 3 },
  },

  /* ---------------- Challenge 05 ---------------- */
  {
    id: '12-delete-by-id',
    challenge: 5,
    title: 'Delete a destination by ID',
    method: 'DELETE',
    route: '/api/destinations/:id',
    path: '/api/destinations/{{destinationId}}',
    mongoose: 'findByIdAndDelete()',
    status: 200,
    purpose: 'Removes one destination and returns the document that was deleted.',
    expected: {
      success: true,
      message: 'Destination deleted',
      data: withMeta({ ...kashmir, price: 27500, rating: 4.9 }, 1, T2),
    },
  },
  {
    id: '13-delete-by-name',
    challenge: 5,
    title: 'Delete a destination by name',
    method: 'DELETE',
    route: '/api/destinations/name/:name',
    path: '/api/destinations/name/Jim%20Corbett%20National%20Park',
    mongoose: 'findOneAndDelete()',
    status: 200,
    purpose: 'Removes the destination whose name matches and returns it.',
    expected: {
      success: true,
      message: 'Destination deleted',
      data: withMeta(corbett, 10),
    },
  },
  {
    id: '14-delete-many',
    challenge: 5,
    title: 'Delete multiple destinations by condition',
    method: 'DELETE',
    route: '/api/destinations/bulk',
    path: '/api/destinations/bulk',
    query: { maxPrice: '6500' },
    mongoose: 'deleteMany()',
    status: 200,
    purpose:
      'Deletes every destination priced at 6,500 or less (Gokarna Coast and Hampi in the sample data).',
    expected: {
      success: true,
      message: '2 destination(s) deleted',
      deletedCount: 2,
    },
  },

  /* ---------------- Error handling ---------------- */
  {
    id: '15-error-invalid-id',
    challenge: 6,
    title: 'Invalid ID format returns 400',
    method: 'GET',
    route: '/api/destinations/:id',
    path: '/api/destinations/12345',
    status: 400,
    purpose: 'A malformed ObjectId is rejected before the database is queried.',
    expected: { success: false, message: 'Invalid destination ID: "12345"' },
  },
  {
    id: '16-error-not-found',
    challenge: 6,
    title: 'Unknown ID returns 404',
    method: 'GET',
    route: '/api/destinations/:id',
    path: '/api/destinations/64b7f0c2a1b2c3d4e5f6a7b8',
    status: 404,
    purpose: 'A well-formed ID that matches no document.',
    expected: { success: false, message: 'Destination not found' },
  },
  {
    id: '17-error-validation',
    challenge: 6,
    title: 'Invalid data returns 400 with details',
    method: 'POST',
    route: '/api/destinations',
    path: '/api/destinations',
    status: 400,
    purpose: 'Schema validation lists every problem found in the body.',
    body: { name: 'X', category: 'Space', price: -100 },
    expected: {
      success: false,
      message: 'Validation failed',
      errors: [
        'Name must be at least 2 characters',
        'Location is required',
        'Category must be one of: Beach, Hill Station, Heritage, Adventure, Wildlife, Spiritual, City',
        'Price cannot be negative',
      ],
    },
  },
  {
    id: '18-error-duplicate',
    challenge: 6,
    title: 'Duplicate name returns 409',
    method: 'POST',
    route: '/api/destinations',
    path: '/api/destinations',
    status: 409,
    purpose: 'The unique index on name blocks a second "Goa Beaches".',
    body: goa,
    expected: {
      success: false,
      message: 'Duplicate value: a destination with this name already exists',
    },
  },
  {
    id: '19-error-delete-no-condition',
    challenge: 6,
    title: 'Bulk delete without a condition returns 400',
    method: 'DELETE',
    route: '/api/destinations/bulk',
    path: '/api/destinations/bulk',
    status: 400,
    purpose: 'Protects the collection from an accidental "delete everything" call.',
    expected: {
      success: false,
      message:
        'Provide at least one condition: category, minPrice, maxPrice, minRating or maxRating',
    },
  },
];

const queryString = (query) =>
  query
    ? '?' +
      Object.entries(query)
        .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%2C/g, ',')}`)
        .join('&')
    : '';

module.exports = { challenges, items, queryString, BASE_URL: 'http://localhost:5000' };
