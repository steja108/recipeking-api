// routes/roleRequestRoutes.js
const express = require('express');
const router = express.Router();
const roleRequestController = require('../controllers/roleRequestController');
const verifyJWT = require('../middleware/verifyJWT');
const verifyRoles = require('../middleware/verifyRoles');
const ROLES = require('../config/roles');

// All routes require authentication
router.use(verifyJWT);

// Routes for all authenticated users
router.route('/')
    .post(roleRequestController.createRoleRequest);

router.route('/mine')
    .get(roleRequestController.getUserRoleRequests);

router.route('/:id/read')
    .patch(roleRequestController.markRequestAsRead);

// Routes for admins only
router.route('/')
    .get(verifyRoles(ROLES.Admin), roleRequestController.getAllRoleRequests);

router.route('/:id')
    .patch(verifyRoles(ROLES.Admin), roleRequestController.processRoleRequest);

router.route('/count/unread')
    .get(verifyRoles(ROLES.Admin), roleRequestController.getUnreadRequestsCount);

module.exports = router;