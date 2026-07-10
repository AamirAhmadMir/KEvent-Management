// API Base URL
const API_BASE_URL = `${window.location.origin}/api`;

// DOM Elements
const userName = document.getElementById('userName');
const availableEvents = document.getElementById('availableEvents');
const myBookings = document.getElementById('myBookings');
const bookEventForm = document.getElementById('bookEventForm');
const bookEventModal = document.getElementById('bookEventModal');
const viewBookingModal = document.getElementById('viewBookingModal');
const eventSearch = document.getElementById('eventSearch');
const eventSort = document.getElementById('eventSort');
const bookingFilter = document.getElementById('bookingFilter');

// Current user and event data
let currentUser = null;
let currentEvents = [];
let currentBookings = [];

// Load dashboard data when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadUserData();
    loadAvailableEvents();
    loadMyBookings();
});

// Check if user is authenticated and is customer
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'customer') {
        alert('Access denied. Customer role required.');
        window.location.href = 'admin-dashboard.html';
        return;
    }
    
    currentUser = userData;
}

// Load user data
function loadUserData() {
    if (currentUser) {
        userName.textContent = currentUser.name;
    }
}

// Load available events
async function loadAvailableEvents() {
    try {
        const token = getToken();
        console.log('Loading available events, token exists:', !!token);
        
        if (!token) {
            availableEvents.innerHTML = '<p>Please login to view events.</p>';
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/bookings/available`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Available events response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Available events data:', data);
            currentEvents = data.data || [];
            displayAvailableEvents(currentEvents);
        } else {
            const errorText = await response.text();
            console.error('Failed to load available events:', response.status, errorText);
            availableEvents.innerHTML = '<p>Unable to load events. Please try again.</p>';
        }
    } catch (error) {
        console.error('Error loading available events:', error);
        availableEvents.innerHTML = '<p>Network error. Please check your connection.</p>';
    }
}

// Display available events
function displayAvailableEvents(events) {
    if (events.length === 0) {
        availableEvents.innerHTML = `
            <div class="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-100">
                <p class="text-slate-500 font-medium">No available events found.</p>
            </div>`;
        return;
    }

    availableEvents.innerHTML = events.map(event => `
        <div class="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
            <div class="h-1 bg-gradient-to-r from-brand-500 to-brand-600"></div>
            <div class="p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-2">${event.title}</h3>
                <p class="text-sm text-slate-500 mb-3 flex items-center gap-1.5">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    ${new Date(event.date).toLocaleDateString()} at ${new Date(event.date).toLocaleTimeString()}
                </p>
                <p class="text-sm text-slate-600 mb-4 line-clamp-2">${event.description}</p>
                <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold mb-4 ${event.availableSeats === 0 ? 'bg-red-50 text-red-700' : 'bg-valley-50 text-valley-700'}">
                    ${event.availableSeats === 0 ? 'Fully Booked' : `${event.availableSeats} seats available`}
                </span>
                <div class="pt-4 border-t border-slate-100">
                    ${event.availableSeats > 0 ?
                        `<button class="btn btn-primary w-full" onclick="openBookModal('${event._id}')">Book Now</button>` :
                        '<button class="btn btn-secondary w-full" disabled>Sold Out</button>'
                    }
                </div>
            </div>
        </div>
    `).join('');
}

// Load user's bookings
async function loadMyBookings() {
    try {
        const token = getToken();
        console.log('Loading my bookings, token exists:', !!token);
        
        if (!token) {
            myBookings.innerHTML = '<p>Please login to view your bookings.</p>';
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Bookings response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Bookings data:', data);
            currentBookings = data.data || [];
            displayMyBookings(currentBookings);
        } else {
            const errorText = await response.text();
            console.error('Failed to load bookings:', response.status, errorText);
            myBookings.innerHTML = '<p>Unable to load bookings. Please try again.</p>';
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        myBookings.innerHTML = '<p>Network error. Please check your connection.</p>';
    }
}

// Display user's bookings
function displayMyBookings(bookings) {
    if (bookings.length === 0) {
        myBookings.innerHTML = `
            <div class="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <p class="text-slate-500 font-medium">You have no bookings yet.</p>
            </div>`;
        return;
    }

    myBookings.innerHTML = bookings.map(booking => `
        <div class="bg-white rounded-2xl border border-slate-100 shadow-card p-5 ${booking.status === 'cancelled' ? 'opacity-70 border-red-100' : ''}">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <h4 class="font-bold text-slate-900">${booking.event.title}</h4>
                        <span class="px-2 py-0.5 rounded-md text-xs font-semibold uppercase ${booking.status === 'confirmed' ? 'bg-valley-50 text-valley-700' : booking.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}">${booking.status}</span>
                    </div>
                    <p class="text-sm text-slate-500">${new Date(booking.event.date).toLocaleDateString()} · ${booking.numberOfSeats} seat(s) · Booked ${new Date(booking.bookingDate).toLocaleDateString()}</p>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button class="btn btn-secondary btn-sm" onclick="viewBooking('${booking._id}')">Details</button>
                    ${booking.status === 'confirmed' ?
                        `<button class="btn btn-danger btn-sm" onclick="openCancelBookingModal('${booking._id}')">Cancel</button>` : ''
                    }
                </div>
            </div>
        </div>
    `).join('');
}

// Open book event modal
async function openBookModal(eventId) {
    try {
        console.log('Loading event details for booking:', eventId);
        const token = getToken();
        
        if (!token) {
            alert('Please login to book events');
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
            const event = data.data?.event || data.data || data;
            
            if (!event || !event._id) {
                console.error('Invalid event data structure:', data);
                alert('Failed to load event details: Invalid data');
                return;
            }
            
            // Populate event details
            document.getElementById('eventDetails').innerHTML = `
                <h4 class="text-lg font-bold text-slate-900 mb-2">${event.title || 'Untitled Event'}</h4>
                <p class="mb-2">${event.description || 'No description available'}</p>
                <p><strong>Date:</strong> ${event.date ? new Date(event.date).toLocaleDateString() : 'TBD'} at ${event.date ? new Date(event.date).toLocaleTimeString() : 'TBD'}</p>
                <p><strong>Available Seats:</strong> ${event.availableSeats || 0}</p>
            `;
            
            document.getElementById('bookEventId').value = event._id;
            document.getElementById('numberOfSeats').max = event.availableSeats || 1;
            document.getElementById('availableSeatsInfo').textContent = `Maximum ${event.availableSeats || 0} seats available`;
            
            // Show modal
            bookEventModal.style.display = 'flex';
        } else {
            const errorText = await response.text();
            console.error('Failed to load event details:', response.status, errorText);
            alert(`Failed to load event details: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Network error. Please try again.');
    }
}

// Close book modal
function closeBookModal() {
    bookEventModal.style.display = 'none';
    bookEventForm.reset();
}

// Handle book event form submission
bookEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = bookEventForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Booking...';
    
    const eventId = document.getElementById('bookEventId').value;
    const numberOfSeats = parseInt(document.getElementById('numberOfSeats').value);
    
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                eventId: eventId,
                numberOfSeats: numberOfSeats
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Booking successful!', 'success');
            closeBookModal();
            loadAvailableEvents();
            loadMyBookings();
        } else {
            showMessage(data.message || 'Failed to book event', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Error booking event:', error);
        showMessage('Connection error. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// View booking details
async function viewBooking(bookingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const booking = data.data.booking;
            
            // Populate booking details
            document.getElementById('bookingDetails').innerHTML = `
                <h4 class="text-lg font-bold text-slate-900 mb-2">${booking.event.title}</h4>
                <p><strong>Date:</strong> ${new Date(booking.event.date).toLocaleDateString()} at ${new Date(booking.event.date).toLocaleTimeString()}</p>
                <p><strong>Seats:</strong> ${booking.numberOfSeats}</p>
                <p><strong>Status:</strong> ${booking.status}</p>
                <p><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
                <p class="mt-2">${booking.event.description}</p>
            `;
            
            // Set cancel button data
            document.getElementById('cancelBookingBtn').setAttribute('data-booking-id', bookingId);
            
            // Show modal
            viewBookingModal.style.display = 'flex';
        } else {
            alert('Failed to load booking details');
        }
    } catch (error) {
        console.error('Error loading booking:', error);
        alert('Network error. Please try again.');
    }
}

// Close view booking modal
function closeViewBookingModal() {
    viewBookingModal.style.display = 'none';
}

// Cancel booking
async function cancelBooking() {
    const bookingId = document.getElementById('cancelBookingBtn').getAttribute('data-booking-id');
    
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Booking cancelled successfully!');
            closeViewBookingModal();
            loadAvailableEvents();
            loadMyBookings();
        } else {
            alert(data.message || 'Failed to cancel booking');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Network error. Please try again.');
    }
}

// Search events
function searchEvents() {
    const searchTerm = eventSearch.value.toLowerCase();
    const filteredEvents = currentEvents.filter(event => 
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm)
    );
    displayAvailableEvents(filteredEvents);
}

// Sort events
function sortEvents() {
    const sortBy = eventSort.value;
    let sortedEvents = [...currentEvents];
    
    switch (sortBy) {
        case 'date':
            sortedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'title':
            sortedEvents.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'seats':
            sortedEvents.sort((a, b) => b.availableSeats - a.availableSeats);
            break;
    }
    
    displayAvailableEvents(sortedEvents);
}

// Filter bookings
function filterBookings() {
    const filter = bookingFilter.value;
    let filteredBookings = [...currentBookings];
    
    switch (filter) {
        case 'upcoming':
            filteredBookings = filteredBookings.filter(booking => 
                new Date(booking.event.date) > new Date()
            );
            break;
        case 'past':
            filteredBookings = filteredBookings.filter(booking => 
                new Date(booking.event.date) < new Date()
            );
            break;
        case 'cancelled':
            filteredBookings = filteredBookings.filter(booking => 
                booking.status === 'cancelled'
            );
            break;
    }
    
    displayMyBookings(filteredBookings);
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

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === bookEventModal) {
        closeBookModal();
    }
    if (e.target === viewBookingModal) {
        closeViewBookingModal();
    }
});
