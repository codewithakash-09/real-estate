const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// In-memory storage (fallback when no MongoDB)
let properties = [
    {
        _id: "1",
        title: '2BHK GDA Flat in Vaishali',
        price: 3500000,
        location: 'Ghaziabad',
        type: 'GDA Flat',
        bedrooms: 2,
        bathrooms: 2,
        area: 850,
        description: 'Beautiful GDA flat in prime location of Vaishali, near metro station',
        status: 'Available',
        createdAt: new Date().toISOString()
    },
    {
        _id: "2",
        title: '3BHK Builder Apartment Indirapuram',
        price: 7500000,
        location: 'Ghaziabad',
        type: 'Builder Flat',
        bedrooms: 3,
        bathrooms: 3,
        area: 1450,
        description: 'Luxurious builder apartment in Indirapuram with modern amenities',
        status: 'Available',
        createdAt: new Date().toISOString()
    }
];

// GET all properties (public)
router.get('/', async (req, res) => {
    try {
        const { location, type, minPrice, maxPrice } = req.query;
        let filtered = [...properties];
        
        if (location) filtered = filtered.filter(p => p.location === location);
        if (type) filtered = filtered.filter(p => p.type === type);
        if (minPrice) filtered = filtered.filter(p => p.price >= parseInt(minPrice));
        if (maxPrice) filtered = filtered.filter(p => p.price <= parseInt(maxPrice));
        
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single property
router.get('/:id', async (req, res) => {
    try {
        const property = properties.find(p => p._id === req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        res.json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create property (protected)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const property = {
            _id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        properties.push(property);
        res.status(201).json(property);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update property (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const index = properties.findIndex(p => p._id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Property not found' });
        
        properties[index] = { ...properties[index], ...req.body };
        res.json(properties[index]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE property (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const index = properties.findIndex(p => p._id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Property not found' });
        
        properties.splice(index, 1);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;