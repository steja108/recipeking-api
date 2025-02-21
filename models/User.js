const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
    username: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    roles: {
        type: [String],
        default: ["Reader"]
    },
    active: {
        type: Boolean,
        default: true
    },
    savedRecipes: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        }],
        default: [] 
    }
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model('User', userSchema)