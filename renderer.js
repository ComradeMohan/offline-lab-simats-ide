const path = require('path');
const { ipcRenderer } = require('electron');
const fs = require('fs');

// Window Controls
document.getElementById('min-btn').addEventListener('click', () => ipcRenderer.invoke('minimize-window'));
document.getElementById('max-btn').addEventListener('click', () => ipcRenderer.invoke('maximize-window'));
document.getElementById('close-btn').addEventListener('click', () => ipcRenderer.invoke('close-window'));

// --- Auto Updater UI ---
const updateStatusEl = document.getElementById('update-status');
const updateMsgEl = document.getElementById('update-msg');
const updateProgressContainer = document.getElementById('update-progress-container');
const updateProgressBar = document.getElementById('update-progress-bar');

ipcRenderer.on('message', (event, { text, status }) => {
    if (updateStatusEl) {
        updateStatusEl.style.display = 'flex';
        updateMsgEl.innerText = text;

        if (status === 'error') updateStatusEl.style.color = '#ff6b6b';
        else if (status === 'available') updateStatusEl.style.color = '#ffbb33';
        else if (status === 'downloaded') updateStatusEl.style.color = '#69f0ae';
        else updateStatusEl.style.color = 'var(--accent-color)';
    }
});

ipcRenderer.on('download-progress', (event, percent) => {
    if (updateProgressContainer && updateProgressBar) {
        updateProgressContainer.style.display = 'block';
        updateProgressBar.style.width = `${percent}%`;
    }
});

// Load Questions
// Load Questions
const questionsPath = path.join(__dirname, 'questions.json');
const javaPath = path.join(__dirname, 'data', 'java.json');
const pythonPath = path.join(__dirname, 'data', 'python.json');
const cPath = path.join(__dirname, 'data', 'c.json');
const cppPath = path.join(__dirname, 'data', 'cpp.json');

let questions = [];
let courseNames = {};

function loadQuestions() {
    try {
        // Load base questions if existing
        if (fs.existsSync(questionsPath)) {
            const base = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
            questions = questions.concat(base);
        }

        // Helper to load and map questions
        const loadBank = (filePath, lang, idPrefix) => {
            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (data.course) courseNames[lang] = data.course;
                    const qs = (data.questions || []).map(q => ({
                        id: `${idPrefix}_${q.id}`,
                        title: q.title,
                        description: q.question_statement,
                        difficulty: q.difficulty || 'easy',
                        language: lang,
                        sample_input: q.sample_input || "",
                        sample_output: q.sample_output || "",
                        test_cases: q.test_cases || [],
                        solution_explanation: q.solution_explanation || "",
                        defaultCode: getTemplate(lang, q)
                    }));
                    questions = questions.concat(qs);
                } catch (e) {
                    console.error(`Error parsing ${filePath}:`, e);
                    // Also report to UI if possible
                    if (outputContentEl) {
                        const errDiv = document.createElement('div');
                        errDiv.style.color = '#ff4444';
                        errDiv.style.padding = '10px';
                        errDiv.style.border = '1px solid #ff4444';
                        errDiv.style.margin = '10px 0';
                        errDiv.innerHTML = `<strong>⚠️ Failed to load ${path.basename(filePath)}</strong><br>
                                            <small>${e.message}</small>`;
                        outputContentEl.appendChild(errDiv);
                    }
                }
            }
        };

        const getTemplate = (lang, q) => {
            const title = q.title || "Untitled";
            const desc = q.question_statement || "";
            if (lang === 'python') {
                return `# ${title}\n# ${desc}\n\ndef solve():\n    print("Hello World")\n\nif __name__ == "__main__":\n    solve()`;
            } else if (lang === 'java') {
                return `public class Main {\n    public static void main(String[] args) {\n        // ${title}\n        System.out.println("Hello World");\n    }\n}`;
            } else if (lang === 'c') {
                return `// ${title}\n#include <stdio.h>\n\nint main() {\n    // Write your code here\n    printf("Hello World\\n");\n    return 0;\n}`;
            } else if (lang === 'cpp') {
                return `// ${title}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    cout << "Hello World" << endl;\n    return 0;\n}`;
            }
            return "";
        };

        loadBank(javaPath, 'java', 'java_ext');
        loadBank(pythonPath, 'python', 'py_ext');
        loadBank(cPath, 'c', 'c_ext');
        loadBank(cppPath, 'cpp', 'cpp_ext');

    } catch (err) {
        console.error("Error loading question banks:", err);
    }
}


// loadQuestions(); // Moved to bottom

let currentQuestion = null;
let editor = null;

// Monaco Editor Loader
const amdLoader = require('./node_modules/monaco-editor/min/vs/loader.js');
const amdRequire = amdLoader.require;

function initEditor() {
    // Determine the base URL for Monaco Editor
    // In production (built EXE), __dirname points to the app.asar content
    const monacoPath = path.join(__dirname, 'node_modules/monaco-editor/min');

    amdRequire.config({
        baseUrl: monacoPath.startsWith('http') ? monacoPath : `file:///${monacoPath.replace(/\\/g, '/')}`
    });

    // Technical fix for Monaco + Electron integration
    self.module = undefined;

    amdRequire(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: '// Select a question to start coding...',
            language: 'java',
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontLigatures: false,
            lineHeight: 22,
            cursorStyle: 'line',
            cursorBlinking: 'smooth',
            renderLineHighlight: 'all',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            minimap: { enabled: false }
        });

        document.fonts.ready.then(() => {
            monaco.editor.remeasureFonts();
        });

        editor.onDidChangeModelContent(() => {
            if (saveProgressBtn && saveProgressBtn.classList.contains('saved')) {
                saveProgressBtn.innerText = 'Save Progress';
                saveProgressBtn.classList.remove('saved');
            }
        });

        // Ensure questions are rendered for the default language once editor is ready
        renderSidebar('c');
    });
}

// UI Elements
const questionListEl = document.getElementById('question-list');
const questionTitleEl = document.getElementById('question-title');
const questionMetaEl = document.getElementById('question-detail-meta');
const questionDescEl = document.getElementById('question-desc');
const langSelectEl = document.getElementById('language-select');
const runBtn = document.getElementById('run-btn');
const outputContentEl = document.getElementById('output-content');
const clearOutputBtn = document.getElementById('clear-output');
const nextBtn = document.getElementById('next-btn');
const saveProgressBtn = document.getElementById('save-progress-btn');

// --- New UI Elements (VS Code Lite Features) ---
const fileMenuTrigger = document.getElementById('file-menu-trigger');
const fileMenu = document.getElementById('file-menu');
const newFileBtn = document.getElementById('new-file-btn');
const openFolderBtn = document.getElementById('open-folder-btn');
const saveBtn = document.getElementById('save-btn');
const saveAsBtn = document.getElementById('save-as-btn');

const tabQuestions = document.getElementById('tab-questions');
const tabExplorer = document.getElementById('tab-explorer');
const fileExplorer = document.getElementById('file-explorer');
const fileList = document.getElementById('file-list');
const sidebarTitle = document.getElementById('sidebar-context-title');

const settingsMenuTrigger = document.getElementById('settings-menu-trigger');
const settingsMenu = document.getElementById('settings-menu');
const aboutDevBtn = document.getElementById('about-dev-btn');
const docsBtn = document.getElementById('docs-btn');

const explorerActions = document.getElementById('explorer-actions');
const sidebarNewFileBtn = document.getElementById('sidebar-new-file-btn');
const sidebarOpenFolderBtn = document.getElementById('sidebar-open-folder-btn');

const dropdownTrigger = document.getElementById('dropdown-trigger');
const dropdownOptions = document.getElementById('dropdown-options');
const selectedLangText = document.getElementById('selected-lang-text');
const options = document.querySelectorAll('.option');

// File State
let currentWorkspaceMode = 'questions'; // 'questions' or 'files'
let currentOpenedFilePath = null;
let currentOpenedFolderPath = null;

// Detailed Error Messages
const ERROR_MESSAGES = {
    c: `
    <div style="background:#2d2d2d; padding:12px; border-left:4px solid #ff4444; color:#ccc; font-family:'Segoe UI', sans-serif; line-height:1.4;">
        <h3 style="color:#ff4444; margin:0 0 8px 0; font-size:1.1em;">🟥 C LANGUAGE — GCC NOT FOUND</h3>
        <p style="margin:0 0 8px 0;"><strong>❗ Problem</strong><br>Reminder: To run C programs, the GCC compiler must be installed.</p>
        <p style="margin:0 0 4px 0;"><strong>✅ How to Install C Compiler (Windows)</strong></p>
        <p style="margin:0 0 8px 0;">Method 1: MinGW-w64 (Recommended)</p>
        <ul style="margin:0 0 8px 0; padding-left:20px;">
            <li>Download MinGW-w64 from: <a href="#" onclick="require('electron').shell.openExternal('https://www.mingw-w64.org/')">https://www.mingw-w64.org/</a></li>
            <li>During installation, choose: <strong>Architecture: x86_64</strong>, <strong>Threads: posix</strong>, <strong>Exception: seh</strong></li>
            <li>After installation, add this folder to System PATH: <code style="background:#444; padding:2px 4px;">C:\\mingw64\\bin</code></li>
        </ul>
        <p style="margin:0 0 8px 0;">Restart this application and try running your C program again.</p>
        <p style="margin:0;"><strong>🔍 Verify Installation</strong><br>Open Command Prompt and type: <code style="background:#444; padding:2px 4px;">gcc --version</code></p>
    </div>`,

    cpp: `
    <div style="background:#2d2d2d; padding:12px; border-left:4px solid #4488ff; color:#ccc; font-family:'Segoe UI', sans-serif; line-height:1.4;">
        <h3 style="color:#4488ff; margin:0 0 8px 0; font-size:1.1em;">🟦 C++ LANGUAGE — G++ NOT FOUND</h3>
        <p style="margin:0 0 8px 0;"><strong>❗ Problem</strong><br>To run C++ programs, the G++ compiler is required.</p>
        <p style="margin:0 0 8px 0;"><strong>✅ How to Install C++ Compiler (Windows)</strong></p>
        <p style="margin:0 0 8px 0;">👉 Same installation as C (MinGW-w64)</p>
        <p style="margin:0 0 8px 0;">Once MinGW-w64 is installed correctly:</p>
        <p style="margin:0;"><strong>🔍 Verify Installation</strong><br><code style="background:#444; padding:2px 4px;">g++ --version</code><br>If GCC is installed, C++ will work automatically.</p>
    </div>`,

    java: `
    <div style="background:#2d2d2d; padding:12px; border-left:4px solid #ffbb33; color:#ccc; font-family:'Segoe UI', sans-serif; line-height:1.4;">
        <h3 style="color:#ffbb33; margin:0 0 8px 0; font-size:1.1em;">🟨 JAVA — JDK NOT FOUND</h3>
        <p style="margin:0 0 8px 0;"><strong>❗ Problem</strong><br>Java programs require the Java Development Kit (JDK).</p>
        <p style="margin:0 0 4px 0;"><strong>✅ How to Install Java (Windows)</strong></p>
        <p style="margin:0 0 8px 0;">Download JDK 17 or above from:</p>
        <ul style="margin:0 0 8px 0; padding-left:20px;">
            <li>Oracle: <a href="#" onclick="require('electron').shell.openExternal('https://www.oracle.com/java/technologies/downloads/')">https://www.oracle.com/java/technologies/downloads/</a></li>
            <li>OR OpenJDK: <a href="#" onclick="require('electron').shell.openExternal('https://adoptium.net/')">https://adoptium.net/</a></li>
        </ul>
        <p style="margin:0 0 8px 0;">Install the JDK and ensure Java is added to PATH (usually automatic).</p>
        <p style="margin:0;"><strong>🔍 Verify Installation</strong><br><code style="background:#444; padding:2px 4px;">javac --version</code><br><code style="background:#444; padding:2px 4px;">java --version</code></p>
    </div>`,

    python: `
    <div style="background:#2d2d2d; padding:12px; border-left:4px solid #00C853; color:#ccc; font-family:'Segoe UI', sans-serif; line-height:1.4;">
        <h3 style="color:#00C853; margin:0 0 8px 0; font-size:1.1em;">🟩 PYTHON — PYTHON NOT FOUND</h3>
        <p style="margin:0 0 8px 0;"><strong>❗ Problem</strong><br>Python interpreter is not installed or not added to PATH.</p>
        <p style="margin:0 0 8px 0;"><strong>✅ How to Install Python (Windows)</strong></p>
        <p style="margin:0 0 8px 0;">Download Python from: <a href="#" onclick="require('electron').shell.openExternal('https://www.python.org/downloads/')">https://www.python.org/downloads/</a></p>
        <p style="margin:0 0 8px 0;">During installation: <strong>✅ CHECK THIS BOX → Add Python to PATH</strong></p>
        <p style="margin:0 0 8px 0;">Complete installation. Restart this application.</p>
        <p style="margin:0;"><strong>🔍 Verify Installation</strong><br><code style="background:#444; padding:2px 4px;">python --version</code> or <code style="background:#444; padding:2px 4px;">py --version</code></p>
    </div>`
};

// --- File Menu Dropdown ---
fileMenuTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    fileMenu.classList.toggle('show');
    if (dropdownOptions) dropdownOptions.classList.remove('show'); // Close lang dropdown
});

// --- Sidebar Tab Switching ---
const switchSidebarTab = (mode) => {
    currentWorkspaceMode = mode;
    if (mode === 'questions') {
        tabQuestions.classList.add('active');
        tabExplorer.classList.remove('active');
        questionListEl.style.display = 'block';
        fileExplorer.style.display = 'none';
        sidebarTitle.innerText = "LAB QUESTIONS";
        if (nextBtn) nextBtn.style.display = 'block';
        if (explorerActions) explorerActions.style.display = 'none';
        renderSidebar(langSelectEl.value);
    } else {
        tabQuestions.classList.remove('active');
        tabExplorer.classList.add('active');
        questionListEl.style.display = 'none';
        fileExplorer.style.display = 'block';
        sidebarTitle.innerText = currentOpenedFolderPath ? path.basename(currentOpenedFolderPath).toUpperCase() : "EXPLORER";
        if (nextBtn) nextBtn.style.display = 'none';
        if (explorerActions) explorerActions.style.display = 'flex';
        renderFileList();
    }
};

tabQuestions.addEventListener('click', () => switchSidebarTab('questions'));
tabExplorer.addEventListener('click', () => switchSidebarTab('files'));

// --- Settings Menu ---
settingsMenuTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('show');
    fileMenu.classList.remove('show');
    if (dropdownOptions) dropdownOptions.classList.remove('show');
});

aboutDevBtn.addEventListener('click', () => {
    require('electron').shell.openExternal('https://mohanreddy.is-a-good.dev/');
    settingsMenu.classList.remove('show');
});

docsBtn.addEventListener('click', () => {
    require('electron').shell.openExternal('https://github.com/ComradeMohan/saveethahub');
    settingsMenu.classList.remove('show');
});

// Close menus when clicking outside
window.addEventListener('click', () => {
    fileMenu.classList.remove('show');
    settingsMenu.classList.remove('show');
});

// --- Sidebar Action Icons ---
if (sidebarNewFileBtn) {
    sidebarNewFileBtn.addEventListener('click', () => {
        newFileBtn.click(); // Trigger existing new file logic
    });
}

if (sidebarOpenFolderBtn) {
    sidebarOpenFolderBtn.addEventListener('click', () => {
        openFolderBtn.click(); // Trigger existing open folder logic
    });
}

// --- File Operations ---

// New File
newFileBtn.addEventListener('click', () => {
    switchSidebarTab('files');
    currentOpenedFilePath = null;
    editor.setValue('');
    questionTitleEl.innerText = 'New Practice File';
    questionDescEl.innerText = 'You are in Practice Mode. Start coding and save your file.';
    fileMenu.classList.remove('show');
});

// Open Folder
openFolderBtn.addEventListener('click', async () => {
    const folderPath = await ipcRenderer.invoke('select-folder');
    if (folderPath) {
        currentOpenedFolderPath = folderPath;
        switchSidebarTab('files');
        renderFileList();
    }
    fileMenu.classList.remove('show');
});

// Render File List
async function renderFileList() {
    if (!currentOpenedFolderPath) {
        fileList.innerHTML = '<li class="explorer-empty" style="padding:40px 20px; text-align:center; color:#555; font-style:italic;">Open a folder using the icon above to see files.</li>';
        return;
    }

    fileList.innerHTML = '';
    const files = fs.readdirSync(currentOpenedFolderPath);

    // Filter for code files
    const validExtensions = ['.c', '.cpp', '.java', '.py'];
    const codeFiles = files.filter(file => validExtensions.includes(path.extname(file).toLowerCase()));

    if (codeFiles.length === 0) {
        fileList.innerHTML = '<li class="explorer-empty" style="padding:20px; color:#555; font-style:italic;">No supported code files found.</li>';
        return;
    }

    codeFiles.forEach(file => {
        const filePath = path.join(currentOpenedFolderPath, file);
        const li = document.createElement('li');
        li.className = 'file-item';
        if (currentOpenedFilePath === filePath) li.classList.add('active');

        const ext = path.extname(file).toLowerCase();
        let icon = '📄';
        if (ext === '.c' || ext === '.cpp') icon = '🔹';
        if (ext === '.java') icon = '☕';
        if (ext === '.py') icon = '🐍';

        li.innerHTML = `<span class="file-icon">${icon}</span> ${file}`;
        li.onclick = () => openFile(filePath);
        fileList.appendChild(li);
    });
}

// Open File
function openFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        currentOpenedFilePath = filePath;

        // Determine language from extension
        const ext = path.extname(filePath).toLowerCase();
        let lang = 'c';
        if (ext === '.cpp') lang = 'cpp';
        if (ext === '.java') lang = 'java';
        if (ext === '.py') lang = 'python';

        // Update Editor
        editor.setValue(content);
        handleLanguageChange(lang, false); // Don't reset editor content!

        // Update Lang Dropdown UI
        const labelMap = { 'c': 'C', 'cpp': 'C++', 'java': 'Java', 'python': 'Python' };
        selectedLangText.innerText = labelMap[lang];
        langSelectEl.value = lang;

        // Update Header
        questionTitleEl.innerText = path.basename(filePath);
        questionDescEl.innerText = `File Location: ${filePath}`;

        renderFileList();

        // Focus Editor for editing
        editor.focus();
    } catch (err) {
        console.error("Failed to open file", err);
    }
}

// Save File
async function saveFile(isSaveAs = false) {
    const code = editor.getValue();
    const lang = langSelectEl.value;
    const extMap = { 'c': 'c', 'cpp': 'cpp', 'java': 'java', 'python': 'py' };
    const preferredExt = extMap[lang] || 'c';

    let savePath = currentOpenedFilePath;

    if (isSaveAs || !savePath) {
        savePath = await ipcRenderer.invoke('save-file-dialog', {
            defaultPath: currentOpenedFilePath || path.join(currentOpenedFolderPath || '', `untitled.${preferredExt}`),
            title: isSaveAs ? 'Save As' : 'Save File',
            extensions: [preferredExt]
        });
    }

    if (savePath) {
        fs.writeFileSync(savePath, code);
        currentOpenedFilePath = savePath;
        alert(`File saved: ${path.basename(savePath)}`);

        // If we are in file mode, refresh the list
        if (currentWorkspaceMode === 'files') {
            if (!currentOpenedFolderPath) currentOpenedFolderPath = path.dirname(savePath);
            renderFileList();
        }
    }
}

// --- Keyboard Shortcuts ---
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
    }
});

saveBtn.addEventListener('click', () => {
    saveFile(false);
    fileMenu.classList.remove('show');
});
saveAsBtn.addEventListener('click', () => {
    saveFile(true);
    fileMenu.classList.remove('show');
});

// Custom Dropdown Logic
// Toggle Dropdown
dropdownTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownOptions.classList.toggle('show');
    if (fileMenu) fileMenu.classList.remove('show'); // Close file menu
});

// Close when clicking outside
document.addEventListener('click', (e) => {
    if (dropdownTrigger && dropdownOptions) {
        if (!dropdownTrigger.contains(e.target) && !dropdownOptions.contains(e.target)) {
            dropdownOptions.classList.remove('show');
        }
    }
    if (fileMenu && fileMenuTrigger) {
        if (!fileMenuTrigger.contains(e.target)) {
            fileMenu.classList.remove('show');
        }
    }
});

// Option Selection Logic
options.forEach(option => {
    option.addEventListener('click', () => {
        const value = option.getAttribute('data-value');
        const text = option.innerText;

        // Update Trigger
        selectedLangText.innerText = text;

        // Sync with hidden select (for compatibility)
        langSelectEl.value = value;

        // Trigger Change Logic
        handleLanguageChange(value);

        // Update UI Selection State
        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // Close Dropdown
        dropdownOptions.classList.remove('show');
    });
});

// Handle Language Change (Refactored from change listener)
function handleLanguageChange(selectedLang, resetEditor = true) {
    if (!editor) return;

    if (resetEditor) {
        // Reset editor (Only for Questions mode or Manual change)
        editor.setValue('');
        questionTitleEl.innerText = 'Select a question';
        questionDescEl.innerText = 'Choose a question from the sidebar to start coding.';
        runBtn.innerHTML = '<span>▶</span> Run Code';
        currentQuestion = null;
    }

    // Instead of clearing, show status
    const switchMsg = document.createElement('div');
    switchMsg.innerText = `\n> Language context switched to ${selectedLang.toUpperCase()}`;
    switchMsg.style.color = "#888";
    switchMsg.style.fontStyle = "italic";
    outputContentEl.appendChild(switchMsg);
    outputContentEl.scrollTop = outputContentEl.scrollHeight;

    // Set Editor Language Model
    let monacoLang = 'c'; // Default
    if (selectedLang === 'cpp' || selectedLang === 'c++') monacoLang = 'cpp';
    if (selectedLang === 'java') monacoLang = 'java';
    if (selectedLang === 'python' || selectedLang === 'py') monacoLang = 'python';

    monaco.editor.setModelLanguage(editor.getModel(), monacoLang);

    // Only render questions if in Questions mode
    if (currentWorkspaceMode === 'questions') {
        renderSidebar(selectedLang);
    }
}

// Initial Setup - Set Default Selection
const defaultLang = 'c';
options.forEach(opt => {
    if (opt.getAttribute('data-value') === defaultLang) opt.classList.add('selected');
});


// Filter and Render Sidebar
function renderSidebar(selectedLang) {
    if (currentWorkspaceMode === 'files') return; // Don't touch sidebar in explorer mode

    questionListEl.innerHTML = ''; // Clear list

    // Update Sidebar Header with Course Name
    if (sidebarTitle) {
        sidebarTitle.innerText = courseNames[selectedLang] || "LAB QUESTIONS";
    }

    const filtered = questions.filter(q => q.language === selectedLang);

    if (filtered.length === 0) {
        questionListEl.innerHTML = '<li style="padding:15px; color:#666; text-align:center;">No questions found for this language.</li>';
        return;
    }

    filtered.forEach(q => {
        const li = document.createElement('li');
        li.className = 'question-item';

        // Strict ID matching logic
        if (currentQuestion && currentQuestion.id === q.id) {
            li.classList.add('active');
        }

        // Difficulty Styling
        let diffClass = 'diff-easy';
        const diffLower = q.difficulty ? q.difficulty.toLowerCase() : 'easy';
        if (diffLower === 'medium') diffClass = 'diff-medium';
        if (diffLower === 'hard') diffClass = 'diff-hard';

        // Check for saved progress
        const isSaved = localStorage.getItem(`saved_code_${q.id}`);
        const indicatorClass = isSaved ? 'saved-indicator show' : 'saved-indicator';

        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div style="font-weight:600;">${q.title}</div>
                <span class="${indicatorClass}">✓</span>
            </div>
            <div style="font-size:0.75em; opacity:0.8; display:flex; align-items:center;">
                <span class="difficulty-badge ${diffClass}"></span>
                <span style="text-transform:capitalize;">${q.difficulty || 'Easy'}</span>
            </div>
        `;

        li.onclick = () => loadQuestion(q);
        questionListEl.appendChild(li);
    });
}

function loadQuestion(q) {
    currentQuestion = q;

    // Update UI Header
    questionTitleEl.innerText = q.title;

    // Better metadata display with badges
    const diff = q.difficulty ? q.difficulty.toUpperCase() : 'EASY';
    const diffClass = `diff-${diff.toLowerCase()}`;
    questionMetaEl.innerHTML = `<span class="difficulty-badge ${diffClass}" style="margin-right:8px;"></span> ${diff} | ${q.language.toUpperCase()}`;

    // Description with Samples and Hint
    let content = q.description;

    if (q.sample_input || q.sample_output) {
        content += `<div style="margin-top:15px; background:rgba(255,255,255,0.05); padding:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">`;
        if (q.sample_input) content += `<div style="margin-bottom:8px;"><strong>Sample Input:</strong><br><code style="color:var(--accent-color); font-family:'JetBrains Mono', monospace;">${q.sample_input}</code></div>`;
        if (q.sample_output) content += `<div><strong>Sample Output:</strong><br><code style="color:#00e676; font-family:'JetBrains Mono', monospace;">${q.sample_output}</code></div>`;
        content += `</div>`;
    }

    if (q.solution_explanation) {
        content += `<div style="margin-top:15px;">
            <button id="show-hint-btn" class="btn" style="padding:4px 10px; font-size:0.8em; background:rgba(255,187,51,0.1); color:#ffbb33; border:1px solid rgba(255,187,51,0.3); min-height:unset;">💡 Show Hint</button>
            <div id="hint-text" style="display:none; margin-top:10px; padding:10px; background:rgba(255,187,51,0.05); border-left:3px solid #ffbb33; color:#ccc; font-style:italic;">
                ${q.solution_explanation}
            </div>
        </div>`;
    }

    questionDescEl.innerHTML = content;

    // Handle Hint Toggle
    const hintBtn = document.getElementById('show-hint-btn');
    const hintText = document.getElementById('hint-text');
    if (hintBtn) {
        hintBtn.onclick = () => {
            if (hintText.style.display === 'none') {
                hintText.style.display = 'block';
                hintBtn.innerText = '📖 Hide Hint';
            } else {
                hintText.style.display = 'none';
                hintBtn.innerText = '💡 Show Hint';
            }
        };
    }

    // Rerender sidebar to update active state visually
    renderSidebar(langSelectEl.value);

    // Update Editor
    const model = editor.getModel();

    // Map lang string to monaco
    let monacoLang = q.language;
    if (q.language === 'c' || q.language === 'cpp') monacoLang = 'cpp';
    if (q.language === 'py') monacoLang = 'python';

    monaco.editor.setModelLanguage(model, monacoLang);

    // Check for saved progress in localStorage
    const savedCode = localStorage.getItem(`saved_code_${q.id}`);
    if (savedCode) {
        editor.setValue(savedCode);
        saveProgressBtn.innerText = 'Saved ✅';
        saveProgressBtn.classList.add('saved');
    } else {
        editor.setValue(q.defaultCode || "");
        saveProgressBtn.innerText = 'Save Progress';
        saveProgressBtn.classList.remove('saved');
    }
}

// Function to save code specifically for the current question
function saveQuestionProgress() {
    if (!currentQuestion) return;
    const code = editor.getValue();
    localStorage.setItem(`saved_code_${currentQuestion.id}`, code);

    saveProgressBtn.innerText = 'Saved ✅';
    saveProgressBtn.classList.add('saved');

    // Refresh sidebar to show checkmark
    renderSidebar(langSelectEl.value);
}

// Event Listeners for Saving
if (saveProgressBtn) {
    saveProgressBtn.onclick = saveQuestionProgress;
}

// Next Button Logic
if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (!currentQuestion) return;

        const lang = langSelectEl.value;
        const filtered = questions.filter(q => q.language === lang);
        const currentIndex = filtered.findIndex(q => q.id === currentQuestion.id);

        if (currentIndex !== -1 && currentIndex < filtered.length - 1) {
            loadQuestion(filtered[currentIndex + 1]);
        } else {
            alert("No more questions in this category!");
        }
    });
}

// Events
// langSelectEl listener removed: handled by handleLanguageChange in custom dropdown logic

runBtn.addEventListener('click', async () => {
    if (!editor) return;

    // Visual Feedback
    runBtn.innerHTML = '<span>⏳</span> Running...';
    runBtn.disabled = true;

    const code = editor.getValue();
    const lang = langSelectEl.value;

    // Clear previous explicit error messages if any, but keep log history
    // outputContentEl.innerText += `\n> Running ${lang.toUpperCase()} code...\n`;
    const runHeader = document.createElement('div');
    runHeader.innerText = `\n> Running ${lang.toUpperCase()}...`;
    runHeader.style.opacity = "0.7";
    runHeader.style.marginBottom = "5px";
    outputContentEl.appendChild(runHeader);

    // Auto-scroll to show "Running..."
    outputContentEl.scrollTop = outputContentEl.scrollHeight;

    try {
        const result = await ipcRenderer.invoke('run-code', {
            language: lang,
            code: code,
            input: ""
        });

        // Check for Compiler Not Found Errors
        if (result.stderr && result.stderr.includes("Compiler/Interpreter not found")) {
            let errorHtml = "";
            if (result.stderr.includes("gcc")) errorHtml = ERROR_MESSAGES.c;
            else if (result.stderr.includes("g++")) errorHtml = ERROR_MESSAGES.cpp;
            else if (result.stderr.includes("java") || result.stderr.includes("javac")) errorHtml = ERROR_MESSAGES.java;
            else if (result.stderr.includes("python")) errorHtml = ERROR_MESSAGES.python;

            if (errorHtml) {
                const errorDiv = document.createElement('div');
                errorDiv.innerHTML = errorHtml;
                outputContentEl.appendChild(errorDiv);
                outputContentEl.scrollTop = outputContentEl.scrollHeight;
                runBtn.innerHTML = '<span>▶</span> Run Code';
                runBtn.disabled = false;
                return; // Stop further processing
            }
        }

        // Generic Error Handling (if not the specific "not found" ones above)
        if (result.stderr) {
            // General Error
            const errSpan = document.createElement('div');
            errSpan.style.color = "#ff6b6b";
            errSpan.style.whiteSpace = "pre-wrap"; // Preserve formatting
            errSpan.innerText = result.stderr;
            outputContentEl.appendChild(errSpan);
        }

        if (result.stdout) {
            const outLabel = document.createElement('div');
            outLabel.innerText = "Output:";
            outLabel.style.color = "#aaa";
            outLabel.style.fontWeight = "bold";
            outLabel.style.marginBottom = "4px";
            outLabel.style.marginTop = "8px"; // Spacing from previous elements
            outputContentEl.appendChild(outLabel);

            const outSpan = document.createElement('div');
            outSpan.style.color = "#69f0ae";
            outSpan.style.whiteSpace = "pre-wrap"; // Preserve formatting
            outSpan.style.fontFamily = "JetBrains Mono, monospace"; // Ensure monospace
            // Trim trailing newlines to prevent extra gaps, but keep internal structure
            outSpan.innerText = result.stdout.replace(/\n+$/, '');
            outputContentEl.appendChild(outSpan);
        } else if (!result.stderr) {
            const noOut = document.createElement('div');
            noOut.style.opacity = "0.5";
            noOut.style.fontStyle = "italic";
            noOut.innerText = "(Program executed successfully with no output)";
            outputContentEl.appendChild(noOut);
        }

        // Separator
        const hr = document.createElement('div');
        hr.innerText = "-----------------------------------";
        hr.style.opacity = "0.2";
        hr.style.margin = "10px 0";
        outputContentEl.appendChild(hr);

        // Scroll
        setTimeout(() => {
            outputContentEl.scrollTop = outputContentEl.scrollHeight;
        }, 50);

    } catch (err) {
        const errDiv = document.createElement('div');
        errDiv.style.color = 'red';
        errDiv.innerText = `System Error: ${err.message}\n`;
        outputContentEl.appendChild(errDiv);
    } finally {
        runBtn.innerHTML = '<span>▶</span> Run Code';
        runBtn.disabled = false;
    }
});

clearOutputBtn.addEventListener('click', () => {
    outputContentEl.innerText = '';
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
    initEditor();
});

// --- Resizing Logic ---
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
let isSidebarCollapsed = false;
let originalSidebarWidth = "280px";

toggleSidebarBtn.addEventListener('click', () => {
    if (isSidebarCollapsed) {
        // Expand
        sidebar.style.width = originalSidebarWidth;
        sidebar.querySelector('#question-list').style.display = 'block';
        toggleSidebarBtn.innerText = '«';
        isSidebarCollapsed = false;
    } else {
        // Collapse
        originalSidebarWidth = sidebar.style.width; // Save current width (in case resized)
        sidebar.style.width = '40px'; // Minimal width to keep button visible
        sidebar.querySelector('#question-list').style.display = 'none';
        toggleSidebarBtn.innerText = '»';
        isSidebarCollapsed = true;
    }
});
const mainContent = document.getElementById('main-content');
const resizerCol = document.getElementById('resizer-col');

const editorWrapper = document.getElementById('editor-wrapper');
const outputPanel = document.getElementById('output-panel');
const resizerRow = document.getElementById('resizer-row');

// Column Resizing (Sidebar)
let isResizingCol = false;

resizerCol.addEventListener('mousedown', (e) => {
    isResizingCol = true;
    document.body.classList.add('resizing');
});

document.addEventListener('mousemove', (e) => {
    if (!isResizingCol) return;

    // Calculate new width
    // Sidebar width = mouse x position - sidebar left offset (usually 0)
    // We add some limits in CSS, but good to handle here too
    let newWidth = e.clientX - sidebar.getBoundingClientRect().left;
    if (newWidth < 150) newWidth = 150;
    if (newWidth > 600) newWidth = 600;

    sidebar.style.width = `${newWidth}px`;
    // Force layout update for editor if it depends on container size
    if (editor) editor.layout();
});

document.addEventListener('mouseup', () => {
    if (isResizingCol) {
        isResizingCol = false;
        document.body.classList.remove('resizing');
    }
});

// Row Resizing (Output Panel)
let isResizingRow = false;

resizerRow.addEventListener('mousedown', (e) => {
    isResizingRow = true;
    document.body.classList.add('resizing-row');
});

document.addEventListener('mousemove', (e) => {
    if (!isResizingRow) return;

    // Calculate new height for Output Panel logic:
    // Main Content Height - Output Panel Height - Header Height...
    // Easier approach: Calculate Output Panel height based on mouse Y from BOTTOM

    const containerRect = mainContent.getBoundingClientRect();
    const newHeight = containerRect.bottom - e.clientY;

    // Limits
    if (newHeight < 50) return; // Limit min height
    if (newHeight > containerRect.height - 100) return; // Don't squash editor too much

    outputPanel.style.height = `${newHeight}px`;
    outputPanel.style.flex = "none"; // Disable flex grow/shrink to respect height

    // Editor needs to take remaining space
    // Since flex direction is column, setting output panel height acts as a constraint
    // if editor has flex:2, we might need to adjust.
    // Better: Set editor flex: 1 and output panel flex: 0 0 auto + height.

    if (editor) editor.layout();
});

document.addEventListener('mouseup', () => {
    if (isResizingRow) {
        isResizingRow = false;
        document.body.classList.remove('resizing-row');
    }
});
