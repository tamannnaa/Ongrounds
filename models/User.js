const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isVerified: 
    { 
        type: Boolean, 
        default: false 
    },
    verificationToken: 
    { 
        type: String, 
        default: null 
    },
});

module.exports = mongoose.model('User', UserSchema);

