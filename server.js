const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const configureSession = require('./middleware/sessionConfig.js');
const userRoutes = require('./routes/UserRoutes.js');
const path = require('path');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI =process.env.MONGO_URI

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

configureSession(app);

//Landing Page
app.get('/', (req, res) => {
    res.render('landingPage');
});


// Routes
app.use('/', userRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
