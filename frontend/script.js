// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Contact form handling
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const phone = this.querySelector('input[type="tel"]').value;
            const course = this.querySelector('select').value;
            const message = this.querySelector('textarea').value;

            // Basic validation
            if (!name || !email || !course) {
                alert('Please fill in all required fields.');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Show success message
            alert('Thank you for your interest! Ms. Hoa will contact you within 24 hours to schedule your free consultation.');
            
            // Reset form
            this.reset();
        });
    }

    // Course card interactions
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        const learnMoreBtn = card.querySelector('.btn');
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const courseTitle = card.querySelector('h3').textContent;
                const courseLevel = card.querySelector('.course-level').textContent;
                
                // Show course details modal or scroll to contact
                const contactSection = document.querySelector('#contact');
                const courseSelect = document.querySelector('#contact select');
                
                if (contactSection && courseSelect) {
                    // Pre-select the course in contact form
                    const optionValue = courseLevel.toLowerCase().replace(' ', '-');
                    const option = courseSelect.querySelector(`option[value*="${optionValue}"]`);
                    if (option) {
                        courseSelect.value = option.value;
                    }
                    
                    // Scroll to contact form
                    const offsetTop = contactSection.offsetTop - 70;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                    
                    // Focus on name input
                    setTimeout(() => {
                        const nameInput = document.querySelector('.contact-form input[type="text"]');
                        if (nameInput) nameInput.focus();
                    }, 500);
                }
            });
        }
    });

    // Navbar background on scroll
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add/remove background based on scroll position
        if (scrollTop > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });

    // Active navigation link highlighting
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', function() {
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
            
            if (scrollPos >= top && scrollPos < top + height) {
                // Remove active class from all links
                navLinks.forEach(link => link.classList.remove('active'));
                // Add active class to current link
                if (navLink) navLink.classList.add('active');
            }
        });
    });

    // Add CSS for active nav link
    const style = document.createElement('style');
    style.textContent = `
        .nav-link.active {
            color: #c41e3a !important;
        }
        .nav-link.active::after {
            width: 100% !important;
        }
    `;
    document.head.appendChild(style);

    // Statistics counter animation (simplified without external libraries)
    const observeStats = () => {
        const stats = document.querySelectorAll('.stat-number');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const finalValue = target.textContent.replace('+', '').replace('%', '');
                    const suffix = target.textContent.includes('+') ? '+' : 
                                  target.textContent.includes('%') ? '%' : '';
                    
                    animateCounter(target, 0, parseInt(finalValue), suffix, 2000);
                    observer.unobserve(target);
                }
            });
        });
        
        stats.forEach(stat => observer.observe(stat));
    };

    const animateCounter = (element, start, end, suffix, duration) => {
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    };

    // Initialize stats counter
    observeStats();

    // Course card hover effects (enhance existing CSS)
    courseCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('featured')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });

    // Testimonial card subtle animation
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const observeTestimonials = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 200);
                observeTestimonials.unobserve(entry.target);
            }
        });
    });

    // Set initial state for testimonials
    testimonialCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observeTestimonials.observe(card);
    });

    // Form field focus effects
    const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });

    // Add transitions to form groups
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.style.transition = 'transform 0.2s ease';
    });

    // Social icons hover effect enhancement
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.1)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    console.log('Ms. Hoa\'s Chinese Language Website - Initialized Successfully! 🏮');

    // Authentication functionality
    initializeAuth();
});

// Authentication System
let currentUser = null;
const API_BASE = window.location.origin + '/api';

function initializeAuth() {
    // Check for existing token
    const token = localStorage.getItem('authToken');
    if (token) {
        validateToken(token);
    }

    // Modal controls
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const profileModal = document.getElementById('profileModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Modal open/close
    loginBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'block';
    });

    registerBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'block';
    });

    profileBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) {
            loadProfile();
            profileModal.style.display = 'block';
        }
    });

    logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Close modals
    document.getElementById('closeLogin')?.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    document.getElementById('closeRegister')?.addEventListener('click', () => {
        registerModal.style.display = 'none';
    });

    document.getElementById('closeProfile')?.addEventListener('click', () => {
        profileModal.style.display = 'none';
    });

    // Switch between login/register
    document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        registerModal.style.display = 'block';
    });

    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'block';
    });

    // Form submissions
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        showLoading(e.target.querySelector('button'));
        
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('authToken', result.data.token);
            currentUser = result.data.user;
            updateAuthUI();
            document.getElementById('loginModal').style.display = 'none';
            showMessage(result.message, 'success');
            e.target.reset();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Lỗi kết nối. Vui lòng thử lại sau.', 'error');
    } finally {
        hideLoading(e.target.querySelector('button'));
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        showLoading(e.target.querySelector('button'));
        
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('authToken', result.data.token);
            currentUser = result.data.user;
            updateAuthUI();
            document.getElementById('registerModal').style.display = 'none';
            showMessage(result.message, 'success');
            e.target.reset();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Lỗi kết nối. Vui lòng thử lại sau.', 'error');
    } finally {
        hideLoading(e.target.querySelector('button'));
    }
}

async function validateToken(token) {
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            currentUser = result.data.user;
            updateAuthUI();
        } else {
            localStorage.removeItem('authToken');
        }
    } catch (error) {
        localStorage.removeItem('authToken');
    }
}

async function loadProfile() {
    if (!currentUser) return;

    // Update profile info
    document.getElementById('profileName').textContent = currentUser.full_name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileTier').textContent = currentUser.membership_tier === 'free' ? 'Miễn phí' : 'VIP';
    document.getElementById('profileJoinDate').textContent = new Date(currentUser.created_at).toLocaleDateString('vi-VN');

    // Load courses
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/courses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const coursesHtml = result.data.courses.map(course => `
                <div class="course-item">
                    <h4>${course.title} <span class="chinese-text">${course.title_chinese}</span></h4>
                    <p>${course.description}</p>
                    <div class="course-meta">
                        <span class="level">${course.level}</span>
                        <span class="hsk">${course.hsk_level}</span>
                        <span class="price">${course.price_vnd === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN').format(course.price_vnd) + ' VNĐ'}</span>
                    </div>
                </div>
            `).join('');

            document.getElementById('coursesContent').innerHTML = coursesHtml;
        }
    } catch (error) {
        document.getElementById('coursesContent').innerHTML = '<p>Không thể tải danh sách khóa học.</p>';
    }
}

function updateAuthUI() {
    const authSection = document.querySelector('.auth-section');
    const userMenu = document.getElementById('userMenu');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userName = document.getElementById('userName');

    if (currentUser) {
        // Show user menu, hide login/register
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.full_name;
    } else {
        // Show login/register, hide user menu
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    updateAuthUI();
    showMessage('Đã đăng xuất thành công!', 'success');
}

function showLoading(button) {
    const originalText = button.textContent;
    button.textContent = 'Đang xử lý...';
    button.disabled = true;
    button.dataset.originalText = originalText;
}

function hideLoading(button) {
    button.textContent = button.dataset.originalText;
    button.disabled = false;
}

function showMessage(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '5px',
        zIndex: '3000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
