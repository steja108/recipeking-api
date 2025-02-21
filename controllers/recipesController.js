
const Recipe = require('../models/Recipe');
const User = require('../models/User');

// @desc Get all recipes
// @route GET /api//recipes
const getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate('user', 'username') // Ensure user data is populated
            .lean();

        const formattedRecipes = recipes.map(recipe => ({
            ...recipe,
            user: {
                _id: recipe.user._id,
                username: recipe.user.username
            },
            ingredients: recipe.ingredients.split('\n'),
            instructions: recipe.instructions.split('\n')
        }));

        res.status(200).json(formattedRecipes);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getSingleRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id)
            .populate('user', 'username')
            .lean();
            
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
        
        res.json({
            ...recipe,
            ingredients: recipe.ingredients.split('\n'),
            instructions: recipe.instructions.split('\n')
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc Create new recipe
// @route POST /api/recipes
// @access Private (Writer/Admin)
const createNewRecipe = async (req, res) => {
    const userId = req.user.id
    const { title, image, ingredients, instructions, cookingTime } = req.body

    // Validate required fields
    const requiredFields = [ 'title', 'ingredients', 'instructions', 'cookingTime']
    const missingFields = requiredFields.filter(field => !req.body[field])
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(', ')}`
        })
    }

    try {
        // Check for duplicate title
        const duplicate = await Recipe.findOne({ title })
            .collation({ locale: 'en', strength: 2 })
            .lean()
            .exec()

        if (duplicate) {
            return res.status(409).json({ message: 'Duplicate recipe title' })
        }

        // Create recipe with proper data types
        const recipe = await Recipe.create({
            user: userId,
            title,
            image: image || '/default-recipe.jpg',
            ingredients: Array.isArray(ingredients) ? 
                ingredients.join('\n') : 
                ingredients,
            instructions: Array.isArray(instructions) ? 
                instructions.join('\n') : 
                instructions,
            cookingTime: Number(cookingTime)
        })

        res.status(201).json({
            _id: recipe._id,
            user: recipe.user,
            title: recipe.title,
            image: recipe.image,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            cookingTime: recipe.cookingTime,
            createdAt: recipe.createdAt
        })

    } catch (err) {
        console.error('Error creating recipe:', err)
        res.status(500).json({ message: 'Server Error' })
    }
}

const getManageRecipes = async (req, res) => {
    try {
        let query = {};
        
        // If user is Writer (not Admin), filter by their ID
        if (req.user.roles.includes('Writer') && 
            !req.user.roles.includes('Admin')) {
            query.user = req.user.id;
        }

        const recipes = await Recipe.find(query)
            .populate('user', 'username')
            .lean();

        const formattedRecipes = recipes.map(recipe => ({
            ...recipe,
            user: {
                _id: recipe.user._id,
                username: recipe.user.username
            },
            ingredients: recipe.ingredients.split('\n'),
            instructions: recipe.instructions.split('\n')
        }));

        res.status(200).json(formattedRecipes);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc Update a recipe
// @route PATCH /api/recipes
// @access Private (Writer/Admin)
const updateRecipe = async (req, res) => {
    const { id } = req.params;
    const { user, title, image, ingredients, instructions, cookingTime } = req.body

    // Confirm data
    if (!id || !user || !title || !ingredients || !instructions) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm recipe exists to update
    const recipe = await Recipe.findById(id).exec()

    if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found' })
    }

    // Check for duplicate title
    const duplicate = await Recipe.findOne({ title })
        .collation({ locale: 'en', strength: 2 })
        .lean()
        .exec()

    // Allow updates to original recipe
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate recipe title' })
    }

    // Update recipe fields
    recipe.user = user
    recipe.title = title
    recipe.image = image || '/default-recipe.jpg'
    recipe.ingredients = Array.isArray(ingredients) ? ingredients.join('\n') : ingredients
    recipe.instructions = Array.isArray(instructions) ? instructions.join('\n') : instructions
    recipe.cookingTime = cookingTime

    const updatedRecipe = await recipe.save()

    res.json({
        message: `'${updatedRecipe.title}' updated`,
        id: updatedRecipe._id
    })
}

// @desc Delete a recipe
// @route DELETE /api/recipes
// @access Private (Admin only)
const deleteRecipe = async (req, res) => {
    const { id } = req.params

    if (!id) {
        return res.status(400).json({ message: 'Recipe ID required' })
    }

    const recipe = await Recipe.findById(id).exec()

    if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found' })
    }

    const result = await recipe.deleteOne()

    res.json({
        message: `Recipe '${result.title}' deleted`,
        id: result._id
    })
}

module.exports = {
    getAllRecipes,
    getSingleRecipe,
    createNewRecipe,
    updateRecipe,
    deleteRecipe,
    getManageRecipes
}