// API Base URL
const API_BASE_URL = `${window.location.origin}/api`;

// DOM Elements
const totalEvents = document.getElementById('totalEvents');
const upcomingEvents = document.getElementById('upcomingEvents');
const totalBookings = document.getElementById('totalBookings');
const availableSeats = document.getElementById('availableSeats');
const eventsList = document.getElementById('eventsList');
const createEventForm = document.getElementById('createEventForm');
const editEventForm = document.getElementById('editEventForm');
const createEventFormPanel = document.getElementById('createEventFormPanel');
const editEventModal = document.getElementById('editEventModal');

// Load dashboard data when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadDashboardData();
    loadEvents();
});

// Check if user is authenticated and is admin
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'admin') {
        alert('Access denied. Admin role required.');
        window.location.href = 'customer-dashboard.html';
        return;
    }
}

// Load dashboard statistics
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/events/stats`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateStatistics(data.data);
        } else {
            console.error('Failed to load statistics');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Update statistics display
function updateStatistics(stats) {
    totalEvents.textContent = stats.eventCounts.total || 0;
    upcomingEvents.textContent = stats.eventCounts.upcoming || 0;
    totalBookings.textContent = stats.seatStats.bookedSeats || 0;
    availableSeats.textContent = stats.seatStats.availableSeats || 0;
}

// Load all events
async function loadEvents() {
    try {
        const token = getToken();
        console.log('Token available:', !!token);
        
        if (!token) {
            eventsList.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h3>Please Login First</h3>
                    <p>You need to login as an administrator to view events.</p>
                    <button onclick="window.location.href='admin-login.html'" class="btn btn-primary">
                        Go to Admin Login
                    </button>
                </div>
            `;
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/events/admin`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Admin events data:', data);
            
            if (data.success && data.data && data.data.events) {
                displayEvents(data.data.events);
            } else {
                console.error('Invalid data structure:', data);
                eventsList.innerHTML = '<p>Invalid data received from server.</p>';
            }
        } else {
            const errorText = await response.text();
            console.error('Failed to load events:', response.status, errorText);
            
            if (response.status === 401) {
                eventsList.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <h3>Session Expired</h3>
                        <p>Your admin session has expired. Please login again.</p>
                        <button onclick="window.location.href='admin-login.html'" class="btn btn-primary">
                            Login Again
                        </button>
                    </div>
                `;
            } else {
                eventsList.innerHTML = '<p>Unable to load events. Please check your connection.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading events:', error);
        eventsList.innerHTML = '<p>Network error. Please try again.</p>';
    }
}

// Display events in the table
function displayEvents(events) {
    console.log('displayEvents called with:', events);
    console.log('eventsList element:', eventsList);
    
    if (events.length === 0) {
        eventsList.innerHTML = '<p>No events found.</p>';
        return;
    }
    
    eventsList.innerHTML = events.map(event => `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-900 mb-1">${event.title}</h4>
                <p class="text-sm text-slate-500 mb-1">${new Date(event.date).toLocaleDateString()} at ${new Date(event.date).toLocaleTimeString()}</p>
                <p class="text-sm text-slate-600 line-clamp-2 mb-2">${event.description}</p>
                <div class="flex flex-wrap gap-2">
                    <span class="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md text-xs font-semibold">${event.availableSeats}/${event.totalSeats} seats</span>
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">${event.bookingStatus || 'Available'}</span>
                </div>
            </div>
            <div class="flex gap-2 shrink-0">
                <button class="btn btn-primary btn-sm" onclick="editEvent('${event._id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteEvent('${event._id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Show create event form
function showCreateEventForm() {
    createEventFormPanel.style.display = 'block';
    createEventFormPanel.scrollIntoView({ behavior: 'smooth' });
}

// Hide create event form
function hideCreateEventForm() {
    if (createEventFormPanel) {
        createEventFormPanel.style.display = 'none';
    }
    if (createEventForm) {
        createEventForm.reset();
    }
}

// Handle create event form submission
createEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = createEventForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Event...';
    
    const formData = new FormData(createEventForm);
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date'),
        totalSeats: parseInt(formData.get('totalSeats'))
    };
    
    // Frontend validation
    if (!eventData.title || eventData.title.length < 3) {
        showMessage('Title must be at least 3 characters long', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
    }
    
    if (!eventData.description || eventData.description.length < 5) {
        showMessage('Description must be at least 5 characters long', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
    }
    
    if (!eventData.date) {
        showMessage('Please select an event date', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
    }
    
    if (!eventData.totalSeats || eventData.totalSeats < 1) {
        showMessage('Total seats must be at least 1', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Event created successfully!', 'success');
            hideCreateEventForm();
            loadEvents();
            loadDashboardData();
        } else {
            console.error('Event creation failed:', data);
            showMessage(data.message || `Failed to create event: ${data.message || 'Validation failed'}`, 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showMessage('Connection error. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Edit event
async function editEvent(eventId) {
    try {
        console.log('Loading event details for:', eventId);
        const token = getToken();
        
        if (!token) {
            alert('Please login to edit events');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Event details response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Event data received:', data);
            
            // Handle different response structures
            let event = null;
            if (data.data && data.data.event) {
                event = data.data.event;
            } else if (data.data) {
                event = data.data;
            } else if (data._id) {
                event = data;
            }
            
            if (!event || !event._id) {
                console.error('Invalid event data structure:', data);
                alert('Failed to load event details: Invalid data. Check console for details.');
                return;
            }
            
            // Check if form elements exist
            const editEventId = document.getElementById('editEventId');
            const editEventTitle = document.getElementById('editEventTitle');
            const editEventDate = document.getElementById('editEventDate');
            const editEventDescription = document.getElementById('editEventDescription');
            const editTotalSeats = document.getElementById('editTotalSeats');
            
            if (!editEventId || !editEventTitle || !editEventDate || !editEventDescription || !editTotalSeats) {
                alert('Form elements not found. Please refresh the page.');
                console.error('Missing form elements:', {editEventId, editEventTitle, editEventDate, editEventDescription, editTotalSeats});
                return;
            }
            
            // Populate edit form
            editEventId.value = event._id;
            editEventTitle.value = event.title || '';
            editEventDate.value = event.date ? new Date(event.date).toISOString().slice(0, 16) : '';
            editEventDescription.value = event.description || '';
            editTotalSeats.value = event.totalSeats || '';
            
            // Show modal
            editEventModal.style.display = 'flex';
        } else {
            const errorText = await response.text();
            console.error('Failed to load event details:', response.status, errorText);
            alert(`Failed to load event details: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Network error: ' + error.message);
    }
}

// Close edit modal
function closeEditModal() {
    editEventModal.style.display = 'none';
    editEventForm.reset();
}

// Handle edit event form submission
editEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventId = document.getElementById('editEventId').value;
    const formData = new FormData(editEventForm);
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date'),
        totalSeats: parseInt(formData.get('totalSeats'))
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Event updated successfully!');
            closeEditModal();
            loadEvents();
            loadDashboardData();
        } else {
            alert(data.message || 'Failed to update event');
        }
    } catch (error) {
        console.error('Error updating event:', error);
        alert('Network error. Please try again.');
    }
});

// Delete event
async function deleteEvent(eventId) {
    try {
        // First check if event has bookings
        const token = getToken();
        const eventResponse = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (eventResponse.ok) {
            const eventData = await eventResponse.json();
            const bookedSeats = eventData.data.totalSeats - eventData.data.availableSeats;
            
            let confirmMessage = 'Are you sure you want to delete this event?';
            if (bookedSeats > 0) {
                confirmMessage = `This event has ${bookedSeats} existing bookings. Deleting will cancel all bookings. Are you sure you want to continue?`;
            }
            
            if (!confirm(confirmMessage)) {
                return;
            }
        } else {
            if (!confirm('Are you sure you want to delete this event?')) {
                return;
            }
        }
    } catch (error) {
        console.error('Error checking event bookings:', error);
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Event deleted successfully!');
            loadEvents();
            loadDashboardData();
        } else {
            alert(data.message || 'Failed to delete event');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Network error. Please try again.');
    }
}

// Filter events
function filterEvents() {
    const filter = document.getElementById('eventFilter').value;
    
    // For now, just reload all events
    // In a real implementation, you would apply the filter on the backend
    loadEvents();
}

// Show message to user
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = `toast ${type}`;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 5000);
}

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Show booking management section
function showBookingManagement() {
    const bookingManagement = document.getElementById('bookingManagement');
    if (bookingManagement) {
        bookingManagement.style.display = 'block';
        bookingManagement.scrollIntoView({ behavior: 'smooth' });
    }
}

// Hide booking management section
function hideBookingManagement() {
    const bookingManagement = document.getElementById('bookingManagement');
    if (bookingManagement) {
        bookingManagement.style.display = 'none';
    }
}

// Load bookings for admin
async function loadBookings() {
    try {
        const token = getToken();
        const eventId = document.getElementById('filterEvent').value;
        const status = document.getElementById('filterStatus').value;
        
        let url = `${API_BASE_URL}/admin/bookings`;
        const params = new URLSearchParams();
        
        if (eventId) params.append('eventId', eventId);
        if (status) params.append('status', status);
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayBookings(data.data.bookings);
        } else {
            const errorText = await response.text();
            console.error('Failed to load bookings:', response.status, errorText);
            document.getElementById('bookingsList').innerHTML = '<p>Unable to load bookings.</p>';
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsList').innerHTML = '<p>Network error. Please try again.</p>';
    }
}

// Display bookings in table
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    
    if (!bookings || bookings.length === 0) {
        bookingsList.innerHTML = '<p>No bookings found.</p>';
        return;
    }
    
    bookingsList.innerHTML = bookings.map(booking => `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-900 mb-1">${booking.eventId.title}</h4>
                <p class="text-sm text-slate-500">${booking.userId.name} · ${booking.userId.email}</p>
                <div class="flex flex-wrap gap-2 mt-2">
                    <span class="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md text-xs font-semibold">${booking.numberOfSeats} seats</span>
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">₹${booking.totalPrice}</span>
                    <span class="px-2 py-0.5 rounded-md text-xs font-semibold ${booking.status === 'confirmed' ? 'bg-valley-50 text-valley-700' : 'bg-red-50 text-red-700'}">${booking.status}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">Booked ${new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="flex gap-2 shrink-0">
                <button class="btn btn-warning btn-sm" onclick="cancelBooking('${booking._id}')">Cancel</button>
                <button class="btn btn-info btn-sm" onclick="viewBookingDetails('${booking._id}')">Details</button>
            </div>
        </div>
    `).join('');
}

// Cancel booking (admin)
async function cancelBooking(bookingId) {
    const reason = prompt('Enter cancellation reason (optional):');
    const confirmCancel = confirm('Are you sure you want to cancel this booking?');
    
    if (!confirmCancel) return;
    
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/admin/bookings/cancel/${bookingId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
        });
        
        if (response.ok) {
            const data = await response.json();
            alert('Booking cancelled successfully!');
            loadBookings();
        } else {
            const errorText = await response.text();
            console.error('Failed to cancel booking:', response.status, errorText);
            
            // Check if it's the "existing bookings" error
            if (errorText.includes('existing bookings')) {
                alert('Event has existing bookings. Admin override applied - booking cancelled and seats restored.');
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to cancel booking');
            }
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Network error. Please try again.');
    }
}

// View booking details
function viewBookingDetails(bookingId) {
    alert(`Booking ID: ${bookingId}\n\nDetailed booking view would open here.\n\nThis would show complete booking information, user details, and payment status.`);
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === editEventModal) {
        closeEditModal();
    }
});
