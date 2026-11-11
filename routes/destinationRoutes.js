const express = require('express');
const controller = require('../controllers/destinationController');

const router = express.Router();

// NOTE: fixed paths (/bulk, /discover, /categories, /count, /name/:name)
// must be declared BEFORE "/:id", otherwise Express would treat them as an id.

router
  .route('/')
  .get(controller.getAllDestinations) //            Challenge 02 - find()
  .post(controller.createDestination); //           Challenge 01 - create()

router
  .route('/bulk')
  .post(controller.createManyDestinations) //       Challenge 01 - insertMany()
  .delete(controller.deleteManyDestinations); //    Challenge 05 - deleteMany()

router.get('/discover', controller.discoverDestinations); // Challenge 04 - filter, sort, skip, limit
router.get('/categories', controller.getCategories); //      Challenge 04 - distinct()
router.get('/count', controller.countDestinations); //       Challenge 04 - countDocuments()

router
  .route('/name/:name')
  .get(controller.getDestinationByName) //          Challenge 02 - findOne()
  .put(controller.updateDestinationByName) //       Challenge 03 - findOneAndUpdate()
  .delete(controller.deleteDestinationByName); //   Challenge 05 - findOneAndDelete()

router
  .route('/:id')
  .get(controller.getDestinationById) //            Challenge 02 - findById()
  .put(controller.updateDestinationById) //         Challenge 03 - findByIdAndUpdate()
  .delete(controller.deleteDestinationById); //     Challenge 05 - findByIdAndDelete()

module.exports = router;
