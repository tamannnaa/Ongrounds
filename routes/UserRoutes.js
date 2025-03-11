const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User'); 
const crypto = require("crypto");

const {sendEmail} = require("./emailsmtp");

const generateUniqueId = async () => {
    let id;
    do {
        id = Math.floor(100000000 + Math.random() * 900000000).toString(); // Generates a 9-digit ID
    } while (await Patient.exists({ mpd: id })); // Check if the ID already exists
    return id;
};


const verificationEmailTemplate = (code) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="background-color:rgb(16, 71, 68); padding: 10px;">
            <h1 style="color: white; text-align: center;">Ongrounds</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #38b2ac;">
            <h2 style="color: #4CAF50;">Email Verification</h2>
            <p>Thank you for logging into your account. Please use the code below to verify your email address:</p>
            <div style="font-size: 24px; font-weight: bold; color: #333; margin: 20px 0; text-align: center;">
                ${code}
            </div>
            <p>If you did not request this verification code, please ignore this email.</p>
            <p style="margin-top: 20px;">Best Regards, <br><strong>Ongrounds Support Team</strong></p>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center;">
            <p style="font-size: 12px; color: #777;">&copy; 2024 Ongrounds, All rights reserved.</p>
        </div>
    </div>
`;
// Update the verificationEmailTemplateRegister to use the correct verification URL
const verificationEmailTemplateRegister = (token) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="background-color:rgb(16, 71, 68); padding: 10px;">
            <h1 style="color: white; text-align: center;">Ongrounds</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #38b2ac;">
            <h2 style="color: #4CAF50;">Email Verification</h2>
            <p>Thank you for registering your account. Please click the button below to verify your email:</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="http://localhost:3000/verify-email?token=${token}" 
                   style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; font-size: 18px; border-radius: 5px;">
                    Verify Email
                </a>
            </div>
            <p>If you did not create an account, please ignore this email.</p>
            <p style="margin-top: 20px;">Best Regards, <br><strong>Ongrounds Support Team</strong></p>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center;">
            <p style="font-size: 12px; color: #777;">&copy; 2024 Ongrounds, All rights reserved.</p>
        </div>
    </div>
`;




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



// User registration(signup)
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            isVerified: false,
            verificationToken,
        });

        await newUser.save();

        // Use verificationEmailTemplateRegister instead of verificationEmailTemplate
        sendEmail(
            email, 
            "Verify Your Email", 
            verificationEmailTemplateRegister(verificationToken, newUser._id)
        );

        return res.json({ message: "Registration successful! Please check your email to verify your account." });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Server error during registration" });
    }
});




// User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate a random 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store verification code in session
        req.session.verificationCode = verificationCode;
        req.session.userEmail = email; // Temporarily store email for verification

        // Send email with verification code
        sendEmail(email, "Login Verification Code", verificationEmailTemplate(verificationCode));

        return res.render("verifyCode",{ message: 'Verification code sent to your email'});

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
});

router.post('/verify', (req, res) => {
    const { code } = req.body;

    if (!req.session.verificationCode || !req.session.userEmail) {
        return res.status(400).json({ message: "No verification process initiated" });
    }

    if (code === req.session.verificationCode) {
        // Retrieve user data after successful verification
        User.findOne({ email: req.session.userEmail }).then(user => {
            req.session.user = {
                id: user._id,
                username: user.username,
                email: user.email
            };

            // Clear verification code from session
            delete req.session.verificationCode;
            delete req.session.userEmail;

            return res.json({ message: "Verification successful", redirect: "/dashboard" });
        });
    } else {
        return res.status(400).json({ message: "Invalid verification code" });
    }
});

// Update verify-email route to handle the button click
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).send("<h2>Invalid or expired token.</h2>");
        }

        // Mark the user as verified
        user.isVerified = true;
        user.verificationToken = null; // Remove token after verification
        await user.save();

        // Set success message in session
        req.session.successMessage = "Email verified successfully! You can now login.";

        // Redirect to login page
        return res.redirect('/login');
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).send("<h2>Server error during verification.</h2>");
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