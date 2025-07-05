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
});
