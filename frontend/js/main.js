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

// Update createPropertyCard function
// Update createPropertyCard function - FIXED for external URLs
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    // Get images array - FIXED to handle different formats
    let images = [];
    
    // Check if property has images array
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        images = property.images;
    } 
    // Check if property has mainImage
    else if (property.mainImage && property.mainImage !== '') {
        images = [property.mainImage];
    }
    // Check if property has single image field
    else if (property.image && property.image !== '') {
        images = [property.image];
    }
    // Fallback placeholder
    else {
        images = ['https://via.placeholder.com/800x600?text=Property+Image'];
    }
    
    // Filter out any empty or invalid URLs
    images = images.filter(img => img && img.trim() !== '');
    
    if (images.length === 0) {
        images = ['https://via.placeholder.com/800x600?text=Property+Image'];
    }
    
    let currentImageIndex = 0;
    
    card.innerHTML = `
        <div class="property-image" style="position: relative; overflow: hidden; height: 250px;">
            <img src="${images[0]}" alt="${property.title}" class="property-img" loading="lazy" style="width: 100%; height: 250px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/800x600?text=Image+Not+Found'">
            ${images.length > 1 ? `
                <button class="image-nav-btn prev-btn" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 50%; font-size: 16px; z-index: 10;">❮</button>
                <button class="image-nav-btn next-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 50%; font-size: 16px; z-index: 10;">❯</button>
                <div class="image-counter" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; z-index: 10;">1/${images.length}</div>
            ` : ''}
            <span class="property-type" style="position: absolute; top: 15px; right: 15px; background: var(--primary); color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; z-index: 10;">${property.type}</span>
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
            <p>${property.description?.substring(0, 100)}${property.description?.length > 100 ? '...' : ''}</p>
            <div class="property-actions">
                <a href="tel:9899130707" class="btn btn-call">📞 Call</a>
                <a href="https://wa.me/919899130707?text=Hi%2C%20I'm%20interested%20in%20${encodeURIComponent(property.title)}%20in%20${property.location}" 
                   class="btn btn-success" target="_blank">💬 WhatsApp</a>
            </div>
        </div>
    `;
    
    // Add image navigation functionality
    if (images.length > 1) {
        const imgElement = card.querySelector('.property-img');
        const prevBtn = card.querySelector('.prev-btn');
        const nextBtn = card.querySelector('.next-btn');
        const counter = card.querySelector('.image-counter');
        
        const updateImage = (direction) => {
            if (direction === 'next') {
                currentImageIndex = (currentImageIndex + 1) % images.length;
            } else {
                currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            }
            imgElement.src = images[currentImageIndex];
            if (counter) {
                counter.textContent = `${currentImageIndex + 1}/${images.length}`;
            }
        };
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateImage('prev');
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                updateImage('next');
            });
        }
    }
    
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
