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
    
    // Setup image navigation
    setupGlobalImageNavigation();
});

// Global image navigation setup
function setupGlobalImageNavigation() {
    document.addEventListener('click', function(e) {
        // Handle previous button
        if (e.target.classList && e.target.classList.contains('prev-btn')) {
            e.stopPropagation();
            e.preventDefault();
            const card = e.target.closest('.property-card');
            if (card) {
                changeImage(card, -1);
            }
        }
        
        // Handle next button
        if (e.target.classList && e.target.classList.contains('next-btn')) {
            e.stopPropagation();
            e.preventDefault();
            const card = e.target.closest('.property-card');
            if (card) {
                changeImage(card, 1);
            }
        }
    });
}

// Function to change image
function changeImage(card, direction) {
    const images = JSON.parse(card.getAttribute('data-images') || '[]');
    let currentIndex = parseInt(card.getAttribute('data-current-index') || '0');
    const totalImages = images.length;
    
    if (totalImages === 0) return;
    
    // Calculate new index
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = totalImages - 1;
    if (newIndex >= totalImages) newIndex = 0;
    
    // Update the main image
    const imgElement = card.querySelector('.property-img');
    if (imgElement) {
        imgElement.src = images[newIndex];
    }
    
    // Update counter
    const counter = card.querySelector('.image-counter');
    if (counter) {
        counter.textContent = `${newIndex + 1}/${totalImages}`;
    }
    
    // Update dots
    const dots = card.querySelectorAll('.dot');
    if (dots.length > 0) {
        dots.forEach((dot, idx) => {
            if (idx === newIndex) {
                dot.style.background = 'white';
                dot.classList.add('active');
            } else {
                dot.style.background = 'rgba(255,255,255,0.5)';
                dot.classList.remove('active');
            }
        });
    }
    
    // Update thumbnails
    const thumbnails = card.querySelectorAll('.thumbnail');
    if (thumbnails.length > 0) {
        thumbnails.forEach((thumb, idx) => {
            if (idx === newIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }
    
    // Save new index
    card.setAttribute('data-current-index', newIndex);
}

// Load and display properties
async function loadProperties() {
    const propertyGrid = document.getElementById('propertyGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (!propertyGrid) return;
    
    try {
        if (loadingSpinner) loadingSpinner.style.display = 'block';
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
    } else if (property.image && property.image.trim() !== '') {
        allImages = [property.image];
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
            <div class="image-dots" style="position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 10;">
                ${allImages.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" style="width: 8px; height: 8px; border-radius: 50%; background: ${idx === 0 ? 'white' : 'rgba(255,255,255,0.5)'}; cursor: pointer; transition: all 0.3s ease;"></span>`).join('')}
            </div>
        `;
    }
    
    // Create thumbnails HTML
    let thumbnailsHtml = '';
    if (hasMultipleImages) {
        thumbnailsHtml = `
            <div class="image-thumbnails" style="display: flex; gap: 8px; padding: 10px; background: rgba(0,0,0,0.05); overflow-x: auto;">
                ${allImages.map((img, idx) => `
                    <div class="thumbnail ${idx === 0 ? 'active' : ''}" data-index="${idx}" style="width: 60px; height: 60px; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid ${idx === 0 ? '#4da6ff' : 'transparent'}; flex-shrink: 0;">
                        <img src="${img}" alt="Thumbnail" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="property-image" style="position: relative; overflow: hidden; height: 280px; background: #f0f0f0;">
            <img src="${displayImage}" 
                 alt="${property.title}" 
                 class="property-img" 
                 loading="lazy" 
                 style="width: 100%; height: 280px; object-fit: cover;" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/800x600?text=Image+Load+Failed'; this.style.objectFit='contain';">
            
            ${hasMultipleImages ? `
                <button class="image-nav-btn prev-btn" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; padding: 10px 14px; cursor: pointer; border-radius: 50%; font-size: 18px; z-index: 10; transition: all 0.3s ease;">❮</button>
                <button class="image-nav-btn next-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: white; border: none; padding: 10px 14px; cursor: pointer; border-radius: 50%; font-size: 18px; z-index: 10; transition: all 0.3s ease;">❯</button>
                <div class="image-counter" style="position: absolute; bottom: 15px; right: 15px; background: rgba(0,0,0,0.7); color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; z-index: 10; font-weight: 500;">1/${allImages.length}</div>
                ${dotsHtml}
            ` : ''}
            
            <span class="property-type" style="position: absolute; top: 15px; right: 15px; background: var(--primary); color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; z-index: 10;">${property.type}</span>
        </div>
        ${thumbnailsHtml}
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
    
    // Add click handlers for thumbnails
    if (hasMultipleImages) {
        const thumbnails = card.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, idx) => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                const images = JSON.parse(card.getAttribute('data-images'));
                const imgElement = card.querySelector('.property-img');
                const counter = card.querySelector('.image-counter');
                const dots = card.querySelectorAll('.dot');
                const allThumbnails = card.querySelectorAll('.thumbnail');
                
                // Update image
                imgElement.src = images[idx];
                
                // Update counter
                if (counter) counter.textContent = `${idx + 1}/${images.length}`;
                
                // Update dots
                dots.forEach((dot, i) => {
                    if (i === idx) {
                        dot.style.background = 'white';
                        dot.classList.add('active');
                    } else {
                        dot.style.background = 'rgba(255,255,255,0.5)';
                        dot.classList.remove('active');
                    }
                });
                
                // Update thumbnails
                allThumbnails.forEach((thumbEl, i) => {
                    if (i === idx) {
                        thumbEl.classList.add('active');
                        thumbEl.style.borderColor = '#4da6ff';
                    } else {
                        thumbEl.classList.remove('active');
                        thumbEl.style.borderColor = 'transparent';
                    }
                });
                
                card.setAttribute('data-current-index', idx);
            });
        });
        
        // Add click handlers for dots
        const dots = card.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const images = JSON.parse(card.getAttribute('data-images'));
                const imgElement = card.querySelector('.property-img');
                const counter = card.querySelector('.image-counter');
                const allDots = card.querySelectorAll('.dot');
                const thumbnails = card.querySelectorAll('.thumbnail');
                
                // Update image
                imgElement.src = images[idx];
                
                // Update counter
                if (counter) counter.textContent = `${idx + 1}/${images.length}`;
                
                // Update dots
                allDots.forEach((dotEl, i) => {
                    if (i === idx) {
                        dotEl.style.background = 'white';
                        dotEl.classList.add('active');
                    } else {
                        dotEl.style.background = 'rgba(255,255,255,0.5)';
                        dotEl.classList.remove('active');
                    }
                });
                
                // Update thumbnails
                thumbnails.forEach((thumbEl, i) => {
                    if (i === idx) {
                        thumbEl.classList.add('active');
                        thumbEl.style.borderColor = '#4da6ff';
                    } else {
                        thumbEl.classList.remove('active');
                        thumbEl.style.borderColor = 'transparent';
                    }
                });
                
                card.setAttribute('data-current-index', idx);
            });
        });
    }
    
    return card;
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
            images: [
                'https://via.placeholder.com/800x600?text=Image+1',
                'https://via.placeholder.com/800x600?text=Image+2',
                'https://via.placeholder.com/800x600?text=Image+3'
            ],
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
            images: [
                'https://via.placeholder.com/800x600?text=Image+1',
                'https://via.placeholder.com/800x600?text=Image+2'
            ],
            mainImage: 'https://via.placeholder.com/800x600?text=Main+Image'
        }
    ];
    
    container.innerHTML = '';
    sampleProperties.forEach(property => {
        const card = createPropertyCard(property);
        container.appendChild(card);
    });
}
