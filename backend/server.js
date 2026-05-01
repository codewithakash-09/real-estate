require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== FIXED: Serve frontend files for Render =====
// This works both locally and on Render
const frontendPath = path.join(__dirname, '../frontend');
console.log('Serving frontend from:', frontendPath);
app.use(express.static(frontendPath));

// ============= MONGODB CONNECTION =============
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables!');
    console.log('Please set MONGODB_URI in Render Environment Variables');
}

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Database:', mongoose.connection.name);
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️  Continuing with in-memory fallback...');
});

// ============= SCHEMAS =============
const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true, enum: ['Ghaziabad', 'Dadri', 'Loni', 'Hapur', 'Delhi'] },
    type: { type: String, required: true, enum: ['GDA Flat', 'Builder Flat'] },
    description: { type: String, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    area: { type: Number, required: true },
    image: { type: String, default: '' },
    status: { type: String, enum: ['Available', 'Sold', 'Under Process'], default: 'Available' },
    createdAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'contacted', 'converted', 'rejected'], default: 'pending' },
    notes: { type: String, default: '' },
    source: { type: String, default: 'website' },
    createdAt: { type: Date, default: Date.now }
});

let Property, Lead;
if (mongoose.connection.readyState === 1) {
    Property = mongoose.model('Property', propertySchema);
    Lead = mongoose.model('Lead', leadSchema);
}

// ============= IN-MEMORY FALLBACK =============
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
    },
    {
        _id: "3",
        title: '1BHK GDA Flat Raj Nagar',
        price: 1800000,
        location: 'Ghaziabad',
        type: 'GDA Flat',
        bedrooms: 1,
        bathrooms: 1,
        area: 500,
        description: 'Affordable GDA flat in Raj Nagar Extension',
        status: 'Available',
        createdAt: new Date().toISOString()
    },
    {
        _id: "4",
        title: '2BHK Builder Floor in Dadri',
        price: 2500000,
        location: 'Dadri',
        type: 'Builder Flat',
        bedrooms: 2,
        bathrooms: 2,
        area: 900,
        description: 'Well-maintained builder floor near Greater Noida',
        status: 'Available',
        createdAt: new Date().toISOString()
    },
    {
        _id: "5",
        title: '3BHK Independent House Loni',
        price: 4500000,
        location: 'Loni',
        type: 'Builder Flat',
        bedrooms: 3,
        bathrooms: 3,
        area: 1800,
        description: 'Spacious independent house with parking',
        status: 'Available',
        createdAt: new Date().toISOString()
    },
    {
        _id: "6",
        title: '2BHK GDA Flat Hapur',
        price: 1500000,
        location: 'Hapur',
        type: 'GDA Flat',
        bedrooms: 2,
        bathrooms: 2,
        area: 750,
        description: 'Budget-friendly GDA flat on NH-24',
        status: 'Available',
        createdAt: new Date().toISOString()
    }
];

let leads = [];

// ============= AUTH MIDDLEWARE =============
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbackSecret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// ============= PROPERTY ROUTES =============

app.get('/api/properties', async (req, res) => {
    try {
        const { location, type, minPrice, maxPrice } = req.query;
        
        if (Property && mongoose.connection.readyState === 1) {
            let filter = {};
            if (location && location !== '') filter.location = location;
            if (type && type !== '') filter.type = type;
            if (minPrice && minPrice !== '' || maxPrice && maxPrice !== '') {
                filter.price = {};
                if (minPrice && minPrice !== '') filter.price.$gte = parseInt(minPrice);
                if (maxPrice && maxPrice !== '') filter.price.$lte = parseInt(maxPrice);
            }
            const data = await Property.find(filter).sort({ createdAt: -1 });
            return res.json(data);
        }
        
        let filtered = [...properties];
        if (location && location !== '') filtered = filtered.filter(p => p.location === location);
        if (type && type !== '') filtered = filtered.filter(p => p.type === type);
        if (minPrice && minPrice !== '') filtered = filtered.filter(p => p.price >= parseInt(minPrice));
        if (maxPrice && maxPrice !== '') filtered = filtered.filter(p => p.price <= parseInt(maxPrice));
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/properties/:id', async (req, res) => {
    try {
        if (Property && mongoose.connection.readyState === 1) {
            const property = await Property.findById(req.params.id);
            if (!property) return res.status(404).json({ message: 'Property not found' });
            return res.json(property);
        }
        
        const property = properties.find(p => p._id === req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        res.json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/properties', authMiddleware, async (req, res) => {
    try {
        if (Property && mongoose.connection.readyState === 1) {
            const property = new Property(req.body);
            await property.save();
            return res.status(201).json(property);
        }
        
        const newProperty = {
            _id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        properties.push(newProperty);
        res.status(201).json(newProperty);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/properties/:id', authMiddleware, async (req, res) => {
    try {
        if (Property && mongoose.connection.readyState === 1) {
            const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!property) return res.status(404).json({ message: 'Property not found' });
            return res.json(property);
        }
        
        const index = properties.findIndex(p => p._id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Property not found' });
        properties[index] = { ...properties[index], ...req.body };
        res.json(properties[index]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/properties/:id', authMiddleware, async (req, res) => {
    try {
        if (Property && mongoose.connection.readyState === 1) {
            const property = await Property.findByIdAndDelete(req.params.id);
            if (!property) return res.status(404).json({ message: 'Property not found' });
            return res.json({ message: 'Property deleted successfully' });
        }
        
        const index = properties.findIndex(p => p._id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Property not found' });
        properties.splice(index, 1);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============= LEAD ROUTES =============

app.post('/api/leads', async (req, res) => {
    try {
        const { name, phone, message } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone are required' });
        }
        
        if (Lead && mongoose.connection.readyState === 1) {
            const lead = new Lead({ name, phone, message });
            await lead.save();
            console.log('📞 Lead saved to MongoDB:', { name, phone });
            return res.status(201).json({ message: 'Lead submitted successfully' });
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
        console.log('📞 Lead saved in-memory:', { name, phone });
        res.status(201).json({ message: 'Lead submitted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/leads', authMiddleware, async (req, res) => {
    try {
        if (Lead && mongoose.connection.readyState === 1) {
            const allLeads = await Lead.find().sort({ createdAt: -1 });
            return res.json(allLeads);
        }
        
        const sortedLeads = [...leads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(sortedLeads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/leads/:id', authMiddleware, async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        if (Lead && mongoose.connection.readyState === 1) {
            const lead = await Lead.findByIdAndUpdate(req.params.id, { status, notes }, { new: true });
            if (!lead) return res.status(404).json({ message: 'Lead not found' });
            return res.json(lead);
        }
        
        const index = leads.findIndex(l => l._id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Lead not found' });
        if (status) leads[index].status = status;
        if (notes) leads[index].notes = notes;
        res.json(leads[index]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ============= AUTH ROUTES =============

const ADMIN_PASSWORD_HASH = bcrypt.hashSync('akash@1234', 10);

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username !== 'bittu') {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const token = jwt.sign(
            { username: 'bittu', role: 'admin' },
            process.env.JWT_SECRET || 'fallbackSecret',
            { expiresIn: '24h' }
        );
        
        res.json({ token, message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        database: mongoose.connection.readyState === 1 ? 'MongoDB' : 'in-memory',
        propertiesCount: properties.length,
        leadsCount: leads.length
    });
});

// Catch-all route for frontend (must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============= START SERVER =============
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log('🏠 Bittu Khari Real Estate Server');
    console.log('=================================');
    console.log(`✅ Server running on: http://localhost:${PORT}`);
    console.log(`📊 Properties API: http://localhost:${PORT}/api/properties`);
    console.log(`📞 Leads API: http://localhost:${PORT}/api/leads`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth/login`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log('=================================');
    console.log('📝 Admin Login: bittu / akash@1234');
    console.log('=================================');
    
    if (mongoose.connection.readyState === 1) {
        console.log('💾 Using MongoDB Database ✅');
        console.log(`📁 Database: ${mongoose.connection.name}`);
    } else {
        console.log('💾 Using In-Memory Database ⚠️');
    }
    console.log('=================================');
});
