const User = require('../models/User')
const Recipe = require('../models/Recipe')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
    // Get all users from MongoDB
    const users = await User.find().select('-password').lean()

    // If no users 
    if (!users?.length) {
        return res.status(400).json({ message: 'No users found' })
    }

    res.json(users)
}

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
    const { username, password, roles } = req.body

    // Confirm data
    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate username
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    // Hash password 
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    const userObject = (!Array.isArray(roles) || !roles.length)
        ? { username, "password": hashedPwd }
        : { username, "password": hashedPwd, roles }

    // Create and store new user 
    const user = await User.create(userObject)

    if (user) { //created 
        res.status(201).json({ message: `New user ${username} created` })
    } else {
        res.status(400).json({ message: 'Invalid user data received' })
    }
}

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
    const { id, username, roles, active, password } = req.body

    // Confirm data 
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    // Does the user exist to update?
    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }

    // Check for duplicate 
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password) {
        // Hash password 
        user.password = await bcrypt.hash(password, 10) // salt rounds 
    }

    const updatedUser = await user.save()

    res.json({ message: `${updatedUser.username} updated` })
}

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    // Does the user still have assigned recipes?
    const recipe = await Recipe.findOne({ user: id }).lean().exec()
    if (recipe) {
        return res.status(400).json({ message: 'User has assigned recipes' })
    }

    // Does the user exist to delete?
    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message: 'User not found' })
    }

    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} deleted`

    res.json(reply)
}

const getSavedRecipes = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'savedRecipes',
                populate: { path: 'user', select: 'username' }
            })
            .lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
    
        res.status(200).json(user.savedRecipes);
    } catch (err) {
        console.error('Error in getSavedRecipes:', err)
        res.status(500).json({ message: 'Server Error' });
    }
};

const toggleSavedRecipe = async (req, res) => {
    const { recipeId } = req.body;
    
    try {
        const user = await User.findById(req.user.id); // Ensure JWT sets req.user.id

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize savedRecipes if undefined
        user.savedRecipes = user.savedRecipes || [];
        
        const index = user.savedRecipes.indexOf(recipeId);
        
        if (index === -1) {
            user.savedRecipes.push(recipeId);
        } else {
            user.savedRecipes.splice(index, 1);
        }
        
        await user.save();
        res.status(200).json(user.savedRecipes);
    } catch (err) {
        console.error('Error in toggleSavedRecipe:', err); // Log the error
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser,
    getSavedRecipes,
    toggleSavedRecipe
}