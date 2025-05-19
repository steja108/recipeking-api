// controllers/roleRequestController.js
const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');

// @desc Create a new role upgrade request
// @route POST /api/role-requests
// @access Private (Authenticated users)
const createRoleRequest = async (req, res) => {
    const { reason } = req.body;
    const userId = req.user.id;
    
    if (!reason) {
        return res.status(400).json({ message: 'Please provide a reason for your request' });
    }
    
    try {
        // Check if user already has a pending request
        const existingRequest = await RoleRequest.findOne({ 
            user: userId, 
            status: 'pending' 
        });
        
        if (existingRequest) {
            return res.status(400).json({ 
                message: 'You already have a pending role upgrade request' 
            });
        }
        
        // Find user to get current role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if user is already a Writer or Admin
        if (user.roles.includes('Writer') || user.roles.includes('Admin')) {
            return res.status(400).json({ 
                message: 'You already have Writer or Admin privileges' 
            });
        }
        
        // Create new role request
        const roleRequest = await RoleRequest.create({
            user: userId,
            currentRole: user.roles.join(', '),
            requestedRole: 'Writer',
            reason,
            status: 'pending'
        });
        
        res.status(201).json({
            message: 'Role upgrade request submitted successfully',
            requestId: roleRequest._id
        });
        
    } catch (err) {
        console.error('Error creating role request:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc Get all role requests (for admin)
// @route GET /api/role-requests
// @access Private (Admin only)
const getAllRoleRequests = async (req, res) => {
    try {
        const roleRequests = await RoleRequest.find()
            .sort({ createdAt: -1 })
            .populate('user', 'username');
            
        res.json(roleRequests);
    } catch (err) {
        console.error('Error fetching role requests:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc Get user's role requests
// @route GET /api/role-requests/mine
// @access Private
const getUserRoleRequests = async (req, res) => {
    try {
        const roleRequests = await RoleRequest.find({ user: req.user.id })
            .sort({ createdAt: -1 });
            
        res.json(roleRequests);
    } catch (err) {
        console.error('Error fetching user role requests:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc Process a role request (approve/reject)
// @route PATCH /api/role-requests/:id
// @access Private (Admin only)
const processRoleRequest = async (req, res) => {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    
    // Validate input
    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
            message: 'Please provide a valid status (approved or rejected)' 
        });
    }
    
    try {
        // Find the role request
        const roleRequest = await RoleRequest.findById(id);
        
        if (!roleRequest) {
            return res.status(404).json({ message: 'Role request not found' });
        }
        
        // Update the request status
        roleRequest.status = status;
        roleRequest.adminNote = adminNote || '';
        
        // If approved, update user role
        if (status === 'approved') {
            const user = await User.findById(roleRequest.user);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Add Writer role if not already present
            if (!user.roles.includes('Writer')) {
                user.roles.push('Writer');
                await user.save();
            }
        }
        
        await roleRequest.save();
        
        res.json({ 
            message: `Role request ${status}`,
            roleRequest
        });
        
    } catch (err) {
        console.error('Error processing role request:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc Mark role request as read by user
// @route PATCH /api/role-requests/:id/read
// @access Private
const markRequestAsRead = async (req, res) => {
    const { id } = req.params;
    
    try {
        const roleRequest = await RoleRequest.findById(id);
        
        if (!roleRequest) {
            return res.status(404).json({ message: 'Role request not found' });
        }
        
        // Ensure user can only mark their own requests as read
        if (roleRequest.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        roleRequest.isRead = true;
        await roleRequest.save();
        
        res.json({ message: 'Request marked as read' });
        
    } catch (err) {
        console.error('Error marking request as read:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc Get count of unread admin notifications
// @route GET /api/role-requests/count/unread
// @access Private (Admin only)
const getUnreadRequestsCount = async (req, res) => {
    try {
        const count = await RoleRequest.countDocuments({ 
            status: 'pending',
            // Add any other conditions for unread notifications
        });
        
        res.json({ count });
    } catch (err) {
        console.error('Error counting unread requests:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createRoleRequest,
    getAllRoleRequests,
    getUserRoleRequests,
    processRoleRequest,
    markRequestAsRead,
    getUnreadRequestsCount
};