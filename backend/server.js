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

const app = express();
let dbConnection = false;

// ============= JSON FILE STORAGE (FALLBACK) =============
const dataPath = path.join(__dirname, 'data.json');

// Load data from file
function loadData() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            const parsed = JSON.parse(data);
            return { 
                properties: parsed.properties || [], 
                leads: parsed.leads || [] 
            };
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    return { properties: [], leads: [] };
}

// Save data to file
function saveData(properties, leads) {
    try {
        const data = { properties, leads, lastUpdated: new Date().toISOString() };
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log('💾 Data saved to JSON file');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Load initial data
let savedData = loadData();
let properties = savedData.properties;
let leads = savedData.leads;

// If no properties exist, add default sample data
if (properties.length === 0) {
    properties = [
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
            images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'],
            mainImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500',
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
            images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'],
            mainImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500',
            createdAt: new Date().toISOString()
        }
    ];
    saveData(properties, leads);
}

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
        ? ['https://yourdomain.com', 'https://www.yourdomain.com']
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

// ============= MONGODB CONNECTION =============
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables!');
    console.log('⚠️  Using JSON file storage mode');
} else {
    if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
        console.error('❌ Invalid MONGODB_URI format');
        console.log('⚠️  Using JSON file storage mode');
    } else {
        mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })
        .then(() => {
            console.log('✅ MongoDB Connected Successfully!');
            console.log('📊 Database:', mongoose.connection.name);
            dbConnection = true;
        })
        .catch(err => {
            console.error('❌ MongoDB Connection Error:', err.message);
            console.log('⚠️  Falling back to JSON file storage');
            dbConnection = false;
        });
    }
}

// ============= SCHEMAS =============
const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true, enum: ['Ghaziabad', 'Dadri', 'Loni', 'Hapur', 'Delhi'] },
    type: { type: String, required: true, enum: ['GDA Flat', 'Builder Flat','Plot','House'] },
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

// Helper function to save JSON data
function persistData() {
    if (!dbConnection) {
        saveData(properties, leads);
    }
}

// ============= PROPERTY ROUTES =============

// GET all properties
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
        console.error('Error fetching properties:', error);
        res.status(500).json({ message: error.message });
    }
});

// GET single property
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
        
        if (Property && mongoose.connection.readyState === 1) {
            const property = new Property(req.body);
            await property.save();
            console.log('✅ Property saved to MongoDB');
            return res.status(201).json(property);
        }
        
        const newProperty = {
            _id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        properties.push(newProperty);
        persistData(); // Save to JSON file
        console.log('💾 Property saved to JSON file');
        res.status(201).json(newProperty);
    } catch (error) {
        console.error('❌ Error creating property:', error);
        res.status(400).json({ message: error.message });
    }
});

// PUT update property
app.put('/api/properties/:id', authMiddleware, async (req, res) => {
    try {
        console.log('📝 Updating property:', req.params.id);
        
        if (Property && mongoose.connection.readyState === 1) {
            const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!property) return res.status(404).json({ message: 'Property not found' });
            console.log('✅ Property updated in MongoDB');
            return res.json(property);
        }
        
        const index = properties.findIndex(p => p._id === req.params.id);
        if (index === -1) return res.status(404).json({ message: 'Property not found' });
        properties[index] = { ...properties[index], ...req.body };
        persistData(); // Save to JSON file
        console.log('💾 Property updated in JSON file');
        res.json(properties[index]);
    } catch (error) {
        console.error('❌ Error updating property:', error);
        res.status(400).json({ message: error.message });
    }
});

// DELETE property
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
        persistData(); // Save to JSON file
        res.json({ message: 'Property deleted successfully' });
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
        persistData(); // Save to JSON file
        console.log('📞 Lead saved to JSON file:', { name, phone });
        res.status(201).json({ message: 'Lead submitted successfully' });
    } catch (error) {
        console.error('Error saving lead:', error);
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
        console.error('Error fetching leads:', error);
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
        persistData(); // Save to JSON file
        res.json(leads[index]);
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
        
        if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
            return res.status(500).json({ message: 'Server configuration error' });
        }
        
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
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: dbStatus,
        databaseResponding: dbResponding,
        storage: dbResponding ? 'MongoDB' : (fs.existsSync(dataPath) ? 'JSON File' : 'In-Memory'),
        propertiesCount: properties.length,
        leadsCount: leads.length,
        environment: process.env.NODE_ENV || 'development'
    });
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
    if (Property && mongoose.connection.readyState === 1) {
        propertiesList = await Property.find().select('_id updatedAt');
    } else {
        propertiesList = properties;
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
    <lastmod>property.updatedAt ? property.updatedAt.toISOString().split('T')[0] : currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    });
    
    sitemap += `
</urlset>`;
    
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
});

// Export data endpoint (for backup)
app.get('/api/export-data', (req, res) => {
    res.json({
        properties: properties,
        leads: leads,
        exportedAt: new Date().toISOString()
    });
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
    } else if (fs.existsSync(dataPath)) {
        console.log('💾 Using JSON File Storage ✅ (Data persists across restarts!)');
    } else {
        console.log('💾 Using In-Memory Database ⚠️');
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
