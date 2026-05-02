// ============================================================
// Step-based UI controller (6 states: Intro + 5 animation steps)
// ============================================================

const STEP_INFO = [
    {
        badge: 'INTRO',
        title: 'Minoxidil Mechanism of Action',
        text: 'Explore how Minoxidil is activated and opens K<sub>ATP</sub> channels to cause vasodilation and promote hair growth. Use the controls below or press <strong>Space</strong> to play.',
    },
    {
        badge: 'STEP 1 · BIOACTIVATION',
        title: 'Enzymatic Activation by SULT1A1',
        text: 'Minoxidil (a <strong>prodrug</strong>) enters the hair follicle and is converted to its active metabolite <strong>Minoxidil Sulfate</strong> by the enzyme <em>sulfotransferase (SULT1A1)</em>. A sulfate group (SO<sub>4</sub>) is added to the N-oxide oxygen, creating a high-energy active molecule.',
    },
    {
        badge: 'STEP 2 · BINDING',
        title: 'Docking to the K<sub>ATP</sub> Channel',
        text: 'Minoxidil Sulfate migrates to and binds the <strong>Sulfonylurea Receptor (SUR1)</strong> subunit of the ATP-sensitive potassium channel (K<sub>ATP</sub>) embedded in the smooth muscle cell membrane.',
    },
    {
        badge: 'STEP 3 · CHANNEL OPENING',
        title: 'Conformational Change',
        text: 'Binding triggers a <strong>conformational change</strong> in the channel protein. The four Kir6.2 subunits physically shift outward (morphing geometry), widening the central pore from a "Closed" to an "Open" state.',
    },
    {
        badge: 'STEP 4 · ION FLOW',
        title: 'K⁺ Efflux & Vasodilation',
        text: 'K⁺ ions rush through the open channel as glowing spheres, causing <strong>hyperpolarization</strong> of the cell membrane. This relaxes vascular smooth muscle, leading to <strong>vasodilation</strong> — the surrounding vessel walls expand.',
    },
    {
        badge: 'STEP 5 · HAIR GROWTH',
        title: 'Hair Growth Cycle Stimulation',
        text: 'Increased blood flow delivers nutrients to the hair follicle. The <strong>Anagen</strong> (growth) phase lengthens, and thin <strong>vellus</strong> hair transforms into thick <strong>terminal</strong> hair through enhanced dermal papilla activity.',
    },
];

const TOTAL_STEPS = STEP_INFO.length - 1; // 5

let currentStep = 0;
let isPlaying = false;
let onStepChange = null;
let onPlayPause = null;
let onResetCb = null;

export function initUI(callbacks) {
    onStepChange = callbacks.onStepChange;
    onPlayPause = callbacks.onPlayPause;
    onResetCb = callbacks.onReset;

    const btnPlay = document.getElementById('btn-play');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnReset = document.getElementById('btn-reset');
    const btnLabels = document.getElementById('btn-toggle-labels');
    const btnAutoRotate = document.getElementById('btn-toggle-autorotate');

    // Play/Pause button
    btnPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
    });

    // Next step
    btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentStep < TOTAL_STEPS) {
            isPlaying = false;
            updatePlayIcon();
            setStep(currentStep + 1);
        }
    });

    // Previous step
    btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentStep > 0) {
            isPlaying = false;
            updatePlayIcon();
            setStep(currentStep - 1);
        }
    });

    // Reset
    btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        isPlaying = false;
        updatePlayIcon();
        setStep(0);
        onResetCb?.();
    });

    // Toggle labels
    btnLabels.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = callbacks.onToggleLabels?.();
        btnLabels.classList.toggle('active', on);
    });

    // Toggle auto-rotate
    btnAutoRotate.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = callbacks.onToggleAutoRotate?.();
        btnAutoRotate.classList.toggle('active', on);
    });

    // Step dot clicks
    document.querySelectorAll('.step-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const s = parseInt(dot.dataset.step);
            if (!isNaN(s)) {
                isPlaying = false;
                updatePlayIcon();
                setStep(s);
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        }
        if (e.code === 'ArrowRight') {
            if (currentStep < TOTAL_STEPS) {
                isPlaying = false;
                updatePlayIcon();
                setStep(currentStep + 1);
            }
        }
        if (e.code === 'ArrowLeft') {
            if (currentStep > 0) {
                isPlaying = false;
                updatePlayIcon();
                setStep(currentStep - 1);
            }
        }
        if (e.code === 'KeyR') {
            isPlaying = false;
            updatePlayIcon();
            setStep(0);
            onResetCb?.();
        }
        if (e.code === 'Escape') {
            // Failsafe to manually trigger VR exit
            const xr = window.renderer?.xr;
            if (xr && xr.isPresenting && xr.getSession()) {
                xr.getSession().end();
            }
        }
    });

    updateInfoPanel();
    updateStepDots();
    updateNavButtons();
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    updatePlayIcon();

    if (isPlaying) {
        // If at intro or at the last step completed, start from beginning or next
        if (currentStep === 0) {
            setStep(1); // auto-advance to step 1
        }
        onPlayPause?.(true);
    } else {
        onPlayPause?.(false);
    }
}

function setStep(step) {
    const wasPlaying = isPlaying;
    currentStep = step;
    updateInfoPanel();
    updateStepDots();
    updateNavButtons();
    onStepChange?.(step);
}

function updateInfoPanel() {
    const info = STEP_INFO[currentStep];
    const badge = document.getElementById('info-step-badge');
    const title = document.getElementById('info-title');
    const text = document.getElementById('info-text');

    badge.textContent = info.badge;
    title.innerHTML = info.title;
    text.innerHTML = info.text;

    // Re-trigger entrance animation
    const panel = document.getElementById('info-panel');
    panel.style.animation = 'none';
    panel.offsetHeight; // reflow
    panel.style.animation = 'fadeSlideIn 0.45s ease-out';
}

function updateStepDots() {
    document.querySelectorAll('.step-dot').forEach(dot => {
        const s = parseInt(dot.dataset.step);
        dot.classList.remove('active', 'completed');
        if (s === currentStep) dot.classList.add('active');
        else if (s < currentStep) dot.classList.add('completed');
    });

    // Color connectors for completed steps
    const connectors = document.querySelectorAll('.step-connector');
    connectors.forEach((conn, i) => {
        if (i < currentStep) {
            conn.style.background = 'var(--success)';
            conn.style.boxShadow = '0 0 6px var(--success-glow)';
        } else {
            conn.style.background = 'rgba(105, 123, 255, 0.10)';
            conn.style.boxShadow = 'none';
        }
    });
}

function updateNavButtons() {
    document.getElementById('btn-prev').disabled = currentStep <= 0;
    document.getElementById('btn-next').disabled = currentStep >= TOTAL_STEPS;
}

function updatePlayIcon() {
    const playIcon = document.getElementById('icon-play');
    const pauseIcon = document.getElementById('icon-pause');
    if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
    if (pauseIcon) pauseIcon.style.display = isPlaying ? 'block' : 'none';
}

export function advanceStep() {
    if (currentStep < TOTAL_STEPS) {
        setStep(currentStep + 1);
    } else {
        isPlaying = false;
        updatePlayIcon();
    }
}

export function getCurrentStep() { return currentStep; }
export function getIsPlaying() { return isPlaying; }
