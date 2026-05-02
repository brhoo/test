import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ELEMENT_COLORS } from './molecules.js';

const labelElements = [];
let labelsVisible = true;

function colorToCSS(hex) {
    const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
    return `rgb(${r},${g},${b})`;
}

/**
 * Create billboarded CSS2D atom labels for non-H atoms.
 * Labels for the active binding site atoms (sulfate group) get the
 * special `.sulfate` CSS class for the pulsing glow effect.
 */
export function createLabels(moleculeGroup) {
    if (!moleculeGroup?.userData?.atoms) return;

    for (const atom of moleculeGroup.userData.atoms) {
        if (atom.el === 'H') continue; // Skip hydrogen for performance

        const div = document.createElement('div');
        div.className = 'atom-label';
        div.textContent = atom.el;
        div.style.color = colorToCSS(ELEMENT_COLORS[atom.el] || 0xcccccc);

        // Mark sulfate group atoms with special class
        if (atom.id >= 31) {
            div.classList.add('sulfate');
        }

        const label = new CSS2DObject(div);
        label.position.set(atom.x, atom.y + 0.45, atom.z);
        label.name = 'label_' + atom.id;
        moleculeGroup.add(label);
        labelElements.push(label);
    }
}

/**
 * Create an enzyme label (SULT1A1) as a floating CSS2D element
 */
export function createEnzymeLabel(parent) {
    const div = document.createElement('div');
    div.className = 'enzyme-label';
    div.innerHTML = 'SULT1A1<br><small style="opacity:0.7">Sulfotransferase</small>';
    const label = new CSS2DObject(div);
    label.position.set(0, 2.0, 0);
    label.name = 'enzymeLabel';
    parent.add(label);
    labelElements.push(label);
    return label;
}

/**
 * Create K⁺ ion labels
 */
export function createIonLabel(ionMesh) {
    const div = document.createElement('div');
    div.className = 'ion-label';
    div.textContent = 'K⁺';
    const label = new CSS2DObject(div);
    label.position.set(0, 0.4, 0);
    label.name = 'ionLabel';
    ionMesh.add(label);
    labelElements.push(label);
    return label;
}

export function toggleLabels() {
    labelsVisible = !labelsVisible;
    for (const l of labelElements) {
        l.visible = labelsVisible;
    }
    return labelsVisible;
}

export function clearLabels() {
    for (const l of labelElements) {
        if (l.parent) l.parent.remove(l);
    }
    labelElements.length = 0;
}
