const Destination = require('../models/Destination');
const ApiError = require('../utils/ApiError');

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

// Forwards rejected promises to the central error handler.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Case-insensitive matching for name lookups (strength 2 ignores case).
const COLLATION = { locale: 'en', strength: 2 };

const SORTABLE_FIELDS = ['price', 'rating', 'name', 'duration', 'createdAt'];
const PROTECTED_FIELDS = ['_id', 'createdAt', 'updatedAt', '__v'];

const checkId = (id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, `Invalid destination ID: "${id}"`);
  }
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toNumber = (value, label) => {
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  if (Number.isNaN(number)) {
    throw new ApiError(400, `"${label}" must be a number`);
  }
  return number;
};

// Builds a MongoDB filter from ?category=&minPrice=&maxPrice=&minRating=&maxRating=
const buildFilter = (query) => {
  const filter = {};

  if (query.category) {
    filter.category = {
      $regex: `^${escapeRegex(String(query.category).trim())}$`,
      $options: 'i',
    };
  }

  const minPrice = toNumber(query.minPrice, 'minPrice');
  const maxPrice = toNumber(query.maxPrice, 'maxPrice');
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ApiError(400, '"minPrice" cannot be greater than "maxPrice"');
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const minRating = toNumber(query.minRating, 'minRating');
  const maxRating = toNumber(query.maxRating, 'maxRating');
  if (minRating !== undefined || maxRating !== undefined) {
    filter.rating = {};
    if (minRating !== undefined) filter.rating.$gte = minRating;
    if (maxRating !== undefined) filter.rating.$lte = maxRating;
  }

  return filter;
};

// ?sort=price,-rating  ->  { price: 1, rating: -1, _id: 1 }
const buildSort = (sortParam) => {
  const sort = {};

  if (sortParam) {
    String(sortParam)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const descending = part.startsWith('-');
        const field = descending ? part.slice(1) : part;
        if (!SORTABLE_FIELDS.includes(field)) {
          throw new ApiError(
            400,
            `Cannot sort by "${field}". Allowed fields: ${SORTABLE_FIELDS.join(', ')}`
          );
        }
        sort[field] = descending ? -1 : 1;
      });
  }

  if (Object.keys(sort).length === 0) sort.createdAt = -1;
  sort._id = 1; // stable order so pages never overlap
  return sort;
};

// ?page=2&limit=5  ->  { page: 2, limit: 5, skip: 5 }
const buildPagination = (query) => {
  const page = toNumber(query.page, 'page') ?? 1;
  const limit = toNumber(query.limit, 'limit') ?? 5;

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, '"page" must be a whole number of 1 or more');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new ApiError(400, '"limit" must be a whole number between 1 and 50');
  }
  return { page, limit, skip: (page - 1) * limit };
};

// Removes fields a client must never change, and rejects empty updates.
const buildUpdate = (body) => {
  const update = { ...(body || {}) };
  PROTECTED_FIELDS.forEach((field) => delete update[field]);
  if (Object.keys(update).length === 0) {
    throw new ApiError(400, 'Request body has no updatable fields');
  }
  return update;
};

const notFound = (what) => new ApiError(404, `${what} not found`);

/* ------------------------------------------------------------------ *
 * Challenge 01 - Add destinations (create, insertMany)
 * ------------------------------------------------------------------ */

// POST /api/destinations
exports.createDestination = asyncHandler(async (req, res) => {
  if (Array.isArray(req.body)) {
    throw new ApiError(400, 'Send a single object here. Use POST /api/destinations/bulk for arrays');
  }
  const destination = await Destination.create(req.body); // create()
  res
    .status(201)
    .json({ success: true, message: 'Destination created', data: destination });
});

// POST /api/destinations/bulk   (body: [ {...}, {...} ]  or  { "destinations": [ ... ] })
exports.createManyDestinations = asyncHandler(async (req, res) => {
  const docs = Array.isArray(req.body) ? req.body : req.body && req.body.destinations;
  if (!Array.isArray(docs) || docs.length === 0) {
    throw new ApiError(400, 'Send a non-empty array of destinations');
  }
  const created = await Destination.insertMany(docs); // insertMany()
  res.status(201).json({
    success: true,
    message: `${created.length} destinations created`,
    count: created.length,
    data: created,
  });
});

/* ------------------------------------------------------------------ *
 * Challenge 02 - Retrieve destinations (find, findById, findOne)
 * ------------------------------------------------------------------ */

// GET /api/destinations
exports.getAllDestinations = asyncHandler(async (req, res) => {
  const destinations = await Destination.find(); // find()
  res.json({ success: true, count: destinations.length, data: destinations });
});

// GET /api/destinations/:id
exports.getDestinationById = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const destination = await Destination.findById(req.params.id); // findById()
  if (!destination) throw notFound('Destination');
  res.json({ success: true, data: destination });
});

// GET /api/destinations/name/:name
exports.getDestinationByName = asyncHandler(async (req, res) => {
  const destination = await Destination.findOne({
    name: req.params.name.trim(),
  }).collation(COLLATION); // findOne()
  if (!destination) throw notFound(`Destination "${req.params.name}"`);
  res.json({ success: true, data: destination });
});

/* ------------------------------------------------------------------ *
 * Challenge 03 - Update destinations (findByIdAndUpdate, findOneAndUpdate)
 * ------------------------------------------------------------------ */

// PUT /api/destinations/:id
exports.updateDestinationById = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const update = buildUpdate(req.body);
  const destination = await Destination.findByIdAndUpdate(req.params.id, update, {
    new: true, // return the updated document
    runValidators: true, // apply schema rules to the new values
  }); // findByIdAndUpdate()
  if (!destination) throw notFound('Destination');
  res.json({ success: true, message: 'Destination updated', data: destination });
});

// PUT /api/destinations/name/:name
exports.updateDestinationByName = asyncHandler(async (req, res) => {
  const update = buildUpdate(req.body);
  const destination = await Destination.findOneAndUpdate(
    { name: req.params.name.trim() },
    update,
    { new: true, runValidators: true, collation: COLLATION }
  ); // findOneAndUpdate()
  if (!destination) throw notFound(`Destination "${req.params.name}"`);
  res.json({ success: true, message: 'Destination updated', data: destination });
});

/* ------------------------------------------------------------------ *
 * Challenge 04 - Smart destination discovery
 *   filter + sort() + skip() + limit() + distinct() + countDocuments()
 * ------------------------------------------------------------------ */

// GET /api/destinations/discover?category=Beach&minPrice=5000&maxPrice=20000&sort=price,-rating&page=1&limit=5
exports.discoverDestinations = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const sort = buildSort(req.query.sort);
  const { page, limit, skip } = buildPagination(req.query);

  const [destinations, total] = await Promise.all([
    Destination.find(filter).sort(sort).skip(skip).limit(limit), // sort(), skip(), limit()
    Destination.countDocuments(filter), // countDocuments()
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    count: destinations.length,
    data: destinations,
  });
});

// GET /api/destinations/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Destination.distinct('category'); // distinct()
  categories.sort();
  res.json({ success: true, count: categories.length, data: categories });
});

// GET /api/destinations/count?category=Beach&minPrice=5000
exports.countDestinations = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const count = await Destination.countDocuments(filter); // countDocuments()
  res.json({ success: true, count });
});

/* ------------------------------------------------------------------ *
 * Challenge 05 - Cleanup (findByIdAndDelete, findOneAndDelete, deleteMany)
 * ------------------------------------------------------------------ */

// DELETE /api/destinations/:id
exports.deleteDestinationById = asyncHandler(async (req, res) => {
  checkId(req.params.id);
  const destination = await Destination.findByIdAndDelete(req.params.id); // findByIdAndDelete()
  if (!destination) throw notFound('Destination');
  res.json({ success: true, message: 'Destination deleted', data: destination });
});

// DELETE /api/destinations/name/:name
exports.deleteDestinationByName = asyncHandler(async (req, res) => {
  const destination = await Destination.findOneAndDelete(
    { name: req.params.name.trim() },
    { collation: COLLATION }
  ); // findOneAndDelete()
  if (!destination) throw notFound(`Destination "${req.params.name}"`);
  res.json({ success: true, message: 'Destination deleted', data: destination });
});

// DELETE /api/destinations/bulk?category=Beach&maxPrice=5000
// A condition is mandatory so a stray request can never wipe the collection.
exports.deleteManyDestinations = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  if (Object.keys(filter).length === 0) {
    throw new ApiError(
      400,
      'Provide at least one condition: category, minPrice, maxPrice, minRating or maxRating'
    );
  }
  const result = await Destination.deleteMany(filter); // deleteMany()
  res.json({
    success: true,
    message: `${result.deletedCount} destination(s) deleted`,
    deletedCount: result.deletedCount,
  });
});
