// API Base URL
const API_BASE_URL = `${window.location.origin}/api`;

// DOM Elements
const eventsGrid = document.getElementById('eventsGrid');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

// Hamburger menu functionality with accessibility
if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.toggle('hidden');
        hamburger.setAttribute('aria-expanded', !isHidden);
        
        // Focus first link when menu opens
        if (!isHidden) {
            const firstLink = mobileMenu.querySelector('a');
            if (firstLink) firstLink.focus();
        }
    });

    // Close menu when clicking on a link
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.focus();
        }
    });
}

// Load events when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUpcomingEvents();
});

// Load upcoming events
async function loadUpcomingEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        
        if (response.ok) {
            const data = await response.json();
            displayEvents(data.data);
        } else {
            console.error('Error loading events:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading events:', error);
        loadPublicEvents();
    }
}

// Load public events (without authentication)
async function loadPublicEvents() {
    try {
        // For now, display sample events
        displaySampleEvents();
    } catch (error) {
        console.error('Error loading public events:', error);
        eventsGrid.innerHTML = '<p>Unable to load events at this time.</p>';
    }
}

// Display events in the grid with modern Tailwind styling
function displayEvents(events) {
    if (events.length === 0) {
        eventsGrid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <p class="text-lg font-semibold text-slate-700 mb-1">No upcoming events</p>
                <p class="text-slate-500">Check back later for new events in Kashmir!</p>
            </div>
        `;
        return;
    }
    
    eventsGrid.innerHTML = events.map((event, index) => `
        <article class="group bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 border border-slate-100 hover:border-brand-100" role="listitem" style="animation: fadeInUp 0.5s ease ${index * 0.1}s both;">
            <div class="h-1.5 bg-gradient-to-r from-brand-500 to-brand-600 group-hover:from-brand-600 group-hover:to-valley-500 transition-all"></div>
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-semibold uppercase tracking-wide">Event</span>
                    <span class="text-slate-400 text-sm font-medium">${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <h3 class="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-700 transition-colors">${event.title}</h3>
                <div class="flex items-center text-slate-500 text-sm mb-3">
                    <svg class="w-4 h-4 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <p class="text-slate-500 text-sm mb-5 line-clamp-2 leading-relaxed">${event.description}</p>
                <div class="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span class="inline-flex items-center text-sm font-medium ${event.availableSeats === 0 ? 'text-red-600' : 'text-valley-600'}">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        ${event.availableSeats === 0 ? 'Fully Booked' : `${event.availableSeats} seats left`}
                    </span>
                    ${event.availableSeats > 0 ?
                        `<button onclick="redirectToLogin()" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all" aria-label="Book ${event.title}">Book Now</button>` :
                        '<button disabled class="px-4 py-2 bg-slate-100 text-slate-400 text-sm font-semibold rounded-xl cursor-not-allowed">Sold Out</button>'
                    }
                </div>
            </div>
        </article>
    `).join('');
}

// Display sample events (for public view)
function displaySampleEvents() {
    const sampleEvents = [
        {
            title: 'Tech Conference 2024',
            date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            description: 'Join us for the biggest tech conference of the year!',
            availableSeats: 150
        },
        {
            title: 'Music Festival',
            date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            description: 'Experience amazing live music performances.',
            availableSeats: 0
        },
        {
            title: 'Food & Wine Expo',
            date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            description: 'Taste the best food and wine from around the world.',
            availableSeats: 75
        }
    ];
    
    displayEvents(sampleEvents);
}

// Redirect to login page
function redirectToLogin() {
    window.location.href = 'login.html';
}

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}
