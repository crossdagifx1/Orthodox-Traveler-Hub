/**
 * =============================================================================
 * NEURALIS // COGNITIVE ORCHESTRATION ENGINE
 * VERSION: 1.0.0
 * ARCHITECT: DAGMAWI AMARE
 * =============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 00. SYSTEM CONFIGURATION ---
    const SYSTEM = {
        ACCENT: 0x00f2ff,
        BG: 0x03040a,
        NODES: 300,
        CONNECTIONS_DISTANCE: 2.5,
        LERP_SPEED: 0.05,
    };

    let lenis, scene, camera, renderer, neuralMesh;
    let clock = new THREE.Clock();
    let mouse = new THREE.Vector2(0, 0);

    // --- 01. COGNITIVE AUTH (PRELOADER) ---
    const initAuth = () => {
        const progressEl = document.querySelector('.auth-progress');
        const authScreen = document.getElementById('auth-sequence');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 4) + 1;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                finalizeAuth();
            }
            if (progressEl) progressEl.innerText = `${progress}%`;
        }, 80);

        function finalizeAuth() {
            gsap.to(authScreen, {
                opacity: 0,
                duration: 1.5,
                ease: "expo.inOut",
                onComplete: () => {
                    authScreen.style.display = 'none';
                    initMainAnimations();
                }
            });
        }
    };

    // --- 02. SMOOTH MOMENTUM ENGINE (LENIS) ---
    const initScroll = () => {
        lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            lerp: 0.05,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    };

    // --- 03. 3D NEURAL KERNEL (THREE.JS) ---
    const init3D = () => {
        const container = document.getElementById('neural-canvas');
        
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 10;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Neural Mesh Construction
        const particlesCount = SYSTEM.NODES;
        const positions = new Float32Array(particlesCount * 3);
        const velocities = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 20;
            velocities[i] = (Math.random() - 0.5) * 0.02;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: SYSTEM.ACCENT,
            size: 0.08,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        neuralMesh = new THREE.Points(geometry, material);
        scene.add(neuralMesh);

        // Connection Lines
        const lineMaterial = new THREE.LineBasicMaterial({
            color: SYSTEM.ACCENT,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });

        const lineGeometry = new THREE.BufferGeometry();
        const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lineMesh);

        // Mouse Tracker
        window.addEventListener('mousemove', (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();
            
            const posAttr = neuralMesh.geometry.attributes.position;
            const linePositions = [];

            for (let i = 0; i < particlesCount; i++) {
                // Apply Velocity
                posAttr.array[i * 3] += velocities[i * 3];
                posAttr.array[i * 3 + 1] += velocities[i * 3 + 1];
                posAttr.array[i * 3 + 2] += velocities[i * 3 + 2];

                // Bounds Check
                if (Math.abs(posAttr.array[i * 3]) > 10) velocities[i * 3] *= -1;
                if (Math.abs(posAttr.array[i * 3 + 1]) > 10) velocities[i * 3 + 1] *= -1;
                if (Math.abs(posAttr.array[i * 3 + 2]) > 10) velocities[i * 3 + 2] *= -1;

                // Mouse Displacement
                const dx = posAttr.array[i * 3] - mouse.x * 5;
                const dy = posAttr.array[i * 3 + 1] - mouse.y * 5;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 3) {
                    posAttr.array[i * 3] += dx * 0.01;
                    posAttr.array[i * 3 + 1] += dy * 0.01;
                }

                // Line Calculation (Expensive but required for Billion Dollar aesthetic)
                for (let j = i + 1; j < particlesCount; j++) {
                    const dx2 = posAttr.array[i * 3] - posAttr.array[j * 3];
                    const dy2 = posAttr.array[i * 3 + 1] - posAttr.array[j * 3 + 1];
                    const dz2 = posAttr.array[i * 3 + 2] - posAttr.array[j * 3 + 2];
                    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2 + dz2 * dz2);

                    if (dist2 < SYSTEM.CONNECTIONS_DISTANCE) {
                        linePositions.push(
                            posAttr.array[i * 3], posAttr.array[i * 3 + 1], posAttr.array[i * 3 + 2],
                            posAttr.array[j * 3], posAttr.array[j * 3 + 1], posAttr.array[j * 3 + 2]
                        );
                    }
                }
            }

            posAttr.needsUpdate = true;
            lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            
            // Pulse Material
            material.opacity = 0.5 + Math.sin(time * 2) * 0.3;
            
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    };

    // --- 04. INTERFACE ANIMATIONS (GSAP) ---
    const initMainAnimations = () => {
        gsap.registerPlugin(ScrollTrigger);

        // Slide Entry Animations
        const slides = gsap.utils.toArray('.slide');
        slides.forEach((slide, i) => {
            const content = slide.querySelector('.content-wrapper');
            if (!content) return;

            gsap.from(content, {
                scrollTrigger: {
                    trigger: slide,
                    start: "top 80%",
                    end: "top 20%",
                    scrub: 1,
                },
                y: 100,
                opacity: 0,
                filter: "blur(10px)",
                duration: 2,
                ease: "power2.out"
            });

            // Camera Reaction
            ScrollTrigger.create({
                trigger: slide,
                start: "top bottom",
                onUpdate: (self) => {
                    const p = self.progress;
                    camera.position.z = 10 - p * 4;
                    camera.rotation.y = p * 0.5;
                }
            });
        });

        // Glitch Loop
        setInterval(() => {
            const glitch = document.querySelector('.glitch-text');
            if (glitch) {
                gsap.to(glitch, { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10, duration: 0.1, yoyo: true, repeat: 1 });
            }
        }, 3000);
    };

    // --- 05. INTERFACE CURSOR ---
    const initCursor = () => {
        const point = document.querySelector('.cursor-point');
        const ring = document.querySelector('.cursor-ring');
        
        let mX = 0, mY = 0;
        let rX = 0, rY = 0;

        window.addEventListener('mousemove', (e) => {
            mX = e.clientX;
            mY = e.clientY;
            
            gsap.to(point, { x: mX, y: mY, duration: 0.1 });
        });

        const updateRing = () => {
            rX += (mX - rX) * 0.15;
            rY += (mY - rY) * 0.15;
            
            if (ring) {
                ring.style.left = `${rX}px`;
                ring.style.top = `${rY}px`;
            }
            requestAnimationFrame(updateRing);
        };
        updateRing();

        // Hover States
        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(ring, { scale: 1.5, borderColor: SYSTEM.ACCENT, duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(ring, { scale: 1, borderColor: 'rgba(0, 242, 255, 0.5)', duration: 0.3 });
            });
        });
    };

    // --- 06. SYSTEM UTILITIES (MASSIVE BUFFER) ---
    /**
     * [NEURALIS COGNITIVE LAYER]
     * Complex math for synaptic bridging and neural latency calculations.
     */
    const NeuralUtils = {
        calcLatency: (distance) => distance * 0.0034,
        normalizeSync: (acc, val) => (acc + val) / 2,
        // Procedural generation of cognitive patterns
        genPattern: (seed) => Math.sin(seed * 0.5) * Math.cos(seed * 0.3)
    };

    // Start Sequence
    initAuth();
    initScroll();
    init3D();
    initCursor();
});

/**
 * -----------------------------------------------------------------------------
 * ARCHITECT LOG // NEURALIS_KERNEL_v5
 * -----------------------------------------------------------------------------
 * - Initialized 3D Neural Mesh (300 Node Cluster).
 * - Implemented Synaptic Line Logic (Real-time Geometry Update).
 * - Synchronized Cognitive Auth Sequence with Interface State.
 * - Optimized Momentum Scroll for Neuro-feedback.
 */
