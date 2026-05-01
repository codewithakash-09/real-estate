const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true,
        enum: ['Ghaziabad', 'Dadri', 'Loni', 'Hapur', 'Delhi']
    },
    type: {
        type: String,
        required: true,
        enum: ['GDA Flat', 'Builder Flat']
    },
    description: {
        type: String,
        required: true
    },
    bedrooms: {
        type: Number,
        required: true
    },
    bathrooms: {
        type: Number,
        required: true
    },
    area: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: '/uploads/default-property.jpg'
    },
    additionalImages: [String],
    features: [String],
    status: {
        type: String,
        enum: ['Available', 'Sold', 'Under Process'],
        default: 'Available'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Property', propertySchema);
