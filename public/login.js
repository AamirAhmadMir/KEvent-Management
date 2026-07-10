// API Base URL
const API_BASE_URL = `${window.location.origin}/api`;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable submit button and show loading
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Signing In...';
    submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    
    const formData = new FormData(loginForm);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        showMessage('Authenticating...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Verify user is customer
            if (data.data.user.role !== 'customer') {
                showMessage('Access denied. This login is for customers only. Please use admin login for administrative access.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                return;
            }
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Store token and user data
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            
            // Redirect to customer dashboard
            setTimeout(() => {
                window.location.href = 'customer-dashboard.html';
            }, 1500);
        } else {
            showMessage(data.message || 'Invalid credentials', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Connection error. Please check your internet connection.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});

// Social login function
function socialLogin(provider) {
    showMessage(`${provider} login is temporarily disabled. Please use email and password to sign in.`, 'info');
    
    // In a real implementation, this would redirect to OAuth provider
    // For now, show informative message
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
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Reset previous errors
    clearErrors();
    
    let isValid = true;
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate password
    if (password.length < 1) {
        showError('password', 'Password is required');
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
    document.querySelectorAll('input').forEach(field => {
        field.style.borderColor = '#e1e5e9';
    });
}

// Add real-time validation
document.getElementById('email').addEventListener('blur', function() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value.trim())) {
        showError('email', 'Please enter a valid email address');
    } else {
        clearFieldError('email');
    }
});

document.getElementById('password').addEventListener('blur', function() {
    if (this.value.length < 1) {
        showError('password', 'Password is required');
    } else {
        clearFieldError('password');
    }
});

// Clear error for specific field
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorMessages = field.parentNode.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    field.style.borderColor = '#e1e5e9';
}

// Add form validation to submission
loginForm.addEventListener('submit', function(e) {
    if (!validateForm()) {
        e.preventDefault();
        showMessage('Please fix the errors in the form', 'error');
    }
});

// Password toggle function
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const eyeIcon = document.querySelector(`#${fieldId} + .password-toggle .eye-icon`);
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        const userData = JSON.parse(user);
        showMessage('You are already logged in. Redirecting...', 'info');
        
        setTimeout(() => {
            if (userData.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'customer-dashboard.html';
            }
        }, 1500);
    }
});
