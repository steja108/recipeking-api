// models/RoleRequest.js
const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        currentRole: {
            type: String,
            required: true
        },
        requestedRole: {
            type: String,
            required: true
        },
        reason: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        adminNote: {
            type: String,
            default: ''
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('RoleRequest', roleRequestSchema);