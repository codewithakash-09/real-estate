// Ultra-light animations - No lag
document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Only animate hero section
    gsap.from('.hero-title', { 
        y: 30, 
        opacity: 0, 
        duration: 0.8, 
        ease: 'power2.out' 
    });
    
    gsap.from('.hero-subtitle', { 
        y: 20, 
        opacity: 0, 
        duration: 0.6, 
        delay: 0.3 
    });
    
    // Simple fade-in for section titles
    document.querySelectorAll('h2.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 90%',
                once: true
            },
            y: 20,
            opacity: 0,
            duration: 0.6
        });
    });
    
    // Simple card entrance
    gsap.from('.property-card, .bank-card, .location-card, .testimonial-card', {
        scrollTrigger: {
            trigger: '.property-grid, .bank-grid, .location-grid, .testimonial-grid',
            start: 'top 90%',
            once: true
        },
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05
    });
});
