import * as THREE from 'three';

// ============================================================
// Cinematic Laboratory / Microscopic Environment
// ============================================================

export function createEnvironment(scene) {
    // Deep clinical dark blue background
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.015);

    // Grid floor
    const grid = new THREE.GridHelper(70, 70, 0x161640, 0x0c0c22);
    grid.position.y = -7;
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    scene.add(grid);

    // ── Lighting ──

    // Soft ambient
    const ambient = new THREE.AmbientLight(0x7777bb, 0.25);
    scene.add(ambient);

    // Key light (clinical white-blue)
    const keyLight = new THREE.DirectionalLight(0xddeeff, 1.3);
    keyLight.position.set(10, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    scene.add(keyLight);

    // Fill light (cool purple)
    const fillLight = new THREE.DirectionalLight(0x5533aa, 0.35);
    fillLight.position.set(-8, 5, -10);
    scene.add(fillLight);

    // Accent point light (follows molecule, warm accent)
    const accentLight = new THREE.PointLight(0x6c7eff, 1.8, 25);
    accentLight.position.set(0, 3, 0);
    scene.add(accentLight);

    // Rim light (pink/magenta for depth)
    const rimLight = new THREE.PointLight(0xff6b9d, 0.7, 35);
    rimLight.position.set(-6, 2, -6);
    scene.add(rimLight);

    // Bottom glow (simulates microscope backlight)
    const bottomLight = new THREE.PointLight(0x3366ff, 0.5, 30);
    bottomLight.position.set(0, -5, 0);
    scene.add(bottomLight);

    // ── Floating protein structures (ambient particles) ──
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        const c = new THREE.Color().setHSL(
            0.58 + Math.random() * 0.18,
            0.4 + Math.random() * 0.3,
            0.35 + Math.random() * 0.25
        );
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        sizes[i] = 0.04 + Math.random() * 0.08;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
        size: 0.07,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Volumetric light cone (spotlight effect) ──
    const coneGeo = new THREE.ConeGeometry(5, 16, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
        color: 0x6c7eff,
        transparent: true,
        opacity: 0.025,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 10, 0);
    cone.rotation.x = Math.PI;
    scene.add(cone);

    // ── Floating protein blobs (background decoration) ──
    const blobGroup = new THREE.Group();
    blobGroup.name = 'proteinBlobs';
    const blobGeo = new THREE.IcosahedronGeometry(0.5, 1);
    const blobMat = new THREE.MeshPhysicalMaterial({
        color: 0x334466,
        metalness: 0.0,
        roughness: 0.7,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
    });

    for (let i = 0; i < 12; i++) {
        const blob = new THREE.Mesh(blobGeo, blobMat.clone());
        blob.position.set(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 40
        );
        const s = 0.5 + Math.random() * 1.5;
        blob.scale.set(s, s * (0.6 + Math.random() * 0.8), s);
        blob.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        blob.userData.rotSpeed = (Math.random() - 0.5) * 0.3;
        blobGroup.add(blob);
    }
    scene.add(blobGroup);

    return {
        accentLight,
        particles,
        blobGroup,
        cone,
        update(time) {
            // Animate floating particles
            const posArr = particles.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                posArr[i * 3 + 1] += Math.sin(time * 0.4 + i * 0.7) * 0.0015;
                posArr[i * 3]     += Math.cos(time * 0.25 + i * 0.4) * 0.0008;
            }
            particles.geometry.attributes.position.needsUpdate = true;

            // Pulse accent light
            accentLight.intensity = 1.8 + Math.sin(time * 1.8) * 0.4;

            // Slowly rotate protein blobs
            blobGroup.children.forEach(blob => {
                blob.rotation.y += blob.userData.rotSpeed * 0.01;
                blob.rotation.x += blob.userData.rotSpeed * 0.005;
            });

            // Volumetric cone subtle pulse
            cone.material.opacity = 0.02 + Math.sin(time * 0.8) * 0.008;
        }
    };
}
