import * as THREE from 'three';

// ============================================================
// K_ATP Potassium Channel – Stylized Surface Model
// 4 Kir6.2 inner subunits + 4 SUR1 outer subunits + phospholipid
// bilayer membrane + ions + blood vessel
// ============================================================

const CHANNEL_COLOR = 0x3a7ca5;
const SUR_COLOR = 0x6b4c9a;
const MEMBRANE_OUTER = 0x1a4a3a;
const MEMBRANE_INNER = 0x143030;
const ION_COLOR = 0xffd700;
const BINDING_GLOW = 0xff6b9d;

const subunitMat = new THREE.MeshPhysicalMaterial({
    color: CHANNEL_COLOR,
    metalness: 0.06,
    roughness: 0.35,
    clearcoat: 0.5,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
});

const surMat = new THREE.MeshPhysicalMaterial({
    color: SUR_COLOR,
    metalness: 0.08,
    roughness: 0.40,
    clearcoat: 0.35,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
});

const membraneMat = new THREE.MeshPhysicalMaterial({
    color: MEMBRANE_OUTER,
    metalness: 0.0,
    roughness: 0.65,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    transmission: 0.3,
    thickness: 0.5,
});

const bindingGlowMat = new THREE.MeshPhysicalMaterial({
    color: BINDING_GLOW,
    emissive: BINDING_GLOW,
    emissiveIntensity: 0.7,
    metalness: 0.0,
    roughness: 0.3,
    transparent: true,
    opacity: 0.35,
});

const ionCoreMat = new THREE.MeshPhysicalMaterial({
    color: ION_COLOR,
    emissive: ION_COLOR,
    emissiveIntensity: 0.9,
    metalness: 0.35,
    roughness: 0.15,
    clearcoat: 1.0,
});

// ============================================================
// Create Kir6.2 pore subunit
// ============================================================
function createKirSubunit() {
    const geo = new THREE.CylinderGeometry(0.7, 1.1, 8, 18, 1, true);
    const mesh = new THREE.Mesh(geo, subunitMat.clone());
    return mesh;
}

// ============================================================
// Create SUR1 outer subunit
// ============================================================
function createSURSubunit() {
    const shape = new THREE.Shape();
    shape.moveTo(-1.5, -3);
    shape.quadraticCurveTo(-2.3, 0, -1.5, 3);
    shape.lineTo(1.5, 3);
    shape.quadraticCurveTo(2.3, 0, 1.5, -3);
    shape.closePath();

    const extrudeSettings = {
        depth: 1.3,
        bevelEnabled: true,
        bevelThickness: 0.35,
        bevelSize: 0.35,
        bevelSegments: 5,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    const mesh = new THREE.Mesh(geo, surMat.clone());
    return mesh;
}

// ============================================================
// Create K⁺ ion with glow aura
// ============================================================
function createIon() {
    const geo = new THREE.SphereGeometry(0.22, 18, 14);
    const mesh = new THREE.Mesh(geo, ionCoreMat.clone());

    // Glow aura
    const glowGeo = new THREE.SphereGeometry(0.40, 16, 12);
    const glowMat = new THREE.MeshBasicMaterial({
        color: ION_COLOR,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    mesh.add(glow);

    return mesh;
}

// ============================================================
// Create phospholipid bilayer (stylized)
// ============================================================
function createPhospholipidBilayer() {
    const bilayerGroup = new THREE.Group();
    bilayerGroup.name = 'bilayer';

    // Outer leaflet disc
    const outerGeo = new THREE.CylinderGeometry(13, 13, 0.15, 64);
    const outerMat = membraneMat.clone();
    outerMat.color.set(MEMBRANE_OUTER);
    const outer = new THREE.Mesh(outerGeo, outerMat);
    outer.position.y = 0.15;
    bilayerGroup.add(outer);

    // Inner leaflet disc
    const innerGeo = new THREE.CylinderGeometry(13, 13, 0.15, 64);
    const innerMat = membraneMat.clone();
    innerMat.color.set(MEMBRANE_INNER);
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.y = -0.15;
    bilayerGroup.add(inner);

    // Lipid heads (small spheres arranged in a ring pattern)
    const headMat = new THREE.MeshPhysicalMaterial({
        color: 0x66aa88,
        metalness: 0.0,
        roughness: 0.6,
        transparent: true,
        opacity: 0.25,
    });
    const headGeo = new THREE.SphereGeometry(0.2, 8, 6);
    for (let r = 3; r <= 12; r += 1.5) {
        const count = Math.floor(r * 4);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            // Skip area near the pore
            if (Math.sqrt(x * x + z * z) < 2.5) continue;

            // Top leaflet heads
            const headTop = new THREE.Mesh(headGeo, headMat);
            headTop.position.set(x, 0.35, z);
            bilayerGroup.add(headTop);

            // Bottom leaflet heads
            const headBot = new THREE.Mesh(headGeo, headMat);
            headBot.position.set(x, -0.35, z);
            bilayerGroup.add(headBot);
        }
    }

    return bilayerGroup;
}

// ============================================================
// Create the full channel assembly
// ============================================================
export function createChannel() {
    const channelGroup = new THREE.Group();
    channelGroup.name = 'channel';

    // ── Inner pore subunits (Kir6.2 × 4) ──
    const poreGates = [];
    for (let i = 0; i < 4; i++) {
        const sub = createKirSubunit();
        const angle = (i / 4) * Math.PI * 2;
        const radius = 2.0;
        sub.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        sub.lookAt(0, 0, 0);
        sub.rotateX(Math.PI / 2);
        sub.userData.baseAngle = angle;
        sub.userData.baseRadius = radius;
        poreGates.push(sub);
        channelGroup.add(sub);
    }

    // ── Outer SUR1 subunits (× 4) ──
    const surSubunits = [];
    for (let i = 0; i < 4; i++) {
        const sur = createSURSubunit();
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const radius = 5.2;
        sur.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        sur.lookAt(0, 0, 0);
        sur.userData.baseAngle = angle;
        sur.userData.baseRadius = radius;
        sur.userData.index = i;
        surSubunits.push(sur);
        channelGroup.add(sur);
    }

    // ── Binding site (glowing active site on SUR[0]) ──
    const bindingSite = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 18, 14),
        bindingGlowMat.clone()
    );
    bindingSite.position.copy(surSubunits[0].position);
    bindingSite.position.y += 1.5;
    bindingSite.visible = false;
    bindingSite.name = 'bindingSite';
    channelGroup.add(bindingSite);

    // ── Phospholipid bilayer membrane ──
    const bilayer = createPhospholipidBilayer();
    channelGroup.add(bilayer);

    // ── K⁺ ions inside the pore (initially hidden) ──
    const ions = [];
    for (let i = 0; i < 10; i++) {
        const ion = createIon();
        ion.position.set(
            (Math.random() - 0.5) * 0.5,
            -3 + i * 0.7,
            (Math.random() - 0.5) * 0.5
        );
        ion.visible = false;
        ion.name = 'ion';
        ions.push(ion);
        channelGroup.add(ion);
    }

    // ── Streaming ions (for efflux animation) ──
    const streamIons = [];
    for (let i = 0; i < 40; i++) {
        const ion = createIon();
        ion.visible = false;
        ion.name = 'streamIon';
        ion.userData.speed = 2.5 + Math.random() * 3.5;
        ion.userData.angle = Math.random() * Math.PI * 2;
        ion.userData.radialOffset = Math.random() * 0.4;
        streamIons.push(ion);
        channelGroup.add(ion);
    }

    channelGroup.userData = {
        poreGates,
        surSubunits,
        bindingSite,
        bilayer,
        ions,
        streamIons,
    };

    return channelGroup;
}

// ============================================================
// Create a blood vessel for vasodilation (Step 4)
// ============================================================
export function createBloodVessel() {
    const group = new THREE.Group();
    group.name = 'bloodVessel';

    const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-10, 0, 0),
        new THREE.Vector3(-4, 1, 1),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(4, -1, -1),
        new THREE.Vector3(10, 0, 0),
    ]);

    // Vessel wall
    const tubeGeo = new THREE.TubeGeometry(path, 80, 1.5, 28, false);
    const tubeMat = new THREE.MeshPhysicalMaterial({
        color: 0xcc3333,
        metalness: 0.0,
        roughness: 0.55,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        clearcoat: 0.2,
    });
    const vessel = new THREE.Mesh(tubeGeo, tubeMat);
    vessel.name = 'vesselWall';
    group.add(vessel);

    // Inner lumen glow
    const innerGeo = new THREE.TubeGeometry(path, 80, 0.7, 18, false);
    const innerMat = new THREE.MeshBasicMaterial({
        color: 0xff5555,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.name = 'vesselInner';
    group.add(inner);

    group.userData = { path, vessel, inner, originalRadius: 1.5, expandedRadius: 2.8 };
    group.visible = false;

    return group;
}

// ============================================================
// Create hair follicle for Step 5
// ============================================================
export function createHairFollicle() {
    const group = new THREE.Group();
    group.name = 'hairFollicle';

    // Skin surface
    const skinGeo = new THREE.PlaneGeometry(16, 16, 32, 32);
    const skinMat = new THREE.MeshPhysicalMaterial({
        color: 0xd4a574,
        metalness: 0.0,
        roughness: 0.8,
        side: THREE.DoubleSide,
    });
    const skin = new THREE.Mesh(skinGeo, skinMat);
    skin.rotation.x = -Math.PI / 2;
    skin.position.y = 2;
    group.add(skin);

    // Follicle bulb (below skin)
    const bulbGeo = new THREE.SphereGeometry(1.0, 20, 16);
    const bulbMat = new THREE.MeshPhysicalMaterial({
        color: 0xcc7755,
        metalness: 0.0,
        roughness: 0.5,
        transparent: true,
        opacity: 0.8,
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(0, -2, 0);
    bulb.scale.set(1, 1.4, 1);
    group.add(bulb);

    // Follicle shaft (cylinder from bulb through skin)
    const shaftGeo = new THREE.CylinderGeometry(0.12, 0.18, 4.5, 12);
    const shaftMat = new THREE.MeshPhysicalMaterial({
        color: 0x553322,
        metalness: 0.1,
        roughness: 0.4,
        clearcoat: 0.6,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.set(0, 0, 0);
    group.add(shaft);

    // Hair strand (above skin, initially thin = vellus)
    const hairGeo = new THREE.CylinderGeometry(0.04, 0.08, 3, 8);
    const hairMat = new THREE.MeshPhysicalMaterial({
        color: 0x332211,
        metalness: 0.15,
        roughness: 0.35,
        clearcoat: 0.8,
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 3.5, 0);
    hair.name = 'hairStrand';
    group.add(hair);

    // Dermal papilla (at the base of bulb)
    const papillaGeo = new THREE.SphereGeometry(0.5, 14, 10);
    const papillaMat = new THREE.MeshPhysicalMaterial({
        color: 0xff6644,
        emissive: 0xff4422,
        emissiveIntensity: 0.3,
        metalness: 0.0,
        roughness: 0.4,
        transparent: true,
        opacity: 0.8,
    });
    const papilla = new THREE.Mesh(papillaGeo, papillaMat);
    papilla.position.set(0, -3.0, 0);
    papilla.name = 'dermalPapilla';
    group.add(papilla);

    // Blood vessels at papilla base
    const capPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2, -3.5, 0),
        new THREE.Vector3(-0.5, -3.2, 0.5),
        new THREE.Vector3(0, -3.0, 0),
        new THREE.Vector3(0.5, -3.2, -0.5),
        new THREE.Vector3(2, -3.5, 0),
    ]);
    const capGeo = new THREE.TubeGeometry(capPath, 30, 0.12, 8, false);
    const capMat = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.5,
    });
    const capillary = new THREE.Mesh(capGeo, capMat);
    capillary.name = 'capillary';
    group.add(capillary);

    // Anagen label indicator  
    group.userData = {
        skin, bulb, shaft, hair, papilla, capillary,
        originalHairScale: { x: 1, y: 1, z: 1 },
        terminalHairScale: { x: 3.5, y: 2.5, z: 3.5 },
    };

    return group;
}
