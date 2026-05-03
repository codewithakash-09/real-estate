// Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Load properties from API
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
                
                const successDiv = document.createElement('div');
                successDiv.className = 'success-message';
                successDiv.textContent = 'Thank you! We will contact you shortly.';
                successDiv.style.display = 'block';
                contactForm.appendChild(successDiv);
                
                contactForm.reset();
                
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

// Load and display properties from API
async function loadProperties() {
    const propertyGrid = document.getElementById('propertyGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!propertyGrid) return;
    
    try {
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        
        // ALWAYS fetch from API first
        const properties = await fetchProperties();
        
        console.log('Properties loaded from API:', properties.length);
        
        if (properties && properties.length > 0) {
            displayProperties(properties, propertyGrid);
        } else {
            // Show message when no properties
            propertyGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                    <p>No properties available yet. Check back soon!</p>
                    <a href="tel:9899130707" class="btn btn-primary">Contact Us for Properties</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        propertyGrid.innerHTML = `
            <div style="text-align: center; padding: 3rem; grid-column: 1/-1;">
                <p>Unable to load properties. Please contact us directly.</p>
                <a href="tel:9899130707" class="btn btn-primary">Call Now</a>
            </div>
        `;
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

function displayProperties(properties, container) {
    container.innerHTML = '';
    properties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
}

// Create property card with working navigation buttons
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    
    // Get all images
    let allImages = [];
    
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        allImages = property.images;
    } else if (property.mainImage && property.mainImage.trim() !== '') {
        allImages = [property.mainImage];
    } else {
        allImages = ['https://via.placeholder.com/800x600?text=Property+Image'];
    }
    
    allImages = allImages.filter(img => img && img.trim() !== '');
    if (allImages.length === 0) {
        allImages = ['https://via.placeholder.com/800x600?text=Property+Image'];
    }
    
    // Store images data
    card.setAttribute('data-images', JSON.stringify(allImages));
    card.setAttribute('data-current-index', '0');
    card.setAttribute('data-total-images', allImages.length);
    
    const displayImage = allImages[0];
    const hasMultipleImages = allImages.length > 1;
    
    // Create dots HTML
    let dotsHtml = '';
    if (hasMultipleImages) {
        dotsHtml = `
            <div class="image-dots">
                ${allImages.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`).join('')}
            </div>
        `;
    }
    
    // Create thumbnails HTML
    let thumbnailsHtml = '';
    if (hasMultipleImages) {
        thumbnailsHtml = `
            <div class="image-thumbnails">
                ${allImages.map((img, idx) => `
                    <div class="thumbnail ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                        <img src="${img}" alt="Thumbnail">
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="property-image">
            <img src="${displayImage}" 
                 alt="${property.title}" 
                 class="property-img" 
                 loading="lazy" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/800x600?text=Image+Load+Failed'; this.style.objectFit='contain';">
            
            ${hasMultipleImages ? `
                <button class="image-nav-btn prev-btn">❮</button>
                <button class="image-nav-btn next-btn">❯</button>
                <div class="image-counter">1/${allImages.length}</div>
                ${dotsHtml}
            ` : ''}
            
            <span class="property-type">${property.type || 'Property'}</span>
        </div>
        ${thumbnailsHtml}
        <div class="property-details">
            <h3>${escapeHtml(property.title)}</h3>
            <div class="property-price">₹${formatPrice(property.price)}</div>
            <div class="property-location">📍 ${escapeHtml(property.location)}</div>
            <div class="property-features">
                <span class="feature">🛏️ ${property.bedrooms || 0} Beds</span>
                <span class="feature">🚿 ${property.bathrooms || 0} Baths</span>
                <span class="feature">📐 ${property.area || 0} sq.ft</span>
            </div>
            <p>${escapeHtml(property.description?.substring(0, 100))}${property.description?.length > 100 ? '...' : ''}</p>
            <div class="property-actions">
                <a href="tel:9899130707" class="btn btn-call">📞 Call</a>
                <a href="https://wa.me/919899130707?text=Hi%2C%20I'm%20interested%20in%20${encodeURIComponent(property.title)}%20in%20${property.location}" 
                   class="btn btn-success" target="_blank">💬 WhatsApp</a>
            </div>
        </div>
    `;
    
    // Add event listeners if multiple images
    if (hasMultipleImages) {
        const prevBtn = card.querySelector('.prev-btn');
        const nextBtn = card.querySelector('.next-btn');
        const thumbnails = card.querySelectorAll('.thumbnail');
        const dots = card.querySelectorAll('.dot');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                changeImage(card, -1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                changeImage(card, 1);
            });
        }
        
        thumbnails.forEach((thumb, idx) => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                goToImage(card, idx);
            });
        });
        
        dots.forEach((dot, idx) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                goToImage(card, idx);
            });
        });
    }
    
    return card;
}

// Function to change image (next/prev)
function changeImage(card, direction) {
    const images = JSON.parse(card.getAttribute('data-images'));
    let currentIndex = parseInt(card.getAttribute('data-current-index') || '0');
    const totalImages = images.length;
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = totalImages - 1;
    if (newIndex >= totalImages) newIndex = 0;
    
    updateCardImage(card, newIndex);
}

// Function to go to specific image
function goToImage(card, index) {
    updateCardImage(card, index);
}

// Update card image and UI
function updateCardImage(card, newIndex) {
    const images = JSON.parse(card.getAttribute('data-images'));
    const totalImages = images.length;
    
    // Update main image
    const imgElement = card.querySelector('.property-img');
    if (imgElement) {
        imgElement.style.opacity = '0.5';
        imgElement.src = images[newIndex];
        imgElement.onload = () => {
            imgElement.style.opacity = '1';
        };
    }
    
    // Update counter
    const counter = card.querySelector('.image-counter');
    if (counter) {
        counter.textContent = `${newIndex + 1}/${totalImages}`;
    }
    
    // Update dots
    const dots = card.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
        if (idx === newIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    // Update thumbnails
    const thumbnails = card.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, idx) => {
        if (idx === newIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
    
    // Save new index
    card.setAttribute('data-current-index', newIndex);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    return price.toLocaleString('en-IN');
}

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
