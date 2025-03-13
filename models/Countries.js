const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema(
    {
    name: { 
        type: String, 
        required: true 
    },
    ranking: { 
        type: Number, 
        required: true 
    },
    location: { 
        type: String, 
        required: true 
    } // City or region
});

const countrySchema = new mongoose.Schema(
    {
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    code: { 
        type: String, 
        required: true, 
        unique: true 
    }, // Country code (e.g., US, UK)
    universities: [universitySchema] // Array of universities
});

module.exports =  mongoose.model('Country', countrySchema);
