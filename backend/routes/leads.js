const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// In-memory storage
let leads = [];

// POST create lead (public)
router.post('/', async (req, res) => {
    try {
        const { name, phone, message } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone are required' });
        }
        
        const lead = {
            _id: Date.now().toString(),
            name,
            phone,
            message: message || '',
            status: 'pending',
            notes: '',
            source: 'website',
            createdAt: new Date().toISOString()
        };
        
        leads.push(lead);
        console.log('📞 New lead:', { name, phone });
        
        res.status(201).json({ message: 'Lead submitted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET all leads (protected)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const sorted = [...leads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(sorted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT update lead (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const index = leads.findIndex(l => l._id === req.params.id);
        
        if (index === -1) return res.status(404).json({ message: 'Lead not found' });
        
        if (status) leads[index].status = status;
        if (notes) leads[index].notes = notes;
        
        res.json(leads[index]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;