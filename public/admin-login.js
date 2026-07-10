// API Base URL
const API_BASE_URL = `${window.location.origin}/api`;

const adminLoginForm = document.getElementById('adminLoginForm');
const messageDiv = document.getElementById('message');

adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = adminLoginForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Signing In...';

    const formData = new FormData(adminLoginForm);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        showMessage('Authenticating admin credentials...', 'info');

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            if (data.data.user.role !== 'admin') {
                showMessage('Access denied. This login is for administrators only.', 'error');
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                return;
            }

            showMessage('Admin login successful! Redirecting...', 'success');
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1500);
        } else {
            showMessage(data.message || 'Invalid admin credentials', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Admin login error:', error);
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

function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const eyeIcon = passwordField.parentNode.querySelector('.eye-icon, [id$="-eye"]');

    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        if (eyeIcon) eyeIcon.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        if (eyeIcon) eyeIcon.textContent = '👁️';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        const userData = JSON.parse(user);
        if (userData.role === 'admin') {
            showMessage('You are already logged in as admin. Redirecting...', 'info');
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1500);
        }
    }
});
