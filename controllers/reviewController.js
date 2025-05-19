
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc Add a review to a recipe
// @route POST /api/recipes/:id/reviews
// @access Private
const addReview = async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!rating || !comment) {
        return res.status(400).json({ message: 'Rating and comment are required' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    try {
        const recipe = await Recipe.findById(id);
        
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Check if user already reviewed this recipe
        const alreadyReviewed = recipe.reviews.find(
            (review) => review.user.toString() === userId.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Recipe already reviewed' });
        }

        // Create new review
        const review = {
            user: userId,
            rating: Number(rating),
            comment
        };

        // Add review to recipe
        recipe.reviews.push(review);
        
        // Update recipe ratings
        recipe.ratingsCount = recipe.reviews.length;
        recipe.rating = recipe.reviews.reduce((acc, item) => item.rating + acc, 0) / recipe.reviews.length;

        // Save recipe with new review
        await recipe.save();

        res.status(201).json({ 
            message: 'Review added',
            review,
            newRating: recipe.rating,
            ratingsCount: recipe.ratingsCount
        });
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc Get all reviews for a recipe
// @route GET /api/recipes/:id/reviews
// @access Public
const getRecipeReviews = async (req, res) => {
    const { id } = req.params;

    try {
        const recipe = await Recipe.findById(id)
            .populate({
                path: 'reviews.user',
                select: 'username'
            });
        
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Sort reviews by most recent first
        const reviews = recipe.reviews.sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json(reviews);
    } catch (err) {
        console.error('Error getting reviews:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc Delete a review
// @route DELETE /api/recipes/:id/reviews/:reviewId
// @access Private
const deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    const userId = req.user.id;

    try {
        const recipe = await Recipe.findById(id);
        
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Find the review
        const review = recipe.reviews.id(reviewId);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if review belongs to user or if user is admin
        if (review.user.toString() !== userId && !req.user.roles.includes('Admin')) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        // Remove the review
        review.remove();
        
        // Recalculate ratings
        if (recipe.reviews.length > 0) {
            recipe.rating = recipe.reviews.reduce((acc, item) => item.rating + acc, 0) / recipe.reviews.length;
        } else {
            recipe.rating = 0;
        }
        
        recipe.ratingsCount = recipe.reviews.length;

        // Save the updated recipe
        await recipe.save();

        res.status(200).json({ 
            message: 'Review deleted',
            newRating: recipe.rating,
            ratingsCount: recipe.ratingsCount
        });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addReview,
    getRecipeReviews,
    deleteReview
};