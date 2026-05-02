import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createEnvironment } from './environment.js';
import { createMinoxidil, createSulfateGroup } from './molecules.js';
import { createChannel, createBloodVessel, createHairFollicle } from './channel.js';
import { createLabels, createIonLabel, toggleLabels } from './labels.js';
import { initAnimations, playStep, updateAnimations, pauseAnimations, resumeAnimations } from './animations.js';
import { initUI, advanceStep, getCurrentStep, getIsPlaying } from './ui.js';
import { initVR } from './vr.js';

// ============================================================
// Renderer
// ============================================================
const container = document.getElementById('canvas-container');

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
});
window.renderer = renderer; // Export for failsafe UI access
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// ============================================================
// CSS2D Renderer (for atom labels — billboarding)
// ============================================================
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

// ============================================================
// Scene & Camera
// ============================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 250);
camera.position.set(0, 2, 12);

// ============================================================
// Orbit Controls
// ============================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2;
controls.maxDistance = 70;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.8;
controls.target.set(0, 0, 0);

// ============================================================
// Environment
// ============================================================
const env = createEnvironment(scene);

// ============================================================
// Molecules
// ============================================================
const minoxidilGroup = createMinoxidil();
scene.add(minoxidilGroup);

const sulfateGroup = createSulfateGroup();
sulfateGroup.position.set(-10, 3, 4);
sulfateGroup.visible = false;
scene.add(sulfateGroup);

// Atom labels for the minoxidil molecule
createLabels(minoxidilGroup);

// NOTE: Enzyme label is handled inside animations.js (shown only during Step 1)

// ============================================================
// Channel, Vessel & Hair Follicle
// ============================================================
const channelGroup = createChannel();
channelGroup.position.set(15, 0, 0);
channelGroup.visible = false;
scene.add(channelGroup);

const vesselGroup = createBloodVessel();
vesselGroup.position.set(15, -12, 0);
vesselGroup.visible = false;
scene.add(vesselGroup);

const follicleGroup = createHairFollicle();
follicleGroup.position.set(0, 0, 0);
follicleGroup.visible = false;
scene.add(follicleGroup);

// Add K⁺ labels to some channel ions
const chUd = channelGroup.userData;
if (chUd.ions) {
    chUd.ions.forEach((ion, i) => {
        if (i % 3 === 0) createIonLabel(ion);
    });
}

// ============================================================
// Animations
// ============================================================
initAnimations({
    scene, camera,
    minoxidilGroup, sulfateGroup,
    channelGroup, vesselGroup, follicleGroup, env,
    onStepComplete: () => {
        if (getIsPlaying()) advanceStep();
    },
});

// ============================================================
// UI
// ============================================================
initUI({
    onStepChange: (step) => {
        playStep(step);
        // Adjust orbit target based on current step
        if (step <= 1) {
            controls.target.set(0, 0, 0);
        } else if (step >= 2 && step <= 4) {
            controls.target.set(15, 0, 0);
        } else if (step === 5) {
            controls.target.set(0, 0, 0);
        }
    },
    onPlayPause: (playing) => {
        if (playing) {
            resumeAnimations();
        } else {
            pauseAnimations();
        }
    },
    onReset: () => {
        playStep(0);
        controls.target.set(0, 0, 0);
    },
    onToggleLabels: () => {
        return toggleLabels();
    },
    onToggleAutoRotate: () => {
        controls.autoRotate = !controls.autoRotate;
        return controls.autoRotate;
    },
});

// ============================================================
// VR (graceful degradation — only shows if supported)
// ============================================================
try {
    initVR(renderer, scene);
} catch (e) {
    console.warn('WebXR init failed:', e);
}

// ============================================================
// Animation Loop
// ============================================================
const clock = new THREE.Clock();

function animate() {
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    controls.update();
    env.update(elapsed);
    updateAnimations(delta);

    // Subtle idle rotation for molecule at intro step
    if (getCurrentStep() === 0) {
        minoxidilGroup.rotation.y += delta * 0.25;
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// ============================================================
// Window Resize
// ============================================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// Hide loading screen
// ============================================================
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loading-screen')?.classList.add('hidden');
    }, 1200);
});

// Fallback — hide loading after 4s regardless
setTimeout(() => {
    document.getElementById('loading-screen')?.classList.add('hidden');
}, 4000);
