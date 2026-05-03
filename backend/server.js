require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import Database connection and Models
const connectDB = require('./config/db');
const Property = require('./models/Property');
const Lead = require('./models/Lead');

const app = express();

// ============= MONGODB CONNECTION =============
connectDB();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://real-estate-z4dr.onrender.com']
        : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend files
const frontendPath = path.join(__dirname, '../frontend');
console.log('Serving frontend from:', frontendPath);
app.use(express.static(frontendPath));
app.use('/admin', express.static(path.join(frontendPath, 'admin')));

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

// GET all properties
app.get('/api/properties', async (req, res) => {
    try {
        const { location, type, minPrice, maxPrice } = req.query;
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
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET single property
app.get('/api/properties/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        return res.json(property);
    } catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({ message: error.message });
    }
});

// POST create property
app.post('/api/properties', authMiddleware, async (req, res) => {
    try {
        console.log('📝 Received property data:', {
            title: req.body.title,
            mainImage: req.body.mainImage ? req.body.mainImage.substring(0, 50) + '...' : 'none',
            imagesCount: req.body.images?.length || 0
        });
        
        const property = new Property(req.body);
        await property.save();
        console.log('✅ Property saved to MongoDB');
        return res.status(201).json(property);
    } catch (error) {
        console.error('❌ Error creating property:', error);
        res.status(400).json({ message: error.message });
    }
});

// PUT update property
app.put('/api/properties/:id', authMiddleware, async (req, res) => {
    try {
        console.log('📝 Updating property:', req.params.id);
        const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!property) return res.status(404).json({ message: 'Property not found' });
        console.log('✅ Property updated in MongoDB');
        return res.json(property);
    } catch (error) {
        console.error('❌ Error updating property:', error);
        res.status(400).json({ message: error.message });
    }
});

// DELETE property
app.delete('/api/properties/:id', authMiddleware, async (req, res) => {
    try {
        const property = await Property.findByIdAndDelete(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        return res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error('Error deleting property:', error);
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
        
        const lead = new Lead({ name, phone, message });
        await lead.save();
        console.log('📞 Lead saved to MongoDB:', { name, phone });
        return res.status(201).json({ message: 'Lead submitted successfully' });
    } catch (error) {
        console.error('Error saving lead:', error);
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/leads', authMiddleware, async (req, res) => {
    try {
        const allLeads = await Lead.find().sort({ createdAt: -1 });
        return res.json(allLeads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/leads/:id', authMiddleware, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const lead = await Lead.findByIdAndUpdate(req.params.id, { status, notes }, { new: true });
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        return res.json(lead);
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(400).json({ message: error.message });
    }
});

// ============= AUTH ROUTES =============
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error('❌ CRITICAL: ADMIN_USERNAME or ADMIN_PASSWORD not set!');
}

let ADMIN_PASSWORD_HASH;
if (ADMIN_PASSWORD) {
    ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);
}

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check for plain text password in ENV
        if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server configuration error: Missing Environment Variables' });
        }
        
        // Compare directly with the ENV variable
        if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const token = jwt.sign(
            { username: process.env.ADMIN_USERNAME, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============= HEALTH CHECK =============
app.get('/api/health', async (req, res) => {
    let dbStatus = 'disconnected';
    let dbResponding = false;
    
    if (mongoose.connection.readyState === 1) {
        dbStatus = 'connected';
        try {
            await mongoose.connection.db.admin().ping();
            dbResponding = true;
        } catch(e) {
            dbResponding = false;
        }
    }
    
    try {
        const propertiesCount = await Property.countDocuments();
        const leadsCount = await Lead.countDocuments();
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            mongodb: dbStatus,
            databaseResponding: dbResponding,
            storage: 'MongoDB',
            propertiesCount,
            leadsCount,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            mongodb: dbStatus,
            databaseResponding: dbResponding,
            error: 'Could not fetch counts'
        });
    }
});

// ============= ROBOTS.TXT & SITEMAP =============
app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
`;
    res.type('text/plain');
    res.send(robotsTxt);
});

app.get('/sitemap.xml', async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    let propertiesList = [];
    try {
        propertiesList = await Property.find().select('_id updatedAt');
    } catch (error) {
        console.error('Sitemap DB Error:', error);
    }
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    const pages = ['', 'about', 'properties', 'contact'];
    pages.forEach(page => {
        sitemap += `
  <url>
    <loc>${baseUrl}/${page}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });
    
    propertiesList.forEach(property => {
        sitemap += `
  <url>
    <loc>${baseUrl}/property/${property._id}</loc>
    <lastmod>${property.updatedAt ? property.updatedAt.toISOString().split('T')[0] : currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    });
    
    sitemap += `
</urlset>`;
    
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
});

// Export data endpoint (Adapted to pull directly from MongoDB)
app.get('/api/export-data', async (req, res) => {
    try {
        const properties = await Property.find();
        const leads = await Lead.find();
        res.json({
            properties,
            leads,
            exportedAt: new Date().toISOString()
        });
    } catch(error) {
         res.status(500).json({ message: 'Error exporting data' });
    }
});

// Catch-all route for frontend (must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============= ERROR HANDLING MIDDLEWARE =============
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============= START SERVER =============
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log('🏠 Bittu Khari Real Estate Server');
    console.log('=================================');
    console.log(`✅ Server running on: http://localhost:${PORT}`);
    console.log(`📊 Properties API: http://localhost:${PORT}/api/properties`);
    console.log(`📞 Leads API: http://localhost:${PORT}/api/leads`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth/login`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`💾 Export: http://localhost:${PORT}/api/export-data`);
    console.log('=================================');
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (mongoose.connection.readyState === 1) {
        console.log('💾 Using MongoDB Database ✅');
    }
    
    if (ADMIN_USERNAME && ADMIN_PASSWORD) {
        console.log('✅ Admin credentials configured');
    }
    console.log('=================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        if (mongoose.connection.readyState === 1) {
            mongoose.connection.close(false, () => {
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });
});
