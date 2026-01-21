const { ipcRenderer } = require('electron');

// Window Controls
document.getElementById('setup-min-btn').onclick = () => ipcRenderer.invoke('minimize-window');
document.getElementById('setup-close-btn').onclick = () => ipcRenderer.invoke('close-window');

let currentSlide = 1;
const totalSlides = 5;

function showSlide(n) {
    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    document.getElementById(`slide-${n}`).classList.add('active');
    currentSlide = n;

    if (n === 5) {
        runSystemChecks();
    }
}

// Navigation Logic
document.getElementById('next-1').onclick = () => showSlide(2);

document.getElementById('back-2').onclick = () => showSlide(1);
document.getElementById('next-2').onclick = () => showSlide(3);

document.getElementById('back-3').onclick = () => showSlide(2);
document.getElementById('next-3').onclick = () => showSlide(4);

document.getElementById('back-4').onclick = () => showSlide(3);
document.getElementById('next-4').onclick = () => showSlide(5);

// Terms Agreement
const termsCheckbox = document.getElementById('terms-agree');
const next4Btn = document.getElementById('next-4');

termsCheckbox.onchange = (e) => {
    next4Btn.disabled = !e.target.checked;
};

// System Checks Logic
async function runSystemChecks() {
    const checks = [
        { id: 'check-python', command: 'python --version', label: 'Python' },
        { id: 'check-java', command: 'java -version', label: 'Java' },
        { id: 'check-c', command: 'gcc --version', label: 'GCC' }
    ];

    let allPassed = true;

    for (const check of checks) {
        const el = document.getElementById(check.id);
        el.innerText = 'Checking...';
        el.className = 'check-status checking';

        try {
            // Using a generic exec handler in main.js
            const result = await ipcRenderer.invoke('check-compiler', check.command);
            if (result.success) {
                el.innerText = 'Installed ✓';
                el.className = 'check-status success';
            } else {
                el.innerText = 'Missing ❌';
                el.className = 'check-status fail';
                // We don't block setup for missing compilers, just warn
            }
        } catch (err) {
            el.innerText = 'Error';
            el.className = 'check-status fail';
        }
    }

    // Enable Finish button
    const finishBtn = document.getElementById('finish-setup');
    finishBtn.style.opacity = '1';
    finishBtn.style.pointerEvents = 'auto';
    finishBtn.onclick = () => {
        ipcRenderer.invoke('setup-complete');
    };
}
