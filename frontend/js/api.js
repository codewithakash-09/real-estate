// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Fetch all properties with filters
async function fetchProperties(filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.type) queryParams.append('type', filters.type);
        if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
        if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
        if (filters.status) queryParams.append('status', filters.status);
        
        const response = await fetch(`${API_BASE_URL}/properties?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch properties');
        return await response.json();
    } catch (error) {
        console.error('Error fetching properties:', error);
        return [];
    }
}

// Fetch single property
async function fetchProperty(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`);
        if (!response.ok) throw new Error('Property not found');
        return await response.json();
    } catch (error) {
        console.error('Error fetching property:', error);
        return null;
    }
}

// Submit lead
async function submitLead(leadData) {
    try {
        const response = await fetch(`${API_BASE_URL}/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit lead');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error submitting lead:', error);
        throw error;
    }
}
