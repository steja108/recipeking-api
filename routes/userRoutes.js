const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(usersController.getAllUsers)
    .post(usersController.createNewUser)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)

router.route('/saved-recipes')
    .get(usersController.getSavedRecipes)

router.route('/save-recipe')
    .patch(usersController.toggleSavedRecipe)

module.exports = router