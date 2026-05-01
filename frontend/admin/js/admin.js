const API_BASE_URL = 'http://localhost:5000/api';
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
    document.querySelectorAll('.content-section').forEach(s => {
        s.style.display = 'none';
    });
    
    document.querySelectorAll('.sidebar-menu a').forEach(a => {
        a.classList.remove('active');
    });
    
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
            document.getElementById('addPropertySection').style.display = 'block';
            document.getElementById('formTitle').textContent = 'Add New Property';
            document.getElementById('propertyForm').reset();
            document.getElementById('propertyId').value = '';
            break;
    }
    
    event.target.classList.add('active');
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

// Edit property
async function editProperty(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`);
        const property = await response.json();
        
        document.getElementById('propertyId').value = property._id;
        document.getElementById('title').value = property.title;
        document.getElementById('price').value = property.price;
        document.getElementById('location').value = property.location;
        document.getElementById('type').value = property.type;
        document.getElementById('bedrooms').value = property.bedrooms;
        document.getElementById('bathrooms').value = property.bathrooms;
        document.getElementById('area').value = property.area;
        document.getElementById('description').value = property.description;
        document.getElementById('status').value = property.status;
        
        document.getElementById('formTitle').textContent = 'Edit Property';
        document.getElementById('submitBtn').textContent = 'Update Property';
        
        showSection('addProperty');
    } catch (error) {
        console.error('Error loading property:', error);
        alert('Failed to load property details');
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

// Property form submission
document.getElementById('propertyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const propertyId = document.getElementById('propertyId').value;
    const formData = {
        title: document.getElementById('title').value,
        price: parseInt(document.getElementById('price').value),
        location: document.getElementById('location').value,
        type: document.getElementById('type').value,
        bedrooms: parseInt(document.getElementById('bedrooms').value),
        bathrooms: parseInt(document.getElementById('bathrooms').value),
        area: parseInt(document.getElementById('area').value),
        description: document.getElementById('description').value,
        status: document.getElementById('status').value
    };
    
    try {
        const url = propertyId 
            ? `${API_BASE_URL}/properties/${propertyId}`
            : `${API_BASE_URL}/properties`;
        
        const method = propertyId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert(propertyId ? 'Property updated successfully' : 'Property added successfully');
            showSection('properties');
            loadProperties();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to save property');
        }
    } catch (error) {
        console.error('Error saving property:', error);
        alert('Error saving property');
    }
});
