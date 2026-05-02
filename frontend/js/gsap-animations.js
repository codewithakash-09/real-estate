// GSAP Animations
document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
    // Add particle styles
    addParticleStyles();
    addCTAStyle();
    
    // Navbar animation
    gsap.from('.navbar', {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });
    
    // Hero section animations
    const heroTimeline = gsap.timeline();
    heroTimeline
        .from('.hero-title', { y: 50, opacity: 0, duration: 1, ease: 'power3.out' })
        .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
        .from('.hero-cta .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.2, ease: 'back.out(1.7)' }, '-=0.3')
        .from('.badge', { scale: 0, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }, '-=0.5');
    
    // Section headings animation
    const headings = document.querySelectorAll('.section-title, .section-subtitle');
    headings.forEach(heading => {
        gsap.from(heading, {
            scrollTrigger: {
                trigger: heading,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });
    });
    
    // Property cards animation
    gsap.from('.property-card', {
        scrollTrigger: {
            trigger: '.property-grid',
            start: 'top 80%'
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out'
    });
    
    // ========= ENHANCED BANK CARD ANIMATIONS =========
    initBankCardAnimations();
    add3DTiltEffect();
    
    // Loan CTA entrance animation
    const loanCTA = document.querySelector('.loan-cta');
    if (loanCTA) {
        const ctaObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loanCTA.style.animation = 'ctaPopIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
                    ctaObserver.unobserve(loanCTA);
                }
            });
        }, { threshold: 0.2 });
        ctaObserver.observe(loanCTA);
    }
    
    // Location cards animation
    gsap.fromTo('.location-card', 
        { opacity: 0, scale: 0.9 },
        {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.5)',
            scrollTrigger: {
                trigger: '.location-grid',
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        }
    );
    
    // Testimonial cards animation
    gsap.from('.testimonial-card', {
        scrollTrigger: {
            trigger: '.testimonial-grid',
            start: 'top 85%'
        },
        x: -30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out'
    });
    
    // Stats counter animation
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const target = stat.textContent;
        if(!isNaN(parseInt(target))) {
            gsap.from(stat, {
                scrollTrigger: {
                    trigger: stat,
                    start: 'top 90%'
                },
                textContent: 0,
                duration: 2,
                ease: 'power1.out',
                snap: { textContent: 1 },
                onUpdate: function() {
                    stat.textContent = Math.round(stat.textContent) + '+';
                }
            });
        }
    });
});

// ============= BANK CARD FUNCTIONS (defined outside DOMContentLoaded) =============

function initBankCardAnimations() {
    const bankCards = document.querySelectorAll('.bank-card');
    if (bankCards.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const delay = Array.from(bankCards).indexOf(card) * 0.15;
                
                setTimeout(() => {
                    card.classList.add('animate-in');
                }, delay * 1000);
                
                addParticleEffect(card);
                observer.unobserve(card);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    bankCards.forEach(card => observer.observe(card));
    
    // Fallback
    setTimeout(() => {
        bankCards.forEach(card => {
            if (!card.classList.contains('animate-in')) {
                card.classList.add('animate-in');
            }
        });
    }, 1000);
}

function addParticleEffect(card) {
    card.addEventListener('mouseenter', createParticles);
    card.addEventListener('mouseleave', removeParticles);
}

function createParticles(e) {
    const card = e.currentTarget;
    const particleCount = 10;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'bank-particle';
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: ${getRandomColor()};
            border-radius: 50%;
            pointer-events: none;
            z-index: 1;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: 0;
            animation: particleFloat ${0.5 + Math.random()}s ease-out forwards;
        `;
        card.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }
}

function removeParticles(e) {
    const particles = e.currentTarget.querySelectorAll('.bank-particle');
    particles.forEach(p => p.remove());
}

function getRandomColor() {
    const colors = ['#004B8D', '#F15A29', '#003d4d', '#1E5F47', '#e6a434'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function addParticleStyles() {
    if (document.getElementById('particle-styles')) return;
    const style = document.createElement('style');
    style.id = 'particle-styles';
    style.textContent = `
        @keyframes particleFloat {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-50px) scale(0); }
        }
    `;
    document.head.appendChild(style);
}

function addCTAStyle() {
    if (document.getElementById('cta-styles')) return;
    const style = document.createElement('style');
    style.id = 'cta-styles';
    style.textContent = `
        @keyframes ctaPopIn {
            0% { opacity: 0; transform: scale(0.8); }
            60% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}
// Background Image Parallax & Animation Effects
document.addEventListener('DOMContentLoaded', () => {
    // Parallax effect on scroll
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const bodyBefore = document.querySelector('body');
        
        if (bodyBefore) {
            const style = getComputedStyle(bodyBefore, '::before');
            const transform = `scale(${1 + scrollY * 0.0001}) translateY(${scrollY * 0.02}px)`;
            // We can't directly modify pseudo-elements, so we use CSS custom properties
            document.documentElement.style.setProperty('--bg-transform', transform);
            document.documentElement.style.setProperty('--bg-opacity', Math.min(0.15 + scrollY * 0.0002, 0.25));
        }
    });
    
    // Intersection Observer for smooth section reveals
    const sections = document.querySelectorAll('section');
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        sectionObserver.observe(section);
    });
    
    // Mouse parallax effect on background
    document.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        
        document.documentElement.style.setProperty('--mouse-x', mouseX * 5);
        document.documentElement.style.setProperty('--mouse-y', mouseY * 5);
    });
});

// Add this to make the pseudo-element respond to mouse movement
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes mouseParallax {
        0% { transform: translate(0, 0); }
        100% { transform: translate(calc(var(--mouse-x) * 1px), calc(var(--mouse-y) * 1px)); }
    }
    
    body::before {
        animation: 
            fadeInBackground 2s ease-in-out forwards,
            mouseParallax 3s ease-out infinite alternate !important;
    }
`;
document.head.appendChild(styleSheet);
function add3DTiltEffect() {
    const cards = document.querySelectorAll('.bank-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-15px) scale(1.03)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
        });
    });
}
