/*
 * © 2026 La Gerencia — Restaurante & Club Billar
 * Script de animaciones — index
 */

const targets = document.querySelectorAll('.anim-fade-up, .anim-fade-in');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

targets.forEach(el => observer.observe(el));
