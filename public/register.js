const API_BASE_URL = `${window.location.origin}/api`;

const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');
const hamburger = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        const isActive = hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isActive);
        
        if (isActive) {
            const firstLink = navMenu.querySelector('a');
            if (firstLink) firstLink.focus();
        }
    });

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && hamburger.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.focus();
        }
    });
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        showMessage('Please fix the errors in the form', 'error');
        return;
    }

    const submitButton = registerForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';

    const formData = new FormData(registerForm);
    const registerData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password')
    };

    const companyKey = formData.get('companyKey');
    if (companyKey) {
        registerData.companyKey = companyKey;
    }

    try {
        showMessage('Creating your account...', 'info');

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Account created successfully! Redirecting...', 'success');

            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            setTimeout(() => {
                if (data.data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'customer-dashboard.html';
                }
            }, 1500);
        } else {
            showMessage(data.message || 'Registration failed', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Connection error. Please check your internet connection.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
}

function validateForm() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    clearErrors();

    let isValid = true;

    if (name.length < 2) {
        showError('name', 'Name must be at least 2 characters long');
        isValid = false;
    } else if (name.length > 50) {
        showError('name', 'Name must be less than 50 characters long');
        isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    } else if (email.length > 100) {
        showError('email', 'Email address is too long');
        isValid = false;
    }

    if (password.length < 6) {
        showError('password', 'Password must be at least 6 characters long');
        isValid = false;
    } else if (password.length > 100) {
        showError('password', 'Password must be less than 100 characters long');
        isValid = false;
    }

    return isValid;
}

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

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => error.remove());
    document.querySelectorAll('input, select').forEach(field => {
        field.style.borderColor = '#ddd';
    });
}

document.getElementById('name').addEventListener('blur', function() {
    const name = this.value.trim();
    if (name.length < 2) {
        showError('name', 'Name must be at least 2 characters long');
    } else if (name.length > 50) {
        showError('name', 'Name must be less than 50 characters long');
    } else {
        clearFieldError('name');
    }
});

document.getElementById('email').addEventListener('blur', function() {
    const email = this.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('email', 'Please enter a valid email address');
    } else if (email.length > 100) {
        showError('email', 'Email address is too long');
    } else {
        clearFieldError('email');
    }
});

document.getElementById('password').addEventListener('blur', function() {
    const password = this.value;
    if (password.length < 6) {
        showError('password', 'Password must be at least 6 characters long');
    } else if (password.length > 100) {
        showError('password', 'Password must be less than 100 characters long');
    } else {
        clearFieldError('password');
    }
});

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorMessages = field.parentNode.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    field.style.borderColor = '#ddd';
}

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
