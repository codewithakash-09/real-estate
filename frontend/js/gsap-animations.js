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
        .from('.hero-title', { y: 50, opacity: 0, duration: 1, ease: 'power3.out' })
        .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
        .from('.hero-cta .btn', { y: 20, opacity: 0, duration: 0.6, stagger: 0.2, ease: 'back.out(1.7)' }, '-=0.3')
        .from('.badge', { scale: 0, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }, '-=0.5');
    
    // FIX: Target specific headings instead of entire sections to avoid nested opacity bugs
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
    
    // Bank cards animation - Speed optimized to fix slow loading
    gsap.from('.bank-card', {
        scrollTrigger: {
            trigger: '.bank-grid',
            start: 'top 85%'
        },
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
    });
    
    // Location cards animation - Fixed the blank section issue
    gsap.from('.location-card', {
        scrollTrigger: {
            trigger: '.location-grid',
            start: 'top 85%'
        },
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.5)'
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
        // Check to make sure we are only animating actual numbers
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
