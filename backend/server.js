require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// ============= MIDDLEWARE (ORDER MATTERS) =============

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON parser
app.use(express.json());

// Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============= SEO & SECURITY HEADERS =============
app.use((req, res, next) => {
    // Only cache static files, NOT API routes
    if (!req.path.startsWith('/api')) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove server fingerprint
    res.removeHeader('X-Powered-By');
    
    next();
});

// ============= FRONTEND PATH =============
const frontendPath = path.join(__dirname, '../frontend');
console.log('Serving frontend from:', frontendPath);

// Serve static files
app.use(express.static(frontendPath));
app.use('/admin', express.static(path.join(frontendPath, 'admin')));

// ============= SEO FILES =============
app.get('/robots.txt', (req, res) => {
    const filePath = path.join(frontendPath, 'robots.txt');
    if (fs.existsSync(filePath)) {
        res.type('text/plain');
        res.sendFile(filePath);
    } else {
        res.type('text/plain');
        res.send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api');
    }
});

app.get('/sitemap.xml', (req, res) => {
    const filePath = path.join(frontendPath, 'sitemap.xml');
    if (fs.existsSync(filePath)) {
        res.type('application/xml');
        res.sendFile(filePath);
    } else {
        // Generate dynamic sitemap
        const baseUrl = process.env.SITE_URL || 'https://bittukhariofficial.site';
        const today = new Date().toISOString().split('T')[0];
        
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.00</priority>
    </url>
    <url>
        <loc>${baseUrl}/#about</loc>
        <changefreq>monthly</changefreq>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>${baseUrl}/#properties</loc>
        <changefreq>daily</changefreq>
        <priority>0.90</priority>
    </url>
    <url>
        <loc>${baseUrl}/#loans</loc>
        <changefreq>monthly</changefreq>
        <priority>0.70</priority>
    </url>
    <url>
        <loc>${baseUrl}/#locations</loc>
        <changefreq>monthly</changefreq>
        <priority>0.80</priority>
    </url>
    <url>
        <loc>${baseUrl}/#contact</loc>
        <changefreq>monthly</changefreq>
        <priority>0.90</priority>
    </url>
</urlset>`;
        
        res.type('application/xml');
        res.send(sitemap);
    }
});

// Favicon (serves a simple SVG if file doesn't exist)
app.get('/favicon.ico', (req, res) => {
    const filePath = path.join(frontendPath, 'favicon.ico');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        // Return a simple SVG favicon
        res.type('image/svg+xml');
        res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="20" fill="#003d4d"/>
            <text x="50" y="65" text-anchor="middle" font-size="50" fill="#e6a434" font-family="Arial">BK</text>
        </svg>`);
    }
});

// ============= MONGODB CONNECTION =============
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set - using in-memory storage');
} else {
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
}

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
    images: { type: [String], default: [] },
    mainImage: { type: String, default: '' },
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
        images: [
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
            'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
        ],
        mainImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
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
        images: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
        ],
        mainImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
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

// ============= API ROUTES =============

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        database: mongoose.connection.readyState === 1 ? 'MongoDB' : 'in-memory',
        propertiesCount: properties.length,
        leadsCount: leads.length,
        uptime: process.uptime()
    });
});

// Properties
app.get('/api/properties', async (req, res) => {
    try {
        const { location, type, minPrice, maxPrice } = req.query;
        
        if (Property && mongoose.connection.readyState === 1) {
            let filter = {};
            if (location) filter.location = location;
            if (type) filter.type = type;
            if (minPrice || maxPrice) {
                filter.price = {};
                if (minPrice) filter.price.$gte = parseInt(minPrice);
                if (maxPrice) filter.price.$lte = parseInt(maxPrice);
            }
            const data = await Property.find(filter).sort({ createdAt: -1 });
            return res.json(data);
        }
        
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

// Leads
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

// Auth
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'bittu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'akash@1234';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username !== ADMIN_USERNAME) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const token = jwt.sign(
            { username: ADMIN_USERNAME, role: 'admin' },
            process.env.JWT_SECRET || 'fallbackSecret',
            { expiresIn: '24h' }
        );
        
        res.json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============= CATCH-ALL FOR SPA (MUST BE LAST) =============
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============= START SERVER =============
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log('🏠 Bittu Khari Real Estate Server');
    console.log('=================================');
    console.log(`✅ Server running on port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/properties`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`🤖 Sitemap: http://localhost:${PORT}/sitemap.xml`);
    console.log(`📄 Robots: http://localhost:${PORT}/robots.txt`);
    console.log('=================================');
    console.log('📝 Admin Login: bittu / akash@1234');
    console.log('=================================');
    
    if (mongoose.connection.readyState === 1) {
        console.log('💾 Database: MongoDB Connected ✅');
    } else {
        console.log('💾 Database: In-Memory (MongoDB not configured) ⚠️');
    }
    console.log('=================================');
});
