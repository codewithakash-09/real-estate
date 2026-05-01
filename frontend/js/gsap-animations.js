// GSAP Animations
document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);
    
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
        .from('.hero-title', {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        })
        .from('.hero-subtitle', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        }, '-=0.5')
        .from('.hero-cta .btn', {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.2,
            ease: 'back.out(1.7)'
        }, '-=0.3')
        .from('.badge', {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'back.out(1.7)'
        }, '-=0.5');
    
    // Scroll reveal animations
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            y: 60,
            opacity: 0,
            duration: 1,
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
    
    // Bank cards animation
    gsap.from('.bank-card', {
        scrollTrigger: {
            trigger: '.bank-grid',
            start: 'top 80%'
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out'
    });
    
    // Location cards animation
    gsap.from('.location-card', {
        scrollTrigger: {
            trigger: '.location-grid',
            start: 'top 80%'
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)'
    });
    
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
        const numericValue = parseInt(target);
        
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
    });
});
