import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let time = 0;

        // Interaction State
        let mouse = { x: null, y: null };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const handleMouseMove = (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        function getNoiseAngle(x, y, t) {
            // 2D Flow Noise
            const scale = 0.001;
            return Math.PI * 2 * (
                Math.sin(x * scale + t * 0.5) +
                Math.cos(y * scale + t * 0.2)
            );
        }

        class Particle {
            constructor() {
                this.init(true);
            }

            init(randomizePosition = false) {
                if (randomizePosition) {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;
                } else {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;
                }

                this.vx = 0;
                this.vy = 0;

                this.size = Math.random() * 2 + 1; // Consistent 2D size

                // Color Palette
                const colors = [
                    { r: 100, g: 150, b: 255 },
                    { r: 50, g: 100, b: 240 },
                    { r: 150, g: 200, b: 255 },
                    { r: 80, g: 220, b: 255 },
                ];
                this.colorRGB = colors[Math.floor(Math.random() * colors.length)];

                this.history = [];
                this.maxHistory = 5;
            }

            update(isActive) {
                // Time scale
                const flowTime = time * 0.1; // Slower flow feel

                if (isActive && mouse.x !== null) {
                    // Active: Attract to mouse but maintain some flow
                    // "Surge toward target"
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Controlled attraction
                    // We don't want them to just collapse into a point.
                    // Let's make them orbit or swirl around the mouse.

                    const swirlStrength = 0.05;
                    const attractStrength = 0.02;

                    // Attract
                    if (dist > 50) {
                        this.vx += dx * attractStrength * 0.1;
                        this.vy += dy * attractStrength * 0.1;
                    }

                    // Swirl (tangent)
                    this.vx += -dy * swirlStrength * 0.1;
                    this.vy += dx * swirlStrength * 0.1;

                } else {
                    // Idle: Flow Field
                    const angle = getNoiseAngle(this.x, this.y, time);
                    const force = 0.1;

                    this.vx += Math.cos(angle) * force;
                    this.vy += Math.sin(angle) * force;

                    // Occasional random surge
                    if (Math.random() < 0.005) {
                        this.vx *= 2;
                        this.vy *= 2;
                    }
                }

                // Friction
                this.vx *= 0.95;
                this.vy *= 0.95;

                // Speed Limit
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                const limit = isActive ? 10 : 4;
                if (speed > limit) {
                    this.vx = (this.vx / speed) * limit;
                    this.vy = (this.vy / speed) * limit;
                }

                this.x += this.vx;
                this.y += this.vy;

                // Update History for Trails
                // IMPORTANT: If we wrapped, don't push a history point that creates a long line
                this.history.push({ x: this.x, y: this.y });
                if (this.history.length > this.maxHistory) this.history.shift();

                // Boundary Wrapping
                let wrapped = false;
                const margin = 50;
                if (this.x < -margin) { this.x = canvas.width + margin; wrapped = true; }
                if (this.x > canvas.width + margin) { this.x = -margin; wrapped = true; }
                if (this.y < -margin) { this.y = canvas.height + margin; wrapped = true; }
                if (this.y > canvas.height + margin) { this.y = -margin; wrapped = true; }

                if (wrapped) {
                    this.history = []; // Clear history to prevent cross-screen lines
                }
            }

            draw() {
                const alpha = 0.8;
                ctx.fillStyle = `rgba(${this.colorRGB.r}, ${this.colorRGB.g}, ${this.colorRGB.b}, ${alpha})`;

                // Draw Trail
                if (this.history.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${this.colorRGB.r}, ${this.colorRGB.g}, ${this.colorRGB.b}, ${alpha})`;
                    ctx.lineWidth = this.size;
                    ctx.lineCap = 'round';
                    // ctx.lineJoin = 'round';

                    ctx.moveTo(this.history[0].x, this.history[0].y);
                    for (let i = 1; i < this.history.length; i++) {
                        ctx.lineTo(this.history[i].x, this.history[i].y);
                    }
                    ctx.stroke();
                } else {
                    // Fallback dot
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        function initParticles() {
            particles = [];
            const count = 300; // Increased density for 2D flow
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.01;

            const isActive = (mouse.x !== null);

            particles.forEach(p => {
                p.update(isActive);
                p.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        handleResize();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="particle-background"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: -1
            }}
        />
    );
};

export default ParticleBackground;
