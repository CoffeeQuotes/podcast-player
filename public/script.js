// Implement lenis to work in my card-container properly 

// Initialize Lenis on the cards container
const cardContainer = document.querySelector('.cards-container');

const lenis = new Lenis({
    wrapper: cardContainer,
    content: cardContainer,
    duration: 1.6, // slightly longer = smoother
    easing: (t) => 1 - Math.pow(1 - t, 3), // softer easing
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 0.8, // reduces jumpiness
    smoothTouch: true, // keeps behavior consistent
    touchMultiplier: 1.5,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);