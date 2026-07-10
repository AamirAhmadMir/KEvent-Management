// API Base URL
const API_BASE_URL = `${window.location.origin}/api`;

// DOM Elements
const companyForm = document.getElementById('companyForm');
const companiesList = document.getElementById('companiesList');
const messageDiv = document.getElementById('message');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.toggle('hidden');
        hamburger.setAttribute('aria-expanded', !isHidden);
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });
}

// Handle company form submission
companyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable submit button and show loading
    const submitButton = companyForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Adding Company...';
    
    const formData = new FormData(companyForm);
    const companyData = {
        name: formData.get('companyName'),
        emailDomain: formData.get('emailDomain'),
        companyKey: formData.get('companyKey'),
        maxAdmins: parseInt(formData.get('maxAdmins')),
        contactEmail: formData.get('contactEmail'),
        description: formData.get('description')
    };
    
    try {
        showMessage('Adding company...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/companies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(companyData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Company added successfully!', 'success');
            companyForm.reset();
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            loadCompanies(); // Refresh the companies list
        } else {
            showMessage(data.message || 'Failed to add company', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Company creation error:', error);
        showMessage('Connection error. Please check your internet connection.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// Load companies list
async function loadCompanies() {
    try {
        const response = await fetch(`${API_BASE_URL}/companies`);
        const data = await response.json();
        
        if (response.ok) {
            displayCompanies(data.data.companies);
        } else {
            showMessage('Failed to load companies', 'error');
        }
    } catch (error) {
        console.error('Error loading companies:', error);
        showMessage('Connection error loading companies', 'error');
    }
}

// Display companies in the list
function displayCompanies(companies) {
    if (!companies || companies.length === 0) {
        companiesList.innerHTML = '<p>No companies registered yet.</p>';
        return;
    }
    
    companiesList.innerHTML = companies.map(company => `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-900 mb-1">${company.name}</h4>
                <p class="text-sm text-slate-500">@${company.emailDomain} · ${company.contactEmail}</p>
                <p class="text-xs text-slate-400 mt-1 font-mono">Key: ${company.companyKey}</p>
                ${company.description ? `<p class="text-sm text-slate-600 mt-2">${company.description}</p>` : ''}
            </div>
            <div class="text-right shrink-0">
                <p class="text-2xl font-extrabold text-brand-600">${company.currentAdminCount}<span class="text-sm font-normal text-slate-400">/${company.maxAdmins}</span></p>
                <p class="text-xs text-slate-400 mb-1">admins</p>
                <span class="inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${company.isActive ? 'bg-valley-50 text-valley-700' : 'bg-red-50 text-red-700'}">${company.isActive ? 'Active' : 'Inactive'}</span>
            </div>
        </div>
    `).join('');
}

// Show message to user
function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
}

// Form validation
function validateForm() {
    const companyName = document.getElementById('companyName').value.trim();
    const emailDomain = document.getElementById('emailDomain').value.trim();
    const companyKey = document.getElementById('companyKey').value.trim();
    const maxAdmins = document.getElementById('maxAdmins').value;
    const contactEmail = document.getElementById('contactEmail').value.trim();
    
    // Reset previous errors
    clearErrors();
    
    let isValid = true;
    
    // Validate company name
    if (companyName.length < 2) {
        showError('companyName', 'Company name must be at least 2 characters long');
        isValid = false;
    }
    
    // Validate email domain
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(emailDomain)) {
        showError('emailDomain', 'Please enter a valid domain (e.g., company.com)');
        isValid = false;
    }
    
    // Validate company key
    if (companyKey.length < 8) {
        showError('companyKey', 'Company key must be at least 8 characters long');
        isValid = false;
    }
    
    // Validate max admins
    if (maxAdmins < 1 || maxAdmins > 100) {
        showError('maxAdmins', 'Maximum admins must be between 1 and 100');
        isValid = false;
    }
    
    // Validate contact email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(contactEmail)) {
        showError('contactEmail', 'Please enter a valid email address');
        isValid = false;
    }
    
    return isValid;
}

// Show error for specific field
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#dc3545';
}

// Clear all errors
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => error.remove());
    document.querySelectorAll('input, textarea').forEach(field => {
        field.style.borderColor = '#e1e5e9';
    });
}

// Add form validation to submission
companyForm.addEventListener('submit', function(e) {
    if (!validateForm()) {
        e.preventDefault();
        showMessage('Please fix the errors in the form', 'error');
    }
});

// Load companies when page loads
document.addEventListener('DOMContentLoaded', loadCompanies);
