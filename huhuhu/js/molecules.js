import * as THREE from 'three';

// ============================================================
// Atom color & radius data (CPK standard coloring)
// ============================================================
export const ELEMENT_COLORS = {
    C: 0x555555,   // Carbon – dark grey
    N: 0x3366ff,   // Nitrogen – blue
    O: 0xff3333,   // Oxygen – red
    S: 0xffdd00,   // Sulfur – yellow
    H: 0xeeeeee,   // Hydrogen – white
};

export const ELEMENT_RADII = {
    C: 0.34,
    N: 0.32,
    O: 0.30,
    S: 0.42,
    H: 0.18,
};

const BOND_RADIUS = 0.065;

// ============================================================
// PubChem CID 4201 – Minoxidil  (C₉H₁₅N₅O)
// 3D conformer coordinates from PubChem (Å units)
// ============================================================
const MINOXIDIL_ATOMS = [
    { id: 1,  el: 'O', x: -3.9714, y:  0.0468, z: -0.2360 },
    { id: 2,  el: 'N', x:  1.4255, y: -0.2076, z:  0.3469 },
    { id: 3,  el: 'N', x: -0.6244, y: -1.2585, z:  0.2517 },
    { id: 4,  el: 'N', x: -2.5918, y:  0.0684, z: -0.0959 },
    { id: 5,  el: 'N', x: -2.5007, y:  2.4760, z: -0.3524 },
    { id: 6,  el: 'N', x: -2.6363, y: -2.2928, z:  0.1600 },
    { id: 7,  el: 'C', x:  4.1965, y:  0.1557, z: -0.3181 },
    { id: 8,  el: 'C', x:  3.3505, y: -0.9312, z: -0.9788 },
    { id: 9,  el: 'C', x:  3.3217, y:  1.3240, z:  0.1334 },
    { id: 10, el: 'C', x:  2.2046, y: -1.3715, z: -0.0708 },
    { id: 11, el: 'C', x:  2.1762, y:  0.8481, z:  1.0239 },
    { id: 12, el: 'C', x:  0.0815, y: -0.1536, z:  0.2026 },
    { id: 13, el: 'C', x: -0.5489, y:  1.1960, z: -0.0111 },
    { id: 14, el: 'C', x: -1.8877, y:  1.2635, z: -0.1559 },
    { id: 15, el: 'C', x: -1.9954, y: -1.1633, z:  0.1005 },
    { id: 16, el: 'H', x:  4.7232, y: -0.2646, z:  0.5473 },
    { id: 17, el: 'H', x:  4.9597, y:  0.5112, z: -1.0191 },
    { id: 18, el: 'H', x:  2.9418, y: -0.5454, z: -1.9213 },
    { id: 19, el: 'H', x:  3.9801, y: -1.7924, z: -1.2281 },
    { id: 20, el: 'H', x:  3.9327, y:  2.0558, z:  0.6733 },
    { id: 21, el: 'H', x:  2.9123, y:  1.8316, z: -0.7489 },
    { id: 22, el: 'H', x:  1.5915, y: -2.0985, z: -0.6158 },
    { id: 23, el: 'H', x:  2.5971, y: -1.8826, z:  0.8165 },
    { id: 24, el: 'H', x:  2.5902, y:  0.4336, z:  1.9524 },
    { id: 25, el: 'H', x:  1.5667, y:  1.7006, z:  1.3365 },
    { id: 26, el: 'H', x:  0.0693, y:  2.0819, z: -0.0888 },
    { id: 27, el: 'H', x: -1.9544, y:  3.3273, z: -0.3897 },
    { id: 28, el: 'H', x: -3.5068, y:  2.5047, z: -0.4577 },
    { id: 29, el: 'H', x: -1.9564, y: -3.0461, z:  0.3126 },
    { id: 30, el: 'H', x: -4.2687, y:  0.1757, z:  0.6813 },
];

const MINOXIDIL_BONDS = [
    [1, 4], [2, 10], [2, 11], [2, 12],
    [3, 12, 2], [3, 15], [4, 14], [4, 15],
    [5, 14], [5, 27], [5, 28], [6, 15, 2], [6, 29],
    [7, 8], [7, 9], [7, 16], [7, 17],
    [8, 10], [8, 18], [8, 19],
    [9, 11], [9, 20], [9, 21],
    [10, 22], [10, 23],
    [11, 24], [11, 25],
    [12, 13], [13, 14, 2], [13, 26],
    [1, 30],
];

// ============================================================
// Sulfate group (SO₄) — replaces H30 on O1
// ============================================================
const SULFATE_EXTRA_ATOMS = [
    { id: 31, el: 'S', x: -5.20, y:  0.10, z: -0.10 },
    { id: 32, el: 'O', x: -5.90, y:  1.30, z:  0.30 },
    { id: 33, el: 'O', x: -5.90, y: -1.10, z:  0.40 },
    { id: 34, el: 'O', x: -5.40, y:  0.00, z: -1.55 },
];

const SULFATE_EXTRA_BONDS = [
    [1, 31],
    [31, 32, 2],
    [31, 33, 2],
    [31, 34],
];

// ============================================================
// Shared geometry/material caches
// ============================================================
const _sphereGeo = new THREE.SphereGeometry(1, 28, 20);
const _cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
const _matCache = {};

function getAtomMaterial(element, isSulfateGroup = false) {
    const key = element + (isSulfateGroup ? '_sulfate' : '');
    if (!_matCache[key]) {
        const color = ELEMENT_COLORS[element] || 0xcccccc;
        _matCache[key] = new THREE.MeshPhysicalMaterial({
            color,
            metalness: 0.12,
            roughness: 0.30,
            clearcoat: 0.7,
            clearcoatRoughness: 0.15,
            emissive: new THREE.Color(color).multiplyScalar(isSulfateGroup ? 0.25 : 0.06),
            emissiveIntensity: isSulfateGroup ? 1.0 : 1.0,
        });
    }
    return _matCache[key];
}

const _bondMat = new THREE.MeshPhysicalMaterial({
    color: 0x444455,
    metalness: 0.05,
    roughness: 0.45,
    clearcoat: 0.3,
});

// ============================================================
// Build a ball-and-stick group from atom/bond arrays
// ============================================================
function buildMolecule(atoms, bonds, options = {}) {
    const group = new THREE.Group();
    group.userData.atomMeshes = {};
    group.userData.atoms = atoms;
    const scale = options.scale || 1.0;
    const isSulfate = options.isSulfate || false;

    // Atoms
    for (const a of atoms) {
        const r = (ELEMENT_RADII[a.el] || 0.3) * scale;
        const mesh = new THREE.Mesh(_sphereGeo, getAtomMaterial(a.el, isSulfate).clone());
        mesh.scale.setScalar(r);
        mesh.position.set(a.x, a.y, a.z);
        mesh.userData = { element: a.el, atomId: a.id, isSulfate };
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        group.userData.atomMeshes[a.id] = mesh;
    }

    // Bonds
    const atomMap = {};
    for (const a of atoms) atomMap[a.id] = a;

    for (const b of bonds) {
        const a1 = atomMap[b[0]];
        const a2 = atomMap[b[1]];
        if (!a1 || !a2) continue;
        const order = b[2] || 1;

        const p1 = new THREE.Vector3(a1.x, a1.y, a1.z);
        const p2 = new THREE.Vector3(a2.x, a2.y, a2.z);
        const dir = new THREE.Vector3().subVectors(p2, p1);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

        for (let i = 0; i < order; i++) {
            const offset = order > 1 ? (i - (order - 1) / 2) * 0.09 * scale : 0;
            const perp = new THREE.Vector3(0, 0, 1).cross(dir).normalize().multiplyScalar(offset);
            if (perp.length() < 0.001) perp.set(offset, 0, 0);

            const bond = new THREE.Mesh(_cylinderGeo, _bondMat.clone());
            bond.scale.set(BOND_RADIUS * scale, len, BOND_RADIUS * scale);
            bond.position.copy(mid).add(perp);
            bond.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir.clone().normalize()
            );
            bond.castShadow = true;
            group.add(bond);
        }
    }

    return group;
}

// ============================================================
// Public API
// ============================================================
export function createMinoxidil() {
    const group = buildMolecule(MINOXIDIL_ATOMS, MINOXIDIL_BONDS, { scale: 1.0 });
    group.name = 'minoxidil';
    return group;
}

export function createMinoxidilSulfate() {
    const atoms = MINOXIDIL_ATOMS.filter(a => a.id !== 30).concat(SULFATE_EXTRA_ATOMS);
    const bonds = MINOXIDIL_BONDS.filter(b => b[0] !== 30 && b[1] !== 30 && !(b[0] === 1 && b[1] === 30))
        .concat(SULFATE_EXTRA_BONDS);
    const group = buildMolecule(atoms, bonds, { scale: 1.0 });
    group.name = 'minoxidilSulfate';
    return group;
}

/** Sulfate group only (SO₄) for the activation animation */
export function createSulfateGroup() {
    const group = buildMolecule(SULFATE_EXTRA_ATOMS, [
        [31, 32, 2], [31, 33, 2], [31, 34],
    ], { scale: 1.0, isSulfate: true });
    group.name = 'sulfateGroup';

    // Add pulsing glow sphere around the sulfate group
    const glowGeo = new THREE.SphereGeometry(1.5, 20, 16);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const glowSphere = new THREE.Mesh(glowGeo, glowMat);
    glowSphere.position.set(-5.35, 0.08, -0.24);
    glowSphere.name = 'sulfateGlow';
    group.add(glowSphere);

    return group;
}

export { MINOXIDIL_ATOMS, MINOXIDIL_BONDS, SULFATE_EXTRA_ATOMS, SULFATE_EXTRA_BONDS };
