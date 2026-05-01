// Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Load properties
    loadProperties();
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
    
    // Close mobile menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.15)';
            navbar.style.padding = '0.8rem 0';
        } else {
            navbar.style.boxShadow = '0 2px 15px rgba(0,0,0,0.1)';
            navbar.style.padding = '1rem 0';
        }
    });
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
            
            const formData = {
                name: contactForm.name.value,
                phone: contactForm.phone.value,
                message: contactForm.message.value
            };
            
            try {
                const response = await submitLead(formData);
                
                // Show success message
                const successDiv = document.createElement('div');
                successDiv.className = 'success-message';
                successDiv.textContent = 'Thank you! We will contact you shortly.';
                successDiv.style.display = 'block';
                contactForm.appendChild(successDiv);
                
                // Reset form
                contactForm.reset();
                
                // Remove success message after 5 seconds
                setTimeout(() => {
                    successDiv.remove();
                }, 5000);
            } catch (error) {
                alert('Failed to submit form. Please try calling us directly at 9899130707');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Load and display properties
async function loadProperties() {
    const propertyGrid = document.getElementById('propertyGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!propertyGrid) return;
    
    try {
        loadingSpinner.style.display = 'block';
        const properties = await fetchProperties();
        
        if (properties.length === 0) {
            // Show sample properties if API is not connected
            displaySampleProperties(propertyGrid);
        } else {
            displayProperties(properties, propertyGrid);
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        // Show sample properties as fallback
        displaySampleProperties(propertyGrid);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Display properties from API
function displayProperties(properties, container) {
    container.innerHTML = '';
    
    properties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
}

// Create property card
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    const imageUrl = property.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%23003d4d" width="400" height="250"/%3E%3Ctext fill="white" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EProperty Image%3C/text%3E%3C/svg%3E';
    
    card.innerHTML = `
        <div class="property-image">
            <img src="${imageUrl}" alt="${property.title}" loading="lazy">
            <span class="property-type">${property.type}</span>
        </div>
        <div class="property-details">
            <h3>${property.title}</h3>
            <div class="property-price">₹${formatPrice(property.price)}</div>
            <div class="property-location">📍 ${property.location}</div>
            <div class="property-features">
                <span class="feature">🛏️ ${property.bedrooms} Beds</span>
                <span class="feature">🚿 ${property.bathrooms} Baths</span>
                <span class="feature">📐 ${property.area} sq.ft</span>
            </div>
            <p>${property.description?.substring(0, 100)}...</p>
            <div class="property-actions">
                <a href="tel:9899130707" class="btn btn-call">📞 Call</a>
                <a href="https://wa.me/919899130707?text=Hi%2C%20I'm%20interested%20in%20${encodeURIComponent(property.title)}%20in%20${property.location}" 
                   class="btn btn-success" target="_blank">💬 WhatsApp</a>
            </div>
        </div>
    `;
    
    return card;
}

// Format price to Indian format
function formatPrice(price) {
    return price.toLocaleString('en-IN');
}

// Property filters
function filterProperties() {
    const location = document.getElementById('locationFilter').value;
    const type = document.getElementById('typeFilter').value;
    const priceRange = document.getElementById('priceFilter').value;
    
    const filters = {};
    if (location) filters.location = location;
    if (type) filters.type = type;
    
    if (priceRange) {
        const [min, max] = priceRange.split('-');
        filters.minPrice = min;
        filters.maxPrice = max;
    }
    
    applyFilters(filters);
}

// Apply filters and reload properties
async function applyFilters(filters) {
    const propertyGrid = document.getElementById('propertyGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    try {
        loadingSpinner.style.display = 'block';
        const properties = await fetchProperties(filters);
        displayProperties(properties, propertyGrid);
    } catch (error) {
        console.error('Error filtering properties:', error);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Display sample properties (fallback when API is not connected)
function displaySampleProperties(container) {
    const sampleProperties = [
        {
            title: '2BHK GDA Flat in Vaishali',
            price: 3500000,
            location: 'Ghaziabad',
            type: 'GDA Flat',
            bedrooms: 2,
            bathrooms: 2,
            area: 850,
            description: 'Beautiful GDA flat in prime location of Vaishali, near metro station'
        },
        {
            title: '3BHK Builder Apartment Indirapuram',
            price: 7500000,
            location: 'Ghaziabad',
            type: 'Builder Flat',
            bedrooms: 3,
            bathrooms: 3,
            area: 1450,
            description: 'Luxurious builder apartment in Indirapuram with modern amenities'
        },
        {
            title: '1BHK GDA Flat Raj Nagar',
            price: 1800000,
            location: 'Ghaziabad',
            type: 'GDA Flat',
            bedrooms: 1,
            bathrooms: 1,
            area: 500,
            description: 'Affordable GDA flat in Raj Nagar Extension, perfect for small families'
        },
        {
            title: '2BHK Builder Floor in Dadri',
            price: 2500000,
            location: 'Dadri',
            type: 'Builder Flat',
            bedrooms: 2,
            bathrooms: 2,
            area: 900,
            description: 'Well-maintained builder floor near Greater Noida, good connectivity'
        },
        {
            title: '3BHK Independent House Loni',
            price: 4500000,
            location: 'Loni',
            type: 'Builder Flat',
            bedrooms: 3,
            bathrooms: 3,
            area: 1800,
            description: 'Spacious independent house with parking and garden area'
        },
        {
            title: '2BHK GDA Flat Hapur',
            price: 1500000,
            location: 'Hapur',
            type: 'GDA Flat',
            bedrooms: 2,
            bathrooms: 2,
            area: 750,
            description: 'Budget-friendly GDA flat on NH-24, perfect for investment'
        }
    ];
    
    container.innerHTML = '';
    sampleProperties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
}
