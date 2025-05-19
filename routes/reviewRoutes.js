const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const verifyJWT = require('../middleware/verifyJWT');

// Public route to get reviews
router.route('/')
    .get(reviewController.getRecipeReviews);

// Protected routes - require authentication
router.use(verifyJWT);

router.route('/')
    .post(reviewController.addReview);

router.route('/:reviewId')
    .delete(reviewController.deleteReview);

module.exports = router;