const express = require('express');
const router = express.Router();
const recipesController = require('../controllers/recipesController');
const verifyJWT = require('../middleware/verifyJWT');
const verifyRoles = require('../middleware/verifyRoles');
const ROLES = require('../config/roles');

router.route('/')
    .get(recipesController.getAllRecipes); // Now public

 // Add this new endpoint

router.use(verifyJWT);
router.route('/manage')
    .get(
        verifyRoles(ROLES.Writer, ROLES.Admin), 
        recipesController.getManageRecipes
    );
router.route('/:id')
    .get(recipesController.getSingleRecipe);

router.route('/')
    .post(verifyRoles(ROLES.Writer, ROLES.Admin), recipesController.createNewRecipe);

router.route('/:id')
    .patch(verifyRoles(ROLES.Writer, ROLES.Admin), recipesController.updateRecipe)
    .delete(verifyRoles(ROLES.Admin), recipesController.deleteRecipe);

module.exports = router;