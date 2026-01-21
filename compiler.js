const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class CompilerService {
    constructor() {
        this.timeout = 5000; // 5 seconds execution limit
    }

    async run(language, code) {
        const timestamp = Date.now();
        const tempDir = os.tmpdir();
        let result = { stdout: '', stderr: '', error: null };

        try {
            switch (language.toLowerCase()) {
                case 'python':
                case 'py':
                    result = await this.runPython(code, tempDir, timestamp);
                    break;
                case 'java':
                    result = await this.runJava(code, tempDir, timestamp);
                    break;
                case 'c':
                    result = await this.runC(code, tempDir, timestamp, 'c');
                    break;
                case 'cpp':
                case 'c++':
                    result = await this.runC(code, tempDir, timestamp, 'cpp');
                    break;
                default:
                    throw new Error(`Unsupported language: ${language}`);
            }
        } catch (err) {
            result.error = err.message;
            result.stderr += `\nSystem Error: ${err.message}`;
        }

        return result;
    }

    executeCommand(command, args, cwd, input = null) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args, { cwd, shell: false });
            let stdout = '';
            let stderr = '';
            let killed = false;

            // Timeout Timer
            const timer = setTimeout(() => {
                killed = true;
                process.kill();
                reject(new Error('Execution timed out (5s limit)'));
            }, this.timeout);

            if (input) {
                process.stdin.write(input);
                process.stdin.end();
            }

            process.stdout.on('data', (data) => { stdout += data.toString(); });
            process.stderr.on('data', (data) => { stderr += data.toString(); });

            process.on('close', (code) => {
                clearTimeout(timer);
                if (!killed) {
                    process.removeAllListeners(); // Cleanup
                    resolve({ stdout, stderr, code });
                }
            });

            process.on('error', (err) => {
                clearTimeout(timer);
                // Handle "not found" specifically
                if (err.code === 'ENOENT') {
                    reject(new Error(`Compiler/Interpreter not found: ${command}`));
                } else {
                    reject(err);
                }
            });
        });
    }

    async runPython(code, tempDir, timestamp) {
        const fileName = `script_${timestamp}.py`;
        const filePath = path.join(tempDir, fileName);

        fs.writeFileSync(filePath, code, { encoding: 'utf8' });

        try {
            const { stdout, stderr } = await this.executeCommand('python', [filePath], tempDir);
            return { stdout, stderr };
        } catch (e) {
            throw e;
        } finally {
            try { fs.unlinkSync(filePath); } catch (e) { }
        }
    }

    async runJava(code, tempDir, timestamp) {
        // Parse Class Name
        let classNameMatch = code.match(/public\s+class\s+(\w+)/);
        if (!classNameMatch) classNameMatch = code.match(/class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : 'Main';

        const fileName = `${className}.java`;
        const filePath = path.join(tempDir, fileName);

        fs.writeFileSync(filePath, code, { encoding: 'utf8' });

        try {
            // Compile
            const compileResult = await this.executeCommand('javac', [fileName], tempDir);

            // Check for Compilation Error
            if (compileResult.code !== 0) {
                return {
                    stdout: compileResult.stdout,
                    stderr: `Compilation Error:\n${compileResult.stderr}`,
                    error: 'Compilation Failed'
                };
            }

            // Run
            const result = await this.executeCommand('java', ['-cp', '.', className], tempDir);
            return result;

        } catch (e) {
            if (e.message.includes('javac') || e.message.includes('Compiler')) {
                throw e;
            }
            throw e;
        } finally {
            try {
                fs.unlinkSync(filePath);
                if (fs.existsSync(path.join(tempDir, `${className}.class`))) {
                    fs.unlinkSync(path.join(tempDir, `${className}.class`));
                }
            } catch (e) { }
        }
    }

    // Unified C/C++ Handler
    async runC(code, tempDir, timestamp, lang) {
        const isCpp = lang === 'cpp';
        const compiler = isCpp ? 'g++' : 'gcc';
        const srcName = `prog_${timestamp}.${isCpp ? 'cpp' : 'c'}`;
        const exeName = `prog_${timestamp}.exe`;

        const srcPath = path.join(tempDir, srcName);
        const exePath = path.join(tempDir, exeName);

        fs.writeFileSync(srcPath, code);

        try {
            // Compile
            const compileResult = await this.executeCommand(compiler, [srcName, '-o', exeName], tempDir);

            // Check for Compilation Error
            if (compileResult.code !== 0) {
                return {
                    stdout: compileResult.stdout,
                    stderr: `Compilation Error:\n${compileResult.stderr}`,
                    error: 'Compilation Failed'
                };
            }

            // Execute
            const result = await this.executeCommand(exePath, [], tempDir);
            return result;

        } finally {
            try {
                fs.unlinkSync(srcPath);
                if (fs.existsSync(exePath)) fs.unlinkSync(exePath);
            } catch (e) { }
        }
    }
}

module.exports = new CompilerService();
