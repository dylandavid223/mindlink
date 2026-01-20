// js/auth.js
// Authentication JavaScript File

class Auth {
    constructor() {
        this.apiUrl = 'https://api.mindlink.com'; // Replace with actual API
        this.tokenKey = 'mindlink_token';
        this.userKey = 'mindlink_user';
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.loginAttempts = 0;
        this.maxLoginAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        
        this.init();
    }
    
    init() {
        this.checkSession();
        this.setupEventListeners();
        this.setupPasswordToggle();
        this.setupAgeValidation();
    }
    
    setupEventListeners() {
        // Login Form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Signup Form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
            this.setupPasswordStrength(signupForm);
        }
        
        // Logout Button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }
        
        // Admin Logout
        const adminLogout = document.getElementById('adminLogout');
        if (adminLogout) {
            adminLogout.addEventListener('click', (e) => this.handleLogout(e));
        }
    }
    
    setupPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }
    
    setupAgeValidation() {
        const ageInput = document.getElementById('age');
        if (ageInput) {
            ageInput.addEventListener('input', (e) => {
                const age = parseInt(e.target.value);
                const parentalConsent = document.getElementById('parentalConsent');
                
                if (age < 15 || age > 35) {
                    this.showAgeValidationMessage('Age must be between 15-35 years');
                    e.target.setCustomValidity('Age must be between 15-35 years');
                } else if (age < 18) {
                    parentalConsent.style.display = 'block';
                    e.target.setCustomValidity('');
                } else {
                    parentalConsent.style.display = 'none';
                    e.target.setCustomValidity('');
                }
            });
        }
    }
    
    setupPasswordStrength(form) {
        const passwordInput = form.querySelector('#password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                const strength = this.calculatePasswordStrength(e.target.value);
                this.updatePasswordStrength(strength);
            });
        }
    }
    
    calculatePasswordStrength(password) {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        
        // Complexity checks
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        return Math.min(strength, 5); // Max 5
    }
    
    updatePasswordStrength(strength) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;
        
        const width = (strength / 5) * 100;
        strengthBar.style.width = `${width}%`;
        
        let color, text;
        if (strength <= 2) {
            color = '#E74C3C'; // Red
            text = 'Weak';
        } else if (strength <= 3) {
            color = '#F39C12'; // Orange
            text = 'Medium';
        } else {
            color = '#27AE60'; // Green
            text = 'Strong';
        }
        
        strengthBar.style.backgroundColor = color;
        strengthText.textContent = text;
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        // Check if locked out
        if (this.isLockedOut()) {
            this.showError('Too many login attempts. Please try again in 15 minutes.');
            return;
        }
        
        const form = e.target;
        const email = form.querySelector('#email').value;
        const password = form.querySelector('#password').value;
        const rememberMe = form.querySelector('#rememberMe')?.checked || false;
        
        // Validate inputs
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            const response = await this.mockLogin(email, password);
            
            if (response.success) {
                // Store token and user data
                this.storeAuthData(response.token, response.user, rememberMe);
                
                // Reset login attempts
                this.loginAttempts = 0;
                
                // Redirect based on role
                this.redirectAfterLogin(response.user.role);
            } else {
                this.loginAttempts++;
                this.showError(response.message || 'Invalid credentials');
                
                if (this.loginAttempts >= this.maxLoginAttempts) {
                    this.lockAccount();
                }
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
            console.error('Login error:', error);
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async handleSignup(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = {
            fullName: form.querySelector('#fullName').value,
            email: form.querySelector('#email').value,
            age: parseInt(form.querySelector('#age').value),
            gender: form.querySelector('#gender').value,
            location: form.querySelector('#location').value,
            password: form.querySelector('#password').value,
            confirmPassword: form.querySelector('#confirmPassword').value,
            terms: form.querySelector('#terms').checked,
            parentConsent: form.querySelector('#parentConsent')?.checked || false
        };
        
        // Validate inputs
        const errors = this.validateSignup(formData);
        if (errors.length > 0) {
            this.showError(errors[0]);
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            const response = await this.mockSignup(formData);
            
            if (response.success) {
                // Auto-login after signup
                this.storeAuthData(response.token, response.user, true);
                
                // Show success message
                this.showSuccess('Account created successfully! Redirecting...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showError(response.message || 'Signup failed');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
            console.error('Signup error:', error);
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    validateSignup(data) {
        const errors = [];
        
        if (!data.fullName || data.fullName.length < 2) {
            errors.push('Please enter your full name');
        }
        
        if (!this.validateEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (data.age < 15 || data.age > 35) {
            errors.push('Age must be between 15-35 years');
        }
        
        if (data.age < 18 && !data.parentConsent) {
            errors.push('Parental consent is required for users under 18');
        }
        
        if (data.password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        
        if (data.password !== data.confirmPassword) {
            errors.push('Passwords do not match');
        }
        
        if (!data.terms) {
            errors.push('You must agree to the Terms of Service');
        }
        
        return errors;
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    async mockLogin(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock responses based on email
        if (email === 'admin@mindlink.com' && password === 'Admin123!') {
            return {
                success: true,
                token: 'mock-jwt-token-admin',
                user: {
                    id: 1,
                    email: email,
                    name: 'Admin User',
                    role: 'super_admin',
                    age: 25,
                    location: 'Nairobi'
                }
            };
        } else if (email === 'counselor@mindlink.com' && password === 'Counselor123!') {
            return {
                success: true,
                token: 'mock-jwt-token-counselor',
                user: {
                    id: 2,
                    email: email,
                    name: 'Sarah Counselor',
                    role: 'counselor',
                    age: 28,
                    location: 'Eldoret'
                }
            };
        } else if (password === 'Password123!') {
            return {
                success: true,
                token: 'mock-jwt-token-user',
                user: {
                    id: 3,
                    email: email,
                    name: email.split('@')[0],
                    role: 'user',
                    age: 20,
                    location: 'Nairobi'
                }
            };
        } else {
            return {
                success: false,
                message: 'Invalid email or password'
            };
        }
    }
    
    async mockSignup(data) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock successful signup
        return {
            success: true,
            token: 'mock-jwt-token-new-user',
            user: {
                id: Math.floor(Math.random() * 1000) + 100,
                email: data.email,
                name: data.fullName,
                role: 'user',
                age: data.age,
                location: data.location,
                gender: data.gender
            }
        };
    }
    
    storeAuthData(token, user, rememberMe) {
        // Store token
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        
        // Set session expiry
        const expiry = Date.now() + this.sessionTimeout;
        localStorage.setItem('mindlink_expiry', expiry.toString());
        
        // If remember me, store in sessionStorage for persistence
        if (rememberMe) {
            sessionStorage.setItem(this.tokenKey, token);
            sessionStorage.setItem(this.userKey, JSON.stringify(user));
        }
        
        // Set last activity timestamp
        localStorage.setItem('mindlink_last_activity', Date.now().toString());
    }
    
    checkSession() {
        const token = localStorage.getItem(this.tokenKey);
        const user = localStorage.getItem(this.userKey);
        const expiry = localStorage.getItem('mindlink_expiry');
        const lastActivity = localStorage.getItem('mindlink_last_activity');
        
        // Check if session expired
        if (!token || !user || !expiry || !lastActivity) {
            this.clearAuthData();
            return;
        }
        
        const now = Date.now();
        const timeSinceLastActivity = now - parseInt(lastActivity);
        
        // If session expired or inactive for too long
        if (now > parseInt(expiry) || timeSinceLastActivity > this.sessionTimeout) {
            this.clearAuthData();
            this.showSessionExpired();
            return;
        }
        
        // Update last activity
        localStorage.setItem('mindlink_last_activity', now.toString());
        
        // If on auth pages, redirect to dashboard
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('signup.html')) {
            const userData = JSON.parse(user);
            this.redirectAfterLogin(userData.role);
        }
    }
    
    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem('mindlink_expiry');
        localStorage.removeItem('mindlink_last_activity');
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);
    }
    
    showSessionExpired() {
        if (!window.location.pathname.includes('login.html')) {
            showNotification('Your session has expired. Please login again.', 'warning');
        }
    }
    
    isLockedOut() {
        const lockoutUntil = localStorage.getItem('mindlink_lockout');
        if (!lockoutUntil) return false;
        
        return Date.now() < parseInt(lockoutUntil);
    }
    
    lockAccount() {
        const lockoutUntil = Date.now() + this.lockoutTime;
        localStorage.setItem('mindlink_lockout', lockoutUntil.toString());
        this.loginAttempts = 0;
    }
    
    redirectAfterLogin(role) {
        switch(role) {
            case 'super_admin':
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'counselor':
                window.location.href = 'counselor-dashboard.html';
                break;
            default:
                window.location.href = 'dashboard.html';
        }
    }
    
    handleLogout(e) {
        e.preventDefault();
        
        // Clear auth data
        this.clearAuthData();
        
        // Show logout message
        showNotification('Logged out successfully', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
    
    showError(message) {
        showNotification(message, 'error');
    }
    
    showSuccess(message) {
        showNotification(message, 'success');
    }
    
    showAgeValidationMessage(message) {
        let validationDiv = document.getElementById('ageValidation');
        if (!validationDiv) {
            validationDiv = document.createElement('div');
            validationDiv.id = 'ageValidation';
            validationDiv.className = 'age-validation';
            const ageInput = document.getElementById('age');
            ageInput.parentNode.insertBefore(validationDiv, ageInput.nextSibling);
        }
        
        validationDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        validationDiv.classList.add('show');
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}