import * as THREE from 'three';

// ============================================================
// 5-Step Animation Controller
// Step 0: Intro (idle)
// Step 1: Bioactivation (SULT1A1 enzyme transforms Minoxidil)
// Step 2: Binding (molecule docks into K-ATP channel)
// Step 3: Channel Opening (pore gates expand, ions appear)
// Step 4: Ion Flow & Vasodilation (K⁺ streaming, vessel expands)
// Step 5: Hair Growth Cycle (follicle, vellus → terminal hair)
// ============================================================

let scene, camera, minoxidilGroup, sulfateGroup, channelGroup, vesselGroup, follicleGroup;
let env, enzymeParticles;
let activeTimeline = null;
let timelineProgress = 0;
let isAnimating = false;
let onStepComplete = null;

const STEP_DURATION = 5.0; // seconds per step

// Enzyme particle system for Step 1
let enzymeParticleSystem = null;

export function initAnimations(refs) {
    scene = refs.scene;
    camera = refs.camera;
    minoxidilGroup = refs.minoxidilGroup;
    sulfateGroup = refs.sulfateGroup;
    channelGroup = refs.channelGroup;
    vesselGroup = refs.vesselGroup;
    follicleGroup = refs.follicleGroup;
    env = refs.env;
    onStepComplete = refs.onStepComplete;

    // Initial state
    minoxidilGroup.visible = true;
    if (sulfateGroup) sulfateGroup.visible = false;
    channelGroup.visible = false;
    vesselGroup.visible = false;
    follicleGroup.visible = false;

    // Create enzyme particle system
    createEnzymeParticles();
}

function createEnzymeParticles() {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 3;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
        const c = new THREE.Color().setHSL(
            0.12 + Math.random() * 0.08, // warm yellow-orange
            0.8,
            0.5 + Math.random() * 0.3
        );
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });

    enzymeParticleSystem = new THREE.Points(geo, mat);
    enzymeParticleSystem.position.set(-4, 0.5, 0);
    enzymeParticleSystem.visible = false;
    scene.add(enzymeParticleSystem);
}

export function playStep(step) {
    isAnimating = true;
    timelineProgress = 0;

    if (step === 0) resetAll();
    else if (step === 1) setupStep1();
    else if (step === 2) setupStep2();
    else if (step === 3) setupStep3();
    else if (step === 4) setupStep4();
    else if (step === 5) setupStep5();
}

export function updateAnimations(delta) {
    if (!isAnimating) return;

    timelineProgress += delta / STEP_DURATION;
    if (timelineProgress >= 1) {
        timelineProgress = 1;
        isAnimating = false;
    }

    const t = easeInOutCubic(Math.min(timelineProgress, 1));

    if (activeTimeline) {
        activeTimeline(t, delta);
    }

    // Pulse sulfate glow when visible
    if (sulfateGroup?.visible) {
        const glowSphere = sulfateGroup.getObjectByName('sulfateGlow');
        if (glowSphere) {
            const pulse = 0.06 + Math.sin(performance.now() * 0.004) * 0.04;
            glowSphere.material.opacity = pulse;
            const s = 1.0 + Math.sin(performance.now() * 0.003) * 0.15;
            glowSphere.scale.setScalar(s);
        }
    }

    if (timelineProgress >= 1 && onStepComplete) {
        onStepComplete();
    }
}

export function pauseAnimations() { isAnimating = false; }
export function resumeAnimations() { if (timelineProgress < 1) isAnimating = true; }
export function getIsAnimating() { return isAnimating; }

// ============================================================
// Easing
// ============================================================
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ============================================================
// Reset to intro state
// ============================================================
function resetAll() {
    activeTimeline = null;
    isAnimating = false;
    timelineProgress = 0;

    minoxidilGroup.visible = true;
    minoxidilGroup.position.set(0, 0, 0);
    minoxidilGroup.rotation.set(0, 0, 0);
    minoxidilGroup.scale.setScalar(1);

    if (sulfateGroup) {
        sulfateGroup.visible = false;
        sulfateGroup.position.set(-8, 2, 3);
    }

    if (enzymeParticleSystem) {
        enzymeParticleSystem.visible = false;
        enzymeParticleSystem.material.opacity = 0;
    }

    channelGroup.visible = false;
    channelGroup.position.set(15, 0, 0);

    const ud = channelGroup.userData;
    if (ud.poreGates) {
        ud.poreGates.forEach((gate, i) => {
            const angle = (i / 4) * Math.PI * 2;
            gate.position.set(Math.cos(angle) * 2, 0, Math.sin(angle) * 2);
        });
    }
    if (ud.ions) ud.ions.forEach(ion => { ion.visible = false; });
    if (ud.streamIons) ud.streamIons.forEach(ion => { ion.visible = false; });
    if (ud.bindingSite) ud.bindingSite.visible = false;

    vesselGroup.visible = false;
    follicleGroup.visible = false;

    if (window.gsap) {
        gsap.to(camera.position, { x: 0, y: 2, z: 12, duration: 1.2, ease: 'power2.inOut' });
    } else {
        camera.position.set(0, 2, 12);
    }
}

// ============================================================
// Step 1: Bioactivation – SULT1A1 + Minoxidil → Minoxidil Sulfate
// ============================================================
function setupStep1() {
    minoxidilGroup.visible = true;
    minoxidilGroup.position.set(0, 0, 0);
    channelGroup.visible = false;
    vesselGroup.visible = false;
    follicleGroup.visible = false;

    // Show sulfate group approaching
    if (sulfateGroup) {
        sulfateGroup.visible = true;
        sulfateGroup.position.set(-10, 3, 4);
    }

    // Show enzyme particles
    if (enzymeParticleSystem) {
        enzymeParticleSystem.visible = true;
        enzymeParticleSystem.position.set(-5, 1, 1);
    }

    if (window.gsap) {
        gsap.to(camera.position, { x: 2, y: 3, z: 10, duration: 1.8, ease: 'power2.inOut' });
    }

    const sulfateStart = new THREE.Vector3(-10, 3, 4);
    const sulfateEnd = new THREE.Vector3(-3.97, 0.05, -0.24);

    activeTimeline = (t) => {
        if (!sulfateGroup) return;

        // Enzyme particles converge on molecule
        if (enzymeParticleSystem) {
            const posArr = enzymeParticleSystem.geometry.attributes.position.array;
            const convergeFactor = Math.min(t * 2, 1);
            enzymeParticleSystem.material.opacity = convergeFactor * 0.7;
            
            for (let i = 0; i < posArr.length / 3; i++) {
                const targetX = (Math.random() - 0.5) * (3 - convergeFactor * 2.5);
                const targetY = (Math.random() - 0.5) * (3 - convergeFactor * 2.5);
                const targetZ = (Math.random() - 0.5) * (3 - convergeFactor * 2.5);
                posArr[i * 3] += (targetX - posArr[i * 3]) * 0.01;
                posArr[i * 3 + 1] += (targetY - posArr[i * 3 + 1]) * 0.01;
                posArr[i * 3 + 2] += (targetZ - posArr[i * 3 + 2]) * 0.01;
            }
            enzymeParticleSystem.geometry.attributes.position.needsUpdate = true;

            // Move enzyme particles toward molecule center
            enzymeParticleSystem.position.lerp(new THREE.Vector3(-3.5, 0.3, 0), t * 0.5);
            enzymeParticleSystem.rotation.y += 0.02;
        }

        // Sulfate group flies toward molecule
        sulfateGroup.position.lerpVectors(sulfateStart, sulfateEnd, t);
        sulfateGroup.rotation.y = t * Math.PI * 3;
        sulfateGroup.rotation.x = t * Math.PI * 0.5;

        // Intensify glow as sulfate approaches
        sulfateGroup.traverse(child => {
            if (child.isMesh && child.material && child.material.emissive) {
                child.material.emissiveIntensity = 0.2 + t * 1.2;
            }
        });

        // Pulse the main molecule on contact
        if (t > 0.75) {
            const pulseT = (t - 0.75) / 0.25;
            const pulse = 1 + Math.sin(pulseT * 20) * 0.04 * (1 - pulseT);
            minoxidilGroup.scale.setScalar(pulse);

            // Flash the molecule
            minoxidilGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.emissiveIntensity = 0.06 + pulseT * 0.4;
                }
            });
        }

        // Fade out enzyme particles toward end
        if (t > 0.85 && enzymeParticleSystem) {
            enzymeParticleSystem.material.opacity = Math.max(0, 0.7 - (t - 0.85) * 4.5);
        }
    };
}

// ============================================================
// Step 2: Binding – Minoxidil Sulfate docks to K_ATP channel
// ============================================================
function setupStep2() {
    minoxidilGroup.visible = true;
    if (sulfateGroup) sulfateGroup.visible = false;
    if (enzymeParticleSystem) enzymeParticleSystem.visible = false;
    channelGroup.visible = true;
    channelGroup.position.set(15, 0, 0);
    vesselGroup.visible = false;
    follicleGroup.visible = false;

    const ud = channelGroup.userData;
    if (ud.bindingSite) ud.bindingSite.visible = true;

    const molStart = new THREE.Vector3(0, 0, 0);
    const molEnd = new THREE.Vector3(11.5, 1.5, 2.2);
    const camEnd = new THREE.Vector3(13, 5, 16);

    if (window.gsap) {
        gsap.to(camera.position, { x: camEnd.x, y: camEnd.y, z: camEnd.z, duration: 2.5, ease: 'power2.inOut' });
    }

    activeTimeline = (t) => {
        // Move molecule toward channel
        minoxidilGroup.position.lerpVectors(molStart, molEnd, t);
        minoxidilGroup.rotation.y = t * Math.PI * 0.6;
        minoxidilGroup.scale.setScalar(1.0);

        // Binding site pulses with increasing intensity
        if (ud.bindingSite) {
            const pulseFreq = 8 + t * 12;
            ud.bindingSite.material.opacity = 0.15 + Math.sin(t * pulseFreq) * 0.2 + t * 0.15;
            ud.bindingSite.scale.setScalar(0.75 + Math.sin(t * 6) * 0.2 + t * 0.2);
            ud.bindingSite.material.emissiveIntensity = 0.3 + t * 0.8;
        }

        // Flash on docking contact
        if (t > 0.88) {
            const flash = (t - 0.88) / 0.12;
            minoxidilGroup.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.emissiveIntensity = flash * 0.6;
                }
            });
            // Binding site locks in
            if (ud.bindingSite) {
                ud.bindingSite.scale.setScalar(1.2 - flash * 0.4);
                ud.bindingSite.material.opacity = 0.6 - flash * 0.2;
            }
        }
    };
}

// ============================================================
// Step 3: Pore Opening – Conformational change
// ============================================================
function setupStep3() {
    minoxidilGroup.visible = true;
    channelGroup.visible = true;
    vesselGroup.visible = false;
    follicleGroup.visible = false;

    const ud = channelGroup.userData;
    if (ud.bindingSite) ud.bindingSite.visible = false;

    // Show ions
    if (ud.ions) ud.ions.forEach(ion => { ion.visible = true; ion.scale.setScalar(0.1); });

    if (window.gsap) {
        gsap.to(camera.position, { x: 15, y: 7, z: 12, duration: 1.8, ease: 'power2.inOut' });
    }

    const baseRadius = 2.0;
    const expandedRadius = 4.0;

    activeTimeline = (t) => {
        // Morph pore gates outward (conformational change)
        if (ud.poreGates) {
            ud.poreGates.forEach((gate, i) => {
                const angle = (i / 4) * Math.PI * 2;
                const r = baseRadius + (expandedRadius - baseRadius) * easeOutBack(t);
                gate.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);

                // Subunits also tilt slightly outward
                const tiltAngle = t * 0.15;
                gate.rotation.z = tiltAngle;
            });
        }

        // Ions grow and become visible with glow
        if (ud.ions) {
            ud.ions.forEach((ion, idx) => {
                ion.visible = true;
                const stagger = idx * 0.08;
                const ionT = Math.max(0, Math.min(1, (t - stagger) / (1 - stagger)));
                const s = ionT * 1.0;
                ion.scale.setScalar(s);
                if (ion.material) {
                    ion.material.emissiveIntensity = 0.5 + ionT * 0.6;
                }
                // Slight float animation
                ion.position.y += Math.sin(performance.now() * 0.003 + idx) * 0.003;
            });
        }

        // SUR subunits shift slightly
        if (ud.surSubunits) {
            ud.surSubunits.forEach((sur) => {
                const angle = sur.userData.baseAngle;
                const newR = sur.userData.baseRadius + t * 0.5;
                sur.position.set(Math.cos(angle) * newR, 0, Math.sin(angle) * newR);
            });
        }
    };
}

// ============================================================
// Step 4: Ion Flow & Vasodilation
// ============================================================
function setupStep4() {
    minoxidilGroup.visible = true;
    channelGroup.visible = true;
    vesselGroup.visible = true;
    vesselGroup.position.set(15, -12, 0);
    vesselGroup.scale.setScalar(0.1);
    follicleGroup.visible = false;

    const ud = channelGroup.userData;

    // Position streaming ions at the pore
    if (ud.streamIons) {
        ud.streamIons.forEach((ion) => {
            ion.visible = true;
            ion.position.set(
                (Math.random() - 0.5) * 0.4,
                -1 + Math.random() * 0.5,
                (Math.random() - 0.5) * 0.4
            );
        });
    }

    if (window.gsap) {
        gsap.to(camera.position, { x: 15, y: 2, z: 22, duration: 2.2, ease: 'power2.inOut' });
    }

    activeTimeline = (t, delta) => {
        // Stream K⁺ ions outward through the open pore
        if (ud.streamIons) {
            ud.streamIons.forEach((ion) => {
                ion.position.y += ion.userData.speed * delta;
                ion.position.x += Math.sin(ion.position.y * 1.5 + ion.userData.angle) * 0.025;
                ion.position.z += Math.cos(ion.position.y * 1.5 + ion.userData.angle) * 0.025;

                // Reset ions that go too far
                if (ion.position.y > 18) {
                    ion.position.y = -1 + Math.random() * 0.5;
                    ion.position.x = (Math.random() - 0.5) * 0.4;
                    ion.position.z = (Math.random() - 0.5) * 0.4;
                }
            });
        }

        // Vessel appears and expands (vasodilation)
        if (vesselGroup.visible) {
            const vesselT = Math.min(t * 1.5, 1);
            vesselGroup.scale.setScalar(0.1 + vesselT * 0.9);

            const wall = vesselGroup.getObjectByName('vesselWall');
            if (wall) {
                wall.material.opacity = 0.2 + vesselT * 0.25;
            }

            const inner = vesselGroup.getObjectByName('vesselInner');
            if (inner) {
                inner.material.opacity = 0.05 + vesselT * 0.15;
            }

            // Simulate vasodilation (scale expansion)
            if (t > 0.4) {
                const expandT = (t - 0.4) / 0.6;
                const expandScale = 1 + expandT * 0.6;
                vesselGroup.scale.set(expandScale, 1, expandScale);
            }
        }
    };
}

// ============================================================
// Step 5: Hair Growth Cycle
// ============================================================
function setupStep5() {
    minoxidilGroup.visible = false;
    if (sulfateGroup) sulfateGroup.visible = false;
    channelGroup.visible = false;
    vesselGroup.visible = false;
    follicleGroup.visible = true;
    follicleGroup.position.set(0, 0, 0);
    follicleGroup.scale.setScalar(1);

    const fud = follicleGroup.userData;

    // Reset hair to vellus state
    if (fud.hair) {
        fud.hair.scale.set(1, 1, 1);
        fud.hair.position.y = 3.5;
    }

    if (window.gsap) {
        gsap.to(camera.position, { x: 3, y: 3, z: 10, duration: 2, ease: 'power2.inOut' });
    }

    activeTimeline = (t) => {
        // Anagen phase: follicle bulb grows, papilla glows
        if (fud.papilla) {
            fud.papilla.material.emissiveIntensity = 0.3 + t * 1.2;
            fud.papilla.scale.setScalar(1 + t * 0.3);
        }

        // Capillary dilates
        if (fud.capillary) {
            fud.capillary.scale.setScalar(1 + t * 0.8);
            fud.capillary.material.opacity = 0.5 + t * 0.3;
        }

        // Bulb enlarges (active anagen)
        if (fud.bulb) {
            fud.bulb.scale.set(1 + t * 0.3, 1.4 + t * 0.5, 1 + t * 0.3);
        }

        // Hair transforms: vellus → terminal
        // Scale up thickness and length
        if (fud.hair) {
            const scaleX = 1 + t * 2.5;  // Gets thicker
            const scaleY = 1 + t * 1.8;  // Gets longer
            const scaleZ = 1 + t * 2.5;
            fud.hair.scale.set(scaleX, scaleY, scaleZ);
            fud.hair.position.y = 3.5 + t * 1.5; // Grows upward

            // Darken the hair color (vellus is light, terminal is dark)
            if (fud.hair.material) {
                const lightness = 0.25 - t * 0.15;
                fud.hair.material.color.setHSL(0.07, 0.5, lightness);
                fud.hair.material.clearcoat = 0.8 + t * 0.2;
            }
        }

        // Shaft thickens
        if (fud.shaft) {
            fud.shaft.scale.set(1 + t * 0.8, 1 + t * 0.3, 1 + t * 0.8);
        }
    };
}
