// [file name]: Recipe.js (renamed from Note.js)
const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

const recipeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        image: {
            type: String,
            default: '/default-recipe.jpg'
        },
        title: {
            type: String,
            required: true
        },
        ingredients: {  // Changed from text
            type: String,
            required: true
        },
        instructions: {  // New field
            type: String,
            required: true
        },
        cookingTime: {   // New field
            type: Number,
            required: true
        },
        category: {
            type: String,
            default: 'General'
        },
        // New fields for ratings and reviews
        reviews: [reviewSchema],
        rating: {
            type: Number,
            default: 0
        },
        ratingsCount: {
            type: Number,
            default: 0
        },
        completed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

recipeSchema.plugin(AutoIncrement, {
    inc_field: 'ticket',
    id: 'ticketNums',
    start_seq: 500
})

module.exports = mongoose.model('Recipe', recipeSchema)