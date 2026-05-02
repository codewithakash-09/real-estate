// Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Load properties
    loadProperties();
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu on link click
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.15)';
                navbar.style.padding = '0.8rem 0';
            } else {
                navbar.style.boxShadow = '0 2px 15px rgba(0,0,0,0.1)';
                navbar.style.padding = '1rem 0';
            }
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
    
    // Global event delegation for image navigation buttons - FIXED
    setupGlobalImageNavigation();
});

// Global event delegation function - THIS FIXES THE ISSUE
function setupGlobalImageNavigation() {
    // Use event delegation on the entire document
    document.addEventListener('click', function(e) {
        // Handle previous button clicks
        if (e.target.classList && e.target.classList.contains('prev-btn')) {
            e.stopPropagation();
            e.preventDefault();
            
            const propertyCard = e.target.closest('.property-card');
            if (propertyCard) {
                // Get or initialize the current image index
                let currentIndex = parseInt(propertyCard.getAttribute('data-current-image') || '0');
                const totalImages = parseInt(propertyCard.getAttribute('data-total-images') || '0');
                const imagesJson = propertyCard.getAttribute('data-images');
                
                if (imagesJson && totalImages > 0) {
                    const images = JSON.parse(imagesJson);
                    currentIndex = (currentIndex - 1 + totalImages) % totalImages;
                    
                    // Update the image
                    const imgElement = propertyCard.querySelector('.property-img');
                    const counter = propertyCard.querySelector('.image-counter');
                    
                    if (imgElement) {
                        imgElement.src = images[currentIndex];
                    }
                    if (counter) {
                        counter.textContent = `${currentIndex + 1}/${totalImages}`;
                    }
                    
                    // Store the new current index
                    propertyCard.setAttribute('data-current-image', currentIndex);
                }
            }
        }
        
        // Handle next button clicks
        if (e.target.classList && e.target.classList.contains('next-btn')) {
            e.stopPropagation();
            e.preventDefault();
            
            const propertyCard = e.target.closest('.property-card');
            if (propertyCard) {
                // Get or initialize the current image index
                let currentIndex = parseInt(propertyCard.getAttribute('data-current-image') || '0');
                const totalImages = parseInt(propertyCard.getAttribute('data-total-images') || '0');
                const imagesJson = propertyCard.getAttribute('data-images');
                
                if (imagesJson && totalImages > 0) {
                    const images = JSON.parse(imagesJson);
                    currentIndex = (currentIndex + 1) % totalImages;
                    
                    // Update the image
                    const imgElement = propertyCard.querySelector('.property-img');
                    const counter = propertyCard.querySelector('.image-counter');
                    
                    if (imgElement) {
                        imgElement.src = images[currentIndex];
                    }
                    if (counter) {
                        counter.textContent = `${currentIndex + 1}/${totalImages}`;
                    }
                    
                    // Store the new current index
                    propertyCard.setAttribute('data-current-image', currentIndex);
                }
            }
        }
    });
}

// Load and display properties
async function loadProperties() {
    const propertyGrid = document.getElementById('propertyGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!propertyGrid) return;
    
    try {
        loadingSpinner.style.display = 'block';
        const properties = await fetchProperties();
        
        if (properties.length === 0) {
            displaySampleProperties(propertyGrid);
        } else {
            displayProperties(properties, propertyGrid);
        }
    } catch (error) {
        console.error('Error loading properties:', error);
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

// COMPLETELY FIXED createPropertyCard function with data attributes
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    // Get all images for gallery
    let allImages = [];
    
    // Check for images array first
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        allImages = property.images;
    } 
    // Check for mainImage
    else if (property.mainImage && property.mainImage.trim() !== '') {
        allImages = [property.mainImage];
    }
    // Check for old image field
    else if (property.image && property.image.trim() !== '') {
        allImages = [property.image];
    }
    // Fallback placeholder
    else {
        allImages = ['https://via.placeholder.com/800x600?text=Property+Image'];
    }
    
    // Filter out empty URLs
    allImages = allImages.filter(img => img && img.trim() !== '');
    
    if (allImages.length === 0) {
        allImages = ['https://via.placeholder.com/800x600?text=Property+Image'];
    }
    
    // Store images as JSON on the card for global navigation
    card.setAttribute('data-images', JSON.stringify(allImages));
    card.setAttribute('data-total-images', allImages.length);
    card.setAttribute('data-current-image', '0');
    
    // Get display image (first image)
    const displayImage = allImages[0];
    
    card.innerHTML = `
        <div class="property-image" style="position: relative; overflow: hidden; height: 250px; background: #f0f0f0;">
            <img src="${displayImage}" 
                 alt="${property.title}" 
                 class="property-img" 
                 loading="lazy" 
                 style="width: 100%; height: 250px; object-fit: cover;" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/800x600?text=Image+Load+Failed'; this.style.objectFit='contain';">
            ${allImages.length > 1 ? `
                <button class="image-nav-btn prev-btn" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.7); color: white; border: none; padding: 10px 14px; cursor: pointer; border-radius: 50%; font-size: 18px; z-index: 10; transition: all 0.3s ease;">❮</button>
                <button class="image-nav-btn next-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.7); color: white; border: none; padding: 10px 14px; cursor: pointer; border-radius: 50%; font-size: 18px; z-index: 10; transition: all 0.3s ease;">❯</button>
                <div class="image-counter" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; z-index: 10; font-weight: 500;">1/${allImages.length}</div>
            ` : ''}
            <span class="property-type" style="position: absolute; top: 15px; right: 15px; background: var(--primary); color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; z-index: 10;">${property.type}</span>
        </div>
        <div class="property-details">
            <h3>${escapeHtml(property.title)}</h3>
            <div class="property-price">₹${formatPrice(property.price)}</div>
            <div class="property-location">📍 ${escapeHtml(property.location)}</div>
            <div class="property-features">
                <span class="feature">🛏️ ${property.bedrooms} Beds</span>
                <span class="feature">🚿 ${property.bathrooms} Baths</span>
                <span class="feature">📐 ${property.area} sq.ft</span>
            </div>
            <p>${escapeHtml(property.description?.substring(0, 100))}${property.description?.length > 100 ? '...' : ''}</p>
            <div class="property-actions">
                <a href="tel:9899130707" class="btn btn-call">📞 Call</a>
                <a href="https://wa.me/919899130707?text=Hi%2C%20I'm%20interested%20in%20${encodeURIComponent(property.title)}%20in%20${property.location}" 
                   class="btn btn-success" target="_blank">💬 WhatsApp</a>
            </div>
        </div>
    `;
    
    return card;
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format price to Indian format
function formatPrice(price) {
    return price.toLocaleString('en-IN');
}

// Property filters
function filterProperties() {
    const location = document.getElementById('locationFilter')?.value || '';
    const type = document.getElementById('typeFilter')?.value || '';
    const priceRange = document.getElementById('priceFilter')?.value || '';
    
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
    
    if (!propertyGrid) return;
    
    try {
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        const properties = await fetchProperties(filters);
        displayProperties(properties, propertyGrid);
    } catch (error) {
        console.error('Error filtering properties:', error);
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

// Display sample properties (fallback when API is not connected)
function displaySampleProperties(container) {
    const sampleProperties = [
        {
            _id: "sample1",
            title: '2BHK GDA Flat in Vaishali',
            price: 3500000,
            location: 'Ghaziabad',
            type: 'GDA Flat',
            bedrooms: 2,
            bathrooms: 2,
            area: 850,
            description: 'Beautiful GDA flat in prime location of Vaishali, near metro station',
            images: ['https://via.placeholder.com/800x600?text=Image+1'],
            mainImage: 'https://via.placeholder.com/800x600?text=Main+Image'
        },
        {
            _id: "sample2",
            title: '3BHK Builder Apartment Indirapuram',
            price: 7500000,
            location: 'Ghaziabad',
            type: 'Builder Flat',
            bedrooms: 3,
            bathrooms: 3,
            area: 1450,
            description: 'Luxurious builder apartment in Indirapuram with modern amenities',
            images: ['https://via.placeholder.com/800x600?text=Image+1'],
            mainImage: 'https://via.placeholder.com/800x600?text=Main+Image'
        },
        {
            _id: "sample3",
            title: '1BHK GDA Flat Raj Nagar',
            price: 1800000,
            location: 'Ghaziabad',
            type: 'GDA Flat',
            bedrooms: 1,
            bathrooms: 1,
            area: 500,
            description: 'Affordable GDA flat in Raj Nagar Extension, perfect for small families',
            images: ['https://via.placeholder.com/800x600?text=Image+1'],
            mainImage: 'https://via.placeholder.com/800x600?text=Main+Image'
        },
        {
            _id: "sample4",
            title: '2BHK Builder Floor in Dadri',
            price: 2500000,
            location: 'Dadri',
            type: 'Builder Flat',
            bedrooms: 2,
            bathrooms: 2,
            area: 900,
            description: 'Well-maintained builder floor near Greater Noida, good connectivity',
            images: ['https://via.placeholder.com/800x600?text=Image+1'],
            mainImage: 'https://via.placeholder.com/800x600?text=Main+Image'
        },
        {
            _id: "sample5",
            title: '3BHK Independent House Loni',
            price: 4500000,
            location: 'Loni',
            type: 'Builder Flat',
            bedrooms: 3,
            bathrooms: 3,
            area: 1800,
            description: 'Spacious independent house with parking and garden area',
            images: ['https://via.placeholder.com/800x600?text=Image+1'],
            mainImage: 'https://via.placeholder.com/800x600?text=Main+Image'
        },
        {
            _id: "sample6",
            title: '2BHK GDA Flat Hapur',
            price: 1500000,
            location: 'Hapur',
            type: 'GDA Flat',
            bedrooms: 2,
            bathrooms: 2,
            area: 750,
            description: 'Budget-friendly GDA flat on NH-24, perfect for investment',
            images: ['https://via.placeholder.com/800x600?text=Image+1'],
            mainImage: 'https://via.placeholder.com/800x600?text=Main+Image'
        }
    ];
    
    container.innerHTML = '';
    sampleProperties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
}
