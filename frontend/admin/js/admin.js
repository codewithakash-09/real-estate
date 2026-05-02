const API_BASE_URL = '/api';
let authToken = localStorage.getItem('authToken');

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        showDashboard();
        loadProperties();
    }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showDashboard();
            loadProperties();
        } else {
            errorDiv.textContent = data.message || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
    }
});

// Show dashboard
function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'flex';
}

// Show section
function showSection(section) {
    console.log('Showing section:', section);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => {
        s.style.display = 'none';
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.sidebar-menu a').forEach(a => {
        a.classList.remove('active');
    });
    
    // Show selected section
    switch(section) {
        case 'properties':
            document.getElementById('propertiesSection').style.display = 'block';
            loadProperties();
            break;
        case 'leads':
            document.getElementById('leadsSection').style.display = 'block';
            loadLeads();
            break;
        case 'addProperty':
            // Only reset if we're not editing (propertyId is empty)
            const propertyId = document.getElementById('propertyId').value;
            if (!propertyId) {
                document.getElementById('formTitle').textContent = 'Add New Property';
                document.getElementById('propertyForm').reset();
                document.getElementById('submitBtn').textContent = 'Save Property';
                document.getElementById('propertyId').value = '';
                const previewContainer = document.getElementById('imagePreviewContainer');
                if (previewContainer) previewContainer.innerHTML = '';
            }
            document.getElementById('addPropertySection').style.display = 'block';
            break;
    }
    
    // Add active class to clicked menu item
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
}

// Load properties
async function loadProperties() {
    try {
        const response = await fetch(`${API_BASE_URL}/properties`);
        const properties = await response.json();
        
        const tbody = document.getElementById('propertiesTableBody');
        tbody.innerHTML = '';
        
        properties.forEach(property => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${property._id.substring(0, 8)}...</td>
                <td>${property.title}</td>
                <td>₹${property.price.toLocaleString('en-IN')}</td>
                <td>${property.location}</td>
                <td>${property.type}</td>
                <td><span class="status-badge status-${property.status.toLowerCase().replace(' ', '-')}">${property.status}</span></td>
                <td>
<button class="btn btn-sm btn-edit" onclick="editProperty('${property._id}')">Edit</button>
                    <button class="btn btn-sm btn-delete" onclick="deleteProperty('${property._id}')">Delete</button>
                 </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

// Load leads
async function loadLeads() {
    try {
        const response = await fetch(`${API_BASE_URL}/leads`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const leads = await response.json();
        
        const tbody = document.getElementById('leadsTableBody');
        tbody.innerHTML = '';
        
        leads.forEach(lead => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(lead.createdAt).toLocaleDateString()}</td>
                <td>${lead.name}</td>
                <td>${lead.phone}</td>
                <td>${lead.message.substring(0, 50)}...</td>
                <td><span class="status-badge status-${lead.status}">${lead.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-status" onclick="updateLeadStatus('${lead._id}', 'contacted')">Mark Contacted</button>
                 </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Update stats
        document.getElementById('totalLeads').textContent = leads.length;
        document.getElementById('pendingLeads').textContent = leads.filter(l => l.status === 'pending').length;
        document.getElementById('contactedLeads').textContent = leads.filter(l => l.status === 'contacted').length;
    } catch (error) {
        console.error('Error loading leads:', error);
    }
}

// Update lead status
async function updateLeadStatus(id, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            loadLeads();
        } else {
            alert('Failed to update lead status');
        }
    } catch (error) {
        console.error('Error updating lead:', error);
    }
}

// Delete property
async function deleteProperty(id) {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            alert('Property deleted successfully');
            loadProperties();
        } else {
            alert('Failed to delete property');
        }
    } catch (error) {
        console.error('Error deleting property:', error);
        alert('Error deleting property');
    }
}

// ============= IMAGE UPLOAD FUNCTIONS =============

async function uploadImages(files) {
    const uploadedUrls = [];
    
    for (let file of files) {
        if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} is too large. Max 5MB.`);
            continue;
        }
        
        if (!file.type.startsWith('image/')) {
            alert(`${file.name} is not an image.`);
            continue;
        }
        
        const imageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        
        uploadedUrls.push(imageUrl);
    }
    
    return uploadedUrls;
}

function createPreviewContainer() {
    let container = document.getElementById('imagePreviewContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'imagePreviewContainer';
        container.className = 'image-preview-grid';
        const formGroup = document.querySelector('#imageFiles').parentElement;
        formGroup.appendChild(container);
    }
    return container;
}

document.getElementById('imageFiles')?.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    const previewContainer = createPreviewContainer();
    
    previewContainer.innerHTML = '';
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview-item';
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index}">
                <button class="remove-image-btn" data-index="${index}">×</button>
            `;
            previewContainer.appendChild(previewDiv);
        };
        reader.readAsDataURL(file);
    });
});

// ============= PROPERTY FORM SUBMISSION =============
document.getElementById('propertyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const propertyId = document.getElementById('propertyId').value;
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    
    const imageFiles = document.getElementById('imageFiles')?.files;
    let uploadedImages = [];
    
    if (imageFiles && imageFiles.length > 0) {
        submitBtn.textContent = 'Uploading Images...';
        submitBtn.disabled = true;
        uploadedImages = await uploadImages(Array.from(imageFiles));
    }
    
    const imagesText = document.getElementById('images').value;
    const existingImages = imagesText ? imagesText.split(',').map(url => url.trim()).filter(url => url) : [];
    const allImages = [...existingImages, ...uploadedImages];
    const mainImage = document.getElementById('mainImage').value || (allImages[0] || '');
    
    const formData = {
        title: document.getElementById('title').value,
        price: parseInt(document.getElementById('price').value),
        location: document.getElementById('location').value,
        type: document.getElementById('type').value,
        bedrooms: parseInt(document.getElementById('bedrooms').value),
        bathrooms: parseInt(document.getElementById('bathrooms').value),
        area: parseInt(document.getElementById('area').value),
        description: document.getElementById('description').value,
        status: document.getElementById('status').value,
        mainImage: mainImage,
        images: allImages
    };
    
    if (!formData.title || !formData.price || !formData.location || !formData.type) {
        alert('Please fill in all required fields');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }
    
    try {
        const url = propertyId 
            ? `${API_BASE_URL}/properties/${propertyId}`
            : `${API_BASE_URL}/properties`;
        
        const method = propertyId ? 'PUT' : 'POST';
        
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert(propertyId ? 'Property updated successfully!' : 'Property added successfully!');
            showSection('properties');
            loadProperties();
            document.getElementById('propertyForm').reset();
            document.getElementById('propertyId').value = '';
            const previewContainer = document.getElementById('imagePreviewContainer');
            if (previewContainer) previewContainer.innerHTML = '';
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to save property');
        }
    } catch (error) {
        console.error('Error saving property:', error);
        alert('Error saving property. Please check your connection.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

/// ============= EDIT PROPERTY =============
async function editProperty(id) {
    console.log('Edit button clicked for property ID:', id);
    
    try {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch property');
        }
        
        const property = await response.json();
        console.log('Property loaded:', property);
        
        // Fill all form fields
        document.getElementById('propertyId').value = property._id;
        document.getElementById('title').value = property.title || '';
        document.getElementById('price').value = property.price || '';
        document.getElementById('location').value = property.location || '';
        document.getElementById('type').value = property.type || '';
        document.getElementById('bedrooms').value = property.bedrooms || '';
        document.getElementById('bathrooms').value = property.bathrooms || '';
        document.getElementById('area').value = property.area || '';
        document.getElementById('description').value = property.description || '';
        document.getElementById('status').value = property.status || 'Available';
        document.getElementById('mainImage').value = property.mainImage || '';
        document.getElementById('images').value = property.images ? property.images.join(', ') : '';
        
        // Clear file input and preview
        document.getElementById('imageFiles').value = '';
        const previewContainer = document.getElementById('imagePreviewContainer');
        if (previewContainer) previewContainer.innerHTML = '';
        
        // Change form title and button text
        document.getElementById('formTitle').textContent = 'Edit Property';
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) submitBtn.textContent = 'Update Property';
        
        // Hide all sections first
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show the add property section
        const addPropertySection = document.getElementById('addPropertySection');
        if (addPropertySection) {
            addPropertySection.style.display = 'block';
            console.log('Add property section displayed');
        } else {
            console.error('addPropertySection element not found');
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading property for edit:', error);
        alert('Failed to load property details. Please try again.');
    }
}
