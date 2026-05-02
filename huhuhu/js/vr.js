import * as THREE from 'three';

/**
 * Initialize WebXR VR support with controller bindings.
 * Gracefully degrades — if VR is not available, no button is shown.
 * - Right controller trigger: Next Step
 * - Left controller trigger: Previous Step
 */
export function initVR(renderer, scene) {
    // Only enable VR if the browser supports it
    if (!navigator.xr) {
        console.info('WebXR not available in this browser. VR mode disabled.');
        return null;
    }

    // Forcefully bypass Three.js internal hardware checks to ALWAYS show "ENTER VR"
    // This fixes issues where the WebXR emulator extension fails to report itself in time.
    const originalIsSessionSupported = navigator.xr.isSessionSupported.bind(navigator.xr);
    navigator.xr.isSessionSupported = (mode) => {
        if (mode === 'immersive-vr') return Promise.resolve(true);
        return originalIsSessionSupported(mode);
    };

        renderer.xr.enabled = true;
        // Dynamically import and create VR button
        import('three/addons/webxr/VRButton.js').then(({ VRButton }) => {
            const vrButton = VRButton.createButton(renderer);

            // Force positioning with !important via JS to bypass CSS caching and override Three.js defaults
            vrButton.style.setProperty('position', 'fixed', 'important');
            vrButton.style.setProperty('bottom', '28px', 'important');
            vrButton.style.setProperty('left', '28px', 'important');
            vrButton.style.setProperty('right', 'auto', 'important');
            vrButton.style.setProperty('top', 'auto', 'important');
            vrButton.style.setProperty('transform', 'none', 'important');
            vrButton.style.setProperty('z-index', '200', 'important');
            document.body.appendChild(vrButton);

            // Controller 0 (right hand) → Next Step
            const controller0 = renderer.xr.getController(0);
            controller0.addEventListener('selectstart', () => {
                document.getElementById('btn-next')?.click();
            });
            scene.add(controller0);

            // Controller 1 (left hand) → Previous Step
            const controller1 = renderer.xr.getController(1);
            controller1.addEventListener('selectstart', () => {
                document.getElementById('btn-prev')?.click();
            });
            scene.add(controller1);

            // Controller ray visualization
            const rayGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -5),
            ]);
            const rayMaterial = new THREE.LineBasicMaterial({
                color: 0x6c7eff,
                transparent: true,
                opacity: 0.5,
            });
            controller0.add(new THREE.Line(rayGeometry, rayMaterial));
            controller1.add(new THREE.Line(rayGeometry.clone(), rayMaterial.clone()));

            // Controller grip indicators
            const gripGeo = new THREE.SphereGeometry(0.04, 12, 8);
            const gripMat = new THREE.MeshPhysicalMaterial({
                color: 0x6c7eff,
                emissive: 0x6c7eff,
                emissiveIntensity: 0.3,
                metalness: 0.2,
                roughness: 0.3,
            });
            const grip0 = renderer.xr.getControllerGrip(0);
            grip0.add(new THREE.Mesh(gripGeo, gripMat));
            scene.add(grip0);

            const grip1 = renderer.xr.getControllerGrip(1);
            grip1.add(new THREE.Mesh(gripGeo, gripMat.clone()));
            scene.add(grip1);
        }).catch(err => {
            console.warn('Failed to load VRButton:', err);
        });

    return null;
}
