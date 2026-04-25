/*
 * © 2026 La Gerencia — Restaurante & Club Billar
 * Script de animaciones — menú
 */

const els = document.querySelectorAll('.anim-fade-up, .anim-fade-in, .anim-slide-r');

const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
        }
    });
}, { threshold: 0.12 });

els.forEach(el => obs.observe(el));
