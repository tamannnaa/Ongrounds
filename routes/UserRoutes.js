const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User'); 

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized: Please login' });
};

router.get('/login', (req, res) => {
    const successMessage = req.session.successMessage;
    delete req.session.successMessage; 

    res.render('login', { successMessage });
});

router.get('/signup', (req, res) => {
    res.render('Signup');
});

// User registration (signup)
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists with that email or username' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        // Save user to database
        await newUser.save();

        // Store success message in session
        req.session.successMessage = 'Registration successful! Please log in.';

        // Redirect to login page
        return res.redirect('/login');
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Server error during registration' });
    }
});


// User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create session
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };

        return res.redirect('/dashboard');

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
});

router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});


// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        return res.status(200).json({ message: 'Logout successful' });
    });
});

// Get current user (protected route)
router.get('/me', isAuthenticated, (req, res) => {
    return res.status(200).json({
        user: req.session.user
    });
});

module.exports = router;